const { UniversalDdlListener } = require("../../antlr-parser/UniversalDdlListener")
import { AntlrAnyRuleContext, AntlrRuleContext, AntlrTokenStream, ruleNameOf } from "./antlr4-utils"
import {
  Ast, AstAlterTable, AstColumn, AstColumnConstraintComposition, AstCommentable, AstCreateIndex,
  AstCreateTable, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstStandaloneComment, AstStandaloneTableComment, AstTableConstraintComposition, AstTableEntry, AstValue
} from "./ast"
import CommentGrabber, { GrabbedCommentsResult } from "./CommentGrabber"

export interface DdlParsingContext {
  source: string
  /**
   * Of type `CommonTokenStream`.
   */
  tokenStream: AntlrTokenStream
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
  private comments: CommentGrabber

  constructor(private parsingContext: DdlParsingContext) {
    super()
    this.comments = new CommentGrabber(this.parsingContext)
  }

  enterScript() {
    this.ast = {
      orders: []
    }
  }

  exitScript() {
    this.addStandaloneComments(this.comments.grabStandaloneCommentsAfterLast())
  }

  enterCreateTableDef() {
    this.currentEntries = []
  }

  exitCreateTableDef(ctx: AntlrAnyRuleContext) {
    const createTable: AstCreateTable = {
      orderType: "createTable",
      name: getIdentifierText(ctx.tableName),
      entries: this.currentEntries!
    }
    this.addToEntriesStandaloneComments(this.comments.grabStandaloneCommentsAfterLast())
    this.addStandaloneCommentsBefore(this.comments.grabComments(ctx, { annotate: createTable }))
    this.ast!.orders.push(createTable)
    this.currentEntries = undefined
  }

  enterAlterTableDef() {
    this.currentEntries = []
  }

  exitAlterTableDef(ctx: AntlrAnyRuleContext) {
    const alterTable: AstAlterTable = {
      orderType: "alterTable",
      table: getIdentifierText(ctx.tableName),
      add: this.currentEntries!
    }
    this.addToEntriesStandaloneComments(this.comments.grabStandaloneCommentsAfterLast())
    this.addStandaloneCommentsBefore(this.comments.grabComments(ctx, { annotate: alterTable }))
    this.ast!.orders.push(alterTable)
    this.currentEntries = undefined
  }

  enterIndexDef(ctx: AntlrAnyRuleContext) {
    const index: any = {
      columns: getTextsOfIdentifierList(ctx.columns)
    }
    if (ctx.KW_UNIQUE())
      index.constraintType = "unique"

    const createIndex: AstCreateIndex = {
      orderType: "createIndex",
      table: getIdentifierText(ctx.tableName),
      index
    }
    this.addStandaloneCommentsBefore(this.comments.grabComments(ctx, { annotate: createIndex }))
    if (ctx.indexName)
      createIndex.name = getIdentifierText(ctx.indexName)
    this.ast!.orders.push(createIndex)
  }

