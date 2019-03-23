import { Ast, AstAlterTable, AstAutoincrementColumnConstraint, AstColumn, AstColumnConstraint, AstCreateIndex, AstCreateTable, AstDefaultColumnConstraint, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstNotNullColumnConstraint, AstNullColumnConstraint, AstPrimaryKeyColumnConstraint, AstPrimaryKeyTableConstraint, AstStandaloneComment, AstStandaloneTableComment, AstTableConstraint, AstUniqueColumnConstraint, AstUniqueTableConstraint, AstValue } from "../ast"
import { GeneratorOptions } from "../exported-definitions"
import { appendSuffix, makeGeneratorContext, tryToMakeInlineBlock } from "./gen-helpers"
import { CodeBlock, GeneratorContext, InlineCode } from "./index"

export function makeUniversalDdlGeneratorContext(options: GeneratorOptions): GeneratorContext {
  return makeGeneratorContext(options, universalDdlSections)
}

const ast = {
  ast(cx: GeneratorContext, node: Ast): CodeBlock {
    return {
      lines: node.orders.map(order => cx.gen("orders", order.orderType, order))
    }
  }
}

const orders = {
  createTable(cx: GeneratorContext, node: AstCreateTable): CodeBlock {
    const entries = node.entries.map(entry => cx.gen("tableEntries", entry.entryType, entry))

    let firstInlineCom: string | undefined
    let lastInlineCom: string[] | undefined
    if (node.inlineComment) {
      if (typeof node.inlineComment === "string")
        firstInlineCom = node.inlineComment
      else if (node.inlineComment.length > 0)
        [firstInlineCom, ...lastInlineCom] = node.inlineComment
    }

    return {
      lines: [
        toCodeBlockComment(node.blockComment),
        {
          code: `create table ${node.name} (`,
          inlineComment: firstInlineCom
        },
        {
          indent: 1,
          lines: appendSuffix(entries, { notLast: "," })
        },
        {
          code: ");",
          inlineComment: normalizeInlineComment(lastInlineCom)
        },
      ]
    }
  },

  alterTable(cx: GeneratorContext, node: AstAlterTable): CodeBlock {
    const inlineComment = normalizeInlineComment(node.inlineComment)
    const entries = node.add.map(entry => cx.gen("tableEntries", entry.entryType, entry))
    const code = `alter table ${node.table} add`
    const ib = tryToMakeInlineBlock(entries, inlineComment)
    if (ib && ib.code) {
      ib.code = `${code} ${ib.code};`
      return {
        lines: [toCodeBlockComment(node.blockComment), ib]
      }
    }
    return {
      lines: [
        toCodeBlockComment(node.blockComment),
        {
          code,
          inlineComment
        },
        {
          indent: 1,
          lines: appendSuffix(entries, { notLast: ",", last: ";" })
        },
      ]
    }
  },

  createIndex(cx: GeneratorContext, node: AstCreateIndex): CodeBlock {
    const name = node.index.name ? ` ${node.index.name}` : ""
    const columns = node.index.columns.join(", ")
    const unique = node.index["constraintType"] === "unique" ? " unique" : ""
    return {
      lines: [
        toCodeBlockComment(node.blockComment),
        {
          code: `create${unique} index${name} on ${node.table} (${columns});`,
          inlineComment: normalizeInlineComment(node.inlineComment)
        },
      ]
    }
  },

  comment(cx: GeneratorContext, node: AstStandaloneComment): CodeBlock {
    return toCodeBlockStandaloneComment(node.blockComment)
  }
}

const tableEntries = {
  column(cx: GeneratorContext, node: AstColumn): CodeBlock {
    let type = node.type
    if (node.typeArgs)
      type += `(${node.typeArgs.join(",")})`

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
  },

  constraint(cx: GeneratorContext, node: AstTableConstraint): CodeBlock {
    return cx.gen("tableConstraints", node.constraintType, node) as CodeBlock
  },

  comment(cx: GeneratorContext, node: AstStandaloneTableComment): CodeBlock {
    return toCodeBlockStandaloneComment(node.blockComment)
  }
}

