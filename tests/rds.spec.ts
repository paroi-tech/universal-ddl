import { parseDdlToRds } from "../src/api"

describe("RDS - Relational Database Structure", () => {
  test("correct list of table names", () => {
    const input = `
      create table t1(
        a integer
      );
      create table t2(
        a integer
      );
      `
    const rds = parseDdlToRds(input, { freeze: true })
    expect(Object.keys(rds.tables)).toEqual(["t1", "t2"])
  })

  test("replace primary key table constraint by column constraint", () => {
    const input = `
      create table t1(
        a integer,
        primary key (a)
      );
      `
    const rds = parseDdlToRds(input, { freeze: true })
    expect(rds.tables["t1"].constraints.primaryKey).toBeUndefined()
    expect(rds.tables["t1"].columns["a"].constraints.primaryKey).toBe(true)
  })

  test("replace unique table constraint by column constraint", () => {
    const input = `
      create table t1(
        a integer,
        unique (a)
      );
      `
    const rds = parseDdlToRds(input, { freeze: true })
    expect(rds.tables["t1"].constraints.uniqueConstraints).toBeUndefined()
    expect(rds.tables["t1"].columns["a"].constraints.unique).toBe(true)
  })

  test("replace foreign key table constraint by column constraint", () => {
    const input = `
      create table t1(
        a integer not null primary key
      );
      create table t2(
        a integer,
        foreign key (a) references t1
      );
      `
    const rds = parseDdlToRds(input, { freeze: true })
    expect(rds.tables["t2"].constraints.foreignKeys).toBeUndefined()
    const references = rds.tables["t2"].columns["a"].constraints.references
    expect(references).toBeDefined()
    expect(references![0].referencedTable).toBe(rds.tables["t1"])
    expect(references![0].referencedColumn).toBe(rds.tables["t1"].columns["a"])
  })

  test("alter table add unique to be merged #1", () => {
    const input = `
      create table t1(
        a integer
      );
      alter table t1 add unique(a);
      `
    const rds = parseDdlToRds(input, { freeze: true })
    expect(rds.tables["t1"].constraints.uniqueConstraints).toBeUndefined()
    expect(rds.tables["t1"].columns["a"].constraints.unique).toBe(true)
  })

  test("alter table add unique to be merged #2", () => {
    const input = `
      create table t1(
        a integer,
        b varchar(255)
      );
      alter table t1 add unique(a, b);
      `
    const rds = parseDdlToRds(input, { freeze: true })
    const uniqueConstraints = rds.tables["t1"].constraints.uniqueConstraints
    expect(uniqueConstraints).toBeDefined()
    expect(uniqueConstraints![0].columns[0]).toBe(rds.tables["t1"].columns["a"])
    expect(uniqueConstraints![0].columns[1]).toBe(rds.tables["t1"].columns["b"])
  })
})