  enterColumnDef(ctx: AntlrAnyRuleContext) {
    const typeCtx = ctx.columnType()

    const column: AstColumn = {
      entryType: "column",
      name: getIdentifierText(ctx.columnName),
      type: typeCtx.children[0].getText(),
    }

    this.addToEntriesStandaloneCommentsBefore(this.comments.grabComments(ctx, { annotate: column }))

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

  exitColumnDef() {
    this.currentColumn = undefined
  }

  enterColumnDetails(ctx: AntlrAnyRuleContext) {
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
        case "KW_NULL":
          composition.constraints.push({
            constraintType: "null"
          })
          break
        case "KW_AUTOINCREMENT":
          composition.constraints.push({
            constraintType: "autoincrement"
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
          if (!childCtx.children[1])
            throw new Error("Missing default value")
          composition.constraints.push({
            constraintType: "default",
            value: buildDefaultValue(childCtx.children[1])
          })
          break
        default:
          throw new Error(`Unexpected column constraint: ${childCtx.getText()}`)
      }
    }

    if (constraintCompositions.length > 0)
      this.currentColumn!.constraintCompositions = constraintCompositions
  }

  enterTableUniqueConstraintDef(ctx: AntlrAnyRuleContext) {
    const constraintCtx = ctx.uniqueConstraintDef()
    const composition: AstTableConstraintComposition = {
      entryType: "constraintComposition",
      constraints: [{
        constraintType: "unique",
        columns: getTextsOfIdentifierList(constraintCtx.identifierList())
      }]
    }
    if (constraintCtx.constraintName)
      composition.name = getIdentifierText(constraintCtx.constraintName)
    this.addToEntriesStandaloneCommentsBefore(this.comments.grabComments(ctx, { annotate: composition }))
    this.currentEntries!.push(composition)
  }

  enterTablePrimaryKeyConstraintDef(ctx: AntlrAnyRuleContext) {
    const constraintCtx = ctx.primaryKeyConstraintDef()
    const composition: AstTableConstraintComposition = {
      entryType: "constraintComposition",
      constraints: [{
        constraintType: "primaryKey",
        columns: getTextsOfIdentifierList(constraintCtx.identifierList())
      }]
    }
    if (constraintCtx.constraintName)
      composition.name = getIdentifierText(constraintCtx.constraintName)
    this.addToEntriesStandaloneCommentsBefore(this.comments.grabComments(ctx, { annotate: composition }))
    this.currentEntries!.push(composition)
  }

  enterTableForeignKeyConstraintDef(ctx: AntlrAnyRuleContext) {
    const constraintCtx = ctx.foreignKeyConstraintDef()
    const fkConstraint: AstForeignKeyTableConstraint = {
      constraintType: "foreignKey",
      columns: getTextsOfIdentifierList(constraintCtx.columns),
      referencedTable: getIdentifierText(constraintCtx.referencedTable)
    }
    if (constraintCtx.referencedColumns)
      fkConstraint.referencedColumns = getTextsOfIdentifierList(constraintCtx.referencedColumns)
    const composition: AstTableConstraintComposition = {
      entryType: "constraintComposition",
      constraints: [fkConstraint]
    }
    if (constraintCtx.constraintName)
      composition.name = getIdentifierText(constraintCtx.constraintName)
    if (constraintCtx.onDelete && constraintCtx.onDelete.KW_CASCADE())
      fkConstraint.onDelete = "cascade"
    this.addToEntriesStandaloneCommentsBefore(this.comments.grabComments(ctx, { annotate: composition }))
    this.currentEntries!.push(composition)
  }

  private addStandaloneCommentsBefore({ standaloneCommentsBefore }: GrabbedCommentsResult) {
    this.addStandaloneComments(standaloneCommentsBefore)
  }

  private addStandaloneComments(comments: string[]) {
    this.ast!.orders.push(...comments.map(blockComment => ({
      orderType: "comment",
      blockComment
    } as AstStandaloneComment)))
  }

  private addToEntriesStandaloneCommentsBefore({ standaloneCommentsBefore }: GrabbedCommentsResult) {
    this.addToEntriesStandaloneComments(standaloneCommentsBefore)
  }

  private addToEntriesStandaloneComments(comments: string[]) {
    this.currentEntries!.push(...comments.map(blockComment => ({
      entryType: "comment",
      blockComment
    } as AstStandaloneTableComment)))
  }
}

function buildDefaultValue(ctx: AntlrAnyRuleContext): AstValue {
  switch (ruleNameOf(ctx)) {
    case "UINT_LITERAL":
    case "INT_LITERAL":
      return {
        type: "int",
        value: parseInt(ctx.getText(), 10)
      }
    case "FLOAT_LITERAL":
      return {
        type: "float",
        value: parseFloat(ctx.getText())
      }
    case "STRING_LITERAL":
      const text = ctx.getText()
      return {
        type: "string",
        value: text.substring(1, text.length - 1).replace(/[']{2}/, "'")
      }
    case "KW_CURRENT_DATE":
    case "KW_CURRENT_TIME":
    case "KW_CURRENT_TS":
      return {
        type: "sqlExpr",
        value: ctx.getText()
      }
    default:
      throw new Error(`Unexpected value: ${ruleNameOf(ctx)}`)
  }
}

function getIdentifierText(idCtx: AntlrAnyRuleContext) {
  return idCtx.IDENTIFIER().getText()
}

function getTextsOfIdentifierList(ctx: AntlrAnyRuleContext) {
  return ctx.id().map(idCtx => getIdentifierText(idCtx))

  // const list: any[] = []
  // for (const idCtx of idListCtx.id()) {
  //   const text = getIdentifierText(idCtx)
  //   list.push(text)
  // }
  // return list
}
