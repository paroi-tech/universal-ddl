const { InputStream, CommonTokenStream, tree: { ParseTreeWalker } } = require('antlr4');
const { UniversalDdlLexer } = require('../parser/UniversalDdlLexer');
const { UniversalDdlParser } = require('../parser/UniversalDdlParser');
const DdlExtractor = require("./DdlExtractor").default;

const input = `
create table person(
  id int,
  note float
);
create table category(
  cat_id int,
  title float
);
`;
const chars = new InputStream(input);
const lexer = new UniversalDdlLexer(chars);
const tokens = new CommonTokenStream(lexer);
const parser = new UniversalDdlParser(tokens);

parser.buildParseTrees = true;

const tree = parser.script();

const extractor = new DdlExtractor();
ParseTreeWalker.DEFAULT.walk(extractor, tree);

console.log(JSON.stringify(extractor.script, undefined, 2));
