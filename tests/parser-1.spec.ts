import { parseDdl } from "../src/parse-ddl"

describe("test set 1", () => {
  test("must include at leat one column", () => {
    const input = `
      create table empty();
      `
    expect(() => parseDdl(input)).toThrow()
  })

  test("returns the correct AST", () => {
    const input = `
      create table table_a(
        col_a integer primary key
      );
      `
    const ast = parseDdl(input)
    // console.log(JSON.stringify(ast))
    expect(ast).toEqual({
      "tables": [
        {
          "name": "table_a",
          "columns": [
            {
              "name": "col_a",
              "type": "integer",
              "primaryKey": true
            }
          ]
        }
      ]
    })
  })
})
