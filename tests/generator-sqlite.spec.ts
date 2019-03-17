import { generateDdl, parseDdl } from "../src/api"

describe("Dialect Generator Specification for SQLite", () => {
  test(`generate auto_increment`, () => {
    const input = `create table t1 (
  a bigint not null autoincrement
);`
    const output = `create table t1 (
  a integer not null autoincrement
);`
    const ast = parseDdl(input, { freeze: true })
    expect(generateDdl(ast, "sqlite")).toEqual(output)
  })
})
