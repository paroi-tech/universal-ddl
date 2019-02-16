const { InputStream, CommonTokenStream, tree: { ParseTreeWalker } } = require("antlr4")
const { UniversalDdlLexer } = require("../parser/UniversalDdlLexer")
const { UniversalDdlParser } = require("../parser/UniversalDdlParser")
import { BasicAst } from "./basic-ast"
import DdlExtractor from "./DdlExtractor"

export function parseDdl(ddl: string): BasicAst {
  const chars = new InputStream(ddl)
  const lexer = new UniversalDdlLexer(chars)
  const tokens = new CommonTokenStream(lexer)
  const parser = new UniversalDdlParser(tokens)

  parser.buildParseTrees = true

  const tree = parser.script()

  const extractor = new DdlExtractor(parser)
  ParseTreeWalker.DEFAULT.walk(extractor, tree)

  return extractor.script
}

