const { UniversalDdlListener } = require("../parser/UniversalDdlListener")
import { ruleNameOf } from "./antlr4-utils"
import {
  Ast, AstAlterTable, AstColumn, AstColumnConstraintComposition, AstCommentable, AstCreateIndex,
  AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstTable, AstTableConstraintComposition, AstTableEntry, AstValue
} from "./ast"
import { getIdentifierText, getIdListItemTexts } from "./ddl-extractor-utils"

export interface DdlExtractorOptions {
  source: string
  /**
   * Of type `CommonTokenStream`.
   */
  tokenStream: any
  tokensType: {
    COMMA: number
    COMMENT: number
    NEWLINE: number
  }
}

export interface DdlParsingContext extends DdlExtractorOptions {
  consumedCommentTokens: Set<any>
}

export default class DdlExtractor extends UniversalDdlListener {
  ast?: Ast
  private parsingContext: DdlParsingContext
  private currentEntries?: AstTableEntry[]
  private currentColumn?: AstColumn

  constructor(options: DdlExtractorOptions) {
    super()
    this.parsingContext = {
      ...options,
      consumedCommentTokens: new Set()
    }
  }

  enterScript() {
    this.ast = {
      orders: []
    }
  }

  enterTableDef(ctx) {
    this.currentEntries = []
  }

  exitTableDef(ctx) {
    const table: AstTable = {
      orderType: "createTable",
      name: getIdentifierText(ctx.tableName),
      entries: this.currentEntries!
    }
    appendCommentsTo(table, this.parsingContext, ctx)
    this.ast!.orders.push(table)
    this.currentEntries = undefined
  }

  enterAlterTableDef(ctx) {
    this.currentEntries = []
  }

  exitAlterTableDef(ctx) {
    const alterTable: AstAlterTable = {
      orderType: "alterTable",
      table: getIdentifierText(ctx.tableName),
      add: this.currentEntries!
    }
    appendCommentsTo(alterTable, this.parsingContext, ctx)
    this.ast!.orders.push(alterTable)
    this.currentEntries = undefined
  }

  enterIndexDef(ctx) {
    const index: any = {
      columns: getIdListItemTexts(ctx.columns)
    }
    if (ctx.KW_UNIQUE())
      index.constraintType = "unique"

    const order: AstCreateIndex = {
      orderType: "createIndex",
      table: getIdentifierText(ctx.tableName),
      index
    }
    appendCommentsTo(order, this.parsingContext, ctx)
    if (ctx.indexName)
      order.name = getIdentifierText(ctx.indexName)
    this.ast!.orders.push(order)
  }

  enterColumnDef(ctx) {
    const typeCtx = ctx.columnType()

    const column: AstColumn = {
      entryType: "column",
      name: getIdentifierText(ctx.columnName),
      type: typeCtx.children[0].getText(),
    }

    appendCommentsTo(column, this.parsingContext, ctx)

    if (typeCtx.children.length > 1 && "UINT_LITERAL" in typeCtx) {
      const params = typeCtx.UINT_LITERAL()
      if (!params)
        return
      const args: any[] = []
      for (const intLiteral of params)
        args.push(parseInt(intLiteral.getText(), 10))
      column.typeArgs = args
    }

    this.currentEntries!.push(column)
    this.currentColumn = column
  }

  exitColumnDef(ctx) {
    this.currentColumn = undefined
  }

  enterColumnDetails(ctx) {
    if (!ctx.children)
      return

    const constraintCompositions: AstColumnConstraintComposition[] = []
    let composition: AstColumnConstraintComposition | undefined

    for (const childCtx of ctx.children) {
      if (!composition || childCtx.constraintName) {
        composition = {
          constraints: []
        }
        if (childCtx.constraintName)
          composition.name = getIdentifierText(childCtx.constraintName)
        constraintCompositions.push(composition)
      }

      switch (ruleNameOf(childCtx)) {
        case "KW_NOT_NULL":
          composition.constraints.push({
            constraintType: "notNull"
          })
          break
        case "KW_AUTOINCREMENT":
          composition.constraints.push({
            constraintType: "autoIncrement"
          })
          break
        case "primaryKeyColumnConstraintDef":
          composition.constraints.push({
            constraintType: "primaryKey"
          })
          break
        case "uniqueColumnConstraintDef":
          composition.constraints.push({
            constraintType: "unique"
          })
          break
        case "foreignKeyColumnConstraintDef":
          const fkConstraint: AstForeignKeyColumnConstraint = {
            constraintType: "foreignKey",
            referencedTable: getIdentifierText(childCtx.referencedTable)
          }
          if (childCtx.referencedColumn)
            fkConstraint.referencedColumn = getIdentifierText(childCtx.referencedColumn)
          if (childCtx.onDelete && childCtx.onDelete.KW_CASCADE())
            fkConstraint.onDelete = "cascade"
          composition.constraints.push(fkConstraint)
          break
        case "defaultSpec":
          composition.constraints.push({
            constraintType: "default",
            value: buildDefaultValue(childCtx.children[1])
          })
          break
      }
    }

    if (constraintCompositions.length > 0)
      this.currentColumn!.constraintCompositions = constraintCompositions
  }

  enterTableUniqueConstraintDef(ctx) {
    this.currentEntries!.push(
      buildTableUniqueConstraint(this.parsingContext, ctx.uniqueConstraintDef())
    )
  }

  enterTablePrimaryKeyConstraintDef(ctx) {
    this.currentEntries!.push(
      buildTablePrimaryKeyConstraint(this.parsingContext, ctx.primaryKeyConstraintDef())
    )
  }

