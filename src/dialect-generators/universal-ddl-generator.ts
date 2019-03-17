import { Ast, AstAlterTable, AstColumn, AstColumnConstraintComposition, AstCreateIndex, AstCreateTable, AstDefaultColumnConstraint, AstForeignKeyColumnConstraint, AstForeignKeyTableConstraint, AstPrimaryKeyTableConstraint, AstStandaloneComment, AstStandaloneTableComment, AstTableConstraintComposition, AstUniqueTableConstraint, AstValue } from "../parser/ast"
import { appendSuffix, makeGeneratorContext, tryToMakeInlineBlock } from "./gen-helpers"
import { CodeBlock, GeneratorContext, GeneratorOptions, InlineCode } from "./index"

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
    const name = node.name ? ` ${node.name}` : ""
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
  },

  constraintComposition(cx: GeneratorContext, node: AstTableConstraintComposition): CodeBlock {
    const constraintName = node.name ? `constraint ${node.name} ` : undefined
    const constraints = node.constraints.map(
      constraint => cx.gen("tableConstraints", constraint.constraintType, constraint) as CodeBlock
    )
    appendSuffix(constraints, { notLast: "," })
    const inlineComment = normalizeInlineComment(node.inlineComment)
    const ib = tryToMakeInlineBlock(constraints, inlineComment)
    if (ib) {
      return {
        lines: [
          toCodeBlockComment(node.blockComment),
          {
            ...ib,
            code: constraintName ? constraintName + ib.code : ib.code
          }
        ]
      }
    }
    return {
      lines: [
        toCodeBlockComment(node.blockComment),
        {
          code: constraintName,
          inlineComment: normalizeInlineComment(node.inlineComment)
        },
        ...constraints
      ]
    }
  },

  comment(cx: GeneratorContext, node: AstStandaloneTableComment): CodeBlock {
    return toCodeBlockStandaloneComment(node.blockComment)
  }
}

const columnChildren = {
  constraintComposition(cx: GeneratorContext, node: AstColumnConstraintComposition): InlineCode {
    const constraintName = node.name ? `constraint ${node.name} ` : ""
    const constraints = node.constraints.map(
      constraint => (cx.gen("columnConstraints", constraint.constraintType, constraint) as InlineCode).code
    ).join(" ")
    return {
      code: `${constraintName}${constraints}`
    }
  }
}

const tableConstraints = {
  primaryKey(cx: GeneratorContext, node: AstPrimaryKeyTableConstraint): CodeBlock {
    return {
      lines: [
        toCodeBlockComment(node.blockComment),
        {
          code: `primary key (${node.columns.join(", ")})`,
          inlineComment: normalizeInlineComment(node.inlineComment)
        },
      ]
    }
  },

  foreignKey(cx: GeneratorContext, node: AstForeignKeyTableConstraint): CodeBlock {
    const refColumns = node.referencedColumns ? ` (${node.referencedColumns.join(", ")})` : ""
    const del = node.onDelete ? ` on delete ${node.onDelete}` : ""
    const upd = node.onUpdate ? ` on update ${node.onUpdate}` : ""
    const ref = `references ${node.referencedTable}${refColumns}`
    return {
      lines: [
        toCodeBlockComment(node.blockComment),
        {
          code: `foreign key (${node.columns.join(", ")}) ${ref}${del}${upd}`,
          inlineComment: normalizeInlineComment(node.inlineComment)
        },
      ]
    }
  },

  unique(cx: GeneratorContext, node: AstUniqueTableConstraint): CodeBlock {
    return {
      lines: [
        toCodeBlockComment(node.blockComment),
        {
          code: `unique (${node.columns.join(", ")})`,
          inlineComment: normalizeInlineComment(node.inlineComment)
        },
      ]
    }
  },
}

const columnConstraints = {
  notNull(): InlineCode {
    return { code: "not null" }
  },
  null(): InlineCode {
    return { code: "null" }
  },
  default(cx: GeneratorContext, { value }: AstDefaultColumnConstraint): InlineCode {
    return { code: `default ${toSqlValue(value)}` }
  },
  primaryKey(): InlineCode {
    return { code: "primary key" }
  },
  autoincrement(): InlineCode {
    return { code: "autoincrement" }
  },
  unique(): InlineCode {
    return { code: "unique" }
  },
  foreignKey(cx: GeneratorContext, node: AstForeignKeyColumnConstraint): InlineCode {
    const del = node.onDelete ? ` on delete ${node.onDelete}` : ""
    const upd = node.onUpdate ? ` on update ${node.onUpdate}` : ""
    const refCol = node.referencedColumn ? ` (${node.referencedColumn})` : ""
    return { code: `references ${node.referencedTable}${refCol}${del}${upd}` }
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
