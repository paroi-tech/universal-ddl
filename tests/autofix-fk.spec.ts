import { parseDdl, parseDdlToRds } from "../src/api"
import { AstAlterTable, AstForeignKeyTableConstraint, AstTableConstraintComposition } from "../src/parser/ast"

describe("Autofix FK", () => {
  test(`Cross table foreign keys as column constraints`, () => {
    const input = `
      create table A (
        a integer not null primary key,
        b integer references B
      );
      create table B (
        b integer not null primary key,
        a integer not null references A
      );
      `
    const ast = parseDdl(input, { freeze: true, autofix: { "foreignKeys": true }, checkConsistency: true })
    expect(ast.orders.length).toBe(3)
    expect(ast.orders[2].orderType).toBe("alterTable")
    const alterTable = ast.orders[2] as AstAlterTable
    expect(alterTable.table).toBe("A")
    expect(alterTable.add[0].entryType).toBe("constraintComposition")
    const fk = (alterTable.add[0] as AstTableConstraintComposition).constraints[0] as AstForeignKeyTableConstraint
    expect(fk.referencedTable).toBe("B")
  })

  test(`Cross table foreign keys as table constraints`, () => {
    const input = `
      create table A (
        a integer not null primary key,
        b integer,
        foreign key (b) references B
      );
      create table B (
        b integer not null primary key,
        a integer not null,
        foreign key (a) references A
      );
      `
    const ast = parseDdl(input, { freeze: true, autofix: { "foreignKeys": true }, checkConsistency: true })
    expect(ast.orders.length).toBe(3)
    expect(ast.orders[2].orderType).toBe("alterTable")
    const alterTable = ast.orders[2] as AstAlterTable
    expect(alterTable.table).toBe("A")
    expect(alterTable.add[0].entryType).toBe("constraintComposition")
    const fk = (alterTable.add[0] as AstTableConstraintComposition).constraints[0] as AstForeignKeyTableConstraint
    expect(fk.referencedTable).toBe("B")
  })
})
