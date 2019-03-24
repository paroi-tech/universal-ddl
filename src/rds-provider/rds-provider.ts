import { Ast, AstAlterTable, AstColumn, AstColumnConstraint, AstCreateIndex, AstCreateTable, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstIndex, AstPrimaryKeyColumnConstraint, AstPrimaryKeyTableConstraint, AstTableConstraint, AstTableEntry, AstUniqueColumnConstraint, AstUniqueTableConstraint } from "../ast"
import { Rds, RdsColumn, RdsColumns, RdsForeignKeyConstraint, RdsIndex, RdsPrimaryKeyConstraint, RdsTable, RdsTables, RdsUniqueConstraint } from "../rds"

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
    entries.filter(({ entryType }) => entryType === "constraint") as AstTableConstraint[],
    table,
    tables
  )
  const astColumns = entries.filter(({ entryType }) => entryType === "column") as AstColumn[]
  astColumns.forEach(({ name, constraints }) => {
    if (constraints)
      fillColumnConstraints(constraints, getRdsColumn(name, table), tables)
  })
}

function fillTableConstraints(astConstraints: AstTableConstraint[], table: RdsTable, tables: RdsTables) {
  for (const astConstraint of astConstraints) {
    switch (astConstraint.constraintType) {
      case "primaryKey":
        fillPrimaryKeyConstraint(astConstraint, table)
        break
      case "unique":
        fillUniqueConstraint(astConstraint, table)
        break
      case "foreignKey":
        fillForeignKeyConstraint(astConstraint, table, tables)
        break
      default:
        throw new Error(`Unknown table constraint type: ${astConstraint!.constraintType}`)
    }
  }
}

function fillPrimaryKeyConstraint(astConstraint: AstPrimaryKeyTableConstraint, table: RdsTable) {
  if (table.constraints.primaryKey)
    throw new Error(`Table ${table.name} cannot have several primary keys`)
  const constraint = createPrimaryKeyConstraint(astConstraint, table)
  table.constraints.primaryKey = constraint
  if (constraint.columns.length === 1)
    constraint.columns[0].constraints.primaryKey = constraint
}

function createPrimaryKeyConstraint(astConstraint: AstPrimaryKeyTableConstraint, table: RdsTable) {
  const constraint: RdsPrimaryKeyConstraint = {
    constraintType: "primaryKey",
    table,
    columns: astConstraint.columns.map(columnName => getRdsColumn(columnName, table)),
  }
  if (astConstraint.blockComment)
    constraint.blockComment = astConstraint.blockComment
  if (astConstraint.inlineComment)
    constraint.inlineComment = astConstraint.inlineComment
  return constraint
}

function fillUniqueConstraint(astConstraint: AstUniqueTableConstraint, table: RdsTable) {
  const constraint = createUniqueConstraint(astConstraint, table)

  if (!table.constraints.uniqueConstraints)
    table.constraints.uniqueConstraints = []
  table.constraints.uniqueConstraints.push(constraint)

  if (constraint.columns.length === 1)
    constraint.columns[0].constraints.unique = constraint
}

function createUniqueConstraint(astConstraint: AstUniqueTableConstraint, table: RdsTable) {
  const constraint: RdsUniqueConstraint = {
    constraintType: "unique",
    table,
    columns: astConstraint.columns.map(columnName => getRdsColumn(columnName, table)),
  }
  if (astConstraint.blockComment)
    constraint.blockComment = astConstraint.blockComment
  if (astConstraint.inlineComment)
    constraint.inlineComment = astConstraint.inlineComment
  return constraint
}

function fillForeignKeyConstraint(astConstraint: AstForeignKeyTableConstraint, table: RdsTable, tables: RdsTables) {
  const constraint = createForeignKeyConstraint(astConstraint, table, tables)

  if (!table.constraints.foreignKeys)
    table.constraints.foreignKeys = []
  table.constraints.foreignKeys.push(constraint)

  if (!constraint.referencedTable.referencedBy)
    constraint.referencedTable.referencedBy = []
  constraint.referencedTable.referencedBy.push(constraint)

  if (constraint.columns.length === 1) {
    const column = constraint.columns[0]
    if (!column.constraints.references)
      column.constraints.references = []
    column.constraints.references.push(constraint)

    const referencedColumn = constraint.referencedColumns[0]
    if (!referencedColumn.referencedBy)
      referencedColumn.referencedBy = []
    referencedColumn.referencedBy.push(constraint)
  }
}

