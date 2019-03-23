import { AstColumn, AstDataType } from "../../ast"
import { AstModifier } from "../ast-modifier"

export function makeColumnTypeReplacer(replace: (type: AstDataType) => AstDataType): AstModifier {
  return {
    forEach: "column",
    replace(column: AstColumn) {
      const newType = replace(column.type)
      if (newType === column.type)
        return column
      return {
        ...column,
        type: newType
      }
    }
  }
}
