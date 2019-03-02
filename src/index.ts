import { Ast } from "./ast"
import { generateDdl } from "./ddl-generators"
import { parseDdl as parseDdlToAst } from "./parse-ddl"
import { Rds } from "./rds"
import { createRds } from "./rds-provider"

export { createRds, generateDdl }

export interface ParseDdlOptions {
  freeze?: boolean
  checkCoherence?: boolean
}

export function parseDdl(source: string, options: ParseDdlOptions = {}): Ast {
  const ast = parseDdlToAst(source)
  return options.freeze ? deepFreezePojo(ast) : ast
}

export function parseDdlToRds(source: string, options: ParseDdlOptions = {}): Rds {
  const ast = parseDdlToAst(source)
  const rds = createRds(ast)
  return options.freeze ? deepFreezePojo(rds) : rds
}

function deepFreezePojo<T extends object>(object: T): T {
  if (Object.isFrozen(object))
    return object
  Object.freeze(object)
  for (const key of Object.keys(object)) {
    const value = object[key]
    if (value && typeof value === "object")
      deepFreezePojo(value)
  }
  return object
}