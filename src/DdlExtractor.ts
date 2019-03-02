const { UniversalDdlListener } = require("../parser/UniversalDdlListener")
import { ruleNameOf } from "./antlr4-utils"
import {
  Ast, AstAlterTable, AstColumn, AstColumnConstraintComposition, AstCommentable, AstCreateIndex,
  AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstTable, AstTableConstraintComposition, AstTableEntry, AstValue
} from "./ast"
import CommentAnnotator from "./CommentAnnotator"

export interface DdlParsingContext {
  source: string
  /**
   * Of type `CommonTokenStream`.
   */
  tokenStream: any
  tokenTypes: {
    COMMA: number
    COMMENT: number
    NEWLINE: number
  }
}

export default class DdlExtractor extends UniversalDdlListener {
  ast?: Ast
  private currentEntries?: AstTableEntry[]
  private currentColumn?: AstColumn
  private comments?: CommentAnnotator

  constructor(private parsingContext: DdlParsingContext) {
    super()
  }

  enterScript() {
    this.comments = new CommentAnnotator(this.parsingContext)
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
    this.comments!.appendCommentsTo(table, ctx)
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
    this.comments!.appendCommentsTo(alterTable, ctx)
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
    this.comments!.appendCommentsTo(order, ctx)
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

    this.comments!.appendCommentsTo(column, ctx)

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
      buildTableUniqueConstraint(ctx.uniqueConstraintDef(), this.comments!)
    )
  }

  enterTablePrimaryKeyConstraintDef(ctx) {
    this.currentEntries!.push(
      buildTablePrimaryKeyConstraint(ctx.primaryKeyConstraintDef(), this.comments!)
    )
  }

  enterTableForeignKeyConstraintDef(ctx) {
    this.currentEntries!.push(
      buildTableForeignKeyConstraint(ctx.foreignKeyConstraintDef(), this.comments!)
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

function buildTableUniqueConstraint(ctx, comments: CommentAnnotator): AstTableConstraintComposition {
  const composition: AstTableConstraintComposition = {
    entryType: "constraintComposition",
    constraints: [{
      constraintType: "unique",
      columns: getIdListItemTexts(ctx.identifierList())
    }]
  }
  if (ctx.constraintName)
    composition.name = getIdentifierText(ctx.constraintName)
  comments.appendCommentsTo(composition, ctx)
  return composition
}

function buildTablePrimaryKeyConstraint(ctx, comments: CommentAnnotator): AstTableConstraintComposition {
  const composition: AstTableConstraintComposition = {
    entryType: "constraintComposition",
    constraints: [{
      constraintType: "primaryKey",
      columns: getIdListItemTexts(ctx.identifierList())
    }]
  }
  if (ctx.constraintName)
    composition.name = getIdentifierText(ctx.constraintName)
  comments.appendCommentsTo(composition, ctx)
  return composition
}

function buildTableForeignKeyConstraint(ctx, comments: CommentAnnotator): AstTableConstraintComposition {
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
  comments.appendCommentsTo(composition, ctx)
  return composition
}

function getIdentifierText(idCtx) {
  return idCtx.IDENTIFIER().getText()
}

function getIdListItemTexts(idListCtx) {
  const list: any[] = []
  for (const idCtx of idListCtx.id()) {
    const text = getIdentifierText(idCtx)
    list.push(text)
  }
  return list
}
