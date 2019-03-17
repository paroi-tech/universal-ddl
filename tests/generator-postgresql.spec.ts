import { generateDdl, parseDdl } from "../src/api"

describe("Dialect Generator Specification for Postgresql", () => {
  test(`generate serial`, () => {
    const input = `create table t1 (
  a integer not null autoincrement
);`
    const output = `create table t1 (
  a serial
);`
    const ast = parseDdl(input, { freeze: true })
    expect(generateDdl(ast, "postgresql")).toEqual(output)
  })

  test(`generate bigserial`, () => {
    const input = `create table t1 (
  a bigint not null autoincrement
);`
    const output = `create table t1 (
  a bigserial
);`
    const ast = parseDdl(input, { freeze: true })
    expect(generateDdl(ast, "postgresql")).toEqual(output)
  })
})
