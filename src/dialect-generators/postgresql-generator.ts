import { removeSelectedColumnConstraints } from "../ast-modifier/modifier-helpers"
import { AstColumn, AstColumnConstraintComposition, AstDataType } from "../parser/ast"
import { makeGeneratorContext } from "./gen-helpers"
import { CodeBlock, GeneratorContext, GeneratorOptions, InlineCode } from "./index"
import { normalizeInlineComment, toCodeBlockComment, universalDdlSections as parent } from "./universal-ddl-generator"

export function makePostgresqlDdlGeneratorContext(options: GeneratorOptions): GeneratorContext {
  const sections = {
    ...parent,
    tableEntries: {
      ...parent.tableEntries,
      column(cx: GeneratorContext, node: AstColumn): CodeBlock {
        const pgc = pgColumn(node)
        if (!pgc)
          return parent.tableEntries.column(cx, node)

        let compos = (pgc.constraintCompositions || []).map(
          compo => (cx.gen("columnChildren", "constraintComposition", compo) as InlineCode).code
        ).join(" ")
        if (compos)
          compos = ` ${compos}`

        return {
          lines: [
            toCodeBlockComment(node.blockComment),
            {
              code: `${node.name} ${pgc.type}${compos}`,
              inlineComment: normalizeInlineComment(node.inlineComment)
            },
          ]
        }
      }
    },
    columnConstraints: {
      ...parent.columnConstraints,
      autoincrement() {
        throw new Error(
          "Constraint 'autoincrement' must be used with 'not null' and 'integer' or 'bigint' for Postgresql"
        )
      },
    }
  }
  return makeGeneratorContext(options, sections)
}

interface PgColumn {
  type: string
  constraintCompositions?: AstColumnConstraintComposition[]
}

function pgColumn(node: AstColumn): PgColumn | undefined {
  const type = toSerialType(node.type)
  if (!type || !node.constraintCompositions)
    return
  const found = findAutoincrementNotNullConstraints(node.constraintCompositions)
  if (!found)
    return
  const constraintCompositions = removeSelectedColumnConstraints(Object.values(found), node.constraintCompositions)
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
      if (constraintType === "autoincrement" || constraintType === "notNull") {
        found[constraintType] = {
          compoIndex,
          constraintIndex,
        }
      }
      return found
    }, found)
    return found
  }, {} as FoundConstraints)
  if (found["autoincrement"]) {
    if (!found["notNull"])
      throw new Error("Constraint 'not null' is required with 'autoincrement' for Postgresql")
    return found
  }
}