function createForeignKeyConstraint(astConstraint: AstForeignKeyTableConstraint, table: RdsTable, tables: RdsTables) {
  const referencedTable = getRdsTable(astConstraint.referencedTable, tables)
  const constraint: RdsForeignKeyConstraint = {
    constraintType: "foreignKey",
    table,
    columns: astConstraint.columns.map(columnName => getRdsColumn(columnName, table)),
    referencedTable,
    referencedColumns: getRdsColumns(astConstraint.referencedColumns || astConstraint.columns, referencedTable)
  }
  if (astConstraint.onDelete)
    constraint.onDelete = astConstraint.onDelete
  if (astConstraint.onUpdate)
    constraint.onUpdate = astConstraint.onUpdate
  if (astConstraint.blockComment)
    constraint.blockComment = astConstraint.blockComment
  if (astConstraint.inlineComment)
    constraint.inlineComment = astConstraint.inlineComment
  return constraint
}

function fillColumnConstraints(astConstraints: AstColumnConstraint[], column: RdsColumn, tables: RdsTables) {
  for (const astConstraint of astConstraints) {
    switch (astConstraint.constraintType) {
      case "notNull":
        column.constraints.notNull = true
        break
      case "null":
        break
      case "primaryKey":
        fillPrimaryKeyConstraint(toAstPrimaryKeyTableConstraint(astConstraint, column), column.table)
        break
      case "autoincrement":
        column.constraints.autoincrement = true
        break
      case "unique":
        fillUniqueConstraint(toAstUniqueTableConstraint(astConstraint, column), column.table)
        break
      case "foreignKey":
        fillForeignKeyConstraint(toAstForeignKeyTableConstraint(astConstraint, column), column.table, tables)
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

function toAstPrimaryKeyTableConstraint(astSource: AstPrimaryKeyColumnConstraint, column: RdsColumn) {
  const constraint: AstPrimaryKeyTableConstraint = {
    entryType: "constraint",
    constraintType: "primaryKey",
    columns: [column.name],
  }
  if (astSource.name)
    constraint.name = astSource.name
  return constraint
}

function toAstUniqueTableConstraint(astSource: AstUniqueColumnConstraint, column: RdsColumn) {
  const constraint: AstUniqueTableConstraint = {
    entryType: "constraint",
    constraintType: "unique",
    columns: [column.name],
  }
  if (astSource.name)
    constraint.name = astSource.name
  return constraint
}

function toAstForeignKeyTableConstraint(astSource: AstForeignKeyColumnConstraint, column: RdsColumn) {
  const constraint: AstForeignKeyTableConstraint = {
    entryType: "constraint",
    constraintType: "foreignKey",
    columns: [column.name],
    referencedTable: astSource.referencedTable,
    referencedColumns: [column.name],
  }
  if (astSource.name)
    constraint.name = astSource.name
  if (astSource.onDelete)
    constraint.onDelete = astSource.onDelete
  if (astSource.onUpdate)
    constraint.onUpdate = astSource.onUpdate
  return constraint
}

function fillTableIndexes({ table: tableName, index }: AstCreateIndex, tables: RdsTables) {
  const table = getRdsTable(tableName, tables)
  if (isAstUniqueTableConstraint(index))
    fillUniqueConstraint(index, table)
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

function getRdsTable(tableName: string, tables: RdsTables) {
  const table = tables[tableName]
  if (!table)
    throw new Error(`Unknown table "${tableName}"`)
  return table
}

function getRdsColumn(columnName: string, table: RdsTable) {
  const column = table.columns[columnName]
  if (!column)
    throw new Error(`Unknown column "${columnName}" in table "${table.name}"`)
  return column
}

function getRdsColumns(columnNames: string[], table: RdsTable) {
  return columnNames.map(columnName => getRdsColumn(columnName, table))
}