import { checkConsistency, parseDdl } from "../src/api"

describe("Consistency Checker", () => {
  test("check if columns exist in the table #1", () => {
    const input = `
      create table t1(
        a integer,
        unique (b)
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(false)
  })

  test("check if columns exist in the table #2", () => {
    const input = `
      create table t1(
        a integer,
        unique (a)
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(true)
  })

  test("foreign key must use existing table #1", () => {
    const input = `
      create table t1(
        a integer not null primary key
      );
      create table t2(
        a integer references t1 (b)
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(false)
  })

  test("foreign key must use existing table #2", () => {
    const input = `
      create table t1(
        a integer not null primary key
      );
      create table t2(
        a integer references t1 (a)
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(true)
  })

  test("foreign key column types must match with referenced column types #1", () => {
    const input = `
      create table t1(
        a varchar(20) not null primary key
      );
      create table t2(
        a integer references t1 (a)
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(false)
  })

  test("foreign key column types must match with referenced column types #2", () => {
    const input = `
      create table t1(
        a integer not null primary key
      );
      create table t2(
        a integer references t1 (a)
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(true)
  })

  test("default value must match with column type #1", () => {
    const input = `
      create table t1(
        a varchar(20) default 12
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(false)
  })

  test("default value must match with column type #2", () => {
    const input = `
      create table t1(
        a varchar(20) default 'ab'
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(true)
  })

  test("default value must match with column type #3", () => {
    const input = `
      create table t1(
        a varchar(20) default 'current_timestamp'
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(true)
  })

  test("default value must match with column type #4", () => {
    const input = `
      create table t1(
        a timestamp default current_timestamp
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(true)
  })

  test("default value must match with column type #5", () => {
    const input = `
      create table t1(
        a timestamp default 'current_timestamp'
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(false)
  })

  test("default value must match with column type #6", () => {
    const input = `
      create table t1(
        a timestamp default '2019-03-16'
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(true)
  })

  test("default value must match with column type #7", () => {
    const input = `
      create table t1(
        a timestamp default 12
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(false)
  })

  test("alter table must use an existing table #1", () => {
    const input = `
      create table t1(
        a integer
      );
      alter table t2 add unique (a);
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(false)
  })

  test("alter table must use an existing table #2", () => {
    const input = `
      create table t1(
        a integer
      );
      alter table t1 add unique (a);
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(true)
  })

  test("create index must use an existing table #1", () => {
    const input = `
      create table t1(
        a integer
      );
      create index idx1 on t2 (a);
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(false)
  })

  test("create index must use an existing table #2", () => {
    const input = `
      create table t1(
        a integer
      );
      create index idx1 on t1 (a);
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(true)
  })

  test("do not allow to create 2 tables with the same name", () => {
    const input = `
      create table t1(
        a integer
      );
      create table t1(
        a integer
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(false)
  })

  test("do not allow to create 2 columns with the same name", () => {
    const input = `
      create table t1(
        a integer,
        a varchar(20)
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(false)
  })

  test("do not allow several primary keys", () => {
    const input = `
      create table t1(
        a integer not null primary key,
        primary key (a)
      );
      `
    const report = checkConsistency(parseDdl(input, { freeze: true }))
    expect(report.valid).toBe(false)
  })
})
