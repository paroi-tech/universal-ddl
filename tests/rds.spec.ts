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

  test("add primary key table constraint as column constraint", () => {
    const input = `
      create table t1(
        a integer,
        primary key (a)
      );
      `
    const rds = parseDdlToRds(input, { freeze: true })
    const constraint = rds.tables["t1"].constraints.primaryKey
    expect(constraint).toBeDefined()
    expect(rds.tables["t1"].columns["a"].constraints.primaryKey).toBe(constraint)
  })

  test("add unique table constraint as column constraint", () => {
    const input = `
      create table t1(
        a integer,
        unique (a)
      );
      `
    const rds = parseDdlToRds(input, { freeze: true })
    expect(rds.tables["t1"].constraints.uniqueConstraints).toBeDefined()
    const constraint = rds.tables["t1"].constraints.uniqueConstraints![0]
    expect(constraint).toBeDefined()
    expect(rds.tables["t1"].columns["a"].constraints.unique).toBe(constraint)
  })

  test("add foreign key table constraint as column constraint", () => {
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
    expect(rds.tables["t2"].constraints.foreignKeys).toBeDefined()
    const constraint = rds.tables["t2"].constraints.foreignKeys![0]
    expect(constraint).toBeDefined()
    expect(rds.tables["t2"].columns["a"].constraints.references).toBeDefined()
    expect(rds.tables["t2"].columns["a"].constraints.references![0]).toBe(constraint)

    expect(constraint.referencedTable).toBe(rds.tables["t1"])
    expect(constraint.referencedColumns[0]).toBe(rds.tables["t1"].columns["a"])
  })

  test("alter table add unique to be merged #1", () => {
    const input = `
      create table t1(
        a integer
      );
      alter table t1 add unique(a);
      `
    const rds = parseDdlToRds(input, { freeze: true })
    expect(rds.tables["t1"].constraints.uniqueConstraints).toBeDefined()
    const constraint = rds.tables["t1"].constraints.uniqueConstraints![0]
    expect(constraint).toBeDefined()
    expect(rds.tables["t1"].columns["a"].constraints.unique).toBe(constraint)
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
    expect(rds.tables["t1"].constraints.uniqueConstraints).toBeDefined()
    const constraint = rds.tables["t1"].constraints.uniqueConstraints![0]
    expect(constraint).toBeDefined()
    expect(rds.tables["t1"].columns["a"].constraints.unique).toBeUndefined()
    expect(constraint.columns[0]).toBe(rds.tables["t1"].columns["a"])
    expect(constraint.columns[1]).toBe(rds.tables["t1"].columns["b"])
  })
})
