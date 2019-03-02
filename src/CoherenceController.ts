import { Ast, AstColumn, AstCreateTable, AstTableConstraintComposition, AstTableEntry } from "./ast"

export interface ControlResult {
  valid: boolean
  errors?: string[]
}

export default class CoherenceController {
  control(ast: Ast): ControlResult {
    return {
      valid: true
    }
  }
}

function getTableConstraintNames(table: AstCreateTable) {
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

function getTableColumnNames(table: AstCreateTable) {
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

function checkTable(table: AstCreateTable): ControlResult {
  const constraintCompositions: AstTableConstraintComposition[] = []
  const columns: AstColumn[] = []

  for (const entry of table.entries) {
    if (entry.entryType === "column")
      columns.push(entry)
    else
      constraintCompositions.push(entry)
  }

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

  for (const composition of constraintCompositions) {
    const constraintName = composition.name || "<Unamed>"
    for (const constraint of composition.constraints) {
      for (const name of constraint.columns) {
        if (!columnNames.has(name))
          errors.push(`Column ${name} used in constraint ${constraintName} does not exist in table ${table.name}`)
      }
    }
  }

  return { valid: true }
}
