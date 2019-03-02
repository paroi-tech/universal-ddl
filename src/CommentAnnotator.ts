import { AstCommentable } from "./ast"
import { DdlParsingContext } from "./DdlExtractor"

export default class CommentAnnotator {
  private consumed = new Set<any>()

  constructor(private parsingContext: DdlParsingContext) {
  }

  /**
   * @param ruleContext An instance of `RuleContext`.
   */
  appendCommentsTo(astNode: AstCommentable, ruleContext: any) {
    const { tokenStream, tokenTypes: { COMMA, COMMENT, NEWLINE } } = this.parsingContext

    // Block Comments
    const blockComments: any[] = []
    const leftTokens = tokenStream.getHiddenTokensToLeft(ruleContext.start.tokenIndex, 1)
    this.addCommentTokensTo(blockComments, this.lastWholeLineComments(leftTokens))

    const blockComment = this.commentTokensToString(blockComments)
    if (blockComment)
      astNode.blockComment = blockComment

    // Inline Comments
    const inlineComments: any[] = []

    const stopIndex = this.getStopTokenIndexOf(ruleContext)
    for (let i = ruleContext.start.tokenIndex; i < stopIndex; ++i) {
      const tokenType = tokenStream.tokens[i].type
      if (tokenType !== COMMA && tokenType !== COMMENT && tokenType !== NEWLINE)
        this.addCommentTokensTo(inlineComments, tokenStream.getHiddenTokensToRight(i, 1))
    }

    this.addLastInlineCommentTokensTo(inlineComments, tokenStream.getHiddenTokensToRight(stopIndex, 1))

    const inlineComment = this.commentTokensToString(inlineComments)
    if (inlineComment)
      astNode.inlineComment = inlineComment
  }

  private lastWholeLineComments(leftTokens: any[] | null) {
    if (!leftTokens)
      return null
    const { tokenTypes: { COMMENT, NEWLINE } } = this.parsingContext
    leftTokens = leftTokens.filter(token => (token.type === COMMENT || token.type === NEWLINE) && !this.consumed.has(token))
    const reversedComments: any[] = []
    let currentComment: any | null
    for (let i = leftTokens.length - 1; i >= 0; --i) {
      const token = leftTokens[i]
      if (token.type === COMMENT)
        currentComment = token
      else if (token.type === NEWLINE) {
        if (currentComment) {
          reversedComments.push(currentComment)
          currentComment = undefined
        }
      }
    }
    return reversedComments.length === 0 ? null : reversedComments.reverse()
  }

  private addCommentTokensTo(target: any[], tokens: any[] | null) {
    if (!tokens)
      return
    const { COMMENT } = this.parsingContext.tokenTypes
    tokens = tokens.filter(token => token.type === COMMENT && !this.consumed.has(token))
    target.push(...tokens)
    for (const tok of tokens)
      this.consumed.add(tok)
  }

  private addLastInlineCommentTokensTo(target: any[], tokens: any[] | null) {
    if (!tokens)
      return
    const { COMMENT, NEWLINE } = this.parsingContext.tokenTypes
    const lastToken = tokens.find(token => (token.type === COMMENT && !this.consumed.has(token)) || token.type === NEWLINE)
    if (lastToken && lastToken.type === COMMENT) {
      target.push(lastToken)
      this.consumed.add(lastToken)
    }
  }

  private getStopTokenIndexOf(ruleContext): number {
    const { COMMA } = this.parsingContext.tokenTypes
    const tokenAfter = this.parsingContext.tokenStream.tokens[ruleContext.stop.tokenIndex + 1]
    let stopIndex = ruleContext.stop.tokenIndex
    if (tokenAfter && tokenAfter.type === COMMA)
      ++stopIndex
    return stopIndex
  }

  private commentTokensToString(tokens: any[]): string | undefined {
    if (tokens.length === 0)
      return
    const { source } = this.parsingContext
    const com = tokens
      .map(({ start, stop }) => source.substring(start + 3, stop + 1).trimRight())
      .filter(com => com.length > 0)
      .join("\n")
    return com || undefined
  }
}

// function debugTokensToText(tokens, parsingContext) {
//   if (!tokens)
//     return "-no-tokens-"
//   return tokens.map(({ tokenIndex, type, start, stop }) => {
//     return `[${tokenIndex}] ${type}: ${parsingContext.source.substring(start, stop + 1).replace("\n", "\\n")}`
//   }).join("\n")
// }