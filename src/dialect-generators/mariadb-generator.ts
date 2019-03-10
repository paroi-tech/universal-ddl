import { AstModifier } from "../ast-modifier/ast-modifier"
import { AstColumn, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstTableConstraintComposition, AstTableEntry } from "../parser/ast"
import { makeGeneratorContext, removeSelectedColumnConstraints } from "./gen-helpers"
import { GeneratorContext, GeneratorOptions } from "./index"
import { universalDdlSections as parent } from "./universal-ddl-generator"

export function makeMariadbDdlGeneratorContext(options: GeneratorOptions): GeneratorContext {
  const modifier: AstModifier = {
    forEach: "tableEntries",
    replace(entries: AstTableEntry[]) {
      const found = findAllColumnForeignKeys(entries)
      if (found.size === 0)
        return entries
      return replaceFkColumnConstraintsWithTableConstraints(found, entries)
    }
  }
  const sections = {
    ...parent,
    columnConstraints: {
      ...parent.columnConstraints,
      autoincrement() {
        return { code: "auto_increment" }
      },
    }
  }
  return makeGeneratorContext(options, sections, [modifier])
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
    const tableFk: AstForeignKeyTableConstraint = {
      constraintType: "foreignKey",
      columns: [column.name],
      referencedTable: fk.referencedTable,
    }
    if (fk.referencedColumn)
      tableFk.referencedColumns = [fk.referencedColumn]
    if (fk.onDelete)
      tableFk.onDelete = fk.onDelete
    if (fk.onUpdate)
      tableFk.onUpdate = fk.onUpdate
    updated.push({
      entryType: "constraintComposition",
      constraints: [tableFk]
    } as AstTableConstraintComposition)
  }
  return updated
}
