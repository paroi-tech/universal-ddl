const { CommonTokenStream, InputStream, tree: { ParseTreeWalker } } = require("antlr4")
const { UniversalDdlLexer } = require("../../antlr-parser/UniversalDdlLexer")
const { UniversalDdlParser } = require("../../antlr-parser/UniversalDdlParser")
import { Ast } from "./ast"
import DdlExtractor from "./DdlExtractor"

export function parseDdlToAst(source: string): Ast {
  const chars = new InputStream(source)
  const lexer = new UniversalDdlLexer(chars)
  const tokenStream = new CommonTokenStream(lexer)
  const parser = new UniversalDdlParser(tokenStream)

  parser.buildParseTrees = true
  parser.removeErrorListeners()
  const errors: string[] = []
  parser.addErrorListener({
    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
      errors.push(`Syntax error at line ${line}:${column}, ${msg}`)
    }
  })

  const tree = parser.script()

  const extractor = new DdlExtractor({
    source,
    tokenStream,
    tokenTypes: {
      COMMA: UniversalDdlParser.COMMA,
      COMMENT: UniversalDdlParser.COMMENT,
      NEWLINE: UniversalDdlParser.NEWLINE,
    }
  })
  ParseTreeWalker.DEFAULT.walk(extractor, tree)

  if (errors.length > 0)
    throw new Error(errors.join("\n"))

  return extractor.ast!
}

