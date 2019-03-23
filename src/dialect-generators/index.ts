import { Ast } from "../ast"
import { AstModifier, modifyAst } from "../ast-modifier/ast-modifier"
import { Dialect, GeneratorOptions } from "../exported-definitions"
import { codeToString } from "./gen-helpers"
import { makeMariadbDdlGeneratorContext } from "./mariadb-generator"
import { makePostgresqlDdlGeneratorContext } from "./postgresql-generator"
import { makeSqliteDdlGeneratorContext } from "./sqlite-generator"
import { makeUniversalDdlGeneratorContext } from "./universal-ddl-generator"

export function generateDdl(ast: Ast, dialect: Dialect, options: GeneratorOptions = {}): string {
  const maker = dialects[dialect.toLowerCase()]
  if (!maker)
    throw new Error(`Unknown dialect: ${dialect}`)
  const cx = maker(options)
  if (cx.createModifiers)
    ast = modifyAst(ast, cx.createModifiers())
  let dropStatements = ""
  if (options.generateDrop && dialect !== "universalddl")
    dropStatements = makeDropStatements(ast, dialect)
  return dropStatements + codeToString(cx, cx.gen("ast", "ast", ast))
}

const dialects = {
  universalddl: makeUniversalDdlGeneratorContext,
  postgresql: makePostgresqlDdlGeneratorContext,
  sqlite: makeSqliteDdlGeneratorContext,
  mariadb: makeMariadbDdlGeneratorContext,
}

export interface GenSections {
  [section: string]: GenSection
}

export interface GenSection {
  [section: string]: (cx: GeneratorContext, ...args: any[]) => CodePiece
}

export interface GeneratorContext {
  sections: GenSections,
  createModifiers?: CreateModifiers
  options: Required<GeneratorOptions>
  gen(sectionName: string, functionName: string, ...args: any[]): CodePiece
}

export type CreateModifiers = () => AstModifier[]

export type CodePiece = InlineCode | CodeBlock | undefined

export interface CodeBlock {
  indent?: number
  lines: CodePiece[]
  spaceBefore?: boolean
  spaceAfter?: boolean
}

export interface InlineCode {
  code?: string
  inlineComment?: string
}

function makeDropStatements(ast: Ast, dialect: Dialect): string {
  let makeDropTable: (tableName: string) => string
  if (dialect === "sqlite")
    makeDropTable = (tableName: string) => `drop table if exists ${tableName};`
  else
    makeDropTable = (tableName: string) => `drop table if exists ${tableName} cascade;`

  const revOrders = [...ast.orders].reverse()
  const lines: string[] = []
  for (const order of revOrders) {
    if (order.orderType === "createTable")
      lines.push(makeDropTable(order.name))
  }

  return lines.length === 0 ? "" : lines.join("\n") + "\n\n"
}