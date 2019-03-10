import { hasColumnConstraint, isDataTypeDateOrTime, isDataTypeInteger, isDataTypeNumber, isDataTypeString } from "../ast-helpers"
import { Ast, AstAlterTable, AstColumn, AstColumnConstraint, AstColumnConstraintComposition, AstCreateIndex, AstCreateTable, AstDataType, AstOrder, AstTableConstraint, AstTableConstraintComposition, AstTableEntry, AstValue } from "../parser/ast"

export interface ConsistencyCheckerReport {
  valid: boolean
  errors?: string[]
}

/*
- for each table constraint: check if columns exist in the table
- for each foreign key (table constraint and column constraint):
   - check if referenced table and referenced columns exist
   - check if column types match
   - check if the referenced columns are the primary key
- default values must match with column types (and try to parse dates)
- alter table and create index: check if the table exists
- do not allow to create 2 tables or columns or constraints with the same name
- A table cannot have several primary keys
*/

interface CheckedTable {
  name: string
  columns: Map<string, CheckedColumn>
  primaryKey?: CheckedColumn[]
}

interface CheckedColumn {
  name: string
  type: AstDataType
  typeArgs?: number[]
  columnConstraints: Set<string>
}

class StopChecking extends Error {
  stopCause = "tooManyErrors"
}

export default class ConsistencyChecker {
  private tables = new Map<string, CheckedTable>()
  private errors: string[] = []

  check(ast: Ast) {
    try {
      this.checkOrders(ast.orders)
    } catch (err) {
      if (err.stopCause !== "tooManyErrors")
        throw err
    }
  }

  getConsistencyCheckerReport(): ConsistencyCheckerReport {
    if (this.errors.length === 0)
      return { valid: true }
    return {
      valid: false,
      errors: [...this.errors]
    }
  }

  private checkOrders(orders: AstOrder[]) {
    for (const order of orders) {
      switch (order.orderType) {
        case "createTable":
          this.checkCreateTable(order)
          break
        case "alterTable":
          this.checkAlterTable(order)
          break
        case "createIndex":
          this.checkCreateIndex(order)
          break
        default:
          throw new Error(`Unexpected order type: ${order!.orderType}`)
      }
    }
  }

  private checkCreateTable(order: AstCreateTable) {
    if (this.tables.has(order.name))
      this.addError(`Duplicated table: ${order.name}`)
    const checkedTable: CheckedTable = {
      name: order.name,
      columns: new Map<string, CheckedColumn>()
    }
    this.tables.set(order.name, checkedTable)
    this.fillCheckedTable(order.entries, checkedTable)
    this.checkTableEntries(order.entries, checkedTable)
  }

  private checkAlterTable(order: AstAlterTable) {
    const checkedTable = this.tables.get(order.table)
    if (!checkedTable)
      this.addError(`Cannot alter table "${order.table}": unknown table`)
    else {
      this.fillCheckedTable(order.add, checkedTable)
      this.checkTableEntries(order.add, checkedTable)
    }
  }

  private checkCreateIndex(order: AstCreateIndex) {
    const checkedTable = this.tables.get(order.table)
    if (!checkedTable)
      this.addError(`Cannot create index on table "${order.table}": unknown table`)
    else
      this.findColumns(order.index.columns, checkedTable)
  }

  private fillCheckedTable(entries: AstTableEntry[], checkedTable: CheckedTable) {
    for (const entry of entries) {
      if (entry.entryType === "column") {
        if (checkedTable.columns.has(entry.name))
          this.addError(`In table "${checkedTable.name}", duplicated column "${entry.name}"`)
        else {
          const checkedColumn: CheckedColumn = {
            name: entry.name,
            type: entry.type,
            typeArgs: entry.typeArgs,
            columnConstraints: new Set()
          }
          checkedTable.columns.set(entry.name, checkedColumn)
          if (hasColumnConstraint(entry, "primaryKey"))
            this.setPrimaryKeyOn(checkedTable, [checkedColumn])
        }
      }
    }
    for (const entry of entries.filter(({ entryType }) => entryType === "constraintComposition")) {
      const constraints = (entry as AstTableConstraintComposition).constraints
      const pk = constraints.find(({ constraintType }) => constraintType === "primaryKey")
      if (pk) {
        const pkColumn = this.findColumns(pk.columns, checkedTable)
        if (pkColumn)
          this.setPrimaryKeyOn(checkedTable, pkColumn)
      }
    }
  }

  private setPrimaryKeyOn(checkedTable: CheckedTable, columns: CheckedColumn[]) {
    if (checkedTable.primaryKey)
      this.addError(`In table "${checkedTable.name}", duplicated primary key"`)
    else
      checkedTable.primaryKey = columns
  }

  private checkTableEntries(entries: AstTableEntry[], checkedTable: CheckedTable) {
    for (const entry of entries) {
      switch (entry.entryType) {
        case "column":
          this.checkColumn(entry, checkedTable)
          break
        case "constraintComposition":
          entry.constraints.forEach(
            constraint => this.checkTableConstraint(constraint, checkedTable)
          )
          break
        default:
          throw new Error(`Unexpected type of table entry: ${entry!.entryType}`)
      }
    }
  }

