const { inspect } = require("util");
const { UniversalDdlListener } = require("../parser/UniversalDdlListener");
const { ruleNameOf } = require("./antlr4-utils");

class DdlExtractor extends UniversalDdlListener {
  constructor(parser) {
    super()
    this.parser = parser
  }

  enterScript(ctx) {
    console.log("enter script");
    this.script = {
      tables: []
    }
  }

  enterTableDef(ctx) {
    console.log("enter tableDef:", ctx.IDENTIFIER().getText())
    this.currentTable = {
      name: ctx.IDENTIFIER().getText(),
      columns: []
    };
    this.script.tables.push(this.currentTable)
  }

  enterColumnDef(ctx) {
    const typeChildren = ctx.colType().children;

    this.currentColumn = {
      name: ctx.IDENTIFIER().getText(),
      type: typeChildren[0].getText(),
    }

    if (typeChildren.length >= 4 && ruleNameOf(typeChildren[1]) === "LEFT_BRACKET") {
      const maxIndex = typeChildren.length - 2;
      const args = [];
      for (let i = 2; i <= maxIndex; ++i) {
        const arg = typeChildren[i];
        if (ruleNameOf(arg) === "INT_VAL")
          args.push(parseInt(arg.getText(), 10));
      }
      this.currentColumn.typeArgs = args;
    }
  }

  exitColumnDef(ctx) {
    this.currentTable.columns.push(this.currentColumn)
  }

  enterColDetails(ctx) {
    if (!ctx.children)
      return
    for (let childCtx of ctx.children) {
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

module.exports = {
  default: DdlExtractor
};