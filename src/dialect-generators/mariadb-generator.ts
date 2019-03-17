import { fkColumnToTableConstraintModifier } from "../ast-modifier/modifiers/fk-column-to-table-constraint"
import { makeGeneratorContext } from "./gen-helpers"
import { GeneratorContext, GeneratorOptions } from "./index"
import { universalDdlSections as parent } from "./universal-ddl-generator"

export function makeMariadbDdlGeneratorContext(options: GeneratorOptions): GeneratorContext {
  const sections = {
    ...parent,
    columnConstraints: {
      ...parent.columnConstraints,
      autoincrement() {
        return { code: "auto_increment" }
      },
    }
  }
  return makeGeneratorContext(options, sections, [fkColumnToTableConstraintModifier])
}
