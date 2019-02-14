const { UniversalDdlListener } = require("../parser/UniversalDdlListener")

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
    this.currentColumn = {
      name: ctx.IDENTIFIER().getText(),
      type: ctx.COL_TYPE().getText(),
    }
  }

  exitColumnDef(ctx) {
    this.currentTable.columns.push(this.currentColumn)
  }

  enterColDetails(ctx) {
    console.log("enter colDetails:", this.currentColumn.name)
    if (!ctx.children)
      return
    let names = this.parser.symbolicNames
    for (let child of ctx.children) {
      let index = child.symbol ? child.symbol.type : -1
      if (index === -1)
        continue
      switch (names[index]) {
        case "KW_PK":
          this.currentColumn.primaryKey = true
          break
        case "KW_UNIQUE":
          this.currentColumn.unique = true
          break
        case "KW_NOT_NULL":
          this.currentColumn.notNull = true
      }
    }
  }
}

module.exports = {
  default: DdlExtractor
};