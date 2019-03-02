export interface Ast {
  orders: AstOrder[]
}

export type AstOrder = AstCreateTable | AstAlterTable | AstCreateIndex

export interface AstCreateTable extends AstCommentable {
  orderType: "createTable"
  name: string
  entries: AstTableEntry[]
}

export interface AstAlterTable extends AstCommentable {
  orderType: "alterTable"
  table: string
  add: AstTableEntry[]
}

export interface AstCreateIndex extends AstCommentable {
  orderType: "createIndex"
  table: string
  name?: string
  index: AstIndex | AstUniqueTableConstraint
}

export type AstTableEntry = AstColumn | AstTableConstraintComposition

export interface AstTableConstraintComposition extends AstCommentable {
  entryType: "constraintComposition"
  name?: string
  constraints: AstTableConstraint[]
}

export type AstTableConstraint = AstPrimaryKeyTableConstraint | AstForeignKeyTableConstraint | AstUniqueTableConstraint

export interface AstPrimaryKeyTableConstraint extends AstCommentable {
  constraintType: "primaryKey"
  columns: string[]
}

export interface AstForeignKeyTableConstraint extends AstCommentable {
  constraintType: "foreignKey"
  columns: string[]
  referencedTable: string
  referencedColumns?: string[]
  onDelete?: AstForeignKeyAction
  onUpdate?: AstForeignKeyAction
}

export type AstForeignKeyAction = "cascade" | "restrict" | "noAction"

export interface AstIndex extends AstCommentable {
  columns: string[]
}

export interface AstUniqueTableConstraint extends AstIndex {
  constraintType: "unique"
}

export interface AstColumn extends AstCommentable {
  entryType: "column"
  name: string
  type: AstDataType
  typeArgs?: number[]
  constraintCompositions?: AstColumnConstraintComposition[]
}

export type AstDataType = "int" | "integer" | "bigint" | "smallint" | "real" | "date" | "time" | "datetime" |
  "timestamp" | "text" | "char" | "varchar" | "decimal" | "numeric" | "float"

export interface AstValue {
  type: "sqlExpr" | "string" | "int" | "float"
  value: string | number
}

export interface AstColumnConstraintComposition {
  name?: string
  constraints: AstColumnConstraint[]
}

export type AstColumnConstraint = AstNotNullColumnConstraint | AstNullColumnConstraint | AstDefaultColumnConstraint |
  AstPrimaryKeyColumnConstraint | AstUniqueColumnConstraint | AstForeignKeyColumnConstraint |
  AstAutoIncrementColumnConstraint

export interface AstNotNullColumnConstraint {
  constraintType: "notNull"
}

export interface AstNullColumnConstraint {
  constraintType: "null"
}

export interface AstDefaultColumnConstraint {
  constraintType: "default"
  value: AstValue
}

export interface AstAutoIncrementColumnConstraint {
  constraintType: "autoIncrement"
}

export interface AstPrimaryKeyColumnConstraint {
  constraintType: "primaryKey"
}

export interface AstUniqueColumnConstraint {
  constraintType: "unique"
}

export interface AstForeignKeyColumnConstraint {
  constraintType: "foreignKey"
  referencedTable: string
  referencedColumn?: string
  onDelete?: AstForeignKeyAction
  onUpdate?: AstForeignKeyAction
}

export interface AstCommentable {
  blockComment?: string
  inlineComment?: string
}
