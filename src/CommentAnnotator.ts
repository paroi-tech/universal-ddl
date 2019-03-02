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
    const { tokenStream } = this.parsingContext

    // Block Comments
    const blockComments: any[] = []
    this.addCommentTokensTo(blockComments, tokenStream.getHiddenTokensToLeft(ruleContext.start.tokenIndex, 1))

    const blockComment = this.commentTokensToString(blockComments)
    if (blockComment)
      astNode.blockComment = blockComment

    // Inline Comments
    const inlineComments: any[] = []

    const stopIndex = this.getStopTokenIndexOf(ruleContext)
    for (let i = ruleContext.start.tokenIndex; i < stopIndex; ++i)
      this.addCommentTokensTo(inlineComments, tokenStream.getHiddenTokensToRight(i, 1))

    this.addLastInlineCommentTokensTo(inlineComments, tokenStream.getHiddenTokensToRight(stopIndex, 1))

    const inlineComment = this.commentTokensToString(inlineComments)
    if (inlineComment)
      astNode.inlineComment = inlineComment
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