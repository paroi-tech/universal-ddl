import { parseDdl } from "../src/parse-ddl"

describe("AST Specification for tables", () => {
  test("a table must include at least one column", () => {
    const input = `
      create table t1();
      `
    expect(() => parseDdl(input)).toThrow()
  })

  test("semicolon is required", () => {
    const input = `
      create table t1(
        a varchar(50)
      )
      `
    expect(() => parseDdl(input)).toThrow()
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
    const ast = parseDdl(input)
    expect(ast.orders.map(order => order.name)).toEqual(["t1", "t2", "t3"])
  })

  test("table constraint: foreign key", () => {
    const input = `
      create table t1(
        a integer,
        b integer,
        foreign key (a, b) references other_table (c, d)
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].foreignKeyConstraints[0]).toEqual({
      "columns": ["a", "b"],
      "referencedTable": "other_table",
      "referencedColumns": ["c", "d"]
    })
  })

  test("table constraint: named foreign key", () => {
    const input = `
      create table t1(
        a integer,
        b integer,
        constraint fk1 foreign key (a, b) references other_table (c, d)
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].foreignKeyConstraints[0]).toEqual({
      "name": "fk1",
      "columns": ["a", "b"],
      "referencedTable": "other_table",
      "referencedColumns": ["c", "d"]
    })
  })

  test("table constraint: unique constraint", () => {
    const input = `
      create table t1(
        a integer,
        b integer,
        unique (a, b)
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].uniqueConstraints[0]).toEqual({
      "columns": ["a", "b"]
    })
  })

  test("table constraint: named unique constraint", () => {
    const input = `
      create table t1(
        a integer,
        b integer,
        constraint u1 unique (a, b)
      );
      `
    const ast = parseDdl(input)
    expect(ast.orders[0].uniqueConstraints[0]).toEqual({
      "name": "u1",
      "columns": ["a", "b"]
    })
  })

  test("alter table add foreign key", () => {
    const input = `
      alter table t1 add foreign key (a, b) references t2(c, d);
      `
    const ast = parseDdl(input)
    expect(ast.orders[0]).toEqual({
      "orderType": "alterTable",
      "table": "t1",
      "alterTable": "addForeignKey",
      "foreignKeyConstraint": {
        "columns": ["a", "b"],
        "referencedTable": "foo",
        "referencedColumns": ["c", "d"]
      }
    })
  })

  test("alter table add foreign key (named)", () => {
    const input = `
      alter table t1 add constraint fk1 foreign key (a, b) references t2(c, d);
      `
    const ast = parseDdl(input)
    expect(ast.orders[0]).toEqual({
      "orderType": "alterTable",
      "table": "t1",
      "alterTable": "addForeignKey",
      "foreignKeyConstraint": {
        "name": "fk1",
        "columns": ["a", "b"],
        "referencedTable": "foo",
        "referencedColumns": ["c", "d"]
      }
    })
  })

  test("create index", () => {
    const input = `
      create index idx1 on t1 (a, b);
      `
    const ast = parseDdl(input)
    expect(ast.orders[0]).toEqual({
      "orderType": "createIndex",
      "table": "t1",
      "indexType": "index",
      "index": {
        "name": "idx1",
        "columns": ["a", "b"]
      }
    })
  })

  test("create unique index", () => {
    const input = `
      create unique index u1 on t1 (a, b);
      `
    const ast = parseDdl(input)
    expect(ast.orders[0]).toEqual({
      "orderType": "createIndex",
      "table": "t1",
      "indexType": "unique",
      "uniqueConstraint": {
        "name": "u1",
        "columns": ["a", "b"]
      }
    })
  })

  test("alter table add unique", () => {
    const input = `
      alter table t1 add unique (a, b);
      `
    const ast = parseDdl(input)
    expect(ast.orders[0]).toEqual({
      "orderType": "alterTable",
      "table": "t1",
      "alterTable": "addUnique",
      "uniqueConstraint": {
        "columns": ["a", "b"]
      }
    })
  })

  test("alter table add unique (named)", () => {
    const input = `
      alter table t1 add constraint u1 unique (a, b);
      `
    const ast = parseDdl(input)
    expect(ast.orders[0]).toEqual({
      "orderType": "alterTable",
      "table": "t1",
      "alterTable": "addUnique",
      "uniqueConstraint": {
        "name": "u1",
        "columns": ["a", "b"]
      }
    })
  })
})
