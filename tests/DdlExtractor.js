const { UniversalDdlListener } = require("../parser/UniversalDdlListener");

class DdlExtractor extends UniversalDdlListener {
  enterScript(ctx) {
    console.log("enter script");
    this.script = {
      tables: []
    };
  }
  enterTableDef(ctx) {
    console.log("enter tableDef:", ctx.IDENTIFIER().getText());
    this.currentTable = {
      name: ctx.IDENTIFIER().getText(),
      columns: []
    };
    this.script.tables.push(this.currentTable);
  }
  enterColumnDef(ctx) {
    console.log("enter columnDef:", ctx.IDENTIFIER().getText());
    this.currentTable.columns.push({
      name: ctx.IDENTIFIER().getText(),
      type: ctx.dataType().getText()
    });
  }
}

module.exports = {
  default: DdlExtractor
};