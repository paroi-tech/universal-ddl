/**
 * @param {*} ctx A ParseTree instance: of type TerminalNode | RuleContext
 */
function ruleNameOf(ctx) {
  if (ctx.parser && ctx.ruleIndex !== undefined) {
    return ctx.parser.ruleNames[ctx.ruleIndex]
  } else if (ctx.parentCtx && ctx.symbol) {
    return ctx.parentCtx.parser.symbolicNames[ctx.symbol.type]
  }
}

module.exports = {
  ruleNameOf
};