  enterTableForeignKeyConstraintDef(ctx) {
    this.currentEntries!.push(
      buildTableForeignKeyConstraint(this.parsingContext, ctx.foreignKeyConstraintDef())
    )
  }
}

function buildDefaultValue(node): AstValue {
  switch (ruleNameOf(node)) {
    case "UINT_LITERAL":
    case "INT_LITERAL":
      return {
        type: "int",
        value: parseInt(node.getText(), 10)
      }
    case "FLOAT_LITERAL":
      return {
        type: "float",
        value: parseFloat(node.getText())
      }
    case "STRING_LITERAL":
      const text = node.getText()
      return {
        type: "string",
        value: text.substring(1, text.length - 1).replace(/[']{2}/, "'")
      }
    case "KW_CURRENT_DATE":
    case "KW_CURRENT_TIME":
    case "KW_CURRENT_TS":
      return {
        type: "sql",
        value: node.getText()
      }
    default:
      throw new Error(`Unexpected value: ${ruleNameOf(node)}`)
  }
}

function buildTableUniqueConstraint(parsingContext: DdlParsingContext, ctx): AstTableConstraintComposition {
  const composition: AstTableConstraintComposition = {
    entryType: "constraintComposition",
    constraints: [{
      constraintType: "unique",
      columns: getIdListItemTexts(ctx.identifierList())
    }]
  }
  if (ctx.constraintName)
    composition.name = getIdentifierText(ctx.constraintName)
  appendCommentsTo(composition, parsingContext, ctx)
  return composition
}

function buildTablePrimaryKeyConstraint(parsingContext: DdlParsingContext, ctx): AstTableConstraintComposition {
  const composition: AstTableConstraintComposition = {
    entryType: "constraintComposition",
    constraints: [{
      constraintType: "primaryKey",
      columns: getIdListItemTexts(ctx.identifierList())
    }]
  }
  if (ctx.constraintName)
    composition.name = getIdentifierText(ctx.constraintName)
  appendCommentsTo(composition, parsingContext, ctx)
  return composition
}

function buildTableForeignKeyConstraint(parsingContext: DdlParsingContext, ctx): AstTableConstraintComposition {
  const fkConstraint: AstForeignKeyTableConstraint = {
    constraintType: "foreignKey",
    columns: getIdListItemTexts(ctx.columns),
    referencedTable: getIdentifierText(ctx.referencedTable)
  }
  if (ctx.referencedColumns)
    fkConstraint.referencedColumns = getIdListItemTexts(ctx.referencedColumns)
  const composition: AstTableConstraintComposition = {
    entryType: "constraintComposition",
    constraints: [fkConstraint]
  }
  if (ctx.constraintName)
    composition.name = getIdentifierText(ctx.constraintName)
  if (ctx.onDelete && ctx.onDelete.KW_CASCADE())
    fkConstraint.onDelete = "cascade"
  appendCommentsTo(composition, parsingContext, ctx)
  return composition
}

// function debugTokensToText(tokens, parsingContext) {
//   if (!tokens)
//     return "-no-tokens-"
//   return tokens.map(({ tokenIndex, type, start, stop }) => {
//     return `[${tokenIndex}] ${type}: ${parsingContext.source.substring(start, stop + 1).replace("\n", "\\n")}`
//   }).join("\n")
// }

/**
 * @param ruleContext An instance of `RuleContext`.
 */
function appendCommentsTo(astNode: AstCommentable, parsingContext: DdlParsingContext, ruleContext: any) {
  const { COMMA, COMMENT, NEWLINE } = parsingContext.tokensType
  const consumed = parsingContext.consumedCommentTokens

  let tokens: any[] = parsingContext.tokenStream
    .getHiddenTokensToLeft(ruleContext.start.tokenIndex, 1)
  if (tokens) {
    tokens = tokens.filter(token => token.type === COMMENT && !consumed.has(token))
    for (const tok of tokens)
      consumed.add(tok)
  }
  const blockComments = tokens || []

  const inlineComments: any[] = []
  const tokenAfter = parsingContext.tokenStream.tokens[ruleContext.stop.tokenIndex + 1]
  let stopIndex = ruleContext.stop.tokenIndex
  if (tokenAfter && tokenAfter.type === COMMA)
    ++stopIndex
  for (let i = ruleContext.start.tokenIndex; i < stopIndex; ++i) {
    let tokens = parsingContext.tokenStream.getHiddenTokensToRight(i, 1)
    if (tokens) {
      tokens = tokens.filter(token => token.type === COMMENT && !consumed.has(token))
      inlineComments.push(...tokens)
      for (const tok of tokens)
        consumed.add(tok)
    }
  }
  const lastTokens = parsingContext.tokenStream.getHiddenTokensToRight(stopIndex, 1)
  if (lastTokens) {
    const lastToken = lastTokens.find(token => (token.type === COMMENT && !consumed.has(token)) || token.type === NEWLINE)
    if (lastToken && lastToken.type === COMMENT) {
      inlineComments.push(lastToken)
      consumed.add(lastToken)
    }
  }

  if (blockComments.length > 0) {
    const com = blockComments
      .map(({ start, stop }) => parsingContext.source.substring(start + 3, stop + 1).trimRight())
      .filter(com => com.length > 0)
      .join("\n")
    if (com)
      astNode.blockComment = com
  }

  if (inlineComments.length > 0) {
    const com = inlineComments
      .map(({ start, stop }) => parsingContext.source.substring(start + 3, stop + 1).trim())
      .filter(com => com.length > 0)
      .join("\n")
    if (com)
      astNode.inlineComment = com
  }
}