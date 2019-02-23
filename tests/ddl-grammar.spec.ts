import { parseDdl } from "../src/parse-ddl"

describe("DDL Grammar", () => {
  test("a table must include at least one column", () => {
    const input = `
      create table t1();
      `
    expect(() => parseDdl(input)).toThrow()
  })

  test("semicolon is required", () => {
    const input = `
      create table t1(
        a varchar(50)
      )
      `
    expect(() => parseDdl(input)).toThrow()
  })

  test("returns tables in the correct order", () => {
    const input = `
      create table t1(
        a integer
      );
      create table t2(
        a integer
      );
      create table t3(
        a integer
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables.map(table => table.name)).toEqual(["t1", "t2", "t3"])
  })

  test("default sql value", () => {
    const input = `
      create table t1(
        a timestamp default current_timestamp
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
      create table t1(
        a varchar(200) default 'John '' Wick'
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
      create table t1(
        a integer default 123
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
      create table t1(
        a numeric(4,2) default 12.35
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].columns[0].default).toEqual({
      "type": "float",
      "value": 12.35
    })
  })

  test("inline foreign key", () => {
    const input = `
      create table t1(
        a integer references other_table(b)
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].columns[0].fkConstraint).toEqual({
      "refTable": "other_table",
      "refColumn": "b"
    })
  })

  test("named inline foreign key", () => {
    const input = `
      create table t1(
        a integer constraint fk1 references other_table(b)
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].columns[0].fkConstraint).toEqual({
      "name": "fk1",
      "refTable": "other_table",
      "refColumn": "b"
    })
  })

  test("table constraint: foreign key", () => {
    const input = `
      create table t1(
        a integer,
        b integer,
        foreign key (a, b) references other_table (c, d)
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].fkConstraints[0]).toEqual({
      "columns": ["a", "b"],
      "refTable": "other_table",
      "refColumns": ["c", "d"]
    })
  })

  test("table constraint: named foreign key", () => {
    const input = `
      create table t1(
        a integer,
        b integer,
        constraint fk1 foreign key (a, b) references other_table (c, d)
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].fkConstraints[0]).toEqual({
      "name": "fk1",
      "columns": ["a", "b"],
      "refTable": "other_table",
      "refColumns": ["c", "d"]
    })
  })

  test("inline constraint: unique", () => {
    const input = `
      create table t1(
        a integer unique
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].columns[0].uniqueConstraint).toEqual(true)
  })

  test("named inline constraint: unique", () => {
    const input = `
      create table t1(
        a integer constraint u1 unique
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].columns[0].uniqueConstraint).toEqual({
      "name": "u1"
    })
  })

  test("table constraint: unique constraint", () => {
    const input = `
      create table t1(
        a integer,
        b integer,
        unique (a, b)
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].uniqueConstraints[0]).toEqual({
      "columns": ["a", "b"]
    })
  })

  test("table constraint: named unique constraint", () => {
    const input = `
      create table t1(
        a integer,
        b integer,
        constraint u1 unique (a, b)
      );
      `
    const ast = parseDdl(input)
    expect(ast.tables[0].fkConstraints[0]).toEqual({
      "name": "u1",
      "columns": ["a", "b"]
    })
  })
})
