import { Ast, AstAlterTable, AstColumn, AstColumnConstraintComposition, AstCreateTable, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstOrder, AstTableConstraintComposition, AstTableEntry } from "../../parser/ast"
import { AstModifier } from "../ast-modifier"
import { removeSelectedColumnConstraints, removeSelectedConstraints } from "../modifier-helpers"
import { foreignKeyColumnToTableConstraint } from "./fk-column-to-table-constraint"

export interface AstModifierProvider {
  astModifiers: AstModifier[]
  afterEnd?(): void
}

export function autofixFk(): AstModifierProvider {
  const knownTables = new Set<string>()
  const deferredFk = new Map<string, AstAlterTable[]>()
  let currentTableName: string | undefined

  function addAlterTable(fk: AstForeignKeyTableConstraint) {
    if (!currentTableName)
      throw new Error(`Missing current table name!`)
    let list = deferredFk.get(fk.referencedTable)
    if (!list) {
      list = []
      deferredFk.set(fk.referencedTable, list)
    }
    list.push({
      orderType: "alterTable",
      table: currentTableName,
      add: [{
        entryType: "constraintComposition",
        name: `${currentTableName}_${fk.columns.join("_")}_fk_${fk.referencedTable}`,
        constraints: [fk]
      }]
    })
  }

  const astModifiers = [
    {
      forEach: "createTable",
      listen(node: AstCreateTable) {
        knownTables.add(node.name)
        currentTableName = node.name
      }
    },
    {
      forEach: "alterTable",
      listen(node: AstAlterTable) {
        currentTableName = node.table
      }
    },
    {
      forEach: "tableConstraintCompositions",
      replace(node: AstTableConstraintComposition) {
        const found = findTableForeignKeysWithUnknownReferencedTable(node, knownTables)
        if (found.length === 0)
          return node
        for (const { fk } of found)
          addAlterTable(fk)
        return removeSelectedConstraints(found.map(({ constraintIndex }) => constraintIndex), node)
      }
    },
    {
      forEach: "column",
      replace(node: AstColumn) {
        if (!node.constraintCompositions)
          return node
        const found = findColumnForeignKeysWithUnknownReferencedTable(node.constraintCompositions, knownTables)
        if (found.length === 0)
          return node
        for (const { fk } of found)
          addAlterTable(foreignKeyColumnToTableConstraint(fk, node.name))
        const constraintCompositions = removeSelectedColumnConstraints(found, node.constraintCompositions)
        const copy = { ...node }
        if (!constraintCompositions)
          delete copy.constraintCompositions
        else
          copy.constraintCompositions = constraintCompositions
        return copy
      }
    },
    {
      forEachChildOf: "orders",
      insertAfter(node: AstOrder): AstAlterTable[] | undefined {
        if (node.orderType === "createTable") {
          const order = deferredFk.get(node.name)
          if (order)
            deferredFk.delete(node.name)
          return order
        }
      }
    },
  ]

  return {
    astModifiers,
    afterEnd() {
      if (deferredFk.size !== 0) {
        const tableNames = Array.from(deferredFk.keys())
        throw new Error(`Missing referenced table(s): ${tableNames.join(", ")}`)
      }
    }
  }
}

interface FoundColumnFk {
  compoIndex: number
  constraintIndex: number
  fk: AstForeignKeyColumnConstraint
}

function findColumnForeignKeysWithUnknownReferencedTable(
  compos: AstColumnConstraintComposition[],
  knownTables: Set<string>
): FoundColumnFk[] {
  const result: FoundColumnFk[] = []
  for (const [compoIndex, compo] of compos.entries()) {
    for (const [constraintIndex, constraint] of compo.constraints.entries()) {
      if (constraint.constraintType === "foreignKey" && !knownTables.has(constraint.referencedTable)) {
        result.push({
          compoIndex,
          constraintIndex,
          fk: constraint
        })
      }
    }
  }
  return result
}

interface FoundTableFk {
  constraintIndex: number
  fk: AstForeignKeyTableConstraint
}

function findTableForeignKeysWithUnknownReferencedTable(
  compo: AstTableConstraintComposition,
  knownTables: Set<string>
): FoundTableFk[] {
  const result: FoundTableFk[] = []
  for (const [constraintIndex, constraint] of compo.constraints.entries()) {
    if (constraint.constraintType === "foreignKey" && !knownTables.has(constraint.referencedTable)) {
      result.push({
        constraintIndex,
        fk: constraint
      })
    }
  }
  return result
}
