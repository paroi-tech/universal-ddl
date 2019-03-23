import { AstCommentable } from "../ast"
import { AntlrRuleContext, AntlrToken } from "./antlr4-utils"
import { DdlParsingContext } from "./DdlExtractor"

export interface GrabbedCommentsResult {
  standaloneCommentsBefore: string[]
}

export interface GrabCommentsOptions {
  annotate: AstCommentable
  withoutStandalone?: boolean
}

interface WholeLineComments {
  blocks: AntlrToken[][]
  hasLastSep: boolean
}

interface BlockComments {
  blockComment?: string
  standaloneComments?: string[]
}

export default class CommentGrabber {
  private consumed = new Set<AntlrToken>()
  private lastTokenIndex = -1

  constructor(private parsingContext: DdlParsingContext) {
  }

  /**
   * @param ctx An instance of `RuleContext`.
   */
  grabComments(ctx: AntlrRuleContext, { annotate, withoutStandalone }: GrabCommentsOptions): GrabbedCommentsResult {
    const { tokenStream } = this.parsingContext
    this.lastTokenIndex = ctx.stop.tokenIndex

    const wlc = this.wholeLineComments(tokenStream.getHiddenTokensToLeft(ctx.start.tokenIndex, 1))
    const { blockComment, standaloneComments } = this.toBlockComments(wlc, withoutStandalone ? "block" : "both")
    if (blockComment)
      annotate.blockComment = blockComment

    const inlineComment = this.grabInlineComments(ctx)
    if (inlineComment)
      annotate.inlineComment = inlineComment

    return {
      standaloneCommentsBefore: standaloneComments || []
    }
  }

  grabStandaloneCommentsAfterLast(): string[] {
    const { tokenStream } = this.parsingContext
    let hiddenTokens: AntlrToken[] | null
    if (this.lastTokenIndex === -1)
      hiddenTokens = tokenStream.tokens
    else
      hiddenTokens = tokenStream.getHiddenTokensToRight(this.lastTokenIndex, 1)
    const wlc = this.wholeLineComments(hiddenTokens)
    const { standaloneComments } = this.toBlockComments(wlc, "standalone")
    return standaloneComments || []
  }

  private wholeLineComments(tokens: AntlrToken[] | null): WholeLineComments | undefined {
    if (!tokens)
      return
    const { tokenTypes: { COMMENT, NEWLINE } } = this.parsingContext
    tokens = tokens.filter(token => (token.type === COMMENT || token.type === NEWLINE) && !this.consumed.has(token))

    const blocks: AntlrToken[][] = []
    let curBlock: AntlrToken[] = []
    let newLine = false

    for (const token of tokens) {
      if (token.type === NEWLINE) {
        if (newLine && curBlock.length > 0) {
          blocks.push(curBlock)
          curBlock = []
        }
        newLine = true
      } else {
        if ((newLine || token.tokenIndex === 0) && token.type === COMMENT)
          curBlock.push(token)
        newLine = false
      }
    }

    let hasLastSep: boolean
    if (curBlock.length > 0) {
      blocks.push(curBlock)
      hasLastSep = false
    } else
      hasLastSep = true

    if (blocks.length > 0) {
      return {
        blocks,
        hasLastSep
      }
    }
  }

  private grabInlineComments(ctx: AntlrRuleContext) {
    const { tokenStream, tokenTypes: { COMMA, COMMENT, NEWLINE } } = this.parsingContext
    const inlineComments: AntlrToken[] = []

    const stopIndex = this.getStopTokenIndexOf(ctx)
    for (let i = ctx.start.tokenIndex; i < stopIndex; ++i) {
      const tokenType = tokenStream.tokens[i].type
      if (tokenType !== COMMA && tokenType !== COMMENT && tokenType !== NEWLINE)
        inlineComments.push(...this.consumeTokens(tokenStream.getHiddenTokensToRight(i, 1) || undefined))
    }

    this.addLastInlineCommentTokensTo(inlineComments, tokenStream.getHiddenTokensToRight(stopIndex, 1) || undefined)

    return this.inlineCommentTokensToString(inlineComments)
  }

  private consumeTokens(tokens: AntlrToken[] | undefined): AntlrToken[] {
    if (!tokens)
      return []
    const { COMMENT } = this.parsingContext.tokenTypes
    tokens = tokens.filter(token => token.type === COMMENT && !this.consumed.has(token))
    for (const tok of tokens)
      this.consumed.add(tok)
    return tokens
  }

  private addLastInlineCommentTokensTo(target: AntlrToken[], tokens: AntlrToken[] | undefined) {
    if (!tokens)
      return
    const { COMMENT, NEWLINE } = this.parsingContext.tokenTypes
    const lastToken = tokens.find(token => (token.type === COMMENT && !this.consumed.has(token)) || token.type === NEWLINE)
    if (lastToken && lastToken.type === COMMENT) {
      target.push(lastToken)
      this.consumed.add(lastToken)
    }
  }

  private getStopTokenIndexOf(ruleContext: AntlrRuleContext): number {
    const { COMMA } = this.parsingContext.tokenTypes
    const tokenAfter = this.parsingContext.tokenStream.tokens[ruleContext.stop.tokenIndex + 1]
    let stopIndex = ruleContext.stop.tokenIndex
    if (tokenAfter && tokenAfter.type === COMMA)
      ++stopIndex
    return stopIndex
  }

  private toBlockComments(wlc: WholeLineComments | undefined, mode: "block" | "standalone" | "both"): BlockComments {
    if (!wlc || wlc.blocks.length === 0)
      return {}
    const blocks = wlc.blocks.map(block => this.consumeTokens(block))
    if (mode === "block") {
      const merged: AntlrToken[] = []
      blocks.forEach(block => merged.push(...block))
      return {
        blockComment: this.blockCommentTokensToString(merged)
      }
    }
    let saBlocks: AntlrToken[][]
    let blockTok: AntlrToken[] | undefined
    if (wlc.hasLastSep || mode === "standalone")
      saBlocks = wlc.blocks
    else {
      const lastIndex = wlc.blocks.length - 1
      blockTok = wlc.blocks[lastIndex]
      saBlocks = wlc.blocks.slice(0, lastIndex)
    }
    return {
      standaloneComments: saBlocks.map(block => this.blockCommentTokensToString(block)).filter(s => !!s) as string[],
      blockComment: blockTok ? this.blockCommentTokensToString(blockTok) : undefined
    }
  }

  private blockCommentTokensToString(tokens: AntlrToken[]): string | undefined {
    if (tokens.length === 0)
      return
    const { source } = this.parsingContext
    const com = tokens
      .map(({ start, stop }) => source.substring(start + 3, stop + 1).trimRight())
      .filter(com => com.length > 0)
      .join("\n")
    return com || undefined
  }

  private inlineCommentTokensToString(tokens: AntlrToken[]): string | string[] | undefined {
    if (tokens.length === 0)
      return
    const { source } = this.parsingContext
    const com = tokens
      .map(({ start, stop }) => source.substring(start + 3, stop + 1).trim())
      .filter(com => com.length > 0)
    return com.length > 0 ? com : undefined
  }
}

// function debugTokensToText(tokens, parsingContext) {
//   if (!tokens)
//     return "-no-tokens-"
//   return tokens.map(({ tokenIndex, type, start, stop }) => {
//     return `[${tokenIndex}] ${type}: ${parsingContext.source.substring(start, stop + 1).replace("\n", "\\n")}`
//   }).join("\n")
// }