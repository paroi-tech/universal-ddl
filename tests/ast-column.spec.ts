import { AstColumn, AstColumnConstraint, AstColumnConstraintComposition, AstTable } from "../src/ast"
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
      const table = parseDdl(input).orders[0] as AstTable
      const column = table.entries[0] as AstColumn
      expect(column.type).toEqual(dataType)
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
      const table = parseDdl(input).orders[0] as AstTable
      const column = table.entries[0] as AstColumn
      expect(column.type).toEqual(type)
      expect(column.typeArgs).toEqual(args)
    })
  }

  test("not null", () => {
    const input = `
      create table t1(
        a integer not null
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      constraints: [
        { constraintType: "notNull" }
      ]
    } as AstColumnConstraintComposition)
  })

  test("column constraint: primary key", () => {
    const input = `
      create table t1(
        a integer not null primary key
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      constraints: [
        { constraintType: "notNull" },
        { constraintType: "primaryKey" }
      ]
    } as AstColumnConstraintComposition)
  })

  test("column constraint: primary key autoincrement", () => {
    const input = `
      create table t1(
        a integer not null primary key autoincrement
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      constraints: [
        { constraintType: "notNull" },
        {
          constraintType: "primaryKey",
          autoincrement: true
        }
      ]
    } as AstColumnConstraintComposition)
  })

  test("column constraint: primary key references", () => {
    const input = `
      create table t1(
        a integer not null primary key references other_table(b)
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      constraints: [
        { constraintType: "notNull" },
        { constraintType: "primaryKey" },
        {
          constraintType: "foreignKey",
          referencedTable: "other_table",
          referencedColumn: "b"
        },
      ]
    } as AstColumnConstraintComposition)
  })

  test("default sql value", () => {
    const input = `
      create table t1(
        a timestamp default current_timestamp
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      constraints: [
        {
          constraintType: "default",
          value: {
            type: "sql",
            value: "current_timestamp"
          }
        }
      ]
    } as AstColumnConstraintComposition)
  })

  test("default string value", () => {
    const input = `
      create table t1(
        a varchar(200) default 'John '' Wick'
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      constraints: [
        {
          constraintType: "default",
          value: {
            type: "string",
            value: "John ' Wick"
          }
        }
      ]
    } as AstColumnConstraintComposition)
  })

  test("default int value", () => {
    const input = `
      create table t1(
        a integer default 123
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      constraints: [
        {
          constraintType: "default",
          value: {
            type: "int",
            value: 123
          }
        }
      ]
    } as AstColumnConstraintComposition)
  })

  test("default float value", () => {
    const input = `
      create table t1(
        a numeric(4,2) default 12.35
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      constraints: [
        {
          constraintType: "default",
          value: {
            type: "float",
            value: 12.35
          }
        }
      ]
    } as AstColumnConstraintComposition)
  })

  test("column constraint: foreign key", () => {
    const input = `
      create table t1(
        a integer references other_table(b)
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      constraints: [
        {
          constraintType: "foreignKey",
          referencedTable: "other_table",
          referencedColumn: "b"
        }
      ]
    } as AstColumnConstraintComposition)
  })

  test("named column constraint: foreign key", () => {
    const input = `
      create table t1(
        a integer constraint fk1 references other_table(b)
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      name: "fk1",
      constraints: [
        {
          constraintType: "foreignKey",
          referencedTable: "other_table",
          referencedColumn: "b"
        }
      ]
    } as AstColumnConstraintComposition)
  })

  test("column constraint: unique", () => {
    const input = `
      create table t1(
        a integer unique
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      constraints: [
        { constraintType: "unique" }
      ]
    } as AstColumnConstraintComposition)
  })

  test("named column constraint: unique", () => {
    const input = `
      create table t1(
        a integer constraint u1 unique
      );
      `
    const table = parseDdl(input).orders[0] as AstTable
    const column = table.entries[0] as AstColumn
    expect(column.constraintCompositions![0]).toEqual({
      name: "u1",
      constraints: [
        { constraintType: "unique" }
      ]
    } as AstColumnConstraintComposition)
  })
})
