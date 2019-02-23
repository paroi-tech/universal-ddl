const { UniversalDdlListener } = require("../parser/UniversalDdlListener")
import { ruleNameOf } from "./antlr4-utils"
import { BasicAst } from "./basic-ast"
import { getIdentifierText, getIdListItemTexts } from "./ddl-extractor-utils"

export default class DdlExtractor extends UniversalDdlListener {
  script: BasicAst | undefined
  private currentTable: any
  private currentColumn: any

  enterScript(ctx) {
    this.script = {
      orders: []
    }
  }

  enterTableDef(ctx) {
    this.currentTable = {
      orderType: "createTable",
      name: getIdentifierText(ctx.tableName),
      columns: []
    }
    this.script!.orders.push(this.currentTable)
  }

  exitTableDef() {
    this.currentTable = undefined
  }

  enterColumnDef(ctx) {
    const typeCtx = ctx.columnType()

    this.currentColumn = {
      name: getIdentifierText(ctx.columnName),
      type: typeCtx.children[0].getText(),
    }

    if (typeCtx.children.length > 1 && "UINT_LITERAL" in typeCtx) {
      const params = typeCtx.UINT_LITERAL()
      const args: any[] = []
      for (const intLiteral of params)
        args.push(parseInt(intLiteral.getText(), 10))
      this.currentColumn.typeArgs = args
    }
  }

  exitColumnDef(ctx) {
    this.currentTable.columns.push(this.currentColumn)
    this.currentColumn = undefined
  }

  enterColumnDetails(ctx) {
    if (!ctx.children)
      return
    for (const childCtx of ctx.children) {
      switch (ruleNameOf(childCtx)) {
        case "KW_NOT_NULL":
          this.currentColumn.notNull = true
          break
        case "inlinePrimaryKeyConstraintDef":
          this.currentColumn.primaryKey = true
          if (childCtx.constraintName)
            this.currentColumn.primaryKeyContraintName = getIdentifierText(childCtx.constraintName)
          break
        case "inlineUniqueConstraintDef":
          this.currentColumn.unique = true
          if (childCtx.constraintName) {
            this.currentColumn.uniqueConstraint = {
              name: getIdentifierText(childCtx.constraintName)
            }
          }
          break
        case "inlineForeignKeyConstraintDef":
          const fkConstraint: any = {
            refTable: getIdentifierText(childCtx.refTable)
          }
          if (childCtx.refColumn)
            fkConstraint.refColumn = getIdentifierText(childCtx.refColumn)
          if (childCtx.constraintName)
            fkConstraint.name = getIdentifierText(childCtx.constraintName)
          this.currentColumn.foreignKeyConstraint = fkConstraint
          break
        case "defaultSpec":
          this.currentColumn.default = this.buildDefaultValue(childCtx.children[1])
          break
      }
    }
  }

  buildDefaultValue(node) {
    const obj: any = {}
    switch (ruleNameOf(node)) {
      case "UINT_LITERAL":
      case "INT_LITERAL":
        obj.type = "int"
        obj.value = parseInt(node.getText(), 10)
        break
      case "FLOAT_LITERAL":
        obj.type = "float"
        obj.value = parseFloat(node.getText())
        break
      case "DATE_LITERAL":
      case "DATETIME_LITERAL":
      case "TIME_LITERAL":
        obj.value = node.getText()
        break
      case "STRING_LITERAL":
        const text = node.getText()
        obj.value = text.substring(1, text.length - 1).replace(/[']{2}/, "'")
        obj.type = "string"
        break
      case "KW_CURRENT_DATE":
      case "KW_CURRENT_TIME":
      case "KW_CURRENT_TS":
        obj.type = "sql"
        obj.value = node.getText()
        break
    }
    return obj
  }

  enterFullUniqueConstraintDef(ctx) {
    if (ruleNameOf(ctx.parentCtx) === "tableItemList") {
      if (!this.currentTable.uniqueConstraints)
        this.currentTable.uniqueConstraints = []
      this.currentTable.uniqueConstraints.push(
        this.buildFullUniqueConstraint(ctx.uniqueConstraintDef())
      )
    }
  }

  enterFullPrimaryKeyConstraintDef(ctx) {
    if (ruleNameOf(ctx.parentCtx) === "tableItemList")
      this.currentTable.primaryKey = this.buildFullPrimaryKeyConstraint(
        ctx.primaryKeyConstraintDef()
      )
  }

  enterFullForeignKeyConstraintDef(ctx) {
    if (ruleNameOf(ctx.parentCtx) === "tableItemList") {
      if (!this.currentTable.foreignKeyConstraints)
        this.currentTable.foreignKeyConstraints = []
      this.currentTable.foreignKeyConstraints.push(
        this.buildFullForeignKeyConstraint(ctx.foreignKeyConstraintDef())
      )
    }
  }

  buildFullUniqueConstraint(ctx) {
    const constraint: any = {
      columns: getIdListItemTexts(ctx.identifierList())
    }
    if (ctx.constraintName)
      constraint.name = getIdentifierText(ctx.constraintName)
    return constraint
  }

  buildFullPrimaryKeyConstraint(ctx) {
    const constraint: any = {
      columns: getIdListItemTexts(ctx.identifierList())
    }
    if (ctx.constraintName)
      constraint.name = getIdentifierText(ctx.constraintName)
    return constraint
  }

  buildFullForeignKeyConstraint(ctx) {
    const constraint: any = {
      columns: getIdListItemTexts(ctx.columns),
      refTable: getIdentifierText(ctx.refTable)
    }
    if (ctx.refColumns)
      constraint.refColumns = getIdListItemTexts(ctx.refColumns)
    if (ctx.constraintName)
      constraint.name = getIdentifierText(ctx.constraintName)
    return constraint
  }
}
