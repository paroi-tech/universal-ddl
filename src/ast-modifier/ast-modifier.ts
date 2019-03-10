import { Ast } from "../parser/ast"
import { ArrayWalker, astWalker, isArrayWalker, isObjectWalker, NodeWalker, ObjectWalker } from "./ast-walker"

export interface AstModifier {
  forEach: string
  replace: NodeModifier
}

export function modifyAst(ast: Ast, modifiers: AstModifier[]): Ast {
  const exec = new AstModifierExecutor(modifiers)
  return exec.modifyAst(ast)
}

class AstModifierExecutor {
  private modifiers: Map<string, NodeModifier>

  constructor(modifiers: AstModifier[]) {
    this.modifiers = normalizeAstModifiers(modifiers)
  }

  modifyAst(node: Ast) {
    return this.walk(node, astWalker)
  }

  private walk<T>(node: T, walker: NodeWalker): T {
    if (isObjectWalker(walker))
      return applyModifiersOnObject(node, this.getHookModifier(walker), this.getObjectChildModifiers(walker))
    if (isArrayWalker(walker))
      return applyModifiersOnArray(node as any, this.getHookModifier(walker), this.getArrayChildModifier(walker)) as any
    return this.walk(node, walker(node))
  }

  private getHookModifier({ hookName }: ObjectWalker | ArrayWalker): NodeModifier {
    if (!hookName)
      return noModifier
    return this.modifiers.get(hookName) || noModifier
  }

  private getObjectChildModifiers({ children }: ObjectWalker): ChildModifiers {
    if (!children)
      return {}
    const childModifiers = {}
    for (const [childName, childWalker] of Object.entries(children))
      childModifiers[childName] = childNode => this.walk(childNode, childWalker)
    return childModifiers
  }

  private getArrayChildModifier({ child: childWalker }: ArrayWalker): NodeModifier | undefined {
    if (!childWalker)
      return
    return childNode => this.walk(childNode, childWalker)
  }
}

function noModifier<T>(something: T): T {
  return something
}

type NodeModifier<T = any> = (child: T) => T

type ChildModifiers<T = any> = {
  [childName in keyof T]?: NodeModifier<T[childName]>
}

function applyModifiersOnObject<T>(source: T, modifier: NodeModifier<T>, childModifiers: ChildModifiers<T>): T {
  let copy: any | undefined
  const updated = modifier(source)
  if (updated !== source)
    copy = updated
  for (const [childName, child] of Object.entries(updated)) {
    const modifier = childModifiers[childName]
    if (!modifier)
      continue
    const updatedChild = modifier(child)
    if (updatedChild !== child) {
      if (!copy)
        copy = { ...updated }
      copy[childName] = updatedChild
    }
  }
  return copy || updated
}

function applyModifiersOnArray<T>(source: T[], modifier: NodeModifier<T[]>, childModifier?: NodeModifier<T>): T[] {
  let copy: any[] | undefined
  const updated = modifier(source)
  if (updated !== source)
    copy = updated
  if (childModifier) {
    for (const [index, child] of source.entries()) {
      const updatedChild = childModifier(child)
      if (updatedChild !== child) {
        if (!copy)
          copy = [...source]
        copy[index] = updatedChild
      }
    }
  }
  return copy || source
}

function normalizeAstModifiers(modifiers: AstModifier[]) {
  const map = new Map<string, AstModifier[]>()
  modifiers.forEach(modifier => {
    let list = map.get(modifier.forEach)
    if (!list) {
      list = []
      map.set(modifier.forEach, list)
    }
    list.push(modifier)
  })
  const map2 = new Map<string, NodeModifier>()
  for (const [hookName, list] of map.entries())
    map2.set(hookName, toOneModifier(list))
  return map2
}

function toOneModifier(modifiers: AstModifier[]): NodeModifier {
  return node => {
    for (const { replace } of modifiers)
      node = replace(node)
    return node
  }
}