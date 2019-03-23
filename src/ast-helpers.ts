import { AstColumn, AstColumnConstraintType, AstDataType } from "./ast"

export function hasColumnConstraint({ constraints }: AstColumn, type: AstColumnConstraintType): boolean {
  if (!constraints)
    return false
  return !!constraints.find(({ constraintType }) => constraintType === type)
}

export function isDataTypeInteger(colType: AstDataType) {
  return colType === "int" || colType === "integer" || colType === "bigint" || colType === "smallint"
    || colType === "tinyint"
}

export function isDataTypeNumber(colType: AstDataType) {
  return colType === "float" || colType === "real" || colType === "decimal" || colType === "numeric"
    || isDataTypeInteger(colType)
}

export function isDataTypeString(colType: AstDataType) {
  return colType === "char" || colType === "varchar" || colType === "text"
}

export function isDataTypeDateOrTime(colType: AstDataType) {
  return colType === "date" || colType === "time" || colType === "timestamp" || colType === "datetime"
}