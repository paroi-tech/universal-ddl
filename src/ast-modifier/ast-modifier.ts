import { Ast } from "../parser/ast"
import { ArrayWalker, astWalker, isArrayWalker, isObjectWalker, NodeWalker, ObjectWalker } from "./ast-walker"

export type AstModifier = AstReplacer | AstInserter | AstListener

export interface AstListener {
  forEach: string
  listen: NodeListener
}

export interface AstReplacer {
  forEach: string
  replace: NodeReplacer
}

export interface AstInserter {
  forEachChildOf: string
  /**
   * Only valid on array children
   */
  insertAfter: NodeInserter
}

function isAstListener(modifier: AstModifier): modifier is AstListener {
  return modifier["forEach"] !== undefined && !!modifier["listen"]
}

function isAstReplacer(modifier: AstModifier): modifier is AstReplacer {
  return modifier["forEach"] !== undefined && !!modifier["replace"]
}

function isAstInserter(modifier: AstModifier): modifier is AstInserter {
  return modifier["forEachChildOf"] !== undefined
}

export type NodeListener = (node: any) => void
export type NodeReplacer<T = any> = (node: T) => T | undefined
export type NodeInserter = (child: any) => any[] | undefined

export function modifyAst(ast: Ast, modifiers: AstModifier[]): Ast {
  const exec = new AstModifierExecutor(modifiers)
  return exec.modifyAst(ast)
}

class AstModifierExecutor {
  private listeners: Map<string, NodeListener>
  private replacers: Map<string, NodeReplacer>
  private inserters: Map<string, NodeInserter>

  constructor(modifiers: AstModifier[]) {
    this.listeners = normalizeAstListeners(modifiers.filter(isAstListener))
    this.replacers = normalizeAstReplacers(modifiers.filter(isAstReplacer))
    this.inserters = normalizeAstInserters(modifiers.filter(isAstInserter))
  }

  modifyAst(node: Ast): Ast {
    return this.walk(node, astWalker) || { orders: [] }
  }

  private walk(node: any, walker: NodeWalker): any | undefined {
    if (isObjectWalker(walker)) {
      return applyReplacersOnObject(
        node,
        this.getHookListener(walker),
        this.getHookReplacer(walker),
        this.getReplacersOfChildren(walker)
      )
    }
    if (isArrayWalker(walker)) {
      return applyReplacersOnArray(
        node,
        this.getHookListener(walker),
        this.getHookReplacer(walker),
        this.getReplacerOfChild(walker),
        this.getHookInserterForChild(walker)
      )
    }
    const childWalker = walker(node)
    return childWalker ? this.walk(node, childWalker) : node
  }

  private getHookListener({ hookName }: ObjectWalker | ArrayWalker): NodeListener {
    return (hookName && this.listeners.get(hookName)) || emptyListener
  }

  private getHookReplacer({ hookName }: ObjectWalker | ArrayWalker): NodeReplacer {
    return (hookName && this.replacers.get(hookName)) || keepSame
  }

  private getHookInserterForChild({ hookName }: ArrayWalker): NodeInserter | undefined {
    if (hookName)
      return this.inserters.get(hookName)
  }

  private getReplacersOfChildren({ children }: ObjectWalker): ChildReplacers {
    if (!children)
      return {}
    const childModifiers = {}
    for (const [childName, childWalker] of Object.entries(children))
      childModifiers[childName] = childNode => this.walk(childNode, childWalker)
    return childModifiers
  }

  private getReplacerOfChild({ child }: ArrayWalker): NodeReplacer | undefined {
    if (!child)
      return
    return childNode => this.walk(childNode, child)
  }
}

function keepSame<T>(something: T): T {
  return something
}

function emptyListener() {
}

type ChildReplacers<T = any> = {
  [childName in keyof T]?: NodeReplacer<T[childName]>
}

