import { removeSelectedColumnConstraints } from "../../ast-modifier/modifier-helpers"
import { AstColumn, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstTableConstraintComposition, AstTableEntry } from "../../parser/ast"
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
  compoIndex: number
  constraintIndex: number
  fk: AstForeignKeyColumnConstraint
}

function findAllColumnForeignKeys(entries: AstTableEntry[]): Map<AstColumn, FoundColumnFk> {
  const result = new Map<AstColumn, FoundColumnFk>()
  for (const entry of entries) {
    if (entry.entryType !== "column" || !entry.constraintCompositions)
      continue
    entry.constraintCompositions.forEach(({ constraints }, compoIndex) => {
      constraints.forEach((constraint, constraintIndex) => {
        if (constraint.constraintType === "foreignKey") {
          result.set(entry, {
            compoIndex,
            constraintIndex,
            fk: constraint
          })
        }
      })
    })
  }
  return result
}

function replaceFkColumnConstraintsWithTableConstraints(found: Map<AstColumn, FoundColumnFk>, entries: AstTableEntry[]) {
  const updated: AstTableEntry[] = []
  for (const entry of entries) {
    const fcfk = entry.entryType === "column" && found.get(entry)
    if (!fcfk)
      updated.push(entry)
    else {
      const column = entry as AstColumn
      const constraintCompositions = removeSelectedColumnConstraints([fcfk], column.constraintCompositions!)
      updated.push({
        ...column,
        constraintCompositions
      } as AstColumn)
    }
  }
  for (const [column, { fk }] of found.entries()) {
    updated.push({
      entryType: "constraintComposition",
      constraints: [foreignKeyColumnToTableConstraint(fk, column.name)]
    } as AstTableConstraintComposition)
  }
  return updated
}

export function foreignKeyColumnToTableConstraint(
  fk: AstForeignKeyColumnConstraint,
  columnName: string
): AstForeignKeyTableConstraint {
  const tableFk: AstForeignKeyTableConstraint = {
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
  return tableFk
}