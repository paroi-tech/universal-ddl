const { readFileSync, writeFileSync } = require("fs")
const { join } = require("path")

const bundleName = "universal-ddl"
const srcDir = join(__dirname, "..", "src")
const compiledDir = join(__dirname, "declarations")
const packageDir = join(__dirname, "..")

try {
  writeFileSync(join(packageDir, "dist", `${bundleName}.d.ts`), makeDefinitionsCode())
} catch (err) {
  console.log(err.message, err.stack)
}

function makeDefinitionsCode() {
  const defs = [
    "// -- AST definitions --",
    removeLocalImportsExports((readFileSync(join(srcDir, "ast.d.ts"), "utf-8")).trim()),
    "// -- RDS definitions --",
    removeLocalImportsExports((readFileSync(join(srcDir, "rds.d.ts"), "utf-8")).trim()),
    "// -- Exported definitions --",
    removeLocalImportsExports((readFileSync(join(srcDir, "exported-definitions.d.ts"), "utf-8")).trim()),
    "// -- Entry point definitions --",
    removeSemicolons(
      removeLocalImportsExports((readFileSync(join(compiledDir, "api.d.ts"), "utf-8")).trim()),
    )
  ]
  return defs.join("\n\n")
}

function removeLocalImportsExports(code) {
  const localImportExport = /^\s*(import|export) .* from "\.\/.*"\s*;?\s*$/
  return code.split("\n").filter(line => {
    return !localImportExport.test(line)
  }).join("\n").trim()
}

function removeSemicolons(code) {
  return code.replace(/;/g, "")
}
