import { AstModifier, modifyAst } from "./ast-modifier/ast-modifier"
import { autofixFk } from "./ast-modifier/modifiers/autofix-fk"
import ConsistencyChecker, { ConsistencyCheckerReport } from "./consistency-checker/ConsistencyChecker"
import { generateDdl } from "./dialect-generators"
import { Ast } from "./parser/ast"
import { parseDdlToAst } from "./parser/parse-ddl"
import { Rds } from "./rds/rds"
import { createRdsFromAst } from "./rds/rds-provider"

export { generateDdl, ConsistencyCheckerReport }

export interface ParseDdlOptions {
  autofix?: AutofixOptions
  freeze?: boolean
  checkConsistency?: boolean
}

export function parseDdl(source: string, options: ParseDdlOptions = {}): Ast {
  let ast = parseDdlToAst(source)
  if (options.autofix)
    ast = autofix(ast, options.autofix)
  if (options.checkConsistency) {
    const report = checkConsistency(ast)
    if (!report.valid)
      throw new Error(report.errors!.join("\n"))
  }
  return options.freeze ? deepFreezePojo(ast) : ast
}

export interface AutofixOptions {
  foreignKeys?: boolean
}

export function autofix(input: Ast, options: AutofixOptions): Ast {
  const modifiers: AstModifier[] = []
  const afterEndListeners: Array<() => void> = []
  if (options.foreignKeys) {
    const { astModifiers, afterEnd } = autofixFk()
    modifiers.push(...astModifiers)
    if (afterEnd)
      afterEndListeners.push(afterEnd)
  }
  if (modifiers.length === 0)
    return input
  const output = modifyAst(input, modifiers)
  for (const listener of afterEndListeners)
    listener()
  return output
}

export function checkConsistency(ast: Ast): ConsistencyCheckerReport {
  const checker = new ConsistencyChecker()
  checker.check(ast)
  return checker.getConsistencyCheckerReport()
}

export interface ParseDdlToRdsOptions {
  autofix?: AutofixOptions
  freeze?: boolean
}

export function parseDdlToRds(source: string, options: ParseDdlToRdsOptions = {}): Rds {
  const ast = parseDdl(source, {
    autofix: options.autofix,
    freeze: false,
    checkConsistency: true
  })
  return createRds(ast, { freeze: !!options.freeze })
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