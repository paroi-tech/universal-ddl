/**
 * Relational Database Structure
 */
export interface Rds {
  tables: RdsTables
}

export interface RdsTables {
  [name: string]: RdsTable
}

export interface RdsTable extends RdsCommentable {
  name: string
  columns: RdsColumns
  constraints: RdsTableContraints
  indexes?: RdsIndex[]
  referencedBy?: RdsForeignKeyConstraint[]
}

export interface RdsColumns {
  [name: string]: RdsColumn
}

export interface RdsColumn extends RdsCommentable {
  table: RdsTable
  name: string
  type: string
  typeArgs?: number[]
  constraints: RdsColumnContraints
  referencedBy?: RdsForeignKeyConstraint[]
}

export interface RdsColumnContraints {
  notNull?: boolean
  primaryKey?: RdsPrimaryKeyConstraint
  autoincrement?: boolean
  unique?: RdsUniqueConstraint
  references?: RdsForeignKeyConstraint[]
  default?: RdsValue
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
  primaryKey?: RdsPrimaryKeyConstraint
  uniqueConstraints?: RdsUniqueConstraint[]
  foreignKeys?: RdsForeignKeyConstraint[]
}

export interface RdsPrimaryKeyConstraint extends RdsCommentable {
  constraintType: "primaryKey"
  table: RdsTable
  columns: RdsColumn[]
}

export interface RdsUniqueConstraint extends RdsIndex {
  constraintType: "unique"
}

export interface RdsForeignKeyConstraint extends RdsCommentable {
  constraintType: "foreignKey"
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