  private checkColumn(node: AstColumn, checkedTable: CheckedTable) {
    const column = checkedTable.columns.get(node.name)
    if (!column)
      throw new Error(`Missing column "${node.name}" in table "${checkedTable.name}"`)
    if (node.constraintCompositions) {
      node.constraintCompositions.forEach(
        ({ constraints }) => constraints.forEach(
          constraint => this.checkColumnConstraint(constraint, column, checkedTable)
        )
      )
    }
  }

  private checkColumnConstraint(node: AstColumnConstraint, checkedColumn: CheckedColumn, checkedTable: CheckedTable) {
    switch (node.constraintType) {
      case "notNull":
      case "null":
      case "primaryKey":
      case "unique":
      case "default":
      case "autoincrement":
        if (checkedColumn.columnConstraints.has(node.constraintType)) {
          this.addError(
            `In table "${checkedTable.name}", column "${checkedColumn.name}", duplicated` +
            ` constraint "${node.constraintType}"`
          )
        } else
          checkedColumn.columnConstraints.add(node.constraintType)
        break
      case "foreignKey":
        this.checkForeignKey(checkedTable, [checkedColumn], node.referencedTable,
          node.referencedColumn ? [node.referencedColumn] : undefined)
        break
      default:
        throw new Error(`Unexpected column constraint: ${node!.constraintType}`)
    }
    if (node.constraintType === "default") {
      if (!isValueTypeCompatible(node.value, checkedColumn)) {
        this.addError(
          `In table "${checkedTable.name}", column "${checkedColumn.name}", default value` +
          ` "${node.value.value}" is incompatible with type "${checkedColumn.type}"`
        )
      }
    }
  }

  private checkForeignKey(table: CheckedTable, columns: CheckedColumn[], refTableName: string, refColumnNames?: string[]) {
    if (!columns)
      return
    const columnNames = columns.map(({ name }) => name)
    const refTable = this.tables.get(refTableName)
    if (!refTable) {
      this.addError(`In table "${table.name}", foreign key "${columnNames.join(`", "`)}":` +
        ` invalid referenced table "${refTableName}"`)
      return
    }
    if (!refColumnNames)
      refColumnNames = columnNames
    const refColumns = this.findColumns(refColumnNames, refTable)
    if (!refColumns)
      return
    if (columns.length !== refColumns.length) {
      this.addError(`In table "${table.name}", foreign key "${columnNames.join(`", "`)}":` +
        ` referenced column(s) don't match: "${refColumnNames.join(`", "`)}"`)
      return
    }
    for (let i = 0; i < columns.length; ++i) {
      if (!isSameColumnType(columns[i], refColumns[i])) {
        this.addError(`In table "${table.name}", foreign key "${columnNames.join(`", "`)}":` +
          ` the type of column "${columnNames[i]}" (${toSqlType(columns[i])}) doesn't match with the` +
          ` type of referenced column "${refColumnNames[i]}" (${toSqlType(refColumns[i])})`)
      }
    }
  }

  private checkTableConstraint(node: AstTableConstraint, checkedTable: CheckedTable) {
    switch (node.constraintType) {
      case "primaryKey":
      case "unique":
        this.findColumns(node.columns, checkedTable)
        break
      case "foreignKey":
        const columns = this.findColumns(node.columns, checkedTable)
        if (columns)
          this.checkForeignKey(checkedTable, columns, node.referencedTable, node.referencedColumns)
        break
      default:
        throw new Error(`Unexpected table constraint: ${node!.constraintType}`)
    }
  }

  private findColumns(columnNames: string[], checkedTable: CheckedTable): CheckedColumn[] | undefined {
    const columns = columnNames.map(columnName => this.findColumn(columnName, checkedTable))
    if (!columns.includes(undefined))
      return columns as CheckedColumn[]
  }

  private findColumn(columnName: string, checkedTable: CheckedTable): CheckedColumn | undefined {
    const column = checkedTable.columns.get(columnName)
    if (!column)
      this.addError(`In table "${checkedTable.name}", unknown column "${columnName}"`)
    return column
  }

  private addError(message: string) {
    this.errors.push(message)
    if (this.errors.length > 10)
      throw new StopChecking()
  }
}

function isValueTypeCompatible({ type: valType, value }: AstValue, { type: colType }: CheckedColumn) {
  switch (valType) {
    case "sqlExpr":
      if (value === "current_timestamp" || value === "current_time" || value === "current_date")
        return isDataTypeDateOrTime(colType)
      return true
    case "int":
      return isDataTypeInteger(colType)
    case "float":
      return isDataTypeNumber(colType)
    case "string":
      if (isDataTypeDateOrTime(colType))
        return !isNaN(Date.parse(value as string))
      return isDataTypeString(colType)
    default:
      throw new Error(`Unexpected value type: ${valType}`)
  }
}

function isSameColumnType(col1: CheckedColumn, col2: CheckedColumn) {
  if (col1.type !== col2.type)
    return false
  if (col1.typeArgs === undefined)
    return col2.typeArgs === undefined
  if (col2.typeArgs === undefined)
    return false
  return col1.typeArgs.join(",") === col2.typeArgs.join(",")
}

function toSqlType({ type, typeArgs }: { type: AstDataType, typeArgs?: number[] }) {
  return typeArgs ? `${type}(${typeArgs.join(",")})` : type
}