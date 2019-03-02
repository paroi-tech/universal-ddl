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