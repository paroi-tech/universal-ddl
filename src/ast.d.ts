export interface Ast {
  orders: AstOrder[]
}

export type AstOrder = AstCreateTable | AstAlterTable | AstCreateIndex | AstStandaloneComment

export type AstOrderType = AstOrder["orderType"]

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
  index: AstIndex | AstUniqueTableConstraint
}

export type AstTableEntry = AstColumn | AstTableConstraint | AstStandaloneTableComment

export type AstTableEntryType = AstTableEntry["entryType"]

export type AstTableConstraint = AstPrimaryKeyTableConstraint | AstForeignKeyTableConstraint | AstUniqueTableConstraint

export type AstTableConstraintType = AstTableConstraint["constraintType"]

export interface AstPrimaryKeyTableConstraint extends AstCommentable {
  entryType: "constraint"
  constraintType: "primaryKey"
  name?: string
  columns: string[]
}

export interface AstForeignKeyTableConstraint extends AstCommentable {
  entryType: "constraint"
  constraintType: "foreignKey"
  name?: string
  columns: string[]
  referencedTable: string
  referencedColumns?: string[]
  onDelete?: AstForeignKeyAction
  onUpdate?: AstForeignKeyAction
}

export type AstForeignKeyAction = "cascade" | "restrict" | "noAction"

export interface AstIndex extends AstCommentable {
  columns: string[]
  name?: string
}

export interface AstUniqueTableConstraint extends AstIndex {
  entryType: "constraint"
  constraintType: "unique"
}

export interface AstColumn extends AstCommentable {
  entryType: "column"
  name: string
  type: AstDataType
  typeArgs?: number[]
  constraints?: AstColumnConstraint[]
}

export type AstDataType = "int" | "integer" | "bigint" | "smallint" | "tinyint"
  | "real" | "decimal" | "numeric" | "float"
  | "date" | "time" | "datetime" | "timestamp" | "text" | "char" | "varchar"

export interface AstValue {
  type: "sqlExpr" | "string" | "int" | "float"
  value: string | number
}

export type AstColumnConstraint = AstNotNullColumnConstraint | AstNullColumnConstraint | AstDefaultColumnConstraint |
  AstPrimaryKeyColumnConstraint | AstUniqueColumnConstraint | AstForeignKeyColumnConstraint |
  AstAutoincrementColumnConstraint

export type AstColumnConstraintType = AstColumnConstraint["constraintType"]

export interface AstNotNullColumnConstraint {
  constraintType: "notNull"
  name?: string
}

export interface AstNullColumnConstraint {
  constraintType: "null"
  name?: string
}

export interface AstDefaultColumnConstraint {
  constraintType: "default"
  name?: string
  value: AstValue
}

export interface AstAutoincrementColumnConstraint {
  constraintType: "autoincrement"
  name?: string
}

export interface AstPrimaryKeyColumnConstraint {
  constraintType: "primaryKey"
  name?: string
}

export interface AstUniqueColumnConstraint {
  constraintType: "unique"
  name?: string
}

export interface AstForeignKeyColumnConstraint {
  constraintType: "foreignKey"
  name?: string
  referencedTable: string
  referencedColumn?: string
  onDelete?: AstForeignKeyAction
  onUpdate?: AstForeignKeyAction
}

export interface AstStandaloneComment {
  orderType: "comment"
  /**
   * A multiline string.
   */
  blockComment: string
}

export interface AstStandaloneTableComment {
  entryType: "comment"
  /**
   * A multiline string.
   */
  blockComment: string
}

export interface AstCommentable {
  /**
   * A multiline string.
   */
  blockComment?: string
  inlineComment?: string | string[]
}