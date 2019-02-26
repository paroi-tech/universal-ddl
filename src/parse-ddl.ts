const { CommonTokenStream, InputStream, tree: { ParseTreeWalker } } = require("antlr4")
const { UniversalDdlLexer } = require("../parser/UniversalDdlLexer")
const { UniversalDdlParser } = require("../parser/UniversalDdlParser")
import { Ast } from "./ast"
import DdlExtractor from "./DdlExtractor"

export function parseDdl(ddl: string): Ast {
  const chars = new InputStream(ddl)
  const lexer = new UniversalDdlLexer(chars)
  const tokens = new CommonTokenStream(lexer)
  const parser = new UniversalDdlParser(tokens)

  parser.buildParseTrees = true
  parser.removeErrorListeners()
  parser.addErrorListener({
    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
      throw new Error(`Syntax error at line ${line}:${column}, ${msg}`)
    }
  })

  const tree = parser.script()

  const extractor = new DdlExtractor()
  ParseTreeWalker.DEFAULT.walk(extractor, tree)

  return extractor.ast!
}

