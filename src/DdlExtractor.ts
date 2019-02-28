const { UniversalDdlListener } = require("../parser/UniversalDdlListener")
import { ruleNameOf } from "./antlr4-utils"
import {
  Ast, AstAlterTable, AstColumn, AstColumnConstraintComposition,
  AstCreateIndex, AstForeignKeyColumnConstraint, AstForeignKeyConstraint,
  AstIndex, AstPrimaryKeyConstraint, AstTable,
  AstTableConstraintComposition, AstTableEntry, AstUniqueConstraint, AstValue
} from "./ast"
import { getIdentifierText, getIdListItemTexts } from "./ddl-extractor-utils"

export default class DdlExtractor extends UniversalDdlListener {
  ast?: Ast
  private currentTable?: AstTable
  private currentEntries?: AstTableEntry[]
  private currentColumn?: AstColumn

  // TODO: use a tmp array to hold column and constraint defs.
  // Then in exitTableDef and exitAlterDef add the items to table or
  // currentTable or currentAlter object and sempty the tmp array.
  // Remove currentColumn and use currentEntries.

  enterScript() {
    this.ast = {
      orders: []
    }
  }

  enterTableDef(ctx) {
    this.currentTable = {
      orderType: "createTable",
      name: getIdentifierText(ctx.tableName),
      entries: []
    }
    this.ast!.orders.push(this.currentTable)
  }

  exitTableDef() {
    this.currentTable = undefined
  }

  enterAlterTableDef(ctx) {
    const order: AstAlterTable = {
      orderType: "alterTable",
      table: getIdentifierText(ctx.tableName),
      add: []
    }
    this.currentAlterTable = order
  }

  exitAlterTable(ctx) {
    this.currentAlterTable = undefined
  }

  enterIndexDef(ctx) {
    const index: any = { // AstIndex | AstUniqueConstraint
      columns: getIdListItemTexts(ctx.columns)
    }
    if (ctx.KW_UNIQUE())
      index.constraintType = "unique"

    const order: AstCreateIndex = {
      orderType: "createIndex",
      table: getIdentifierText(ctx.tableName),
      index
    }
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

    if (typeCtx.children.length > 1 && "UINT_LITERAL" in typeCtx) {
      const params = typeCtx.UINT_LITERAL()
      if (!params)
        return
      const args: any[] = []
      for (const intLiteral of params)
        args.push(parseInt(intLiteral.getText(), 10))
      column.typeArgs = args
    }

    this.currentColumn = column
  }

  exitColumnDef(ctx) {
    if (ruleNameOf(ctx.parentCtx) === "tableItemList")
      this.currentTable!.entries.push(this.currentColumn!)
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

  enterFullUniqueConstraintDef(ctx) {
    const table = this.currentTable!
    if (ruleNameOf(ctx.parentCtx) === "tableItemList") {
      table.entries.push(
        buildFullUniqueConstraint(ctx.uniqueConstraintDef())
      )
    }
  }

  enterFullPrimaryKeyConstraintDef(ctx) {
    const table = this.currentTable!
    if (ruleNameOf(ctx.parentCtx) === "tableItemList") {
      table.entries.push(
        buildFullPrimaryKeyConstraint(ctx.primaryKeyConstraintDef())
      )
    }
  }

  enterFullForeignKeyConstraintDef(ctx) {
    const table = this.currentTable!
    if (ruleNameOf(ctx.parentCtx) === "tableItemList") {
      table.entries.push(
        buildFullForeignKeyConstraint(ctx.foreignKeyConstraintDef())
      )
    }
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

function buildFullUniqueConstraint(ctx): AstTableConstraintComposition {
  const composition: AstTableConstraintComposition = {
    entryType: "constraintComposition",
    constraints: [{
      constraintType: "unique",
      columns: getIdListItemTexts(ctx.identifierList())
    }]
  }
  if (ctx.constraintName)
    composition.name = getIdentifierText(ctx.constraintName)
  return composition
}

function buildFullPrimaryKeyConstraint(ctx): AstTableConstraintComposition {
  const composition: AstTableConstraintComposition = {
    entryType: "constraintComposition",
    constraints: [{
      constraintType: "primaryKey",
      columns: getIdListItemTexts(ctx.identifierList())
    }]
  }
  if (ctx.constraintName)
    composition.name = getIdentifierText(ctx.constraintName)
  return composition
}

function buildFullForeignKeyConstraint(ctx): AstTableConstraintComposition {
  const fkConstraint: AstForeignKeyConstraint = {
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
  return composition
}
