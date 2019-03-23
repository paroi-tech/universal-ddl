import { AstColumn, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint } from "../../ast"
import { AstModifier } from "../ast-modifier"

export function foreignKeyAlwaysWithReferencedColumns(): AstModifier[] {
  let currentColumnName: string | undefined
  return [
    {
      forEach: "foreignKeyTableConstraint",
      replace(fk: AstForeignKeyTableConstraint) {
        if (fk.referencedColumns)
          return fk
        return {
          ...fk,
          referencedColumns: [...fk.columns]
        }
      }
    },
    {
      forEach: "column",
      listen(column: AstColumn) {
        currentColumnName = column.name
      }
    },
    {
      forEach: "foreignKeyColumnConstraint",
      replace(fk: AstForeignKeyColumnConstraint) {
        if (currentColumnName === undefined)
          throw new Error(`Missing current column name`)
        if (fk.referencedColumn)
          return fk
        console.log("-->", currentColumnName)
        return {
          ...fk,
          referencedColumn: currentColumnName
        }
      }
    },
  ]
}