function applyReplacersOnObject<T>(
  source: T, listener: NodeListener, replacer: NodeReplacer<T>, childReplacers: ChildReplacers<T>
): T | undefined {
  listener(source)
  let copy: any | undefined
  const updated = replacer(source)
  if (updated !== undefined) {
    if (updated !== source)
      copy = updated
    for (const [childName, child] of Object.entries(updated)) {
      const modifier = childReplacers[childName]
      if (!modifier)
        continue
      const updatedChild = modifier(child)
      if (updatedChild !== child) {
        if (!copy)
          copy = { ...updated }
        if (updatedChild === undefined)
          delete copy[childName]
        else
          copy[childName] = updatedChild
      }
    }
  }
  return copy || updated
}

function applyReplacersOnArray(
  source: any[], listener: NodeListener, replacer: NodeReplacer<any[]>, childReplacer?: NodeReplacer<any>,
  childInserter?: NodeInserter
): any[] {
  listener(source)
  let copy: any[] | undefined
  const updated = replacer(source)
  if (updated !== undefined && (childReplacer || childInserter)) {
    if (updated !== source)
      copy = updated
    const insertedAfter: Array<{ index: number, newChildren: any[] }> = []
    for (const [index, child] of source.entries()) {
      let updatedChild = child
      if (childReplacer) {
        updatedChild = childReplacer(child)
        if (updatedChild !== child) {
          if (!copy)
            copy = [...source]
          copy[index] = updatedChild
        }
      }
      if (childInserter && updatedChild !== undefined) {
        const newChildren = childInserter(updatedChild)
        if (newChildren)
          insertedAfter.push({ index: index + 1, newChildren })
      }
    }
    if (insertedAfter.length > 0) {
      if (!copy)
        copy = [...source]
      let insertCount = 0
      for (const { index, newChildren } of insertedAfter) {
        copy.splice(index + insertCount, 0, ...newChildren)
        insertCount += newChildren.length
      }
    }
    if (copy)
      copy = copy.filter(child => child !== undefined)
  }
  return copy || source
}

function normalizeAstListeners(replacers: AstListener[]): Map<string, NodeListener> {
  const map = new Map<string, NodeListener[]>()
  for (const modifier of replacers) {
    let list = map.get(modifier.forEach)
    if (!list) {
      list = []
      map.set(modifier.forEach, list)
    }
    list.push(modifier.listen)
  }
  const mapOfOne = new Map<string, NodeListener>()
  for (const [hookName, list] of map.entries())
    mapOfOne.set(hookName, toOneListener(list))
  return mapOfOne
}

function toOneListener(replacers: NodeListener[]): NodeListener {
  return node => {
    for (const replacer of replacers)
      replacer(node)
  }
}

function normalizeAstReplacers(replacers: AstReplacer[]): Map<string, NodeReplacer> {
  const map = new Map<string, NodeReplacer[]>()
  for (const modifier of replacers) {
    let list = map.get(modifier.forEach)
    if (!list) {
      list = []
      map.set(modifier.forEach, list)
    }
    list.push(modifier.replace)
  }
  const mapOfOne = new Map<string, NodeReplacer>()
  for (const [hookName, list] of map.entries())
    mapOfOne.set(hookName, toOneReplacer(list))
  return mapOfOne
}

function toOneReplacer(replacers: NodeReplacer[]): NodeReplacer {
  return node => {
    for (const replacer of replacers) {
      node = replacer(node)
      if (node === undefined)
        return
    }
    return node
  }
}

function normalizeAstInserters(inserters: AstInserter[]): Map<string, NodeInserter> {
  const map = new Map<string, NodeInserter[]>()
  for (const modifier of inserters) {
    let list = map.get(modifier.forEachChildOf)
    if (!list) {
      list = []
      map.set(modifier.forEachChildOf, list)
    }
    list.push(modifier.insertAfter)
  }
  const mapOfOne = new Map<string, NodeInserter>()
  for (const [hookName, list] of map.entries())
    mapOfOne.set(hookName, toOneInserter(list))
  return mapOfOne
}

function toOneInserter(inserters: NodeInserter[]): NodeInserter {
  return node => {
    const merged: any[] = []
    for (const inserter of inserters) {
      const insert = inserter(node)
      if (insert !== undefined)
        merged.push(...insert)
    }
    if (merged.length > 0)
      return merged
  }
}