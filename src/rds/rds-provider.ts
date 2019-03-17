import { Ast, AstAlterTable, AstColumn, AstColumnConstraintComposition, AstCreateIndex, AstCreateTable, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstIndex, AstPrimaryKeyTableConstraint, AstTableConstraintComposition, AstTableEntry, AstUniqueTableConstraint } from "../parser/ast"
import { Rds, RdsColumn, RdsColumns, RdsForeignKeyColumnConstraint, RdsIndex, RdsPrimaryKeyTableConstraint, RdsTable, RdsTables, RdsUniqueTableConstraint } from "./rds"

export function createRdsFromAst({ orders }: Ast): Rds {
  const astTables = orders.filter(({ orderType }) => orderType === "createTable") as AstCreateTable[]
  const astAlterTables = orders.filter(({ orderType }) => orderType === "alterTable") as AstAlterTable[]
  const astCreateIndexes = orders.filter(({ orderType }) => orderType === "createIndex") as AstCreateIndex[]

  const tables: RdsTables = {}
  for (const astTable of astTables)
    tables[astTable.name] = createRdsTable(astTable)

  astAlterTables.forEach(alterTable => addColumnsFromAlterTable(alterTable, tables))
  astTables.forEach(({ name, entries }) => fillTableAndColumnConstraints(name, entries, tables))
  astAlterTables.forEach(({ table, add }) => fillTableAndColumnConstraints(table, add, tables))
  astCreateIndexes.forEach(createIndex => fillTableIndexes(createIndex, tables))

  return { tables }
}

function createRdsTable({ name, entries, blockComment, inlineComment }: AstCreateTable): RdsTable {
  const astColumns = entries.filter(({ entryType }) => entryType === "column") as AstColumn[]
  const columns: RdsColumns = {}
  const table: RdsTable = {
    name,
    columns,
    constraints: {},
    blockComment,
    inlineComment
  }
  for (const column of astColumns)
    columns[column.name] = createRdsColumn(column, table)
  return table
}

function createRdsColumn({ name, type, typeArgs, blockComment, inlineComment }: AstColumn, table: RdsTable): RdsColumn {
  return {
    table,
    name,
    type,
    typeArgs: typeArgs ? [...typeArgs] : undefined,
    constraints: {},
    blockComment,
    inlineComment
  }
}

function addColumnsFromAlterTable({ table: tableName, add: entries }: AstAlterTable, tables: RdsTables) {
  const table = getRdsTable(tableName, tables)
  if (!table)
    throw new Error(`Error in "alter table ${tableName}": unknown table`)
  const astColumns = entries.filter(({ entryType }) => entryType === "column") as AstColumn[]
  for (const column of astColumns)
    table.columns[column.name] = createRdsColumn(column, table)
}

function fillTableAndColumnConstraints(tableName: string, entries: AstTableEntry[], tables: RdsTables) {
  const table = getRdsTable(tableName, tables)
  fillTableConstraints(
    entries.filter(({ entryType }) => entryType === "constraintComposition") as AstTableConstraintComposition[],
    table,
    tables
  )
  const astColumns = entries.filter(({ entryType }) => entryType === "column") as AstColumn[]
  astColumns.forEach(({ name, constraintCompositions }) => {
    if (constraintCompositions)
      fillColumnConstraints(constraintCompositions, getRdsColumn(name, table), tables)
  })
}

function fillTableConstraints(astCompos: AstTableConstraintComposition[], table: RdsTable, tables: RdsTables) {
  for (const { constraints } of astCompos) {
    for (const astConstraint of constraints) {
      switch (astConstraint.constraintType) {
        case "primaryKey":
          fillPrimaryKeyTableConstraint(astConstraint, table)
          break
        case "unique":
          fillUniqueTableConstraint(astConstraint, table)
          break
        case "foreignKey":
          fillForeignKeyTableConstraint(astConstraint, table, tables)
          break
        default:
          throw new Error(`Unknown table constraint type: ${astConstraint!.constraintType}`)
      }
    }
  }
}

function fillPrimaryKeyTableConstraint(astConstraint: AstPrimaryKeyTableConstraint, table: RdsTable) {
  if (table.constraints.primaryKey)
    throw new Error(`Table ${table.name} cannot have several primary keys`)
  if (astConstraint.columns.length === 1)
    getRdsColumn(astConstraint.columns[0], table).constraints.primaryKey = true
  else {
    const constraint: RdsPrimaryKeyTableConstraint = {
      constraintType: "primaryKeyConstraint",
      table,
      columns: astConstraint.columns.map(columnName => getRdsColumn(columnName, table)),
    }
    if (astConstraint.blockComment)
      constraint.blockComment = astConstraint.blockComment
    if (astConstraint.inlineComment)
      constraint.inlineComment = astConstraint.inlineComment
    table.constraints.primaryKey = constraint
  }
}

