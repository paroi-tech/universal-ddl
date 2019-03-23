/**
 * Relational Database Structure
 */
export interface Rds {
  tables: RdsTables
}

export type RdsTables = { [name: string]: RdsTable }

export interface RdsTable extends RdsCommentable {
  name: string
  columns: RdsColumns
  constraints: RdsTableContraints
  indexes?: RdsIndex[]
}

export type RdsColumns = { [name: string]: RdsColumn }

export interface RdsColumn extends RdsCommentable {
  table: RdsTable
  name: string
  type: string
  typeArgs?: number[]
  constraints: RdsColumnContraints
}

export interface RdsColumnContraints {
  notNull?: boolean
  primaryKey?: boolean
  autoincrement?: boolean
  unique?: boolean
  references?: RdsForeignKeyColumnConstraint[]
  default?: RdsValue
}

export interface RdsForeignKeyColumnConstraint {
  referencedTable: RdsTable
  referencedColumn: RdsColumn
  onDelete?: RdsForeignKeyAction
  onUpdate?: RdsForeignKeyAction
}

export type RdsForeignKeyAction = "cascade" | "restrict" | "noAction"

export interface RdsValue {
  isSqlExpr?: boolean
  value: string | number
}

export interface RdsIndex extends RdsCommentable {
  table: RdsTable
  columns: RdsColumn[]
}

export interface RdsTableContraints {
  primaryKey?: RdsPrimaryKeyTableConstraint
  uniqueConstraints?: RdsUniqueTableConstraint[]
  foreignKeys?: RdsForeignKeyTableConstraint[]
}

export interface RdsPrimaryKeyTableConstraint extends RdsCommentable {
  constraintType: "primaryKeyConstraint"
  table: RdsTable
  columns: RdsColumn[]
}

export interface RdsUniqueTableConstraint extends RdsIndex {
  constraintType: "uniqueConstraint"
}

export interface RdsForeignKeyTableConstraint extends RdsCommentable {
  constraintType: "foreignKeyConstraint"
  table: RdsTable
  columns: RdsColumn[]
  referencedTable: RdsTable
  referencedColumns: RdsColumn[]
  onDelete?: RdsForeignKeyAction
  onUpdate?: RdsForeignKeyAction
}

export interface RdsCommentable {
  blockComment?: string
  inlineComment?: string | string[]
}