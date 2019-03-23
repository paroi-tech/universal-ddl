import { AstAlterTable, AstCreateIndex, AstCreateTable, AstForeignKeyTableConstraint, AstPrimaryKeyTableConstraint, AstUniqueTableConstraint } from "../src/ast"
import { parseDdlToAst } from "../src/parser/parse-ddl"

describe("AST Specification for tables", () => {
  test("a table must include at least one column", () => {
    const input = `
      create table t1();
      `
    expect(() => parseDdlToAst(input)).toThrow()
  })

  test("semicolon is required", () => {
    const input = `
      create table t1(
        a varchar(50)
      )
      `
    expect(() => parseDdlToAst(input)).toThrow()
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
    const tables = parseDdlToAst(input).orders as AstCreateTable[]
    expect(tables.map(order => order.name)).toEqual(["t1", "t2", "t3"])
  })

  test("table constraint: primary key", () => {
    const input = `
      create table t1(
        col integer,
        primary key (a, b)
      );
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.entries[1]).toEqual({
      entryType: "constraint",
      constraintType: "primaryKey",
      columns: ["a", "b"]
    } as AstPrimaryKeyTableConstraint)
  })

  test("table constraint: foreign key", () => {
    const input = `
      create table t1(
        col integer,
        foreign key (a, b) references other_table (c, d)
      );
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.entries[1]).toEqual({
      entryType: "constraint",
      constraintType: "foreignKey",
      columns: ["a", "b"],
      referencedTable: "other_table",
      referencedColumns: ["c", "d"]
    } as AstForeignKeyTableConstraint)
  })

  test("table constraint: named foreign key", () => {
    const input = `
      create table t1(
        col integer,
        constraint fk1 foreign key (a, b) references other_table (c, d)
      );
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.entries[1]).toEqual({
      entryType: "constraint",
      name: "fk1",
      constraintType: "foreignKey",
      columns: ["a", "b"],
      referencedTable: "other_table",
      referencedColumns: ["c", "d"]
    } as AstForeignKeyTableConstraint)
  })

  test("table constraint: named foreign key on delete cascade", () => {
    const input = `
      create table t1(
        col integer,
        constraint fk1 foreign key (a, b) references other_table (c, d) on delete cascade
      );
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.entries[1]).toEqual({
      entryType: "constraint",
      name: "fk1",
      constraintType: "foreignKey",
      columns: ["a", "b"],
      referencedTable: "other_table",
      referencedColumns: ["c", "d"],
      onDelete: "cascade"
    } as AstForeignKeyTableConstraint)
  })

  test("table constraint: unique constraint", () => {
    const input = `
      create table t1(
        col integer,
        unique (a, b)
      );
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.entries[1]).toEqual({
      entryType: "constraint",
      constraintType: "unique",
      columns: ["a", "b"]
    } as AstUniqueTableConstraint)
  })

  test("table constraint: named unique constraint", () => {
    const input = `
      create table t1(
        col integer,
        constraint u1 unique (a, b)
      );
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.entries[1]).toEqual({
      entryType: "constraint",
      name: "u1",
      constraintType: "unique",
      columns: ["a", "b"]
    } as AstUniqueTableConstraint)
  })

  test("alter table add foreign key", () => {
    const input = `
      alter table t1 add foreign key (a, b) references t2(c, d);
      `
    const ast = parseDdlToAst(input)
    expect(ast.orders[0]).toEqual({
      orderType: "alterTable",
      table: "t1",
      add: [{
        entryType: "constraint",
        constraintType: "foreignKey",
        columns: ["a", "b"],
        referencedTable: "t2",
        referencedColumns: ["c", "d"]
      }]
    } as AstAlterTable)
  })

  test("alter table add foreign key (named)", () => {
    const input = `
      alter table t1 add constraint fk1 foreign key (a, b) references t2(c, d);
      `
    const ast = parseDdlToAst(input)
    expect(ast.orders[0]).toEqual({
      orderType: "alterTable",
      table: "t1",
      add: [{
        entryType: "constraint",
        name: "fk1",
        constraintType: "foreignKey",
        columns: ["a", "b"],
        referencedTable: "t2",
        referencedColumns: ["c", "d"]
      }]
    } as AstAlterTable)
  })

  test("create index", () => {
    const input = `
      create index idx1 on t1 (a, b);
      `
    const ast = parseDdlToAst(input)
    expect(ast.orders[0]).toEqual({
      orderType: "createIndex",
      table: "t1",
      index: {
        name: "idx1",
        columns: ["a", "b"]
      }
    } as AstCreateIndex)
  })

  test("create unique index", () => {
    const input = `
      create unique index u1 on t1 (a, b);
      `
    const ast = parseDdlToAst(input)
    expect(ast.orders[0]).toEqual({
      orderType: "createIndex",
      table: "t1",
      index: {
        constraintType: "unique",
        name: "u1",
        columns: ["a", "b"]
      }
    } as AstCreateIndex)
  })

  test("alter table add unique", () => {
    const input = `
      alter table t1 add unique (a, b);
      `
    const ast = parseDdlToAst(input)
    expect(ast.orders[0]).toEqual({
      orderType: "alterTable",
      table: "t1",
      add: [{
        entryType: "constraint",
        constraintType: "unique",
        columns: ["a", "b"]
      }]
    } as AstAlterTable)
  })

  test("alter table add unique (named)", () => {
    const input = `
      alter table t1 add constraint u1 unique (a, b);
      `
    const ast = parseDdlToAst(input)
    expect(ast.orders[0]).toEqual({
      orderType: "alterTable",
      table: "t1",
      add: [{
        entryType: "constraint",
        name: "u1",
        constraintType: "unique",
        columns: ["a", "b"]
      }]
    } as AstAlterTable)
  })
})
