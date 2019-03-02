import { Ast, AstTable } from "./ast"

export interface ControlResult {
  valid: boolean
  errors?: string[]
}

function getTableConstraintNames(table: AstTable) {
  const constraintNames = new Set<string>()
  const errors: string[] = []

  for (const entry of table.entries) {
    if (entry.entryType === "column" || !entry.name)
      continue
    if (constraintNames.has(entry.name))
      errors.push(`${entry.name} is already used as constraint name in table ${table.name}`)
    else
      constraintNames.add(entry.name)
  }

  return { constraintNames, errors }
}

function getTableColumnNames(table: AstTable) {
  const columnNames = new Set<string>()
  const errors: string[] = []

  for (const entry of table.entries) {
    if (entry.entryType === "column") {
      if (columnNames.has(entry.name))
        errors.push(`${entry.name} is already used as column name in table ${table.name}`)
      else
        columnNames.add(entry.name)
    }
  }

  return { columnNames, errors }
}

export default class CoherenceController {
  control(ast: Ast): ControlResult {
    return {
      valid: true
    }
  }

  private checkTable(table: AstTable): ControlResult {
    const columnObj = getTableColumnNames(table)
    const constraintObj = getTableConstraintNames(table)

    if (columnObj.errors.length > 0 || constraintObj.errors.length > 0) {
      return {
        valid: false,
        errors: columnObj.errors.concat(constraintObj.errors)
      }
    }

    const columnNames = columnObj.columnNames
    const constraintNames = constraintObj.constraintNames
    const intersection = []
    const errors: string[] = []

    for (const name of columnNames) {
      if (constraintNames.has(name))
        errors.push(`${name} is used as column name and constraint name in table ${table.name}`)
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors
      }
    }

    return {
      valid: true
    }
  }
}