const columnChildren = {
  constraints(cx: GeneratorContext, nodes: AstColumnConstraint[]): InlineCode {
    const constraints = nodes.map(
      constraint => (cx.gen("columnConstraints", constraint.constraintType, constraint) as InlineCode).code
    ).join(" ")
    return {
      code: constraints
    }
  }
}

const tableConstraints = {
  primaryKey(cx: GeneratorContext, node: AstPrimaryKeyTableConstraint): CodeBlock {
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    return {
      lines: [
        toCodeBlockComment(node.blockComment),
        {
          code: `${constraintName}primary key (${node.columns.join(", ")})`,
          inlineComment: normalizeInlineComment(node.inlineComment)
        },
      ]
    }
  },

  foreignKey(cx: GeneratorContext, node: AstForeignKeyTableConstraint): CodeBlock {
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    const refColumns = node.referencedColumns ? ` (${node.referencedColumns.join(", ")})` : ""
    const del = node.onDelete ? ` on delete ${node.onDelete}` : ""
    const upd = node.onUpdate ? ` on update ${node.onUpdate}` : ""
    const ref = `references ${node.referencedTable}${refColumns}`
    return {
      lines: [
        toCodeBlockComment(node.blockComment),
        {
          code: `${constraintName}foreign key (${node.columns.join(", ")}) ${ref}${del}${upd}`,
          inlineComment: normalizeInlineComment(node.inlineComment)
        },
      ]
    }
  },

  unique(cx: GeneratorContext, node: AstUniqueTableConstraint): CodeBlock {
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    return {
      lines: [
        toCodeBlockComment(node.blockComment),
        {
          code: `${constraintName}unique (${node.columns.join(", ")})`,
          inlineComment: normalizeInlineComment(node.inlineComment)
        },
      ]
    }
  },
}

const columnConstraints = {
  notNull(cx: GeneratorContext, node: AstNotNullColumnConstraint): InlineCode {
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    return { code: `${constraintName}not null` }
  },
  null(cx: GeneratorContext, node: AstNullColumnConstraint): InlineCode {
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    return { code: `${constraintName}null` }
  },
  default(cx: GeneratorContext, node: AstDefaultColumnConstraint): InlineCode {
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    return { code: `${constraintName}default ${toSqlValue(node.value)}` }
  },
  primaryKey(cx: GeneratorContext, node: AstPrimaryKeyColumnConstraint): InlineCode {
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    return { code: `${constraintName}primary key` }
  },
  autoincrement(cx: GeneratorContext, node: AstAutoincrementColumnConstraint): InlineCode {
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    return { code: `${constraintName}autoincrement` }
  },
  unique(cx: GeneratorContext, node: AstUniqueColumnConstraint): InlineCode {
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    return { code: `${constraintName}unique` }
  },
  foreignKey(cx: GeneratorContext, node: AstForeignKeyColumnConstraint): InlineCode {
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    const del = node.onDelete ? ` on delete ${node.onDelete}` : ""
    const upd = node.onUpdate ? ` on update ${node.onUpdate}` : ""
    const refCol = node.referencedColumn ? ` (${node.referencedColumn})` : ""
    return { code: `${constraintName}references ${node.referencedTable}${refCol}${del}${upd}` }
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

export function toCodeBlockStandaloneComment(blockComment: string, indent?: number): CodeBlock {
  return {
    indent,
    lines: blockComment.split("\n").map(inlineComment => ({ inlineComment })),
    spaceBefore: true,
    spaceAfter: true
  }
}

export function toCodeBlockComment(blockComment: string | undefined, indent?: number): CodeBlock | undefined {
  if (!blockComment)
    return
  return {
    indent,
    lines: blockComment.split("\n").map(inlineComment => ({ inlineComment }))
  }
}

export function normalizeInlineComment(inlineComment: string | string[] | undefined): string | undefined {
  if (!inlineComment || typeof inlineComment === "string")
    return inlineComment
  return inlineComment.map(s => s.trim()).join(" ")
}
