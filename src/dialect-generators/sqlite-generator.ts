import { hasColumnConstraint, isDataTypeInteger } from "../ast-helpers"
import { AstColumn, AstDataType } from "../parser/ast"
import { makeGeneratorContext } from "./gen-helpers"
import { CodeBlock, GeneratorContext, GeneratorOptions, InlineCode } from "./index"
import { normalizeInlineComment, toCodeBlockComment, universalDdlSections as parent } from "./universal-ddl-generator"

export function makeSqliteDdlGeneratorContext(options: GeneratorOptions): GeneratorContext {
  const sections = {
    ...parent,
    tableEntries: {
      ...parent.tableEntries,
      column(cx: GeneratorContext, node: AstColumn): CodeBlock {
        if (!hasColumnConstraint(node, "autoincrement") || node.type === "integer")
          return parent.tableEntries.column(cx, node)
        if (!isDataTypeInteger(node.type)) {
          throw new Error(
            `Constraint 'autoincrement' on column '${node.name}' should be used with an 'integer' data type` +
            ` (current: '${node.type}') with SQLite`
          )
        }
        const type = "integer"

        let compos = (node.constraintCompositions || []).map(
          compo => (cx.gen("columnChildren", "constraintComposition", compo) as InlineCode).code
        ).join(" ")
        if (compos)
          compos = ` ${compos}`

        return {
          lines: [
            toCodeBlockComment(node.blockComment),
            {
              code: `${node.name} ${type}${compos}`,
              inlineComment: normalizeInlineComment(node.inlineComment)
            },
          ]
        }
      }
    },
  }
  return makeGeneratorContext(options, sections)
}
