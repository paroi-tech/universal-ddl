import { parseDdl, parseDdlToRds } from "../src/api"

describe("Dialect Generator Specification for Universal DDL", () => {
  test(`Freeze AST`, () => {
    const input = `create table t1 (a integer);`
    const ast = parseDdl(input, { freeze: true })
    expect(() => ast.orders.push({ orderType: "comment", blockComment: "" })).toThrow()
  })

  test(`Freeze RDS`, () => {
    const input = `create table t1 (a integer);`
    const rds = parseDdlToRds(input, { freeze: true })
    expect(() => rds.tables["t1"].name = "").toThrow()
  })
})
