import { AstAlterTable, AstColumn, AstColumnConstraint, AstCreateTable, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstOrder, AstTableConstraint } from "../../ast"
import { AstModifier } from "../ast-modifier"
import { removeSelectedItems } from "../modifier-helpers"
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
      add: [fk]
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
      forEach: "tableConstraint",
      replace(node: AstTableConstraint) {
        if (node.constraintType !== "foreignKey" || knownTables.has(node.referencedTable))
          return node
        addAlterTable(node)
      }
    },
    {
      forEach: "column",
      replace(node: AstColumn) {
        if (!node.constraints)
          return node
        const found = findColumnForeignKeysWithUnknownReferencedTable(node.constraints, knownTables)
        if (found.length === 0)
          return node
        for (const { fk } of found) {
          const fkName = `${currentTableName}_${node.name}_fk_${fk.referencedTable}`
          addAlterTable(foreignKeyColumnToTableConstraint(fk, node.name, fkName))
        }
        const indices = found.map(({ constraintIndex }) => constraintIndex)
        const constraints = removeSelectedItems(indices, node.constraints)
        const copy = { ...node }
        if (!constraints)
          delete copy.constraints
        else
          copy.constraints = constraints
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
  constraintIndex: number
  fk: AstForeignKeyColumnConstraint
}

function findColumnForeignKeysWithUnknownReferencedTable(
  constraints: AstColumnConstraint[] | undefined,
  knownTables: Set<string>
): FoundColumnFk[] {
  const result: FoundColumnFk[] = []
  if (constraints) {
    for (const [constraintIndex, constraint] of constraints.entries()) {
      if (constraint.constraintType === "foreignKey" && !knownTables.has(constraint.referencedTable)) {
        result.push({
          constraintIndex,
          fk: constraint
        })
      }
    }
  }
  return result
}