import { foreignKeyAlwaysWithReferencedColumns } from "../ast-modifier/modifiers/fk-always-with-referenced-columns"
import { fkColumnToTableConstraintModifier } from "../ast-modifier/modifiers/fk-column-to-table-constraint"
import { GeneratorOptions } from "../exported-definitions"
import { makeGeneratorContext } from "./gen-helpers"
import { GeneratorContext } from "./index"
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
  const createModifiers = () => {
    return [fkColumnToTableConstraintModifier, ...foreignKeyAlwaysWithReferencedColumns()]
  }
  return makeGeneratorContext(options, sections, createModifiers)
}
