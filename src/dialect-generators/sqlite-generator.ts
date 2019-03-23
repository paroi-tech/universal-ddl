import { AstColumn } from "../ast"
import { hasColumnConstraint, isDataTypeInteger } from "../ast-helpers"
import { GeneratorOptions } from "../exported-definitions";
import { makeGeneratorContext } from "./gen-helpers"
import { CodeBlock, GeneratorContext, InlineCode } from "./index"
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

        let constraints = (cx.gen("columnChildren", "constraints", node.constraints || []) as InlineCode).code
        constraints = constraints ? ` ${constraints}` : ""

        return {
          lines: [
            toCodeBlockComment(node.blockComment),
            {
              code: `${node.name} ${type}${constraints}`,
              inlineComment: normalizeInlineComment(node.inlineComment)
            },
          ]
        }
      }
    },
  }
  return makeGeneratorContext(options, sections)
}
