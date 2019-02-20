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
    const typeChildren = ctx.columnType().children

    this.currentColumn = {
      name: getIdentifierText(ctx.columnName),
      type: typeChildren[0].getText(),
    }

    if (typeChildren.length >= 4 && ruleNameOf(typeChildren[1]) === "LEFT_BRACKET") {
      const maxIndex = typeChildren.length - 2
      const args: any[] = []
      for (let i = 2; i <= maxIndex; ++i) {
        const arg = typeChildren[i]
        if (ruleNameOf(arg) === "UINT_LITERAL")
          args.push(parseInt(arg.getText(), 10))
      }
      this.currentColumn.typeArgs = args
    }
  }

  exitColumnDef(ctx) {
    this.currentTable.columns.push(this.currentColumn)
  }

  enterColDetails(ctx) {
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
          this.currentColumn.references = {
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
      refTable: getIdentifierText(ctx.refTable)
    }
    if (ctx.refColumns)
      constraint.refColumns = getIdListItemTexts(ctx.refColumns)
    return constraint
  }
}
