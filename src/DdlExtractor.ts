const { UniversalDdlListener } = require("../parser/UniversalDdlListener")
import { ruleNameOf } from "./antlr4-utils"
import { BasicAst } from "./basic-ast"

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
      name: ctx.IDENTIFIER().getText(),
      columns: []
    }
    this.script!.tables.push(this.currentTable)
  }

  enterColumnDef(ctx) {
    const typeChildren = ctx.colType().children

    this.currentColumn = {
      name: ctx.IDENTIFIER().getText(),
      type: typeChildren[0].getText(),
    }

    if (typeChildren.length >= 4 && ruleNameOf(typeChildren[1]) === "LEFT_BRACKET") {
      const maxIndex = typeChildren.length - 2
      const args: any[] = []
      for (let i = 2; i <= maxIndex; ++i) {
        const arg = typeChildren[i]
        if (ruleNameOf(arg) === "INT_VAL")
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
          this.currentColumn.foreignKey = true
          this.currentColumn.foreignKeyArgs = childCtx.IDENTIFIER().map(id => id.getText())
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
}
