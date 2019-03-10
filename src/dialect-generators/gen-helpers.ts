import { AstModifier } from "../ast-modifier/ast-modifier"
import { AstColumnConstraintComposition } from "../parser/ast"
import { CodeBlock, CodePiece, GeneratorContext, GeneratorOptions, GenSections, InlineCode } from "./index"

export function makeGeneratorContext(options: GeneratorOptions, sections: GenSections, modifiers?: AstModifier[]): GeneratorContext {
  const cx: GeneratorContext = {
    sections,
    modifiers,
    options: {
      ...defaultOptions,
      ...options
    },
    gen(sectionName: string, functionName: string, ...args: any[]) {
      const dict = cx.sections[sectionName]
      if (!dict)
        throw new Error(`Invalid section: ${sectionName}`)
      if (dict[functionName] === undefined)
        throw new Error(`Cannot find "${functionName}" in ${sectionName}`)
      return dict[functionName](cx, ...args)
    }
  }
  return cx
}

const defaultOptions: Required<GeneratorOptions> = {
  indentUnit: "  "
}

export function indentation(cx: GeneratorContext, level: number) {
  if (level === 0)
    return ""
  if (level === 1)
    return cx.options.indentUnit
  const items: string[] = []
  for (let i = 0; i < level; ++i)
    items.push(cx.options.indentUnit)
  return items.join("")
}

export function codeToString(cx: GeneratorContext, code: CodePiece): string {
  if (!code)
    return ""
  if (isCodeBlock(code))
    return codeBlockToString(cx, code, 0, "\n\n")
  else
    return codeLineToString(code)
}

export function isCodeBlock(code: CodePiece): code is CodeBlock {
  return !!(code && code["lines"])
}

export function isInlineCode(code: CodePiece): code is InlineCode {
  return !!(code && !code["lines"])
}

function codeBlockToString(cx: GeneratorContext, { indent, lines }: CodeBlock, parentIndent = 0, sep = "\n"): string {
  const curIndent = (indent || 0) + parentIndent
  return lines.map(item => {
    if (!item)
      return
    const prefix = indentation(cx, curIndent)
    if (isCodeBlock(item))
      return codeBlockToString(cx, item, curIndent)
    else
      return prefix + codeLineToString(item)
  }).filter(line => !!line).join(sep)
}

function codeLineToString({ code, inlineComment }: InlineCode): string {
  inlineComment = inlineComment ? `${code ? " " : ""}-- ${inlineComment}` : ""
  return (code || "") + inlineComment
}

interface AppendSuffixOptions {
  notLast?: string
  last?: string
}

export function appendSuffix<T extends CodePiece>(items: T[], options: AppendSuffixOptions): T[] {
  let isLast = true
  for (let i = items.length - 1; i >= 0; --i) {
    const item = items[i]
    if (isEmptyCodePiece(item))
      continue
    if (isLast) {
      isLast = false
      if (options.last) {
        appendSuffixToCodePiece(item, options.last)
      }
    } else if (options.notLast)
      appendSuffixToCodePiece(item, options.notLast)
  }
  return items
}

export function isEmptyCodePiece(item: CodePiece): boolean {
  if (!item)
    return true
  if (isCodeBlock(item))
    return !item.lines.find(child => !isEmptyCodePiece(child))
  else
    return !item.code && !item.inlineComment
}

function appendSuffixToCodePiece(item: CodePiece, suffix: string) {
  if (item) {
    if (isCodeBlock(item))
      appendSuffix(item.lines, { last: suffix })
    else if (item.code)
      item.code += suffix
  }
}

export function tryToMakeInlineBlock(pieces: CodePiece[], inlineComment?: string): InlineCode | undefined {
  let single: CodePiece | undefined
  for (const p of pieces) {
    if (isEmptyCodePiece(p))
      continue
    if (single) {
      return
    }
    single = p
  }
  if (!single)
    return
  if (isCodeBlock(single))
    return tryToMakeInlineBlock(single.lines, inlineComment)
  if (single.inlineComment)
    inlineComment = inlineComment ? `${single.inlineComment} ${inlineComment}` : single.inlineComment
  return {
    ...single,
    inlineComment
  }
}

interface SelectedConstraint {
  compoIndex: number
  constraintIndex: number
}

export function removeSelectedColumnConstraints(sel: SelectedConstraint[], compos: AstColumnConstraintComposition[]) {
  // Build map
  const map = new Map<number, number[]>()
  for (const { compoIndex, constraintIndex } of sel) {
    let indices = map.get(compoIndex)
    if (!indices) {
      indices = []
      map.set(compoIndex, indices)
    }
    indices.push(constraintIndex)
  }

  // Make a copy with removed constraints
  const copy = [...compos]
  for (const [compoIndex, constraintIndices] of map.entries()) {
    copy[compoIndex] = {
      ...copy[compoIndex],
      constraints: [...copy[compoIndex].constraints]
    }
    for (const constraintIndex of constraintIndices.reverse())
      copy[compoIndex].constraints.splice(constraintIndex, 1)
  }
  for (const compoIndex of Array.from(map.keys()).sort((a, b) => b - a)) {
    if (copy[compoIndex].constraints.length === 0)
      copy.splice(compoIndex, 1)
  }
  return copy.length === 0 ? undefined : copy
}