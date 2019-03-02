/**
 * Helper for ANTLR4.
 * @param ctx A `ParseTree` instance: of type `TerminalNode` or `RuleContext`.
 */
export function ruleNameOf(ctx: any): string | undefined {
  if (ctx.parser && ctx.ruleIndex !== undefined) {
    return ctx.parser.ruleNames[ctx.ruleIndex]
  } else if (ctx.parentCtx && ctx.symbol) {
    return ctx.parentCtx.parser.symbolicNames[ctx.symbol.type]
  }
}

/**
 * Helper for ANTLR4.
 * @param ctx A `ParseTree` instance: of type `TerminalNode` or `RuleContext`.
 */
export function lexerTokenType(ctx: any, tokenName): number {
  const parser = ctx.parser || ctx.parentCtx.parser
  // const type = parser.symbolicNames.indexOf(tokenName)
  // if (type === -1)
  const type = parser.constructor[tokenName]
  if (typeof type !== "number")
    throw new Error(`Unknown lexer token: ${tokenName}`)
  // console.log(type); process.exit()
  return type
}
