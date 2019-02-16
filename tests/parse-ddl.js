const { InputStream, CommonTokenStream, tree: { ParseTreeWalker } } = require('antlr4');
const { UniversalDdlLexer } = require('../parser/UniversalDdlLexer');
const { UniversalDdlParser } = require('../parser/UniversalDdlParser');
const DdlExtractor = require("./DdlExtractor").default;

const input = `
create table person(
  id int primary key,
  name varchar(50) unique not null default 'sam',
  birthdate date default current_date,
  note float(5) foreign key references foo(bar)
);
`;
const chars = new InputStream(input);
const lexer = new UniversalDdlLexer(chars);
const tokens = new CommonTokenStream(lexer);
const parser = new UniversalDdlParser(tokens);

parser.buildParseTrees = true;

const tree = parser.script();

const extractor = new DdlExtractor(parser);
ParseTreeWalker.DEFAULT.walk(extractor, tree);

console.log(JSON.stringify(extractor.script, undefined, 2));
