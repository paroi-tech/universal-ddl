import { GeneratorOptions } from "../exported-definitions"
import { CodeBlock, CodePiece, CreateModifiers, GeneratorContext, GenSections, InlineCode } from "./index"

export function makeGeneratorContext(
  options: GeneratorOptions,
  sections: GenSections,
  createModifiers?: CreateModifiers
): GeneratorContext {
  const cx: GeneratorContext = {
    sections,
    createModifiers,
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
  indentUnit: "  ",
  generateDrop: false
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
    return codeBlockToString(cx, code, 0, "spaced")
  else
    return codeLineToString(code)
}

export function isCodeBlock(code: CodePiece): code is CodeBlock {
  return !!(code && code["lines"])
}

export function isInlineCode(code: CodePiece): code is InlineCode {
  return !!(code && !code["lines"])
}

type SpaceMode = "spaced" | "cancel" | "cancelBefore" | "cancelAfter"

function codeBlockToString(cx: GeneratorContext, block: CodeBlock, parentIndent = 0, spaceMode?: SpaceMode): string {
  const { indent, lines, spaceBefore, spaceAfter } = block
  const curIndent = (indent || 0) + parentIndent
  const lastIndex = lines.length - 1
  const content = lines.map((item, index) => {
    if (!item)
      return
    const prefix = indentation(cx, curIndent)
    if (isCodeBlock(item)) {
      let childSpace: SpaceMode | undefined
      if (spaceMode === "spaced")
        childSpace = "cancel"
      else
        childSpace = index === 0 ? "cancelBefore" : index === lastIndex ? "cancelAfter" : undefined
      return codeBlockToString(cx, item, curIndent, childSpace)
    } else
      return prefix + codeLineToString(item)
  }).filter(line => !!line).join(spaceMode === "spaced" ? "\n\n" : "\n")
  if (spaceMode === "cancel")
    return content
  const prefix = spaceBefore && spaceMode !== "cancelBefore" ? "\n" : ""
  const suffix = spaceAfter && spaceMode !== "cancelAfter" ? "\n" : ""
  return prefix + content + suffix
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
    if (isEmptyCodePiece(item, true))
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

export function isEmptyCodePiece(item: CodePiece, ignoreComments = false): boolean {
  if (!item)
    return true
  if (isCodeBlock(item))
    return !item.lines.find(child => !isEmptyCodePiece(child, ignoreComments))
  else
    return !item.code && (ignoreComments || !item.inlineComment)
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
  if (isCodeBlock(single)) {
    if (single.spaceBefore || single.spaceAfter)
      return
    return tryToMakeInlineBlock(single.lines, inlineComment)
  }
  if (single.inlineComment)
    inlineComment = inlineComment ? `${single.inlineComment} ${inlineComment}` : single.inlineComment
  return {
    ...single,
    inlineComment
  }
}
