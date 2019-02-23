const { UniversalDdlListener } = require("../parser/UniversalDdlListener")
import { ruleNameOf } from "./antlr4-utils";
import { BasicAst } from "./basic-ast";
import { getIdentifierText, getIdListItemTexts } from "./ddl-extractor-utils";

export default class DdlExtractor extends UniversalDdlListener {
  script: BasicAst | undefined
  private currentTable: any
  private currentColumn: any

  enterScript(ctx) {
    this.script = {
      tables: []
    }
  }

  enterTableDef(ctx) {
    this.currentTable = {
      name: getIdentifierText(ctx.tableName),
      columns: []
    }
    this.script!.tables.push(this.currentTable)
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
  }

  enterColumnDetails(ctx) {
    if (!ctx.children)
      return
    for (const childCtx of ctx.children) {
      switch (ruleNameOf(childCtx)) {
        case "KW_PK":
          this.currentColumn.primaryKey = true
          break
        case "KW_UNIQUE":
          this.currentColumn.unique = true
          break
        case "KW_NOT_NULL":
          this.currentColumn.notNull = true
          break
        case "inlineForeignKeyDef":
          const fkConstraint: any = {
            table: getIdentifierText(childCtx.refTable),
            column: getIdentifierText(childCtx.refColumn),
          }
          if (childCtx.name)
           fkConstraint.name = getIdentifierText(childCtx.name)
          this.currentColumn.fkConstraint = fkConstraint
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

  enterUniqueConstraint(ctx) {
    if (ruleNameOf(ctx.parentCtx) === "tableItemList") {
      if (!this.currentTable.uniqueConstraints)
        this.currentTable.uniqueConstraints = []
      this.currentTable.uniqueConstraints.push(
        this.buildUniqueConstraint(ctx.uniqueConstraintDef())
      )
    }
  }

  enterPrimaryKeyConstraint(ctx) {
    if (ruleNameOf(ctx.parentCtx) === "tableItemList")
      this.currentTable.primaryKey = this.buildPrimaryKeyConstraint(ctx.pkConstraintDef())
  }

  enterForeignKeyConstraint(ctx) {
    if (ruleNameOf(ctx.parentCtx) === "tableItemList") {
      if (!this.currentTable.fkConstraints)
        this.currentTable.fkConstraints = []
      this.currentTable.fkConstraints.push(
        this.buildForeignKeyConstraint(ctx.fkConstraintDef())
      )
    }
  }

  buildUniqueConstraint(ctx) {
    return {
      name: getIdentifierText(ctx.constraintName) || "",
      columns: getIdListItemTexts(ctx.identifierList())
    }
  }

  buildPrimaryKeyConstraint(ctx) {
    return {
      name: getIdentifierText(ctx.constraintName) || "",
      columns: getIdListItemTexts(ctx.identifierList())
    }
  }

  buildForeignKeyConstraint(ctx) {
    const constraint: any = {
      name: getIdentifierText(ctx.constraintName) || "",
      columns: getIdListItemTexts(ctx.columns),
      references: {
        table: getIdentifierText(ctx.refTable)
      }
    }
    if (ctx.refColumns)
      constraint.references.columns = getIdListItemTexts(ctx.refColumns)
    return constraint
  }
}
