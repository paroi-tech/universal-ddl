import { generateDdl, parseDdl } from "../src/api"

describe("Dialect Generator Specification for MariaDB", () => {
  test(`generate auto_increment`, () => {
    const input = `create table t1 (
  a integer not null autoincrement
);`
    const output = `create table t1 (
  a integer not null auto_increment
);`
    const ast = parseDdl(input, { freeze: true })
    expect(generateDdl(ast, "mariadb")).toEqual(output)
  })

  test(`foreign keys: replace column constraint by table constraint #1`, () => {
    const input = `create table t1 (
  a integer references t2 (b)
);`
    const output = `create table t1 (
  a integer,
  foreign key (a) references t2 (b)
);`
    const ast = parseDdl(input, { freeze: true })
    expect(generateDdl(ast, "mariadb")).toEqual(output)
  })

  test(`foreign keys: replace column constraint by table constraint #2`, () => {
    const input = `create table t1 (
  a integer not null references t2 (b)
);`
    const output = `create table t1 (
  a integer not null,
  foreign key (a) references t2 (b)
);`
    const ast = parseDdl(input, { freeze: true })
    expect(generateDdl(ast, "mariadb")).toEqual(output)
  })

  test(`foreign keys: replace column constraint by table constraint #3`, () => {
    const input = `create table t1 (
  a integer references t2
);`
    const output = `create table t1 (
  a integer,
  foreign key (a) references t2
);`
    const ast = parseDdl(input, { freeze: true })
    expect(generateDdl(ast, "mariadb")).toEqual(output)
  })
})
