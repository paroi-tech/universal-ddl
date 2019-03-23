import { AstColumn, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstTableConstraint, AstTableEntry } from "../../ast"
import { removeSelectedItems } from "../../ast-modifier/modifier-helpers"
import { AstModifier } from "../ast-modifier"

export const fkColumnToTableConstraintModifier: AstModifier = {
  forEach: "tableEntries",
  replace(entries: AstTableEntry[]) {
    const found = findAllColumnForeignKeys(entries)
    if (found.size === 0)
      return entries
    return replaceFkColumnConstraintsWithTableConstraints(found, entries)
  }
}

interface FoundColumnFk {
  constraintIndex: number
  fk: AstForeignKeyColumnConstraint
}

function findAllColumnForeignKeys(entries: AstTableEntry[]): Map<AstColumn, FoundColumnFk[]> {
  const result = new Map<AstColumn, FoundColumnFk[]>()
  for (const entry of entries) {
    if (entry.entryType !== "column" || !entry.constraints)
      continue
    entry.constraints.forEach((constraint, constraintIndex) => {
      if (constraint.constraintType === "foreignKey") {
        let list = result.get(entry)
        if (!list) {
          list = []
          result.set(entry, list)
        }
        list.push({
          constraintIndex,
          fk: constraint
        })
      }
    })
  }
  return result
}

function replaceFkColumnConstraintsWithTableConstraints(found: Map<AstColumn, FoundColumnFk[]>, entries: AstTableEntry[]) {
  const updated: AstTableEntry[] = []
  for (const entry of entries) {
    const foundFkList = entry.entryType === "column" && found.get(entry)
    if (!foundFkList)
      updated.push(entry)
    else {
      const column = entry as AstColumn
      const indices = foundFkList.map(({ constraintIndex }) => constraintIndex)
      const constraints = removeSelectedItems(indices, column.constraints!)
      const copy = { ...column }
      if (constraints)
        copy.constraints = constraints
      else
        delete copy.constraints
      updated.push(copy)
    }
  }
  for (const [column, foundFkList] of found.entries()) {
    for (const { fk } of foundFkList)
      updated.push(foreignKeyColumnToTableConstraint(fk, column.name))
  }
  return updated
}

export function foreignKeyColumnToTableConstraint(
  fk: AstForeignKeyColumnConstraint,
  columnName: string,
  constraintName?: string
): AstForeignKeyTableConstraint {
  const tableFk: AstForeignKeyTableConstraint = {
    entryType: "constraint",
    constraintType: "foreignKey",
    columns: [columnName],
    referencedTable: fk.referencedTable,
  }
  if (fk.referencedColumn)
    tableFk.referencedColumns = [fk.referencedColumn]
  if (fk.onDelete)
    tableFk.onDelete = fk.onDelete
  if (fk.onUpdate)
    tableFk.onUpdate = fk.onUpdate
  if (constraintName)
    tableFk.name = constraintName
  return tableFk
}