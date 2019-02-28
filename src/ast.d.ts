export interface Ast {
  orders: AstOrder[]
}

export type AstOrder = AstTable | AstAlterTable | AstCreateIndex

export interface AstTable {
  orderType: "createTable"
  name: string
  entries: AstTableEntry[]
}

export interface AstAlterTable {
  orderType: "alterTable"
  table: string
  add: AstTableEntry[]
}

export interface AstCreateIndex {
  orderType: "createIndex"
  table: string
  name?: string,
  index: AstIndex | AstUniqueConstraint
}

export type AstTableEntry = AstColumn | AstTableConstraintComposition

export interface AstTableConstraintComposition {
  entryType: "constraintComposition"
  name?: string
  constraints: AstTableConstraint[]
}

export type AstTableConstraint = AstPrimaryKeyConstraint | AstForeignKeyConstraint | AstUniqueConstraint

export interface AstPrimaryKeyConstraint {
  constraintType: "primaryKey"
  columns: string[]
}

export interface AstForeignKeyConstraint {
  constraintType: "foreignKey"
  columns: string[]
  referencedTable: string,
  referencedColumns?: string[]
}

export interface AstIndex {
  columns: string[]
}

export interface AstUniqueConstraint extends AstIndex {
  constraintType: "unique"
}

export interface AstColumn {
  entryType: "column"
  name: string
  type: AstDataType
  typeArgs?: number[]
  constraintCompositions?: AstColumnConstraintComposition[]
}

export type AstDataType = "int" | "integer" | "bigint" | "smallint" | "real" | "date" | "time" | "datetime" |
  "timestamp" | "text" | "char" | "varchar" | "decimal" | "numeric" | "float"

export interface AstValue {
  type: "sql" | "string" | "int" | "float"
  value: string | number
}

export interface AstColumnConstraintComposition {
  name?: string
  constraints: AstColumnConstraint[]
}

export type AstColumnConstraint = AstNotNullColumnConstraint | AstDefaultColumnConstraint | AstPrimaryKeyColumnConstraint | AstUniqueColumnConstraint | AstForeignKeyColumnConstraint

export interface AstNotNullColumnConstraint {
  constraintType: "notNull"
}

export interface AstDefaultColumnConstraint {
  constraintType: "default"
  value: AstValue
}

export interface AstPrimaryKeyColumnConstraint {
  constraintType: "primaryKey"
  autoincrement?: boolean
}

export interface AstUniqueColumnConstraint {
  constraintType: "unique"
}

export interface AstForeignKeyColumnConstraint {
  constraintType: "foreignKey"
  referencedTable: string
  referencedColumn?: string
}
