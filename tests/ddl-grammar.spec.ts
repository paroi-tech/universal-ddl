import { parseDdl } from "../src/parse-ddl"

describe("DDL Grammar", () => {
  test("a table must include at least one column", () => {
    const input = `
      create table empty();
      `
    expect(() => parseDdl(input)).toThrow()
  })

  test("semicolon is required", () => {
    const input = `
      create table person(
        name varchar(50)
      )
      `
    expect(() => parseDdl(input)).toThrow()
  })

  test("returns tables in the correct order", () => {
    const input = `
      create table table_a(
        col_a integer
      );
      create table table_b(
        col_b integer
      );
      create table table_c(
        col_b integer
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables.map(table => table.name)).toEqual(["table_a", "table_b", "table_c"])
  })

  test("default sql value", () => {
    const input = `
      create table person(
        inscription timestamp default current_timestamp
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].columns[0].default).toEqual({
      "type": "sql",
      "value": "current_timestamp"
    })
  })

  test("default string value", () => {
    const input = `
      create table person(
        name varchar(200) default 'John '' Wick'
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].columns[0].default).toEqual({
      "type": "string",
      "value": "John ' Wick"
    })
  })

  test("default int value", () => {
    const input = `
      create table person(
        age integer default 123
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].columns[0].default).toEqual({
      "type": "int",
      "value": 123
    })
  })

  test("default float value", () => {
    const input = `
      create table person(
        note numeric(4,2) default 12.35
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].columns[0].default).toEqual({
      "type": "float",
      "value": 12.35
    })
  })
})
