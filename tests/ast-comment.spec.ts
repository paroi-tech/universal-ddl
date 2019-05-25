import { AstColumn, AstCreateTable } from "../src/ast"
import { parseDdlToAst } from "../src/parser/parse-ddl"

describe("AST Specification for comments", () => {

  test("standalone comments on empty script", () => {
    const input = `-- comment I #1
      -- comment I #2

      -- comment II #1
      -- comment II #2`
    const orders = parseDdlToAst(input).orders
    expect(orders.length).toEqual(2)
    expect(orders[0].orderType).toEqual("comment")
    expect(orders[0].blockComment).toEqual("comment I #1\ncomment I #2")
    expect(orders[1].orderType).toEqual("comment")
    expect(orders[1].blockComment).toEqual("comment II #1\ncomment II #2")
  })

  test("standalone comments", () => {
    const input = `
      -- comment I #1
      --
      -- comment I #2

       create table t1(
        a integer
      );

      -- comment II #1
      -- comment II #2
      `
    const orders = parseDdlToAst(input).orders
    expect(orders.length).toEqual(3)
    expect(orders[0].orderType).toEqual("comment")
    expect(orders[0].blockComment).toEqual("comment I #1\n\ncomment I #2")
    expect(orders[2].orderType).toEqual("comment")
    expect(orders[2].blockComment).toEqual("comment II #1\ncomment II #2")
  })

  test("wrong comment", () => {
    const input = `
      --wrong
      `
    expect(() => parseDdlToAst(input)).toThrowError()
  })

  test("inline comments on table", () => {
    const input = `
      create table t1( -- comment I #1
        a integer
      ); -- comment I #2
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.inlineComment).toEqual(["comment I #1", "comment I #2"])
  })

  test("block comments on table", () => {
    const input = `
      -- comment I #1
      -- comment I #2
      create table t1(
        a integer
      );
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.blockComment).toEqual("comment I #1\ncomment I #2")
  })

  test("inline comments on column", () => {
    const input = `
      create table t1(
        a        -- comment I #1
        integer, -- comment I #2
        b       -- comment II #1
        integer -- comment II #2
      );
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect((table.entries[0] as AstColumn).inlineComment).toEqual(["comment I #1", "comment I #2"])
    expect((table.entries[1] as AstColumn).inlineComment).toEqual(["comment II #1", "comment II #2"])
  })

  test("inline comments on table", () => {
    const input = `
      create table t1( -- comment I #1
        a integer
      ) -- comment I #2
      ; -- comment I #3
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.inlineComment).toEqual(["comment I #1", "comment I #2", "comment I #3"])
  })

  test("block comments on column", () => {
    const input = `
      create table t1(
        -- comment I #1
        -- comment I #2
        a integer
      );
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.entries.length).toEqual(1)
    expect(table.entries[0].entryType).toEqual("column")
    expect(table.entries[0].blockComment).toEqual("comment I #1\ncomment I #2")
  })

  test("standalone comments on table", () => {
    const input = `
      create table t1(
        -- comment I #1
        -- comment I #2

        a integer
      );
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.entries.length).toEqual(2)
    expect(table.entries[0].entryType).toEqual("comment")
    expect(table.entries[0].blockComment).toEqual("comment I #1\ncomment I #2")
  })

  test("standalone comments on table (2)", () => {
    const input = `
      create table t1(
        a integer
        -- comment I #1
        -- comment I #2
      );
      `
    const table = parseDdlToAst(input).orders[0] as AstCreateTable
    expect(table.entries.length).toEqual(2)
    expect(table.entries[1].entryType).toEqual("comment")
    expect(table.entries[1].blockComment).toEqual("comment I #1\ncomment I #2")
  })

  test("standalone and block comments between 2 tables", () => {
    const input = `
      create table t1(
        a integer
      );
      -- comment I

      -- comment II #1
      -- comment II #2

      -- comment III
      create table t2(
        a integer
      );
      `
    const orders = parseDdlToAst(input).orders
    expect(orders.length).toEqual(4)
    expect(orders[0].orderType).toEqual("createTable")
    expect(orders[1].orderType).toEqual("comment")
    expect(orders[1].blockComment).toEqual("comment I")
    expect(orders[2].orderType).toEqual("comment")
    expect(orders[2].blockComment).toEqual("comment II #1\ncomment II #2")
    expect(orders[3].orderType).toEqual("createTable")
    expect(orders[3].blockComment).toEqual("comment III")
  })
})
