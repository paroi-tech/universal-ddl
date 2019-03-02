import { Ast, AstAlterTable, AstColumn, AstColumnConstraintComposition, AstCreateIndex, AstCreateTable, AstDefaultColumnConstraint, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstPrimaryKeyTableConstraint, AstTableConstraintComposition, AstUniqueTableConstraint, AstValue } from "../ast"
import { indent, makeGeneratorContext } from "./gen-helpers"
import { GeneratorContext, GeneratorOptions } from "./index"

export function makeUniversalDdlGeneratorContext(options: GeneratorOptions): GeneratorContext {
  return makeGeneratorContext(options, universalDdlSections)
}

const ast = {
  ast(cx: GeneratorContext, node: Ast) {
    return node.orders.map(order => cx.gen("orders", order.orderType, order)).join("\n\n")
  }
}

const orders = {
  createTable(cx: GeneratorContext, node: AstCreateTable) {
    const suffix = toSqlBlockComment(node.inlineComment, indent(cx, 1))
    const prefix = toSqlBlockComment(node.blockComment)
    const lastIndex = node.entries.length - 1
    const childEnd = index => index < lastIndex ? "," : ""
    const entries = node.entries.map((entry, index) => cx.gen("tableEntries", entry.entryType, entry, childEnd(index)))
    return `${prefix}create table ${node.name} (
${entries.join("\n")}
${suffix});`
  },

  alterTable(cx: GeneratorContext, node: AstAlterTable) {
    const suffix = toSqlInlineComment(node.inlineComment)
    const prefix = toSqlBlockComment(node.blockComment)
    const lastIndex = node.add.length - 1
    const childEnd = index => index < lastIndex ? "," : ";"
    const entries = node.add.map(
      (entry, index) => cx.gen("tableEntries", entry.entryType, entry, childEnd(index), index === 0)
    )
    return `${prefix}alter table ${node.table} add${entries.join("\n")}${suffix}`
  },

  createIndex(cx: GeneratorContext, node: AstCreateIndex) {
    const suffix = toSqlInlineComment(node.inlineComment)
    const prefix = toSqlBlockComment(node.blockComment)
    const name = node.name ? ` ${node.name}` : ""
    const columns = node.index.columns.join("\n")
    const unique = node.index["constraintType"] === "unique" ? " unique" : ""
    return `${prefix}create${unique} index${name} on ${node.table} (${columns});${suffix}`
  }
}

const tableEntries = {
  column(cx: GeneratorContext, node: AstColumn, end = "", inline = false) {
    const suffix = toSqlInlineComment(node.inlineComment)
    const prefix = makeTableEntryPrefix(cx, node.blockComment, inline)
    let type = node.type
    if (node.typeArgs)
      type += `(${node.typeArgs.join(",")})`

    let compos = (node.constraintCompositions || []).map(
      compo => cx.gen("columnChildren", "constraintComposition", compo)
    ).join(" ")
    if (compos)
      compos = ` ${compos}`

    const entry = `${node.name} ${type}${compos}`
    return `${prefix}${entry}${end}${suffix}`
  },

  constraintComposition(cx: GeneratorContext, node: AstTableConstraintComposition, end = "", inline = false) {
    const suffix = toSqlInlineComment(node.inlineComment)
    const prefix = makeTableEntryPrefix(cx, node.blockComment, inline)
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    const lastIndex = node.constraints.length - 1
    const childEnd = index => index === lastIndex ? end : ""
    const constraints = node.constraints.map(
      (constraint, index) => cx.gen("tableConstraints", constraint.constraintType, constraint, childEnd(index))
    )
    const entry = `${constraintName}${constraints.join(`, `)}`
    return `${prefix}${entry}${suffix}`
  }
}

const columnChildren = {
  constraintComposition(cx: GeneratorContext, node: AstColumnConstraintComposition) {
    const name = node.name ? `constraint ${node.name} ` : ""
    const constraints = node.constraints.map(
      constraint => cx.gen("columnConstraints", constraint.constraintType, constraint)
    )
    return `${name}${constraints.join(" ")}`
  }
}

const tableConstraints = {
  primaryKey(cx: GeneratorContext, node: AstPrimaryKeyTableConstraint, end = "") {
    const suffix = toSqlInlineComment(node.inlineComment)
    const prefix = toSqlBlockComment(node.blockComment)
    const entry = `primary key (${node.columns.join(", ")})`
    return `${prefix}${entry}${end}${suffix}`
  },

  foreignKey(cx: GeneratorContext, node: AstForeignKeyTableConstraint, end = "") {
    const suffix = toSqlInlineComment(node.inlineComment)
    const prefix = toSqlBlockComment(node.blockComment)
    const refColumns = node.referencedColumns ? ` (${node.referencedColumns.join(", ")})` : ""
    const del = node.onDelete ? ` on delete ${node.onDelete}` : ""
    const upd = node.onUpdate ? ` on update ${node.onUpdate}` : ""
    const ref = `references ${node.referencedTable}${refColumns}`
    const entry = `foreign key (${node.columns.join(", ")}) ${ref}${del}${upd}`
    return `${prefix}${entry}${end}${suffix}`
  },

  unique(cx: GeneratorContext, node: AstUniqueTableConstraint, end = "") {
    const suffix = toSqlInlineComment(node.inlineComment)
    const prefix = toSqlBlockComment(node.blockComment)
    const entry = `unique (${node.columns.join(", ")})`
    return `${prefix}${entry}${end}${suffix}`
  },
}

const columnConstraints = {
  notNull() {
    return "not null"
  },
  null() {
    return "null"
  },
  default(cx: GeneratorContext, { value }: AstDefaultColumnConstraint) {
    return `default ${toSqlValue(value)}`
  },
  primaryKey() {
    return "primary key"
  },
  autoIncrement() {
    return "autoincrement"
  },
  unique() {
    return "unique"
  },
  foreignKey(cx: GeneratorContext, node: AstForeignKeyColumnConstraint) {
    const del = node.onDelete ? ` on delete ${node.onDelete}` : ""
    const upd = node.onUpdate ? ` on update ${node.onUpdate}` : ""
    return `references ${node.referencedTable} (${node.referencedColumn})${del}${upd}`
  },
}

export const universalDdlSections = {
  ast,
  orders,
  tableEntries,
  columnChildren,
  tableConstraints,
  columnConstraints,
}

export function makeTableEntryPrefix(cx: GeneratorContext, blockComment: string | undefined, inline: boolean): string {
  const indent1 = indent(cx, 1)
  if (inline)
    return blockComment ? "\n" + toSqlBlockComment(blockComment, indent1) + indent1 : " "
  else
    return toSqlBlockComment(blockComment, indent1) + indent1
}

export function toSqlValue({ type, value }: AstValue): string {
  switch (type) {
    case "float":
    case "int":
      return `${value}`
    case "string":
      return "'" + (value as string).replace(/'/g, "''") + "'"
    case "sqlExpr":
      return value as string
    default:
      throw new Error(`Unexpected value type: ${type}`)
  }
}

export function toSqlBlockComment(blockComment: string | undefined, linePrefix = "") {
  if (!blockComment)
    return ""
  const prefix = `${linePrefix}-- `
  return `${prefix}${blockComment.replace(/\n/g, `\n${prefix}`)}\n`
}

export function toSqlInlineComment(inlineComment: string | undefined) {
  if (!inlineComment)
    return ""
  return " -- " + inlineComment.split("\n").map(s => s.trim()).join(" ")
}
