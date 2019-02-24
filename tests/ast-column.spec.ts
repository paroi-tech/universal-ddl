import { parseDdl } from "../src/parse-ddl"

describe("AST Specification for columns", () => {

  const simpleTypes = ["int", "integer", "bigint", "smallint", "real", "date", "time", "datetime", "timestamp", "text"]
  for (const dataType of simpleTypes) {
    test(`data type: ${dataType}`, () => {
      const input = `
        create table t1(
          a ${dataType}
        );
        `
      const ast = parseDdl(input)
      expect(ast.orders[0].columns[0].type).toEqual(dataType)
    })
  }

  const paramTypes = [
    {
      type: "char",
      args: [20]
    },
    {
      type: "varchar",
      args: [25]
    },
    {
      type: "decimal",
      args: [4, 2]
    },
    {
      type: "decimal",
      args: [8]
    },
    {
      type: "numeric",
      args: [4, 2]
    },
    {
      type: "numeric",
      args: [8]
    },
    {
      type: "float",
      args: [5]
    },
  ]
  for (const { type, args } of paramTypes) {
    test(`data type: ${type}(${args.join(", ")})`, () => {
      const input = `
        create table t1(
          a ${type}(${args.join(", ")})
        );
        `
      const ast = parseDdl(input)
      expect(ast.orders[0].columns[0].type).toEqual(type)
      expect(ast.orders[0].columns[0].typeArgs).toEqual(args)
    })
  }

  test("not null", () => {
    const input = `
      create table t1(
        a integer not null
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].columns[0].notNull).toEqual(true)
  })

  test("inline primary key", () => {
    const input = `
      create table t1(
        a integer not null primary key
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].columns[0].notNull).toEqual(true)
    expect(ast.orders[0].columns[0].primaryKey).toEqual(true)
  })

  test("autoincrement", () => {
    const input = `
      create table t1(
        a integer not null primary key autoincrement
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].columns[0].notNull).toEqual(true)
    expect(ast.orders[0].columns[0].primaryKey).toEqual(true)
    expect(ast.orders[0].columns[0].autoincrement).toEqual(true)
  })

  test("inline primary key references", () => {
    const input = `
      create table t1(
        a integer not null primary key references other_table(b)
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].columns[0].notNull).toEqual(true)
    expect(ast.orders[0].columns[0].primaryKey).toEqual(true)
    expect(ast.orders[0].columns[0].foreignKeyConstraint).toEqual({
      "referencedTable": "other_table",
      "referencedColumn": "b"
    })
  })

  test("default sql value", () => {
    const input = `
      create table t1(
        a timestamp default current_timestamp
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].columns[0].default).toEqual({
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
    expect(ast.orders[0].columns[0].default).toEqual({
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
    expect(ast.orders[0].columns[0].default).toEqual({
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
    expect(ast.orders[0].columns[0].default).toEqual({
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
    expect(ast.orders[0].columns[0].foreignKeyConstraint).toEqual({
      "referencedTable": "other_table",
      "referencedColumn": "b"
    })
  })

  test("named inline foreign key", () => {
    const input = `
      create table t1(
        a integer constraint fk1 references other_table(b)
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].columns[0].foreignKeyConstraint).toEqual({
      "name": "fk1",
      "referencedTable": "other_table",
      "referencedColumn": "b"
    })
  })

  test("inline constraint: unique", () => {
    const input = `
      create table t1(
        a integer unique
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].columns[0].uniqueConstraint).toEqual(true)
  })

  test("named inline constraint: unique", () => {
    const input = `
      create table t1(
        a integer constraint u1 unique
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].columns[0].uniqueConstraint).toEqual({
      "name": "u1"
    })
  })
})
