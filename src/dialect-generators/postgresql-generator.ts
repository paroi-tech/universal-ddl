import { AstColumn, AstColumnConstraint, AstDataType } from "../ast"
import { removeSelectedItems } from "../ast-modifier/modifier-helpers"
import { makeColumnTypeReplacer } from "../ast-modifier/modifiers/column-type"
import { GeneratorOptions } from "../exported-definitions"
import { makeGeneratorContext } from "./gen-helpers"
import { CodeBlock, GeneratorContext, InlineCode } from "./index"
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

        let constraints = (cx.gen("columnChildren", "constraints", pgc.constraints || []) as InlineCode).code
        constraints = constraints ? ` ${constraints}` : ""

        return {
          lines: [
            toCodeBlockComment(node.blockComment),
            {
              code: `${node.name} ${pgc.type}${constraints}`,
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

  const modifier = makeColumnTypeReplacer(type => {
    return type === "tinyint" ? "smallint" : type
  })

  return makeGeneratorContext(options, sections, () => [modifier])
}

interface PgColumn {
  type: string
  constraints: AstColumnConstraint[] | undefined
}

function pgColumn(node: AstColumn): PgColumn | undefined {
  const type = toSerialType(node.type)
  if (!type || !node.constraints)
    return
  const found = findAutoincrementNotNullConstraints(node.constraints)
  if (!found)
    return
  const constraints = removeSelectedItems(Object.values(found), node.constraints)
  return {
    type,
    constraints
  }
}

function toSerialType(type: AstDataType): string | undefined {
  if (type === "int" || type === "integer")
    return "serial"
  if (type === "bigint")
    return "bigserial"
}

interface FoundConstraints {
  [constraintType: string]: number
}

function findAutoincrementNotNullConstraints(constraints: AstColumnConstraint[]): FoundConstraints | undefined {
  const found = constraints.reduce((found: FoundConstraints, { constraintType }, constraintIndex) => {
    if (constraintType === "autoincrement" || constraintType === "notNull")
      found[constraintType] = constraintIndex
    return found
  }, {} as FoundConstraints)
  if (found["autoincrement"] !== undefined) {
    if (found["notNull"] === undefined)
      throw new Error("Constraint 'not null' is required with 'autoincrement' for Postgresql")
    return found
  }
}