function fillUniqueTableConstraint(astConstraint: AstUniqueTableConstraint, table: RdsTable) {
  if (astConstraint.columns.length === 1)
    getRdsColumn(astConstraint.columns[0], table).constraints.unique = true
  else {
    const constraint: RdsUniqueTableConstraint = {
      constraintType: "uniqueConstraint",
      table,
      columns: astConstraint.columns.map(columnName => getRdsColumn(columnName, table)),
    }
    if (astConstraint.blockComment)
      constraint.blockComment = astConstraint.blockComment
    if (astConstraint.inlineComment)
      constraint.inlineComment = astConstraint.inlineComment
    if (!table.constraints.uniqueConstraints)
      table.constraints.uniqueConstraints = []
    table.constraints.uniqueConstraints.push(constraint)
  }
}

function fillForeignKeyTableConstraint(astConstraint: AstForeignKeyTableConstraint, table: RdsTable, tables: RdsTables) {
  if (astConstraint.columns.length === 1) {
    const columnName = astConstraint.columns[0]
    const referencedColumn = astConstraint.referencedColumns && astConstraint.referencedColumns[0] || columnName
    fillForeignKeyColumnConstraint(
      {
        constraintType: "foreignKey",
        referencedColumn,
        referencedTable: astConstraint.referencedTable,
        onDelete: astConstraint.onDelete,
        onUpdate: astConstraint.onUpdate
      },
      getRdsColumn(columnName, table),
      tables
    )
  } else {
    const constraint: RdsUniqueTableConstraint = {
      constraintType: "uniqueConstraint",
      table,
      columns: astConstraint.columns.map(columnName => getRdsColumn(columnName, table)),
    }
    if (astConstraint.blockComment)
      constraint.blockComment = astConstraint.blockComment
    if (astConstraint.inlineComment)
      constraint.inlineComment = astConstraint.inlineComment
    if (!table.constraints.uniqueConstraints)
      table.constraints.uniqueConstraints = []
    table.constraints.uniqueConstraints.push(constraint)
  }
}

function fillForeignKeyColumnConstraint(astConstraint: AstForeignKeyColumnConstraint, column: RdsColumn, tables: RdsTables) {
  const referencedTable = getRdsTable(astConstraint.referencedTable, tables)
  const constraint: RdsForeignKeyColumnConstraint = {
    referencedColumn: getRdsColumn(astConstraint.referencedColumn || column.name, referencedTable),
    referencedTable,
    onDelete: astConstraint.onDelete,
    onUpdate: astConstraint.onUpdate
  }
  const columnConstraints = column.constraints
  if (!columnConstraints.references)
    columnConstraints.references = []
  columnConstraints.references.push(constraint)
}

function fillColumnConstraints(astCompos: AstColumnConstraintComposition[], column: RdsColumn, tables: RdsTables) {
  for (const { constraints } of astCompos) {
    for (const astConstraint of constraints) {
      switch (astConstraint.constraintType) {
        case "notNull":
          column.constraints.notNull = true
          break
        case "null":
          break
        case "primaryKey":
          column.constraints.primaryKey = true
          break
        case "autoincrement":
          column.constraints.autoincrement = true
          break
        case "unique":
          column.constraints.unique = true
          break
        case "foreignKey":
          fillForeignKeyColumnConstraint(astConstraint, column, tables)
          break
        case "default":
          column.constraints.default = {
            value: astConstraint.value.value
          }
          if (astConstraint.value.type === "sqlExpr")
            column.constraints.default.isSqlExpr = true
          break
        default:
          throw new Error(`Unknown column constraint type: ${astConstraint!.constraintType}`)
      }
    }
  }
}

function fillTableIndexes({ table: tableName, index }: AstCreateIndex, tables: RdsTables) {
  const table = getRdsTable(tableName, tables)
  if (isAstUniqueTableConstraint(index))
    fillUniqueTableConstraint(index, table)
  else
    fillIndex(index, table)
}

function isAstUniqueTableConstraint(index: AstIndex | AstUniqueTableConstraint): index is AstUniqueTableConstraint {
  return index["constraintType"] === "unique"
}

function fillIndex(astIndex: AstIndex, table: RdsTable) {
  const index: RdsIndex = {
    table,
    columns: astIndex.columns.map(columnName => getRdsColumn(columnName, table)),
  }
  if (astIndex.blockComment)
    index.blockComment = astIndex.blockComment
  if (astIndex.inlineComment)
    index.inlineComment = astIndex.inlineComment
  if (!table.indexes)
    table.indexes = []
  table.indexes.push(index)
}

function getRdsColumn(columnName: string, table: RdsTable) {
  const column = table.columns[columnName]
  if (!column)
    throw new Error(`Unknown column "${columnName}" in table "${table.name}"`)
  return column
}

function getRdsTable(tableName: string, tables: RdsTables) {
  const table = tables[tableName]
  if (!table)
    throw new Error(`Unknown table "${tableName}"`)
  return table
}