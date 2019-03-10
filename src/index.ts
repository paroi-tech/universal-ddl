import ConsistencyChecker, { ConsistencyCheckerReport } from "./consistency-checker/ConsistencyChecker"
import { generateDdl } from "./dialect-generators"
import { Ast } from "./parser/ast"
import { parseDdlToAst } from "./parser/parse-ddl"
import { Rds } from "./rds/rds"
import { createRdsFromAst } from "./rds/rds-provider"

export { generateDdl, ConsistencyCheckerReport }

export interface ParseDdlOptions {
  freeze?: boolean
  checkConsistency?: boolean
}

export function parseDdl(source: string, options: ParseDdlOptions = {}): Ast {
  const ast = parseDdlToAst(source)
  if (options.checkConsistency) {
    const report = checkConsistency(ast)
    if (!report.valid)
      throw new Error(report.errors!.join("\n"))
  }
  return options.freeze ? deepFreezePojo(ast) : ast
}

export function checkConsistency(ast: Ast): ConsistencyCheckerReport {
  const checker = new ConsistencyChecker()
  checker.check(ast)
  return checker.getConsistencyCheckerReport()
}

export function parseDdlToRds(source: string, options: ParseDdlOptions = {}): Rds {
  const ast = parseDdl(source, {
    ...options,
    freeze: false
  })
  return createRds(ast, { freeze: options.freeze })
}

export interface CreateRdsOptions {
  freeze?: boolean
  checkConsistency?: boolean
}

export function createRds(ast: Ast, options: CreateRdsOptions = {}): Rds {
  const rds = createRdsFromAst(ast)
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