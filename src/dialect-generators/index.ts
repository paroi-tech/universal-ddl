import { AstModifier, modifyAst } from "../ast-modifier/ast-modifier"
import { Ast } from "../parser/ast"
import { codeToString } from "./gen-helpers"
import { makeMariadbDdlGeneratorContext } from "./mariadb-generator"
import { makePostgresqlDdlGeneratorContext } from "./postgresql-generator"
import { makeSqliteDdlGeneratorContext } from "./sqlite-generator"
import { makeUniversalDdlGeneratorContext } from "./universal-ddl-generator"

export interface GeneratorOptions {
  indentUnit?: string
}

export function generateDdl(ast: Ast, dialect: Dialect, options: GeneratorOptions = {}): string {
  const maker = dialects[dialect.toLowerCase()]
  if (!maker)
    throw new Error(`Unknown dialect: ${dialect}`)
  const cx = maker(options)
  if (cx.modifiers)
    ast = modifyAst(ast, cx.modifiers)
  return codeToString(cx, cx.gen("ast", "ast", ast))
}

// interface GeneratorDialects {
//   [dialectName: string]: (options: GeneratorOptions) => GeneratorContext
// }

const dialects = {
  universalddl: makeUniversalDdlGeneratorContext,
  postgresql: makePostgresqlDdlGeneratorContext,
  sqlite: makeSqliteDdlGeneratorContext,
  mariadb: makeMariadbDdlGeneratorContext,
}

export type Dialect = keyof typeof dialects

export interface GenSections {
  [section: string]: GenSection
}

export interface GenSection {
  [section: string]: (cx: GeneratorContext, ...args: any[]) => CodePiece
}

export interface GeneratorContext {
  sections: GenSections,
  modifiers?: AstModifier[]
  options: Required<GeneratorOptions>
  gen(sectionName: string, functionName: string, ...args: any[]): CodePiece
}

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