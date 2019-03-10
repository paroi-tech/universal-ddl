import { modifyAst } from "./ast-modifier/ast-modifier"
import { generateDdl, parseDdl } from "./index"
import { AstTableEntry } from "./parser/ast"

const input = `
create table t1(
  a integer references t2(b)
);
`
console.log("\n\n-------- Input --------")
console.log(input.trim())

console.log("\n\n-------- AST --------")
const ast = parseDdl(input, { freeze: true })
console.log(JSON.stringify(ast, undefined, 2))

console.log("\n\n-------- Modified AST --------")
const ast2 = modifyAst(ast, [
  {
    forEach: "tableEntries",
    replace(list: AstTableEntry[]) {
      // console.log("[replace]", JSON.stringify(list, undefined, 2))
      return [...list, {
        "entryType": "column",
        "name": "b",
        "type": "integer"
      }]
    }
  }
])
console.log(JSON.stringify(ast2, undefined, 2))

// console.log("\n\n-------- Universal DDL --------")
// console.log(generateDdl("universalddl", ast))

// console.log("\n\n-------- Postgresql DDL --------")
// console.log(generateDdl("postgresql", ast))

// console.log("\n\n-------- SQLite DDL --------")
// console.log(generateDdl("sqlite", ast))

console.log("\n\n-------- Mariadb DDL --------")
console.log(generateDdl("mariadb", ast))