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
          this.currentColumn.fkConstraint = {
            table: getIdentifierText(childCtx.refTable),
            column: getIdentifierText(childCtx.refColumn),
          }
          break
        case "defaultSpec":
          this.currentColumn.default = {
            value: childCtx.children[1].getText()
          }
          if (childCtx.defaultValueType)
            this.currentColumn.default.type = "sql"
          break
      }
    }
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
