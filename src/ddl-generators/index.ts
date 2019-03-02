import { Ast } from "../ast"
import { makePostgresqlDdlGeneratorContext } from "./postgresql-generator"
import { makeUniversalDdlGeneratorContext } from "./universal-ddl-generator"

export function generateDdl(dialect: string, ast: Ast, options: GeneratorOptions = {}): string {
  const maker = dialects[dialect]
  if (!maker)
    throw new Error(`Unknown dialect: ${dialect}`)
  const cx = maker(options)
  return cx.gen("ast", "ast", ast)
}

interface GeneratorDialects {
  [dialectName: string]: (options: GeneratorOptions) => GeneratorContext
}

const dialects: GeneratorDialects = {
  UniversalDdl: makeUniversalDdlGeneratorContext,
  Postgresql: makePostgresqlDdlGeneratorContext,
}

export interface GenSections {
  [section: string]: GenSection
}

export interface GenSection {
  [section: string]: (cx: GeneratorContext, ...args: any[]) => string
}

export interface GeneratorContext {
  sections: GenSections,
  options: Required<GeneratorOptions>
  gen(sectionName: string, functionName: string, ...args: any[]): string
}

export interface GeneratorOptions {
  indentUnit?: string
}
