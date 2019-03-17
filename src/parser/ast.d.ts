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
  name?: string
  index: AstIndex | AstUniqueTableConstraint
}

export type AstTableEntry = AstColumn | AstTableConstraintComposition | AstStandaloneTableComment

export type AstTableEntryType = AstTableEntry["entryType"]

export interface AstTableConstraintComposition extends AstCommentable {
  entryType: "constraintComposition"
  name?: string
  constraints: AstTableConstraint[]
}

export type AstTableConstraint = AstPrimaryKeyTableConstraint | AstForeignKeyTableConstraint | AstUniqueTableConstraint

export type AstTableConstraintType = AstTableConstraint["constraintType"]

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

export type AstDataType = "int" | "integer" | "bigint" | "smallint" | "tinyint"
  | "real" | "decimal" | "numeric" | "float"
  | "date" | "time" | "datetime" | "timestamp" | "text" | "char" | "varchar"

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
  AstAutoincrementColumnConstraint

export type AstColumnConstraintType = AstColumnConstraint["constraintType"]

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

export interface AstAutoincrementColumnConstraint {
  constraintType: "autoincrement"
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