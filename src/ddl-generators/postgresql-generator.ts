import { AstColumn, AstColumnConstraintComposition, AstDataType } from "../ast"
import { makeGeneratorContext } from "./gen-helpers"
import { GeneratorContext, GeneratorOptions } from "./index"
import { makeTableEntryPrefix, toSqlInlineComment, universalDdlSections as parent } from "./universal-ddl-generator"

export function makePostgresqlDdlGeneratorContext(options: GeneratorOptions): GeneratorContext {
  return makeGeneratorContext(options, {
    ...parent,
    tableEntries: {
      ...parent.tableEntries,
      column(cx: GeneratorContext, node: AstColumn, end = "", inline = false) {
        const pgc = pgColumn(node)
        if (!pgc)
          return parent.tableEntries.column(cx, node, end, inline)

        const suffix = toSqlInlineComment(node.inlineComment)
        const prefix = makeTableEntryPrefix(cx, node.blockComment, inline)

        let compos = (pgc.constraintCompositions || []).map(
          compo => cx.gen("columnChildren", "constraintComposition", compo)
        ).join(" ")
        if (compos)
          compos = ` ${compos}`

        const entry = `${node.name} ${pgc.type}${compos}`
        return `${prefix}${entry}${end}${suffix}`
      }
    },
  })
}

interface PgColumn {
  type: string
  constraintCompositions: AstColumnConstraintComposition[]
}

function pgColumn(node: AstColumn): PgColumn | undefined {
  const type = toSerialType(node.type)
  if (!type || !node.constraintCompositions)
    return
  const found = findAutoincrementNotNullConstraints(node.constraintCompositions)
  if (!found)
    return
  const constraintCompositions = removeFoundConstraints(found, node.constraintCompositions)
  return {
    type,
    constraintCompositions
  }
}

function toSerialType(type: AstDataType): string | undefined {
  if (type === "int" || type === "integer")
    return "serial"
  if (type === "bigint")
    return "bigserial"
}

interface FoundConstraints {
  [constraintType: string]: {
    compoIndex: number
    constraintIndex: number
  }
}

function findAutoincrementNotNullConstraints(compos: AstColumnConstraintComposition[]): FoundConstraints | undefined {
  const found: FoundConstraints = compos.reduce((found: FoundConstraints, compo, compoIndex) => {
    found = compo.constraints.reduce((found: FoundConstraints, { constraintType }, constraintIndex) => {
      if (constraintType === "autoIncrement" || constraintType === "notNull") {
        found[constraintType] = {
          compoIndex,
          constraintIndex,
        }
      }
      return found
    }, found)
    return found
  }, {} as FoundConstraints)
  if (found["autoIncrement"]) {
    if (!found["notNull"])
      throw new Error("Constraint 'not null' is required with 'autoincrement' for Postgresql")
    return found
  }
}

function removeFoundConstraints(found: FoundConstraints, compos: AstColumnConstraintComposition[]) {
  // Build map
  const map = new Map<number, number[]>()
  for (const { compoIndex, constraintIndex } of Object.values(found)) {
    let indices = map.get(compoIndex)
    if (!indices) {
      indices = []
      map.set(compoIndex, indices)
    }
    indices.push(constraintIndex)
  }

  // Make a copy with removed constraints
  const copy = [...compos]
  for (const [compoIndex, constraintIndices] of map.entries()) {
    copy[compoIndex] = {
      ...copy[compoIndex],
      constraints: [...copy[compoIndex].constraints]
    }
    for (const constraintIndex of constraintIndices.reverse())
      copy[compoIndex].constraints.splice(constraintIndex, 1)
  }
  for (const compoIndex of Array.from(map.keys()).sort((a, b) => b - a)) {
    if (copy[compoIndex].constraints.length === 0)
      copy.splice(compoIndex, 1)
  }
  return copy
}