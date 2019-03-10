#!/usr/bin/env node
import commandLineArgs = require("command-line-args")
import commandLineUsage = require("command-line-usage")
import { existsSync, readFileSync, writeFileSync } from "fs"
import { basename, dirname, extname } from "path"
import { parseDdl } from "."
import { Dialect, generateDdl } from "./dialect-generators"
import { Ast } from "./parser/ast"

class InvalidArgumentError extends Error {
  readonly causeCode = "invalidArgument"
  constructor(message: string) {
    super(message)
  }
}

const optionDefinitions = [
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Print this help message."
  },
  {
    name: "output-dir",
    alias: "o",
    type: String,
    description: "The output directory (optional).",
    typeLabel: "{underline directory}"
  },
  {
    name: "postgresql",
    alias: "p",
    type: Boolean,
    description: "Generate a DDL for Postgresql."
  },
  {
    name: "sqlite",
    alias: "s",
    type: Boolean,
    description: "Generate a DDL for SQLite."
  },
  {
    name: "mariadb",
    alias: "m",
    type: Boolean,
    description: "Generate a DDL for Mariadb or MySQL."
  },
  {
    name: "universal-ddl",
    alias: "u",
    type: Boolean,
    description: "Generate a DDL using the Universal DDL syntax."
  },
  {
    name: "encoding",
    alias: "e",
    type: String,
    description: "Encoding for input and output file(s) (default is {underline utf8})."
  },
  {
    name: "force",
    alias: "f",
    type: Boolean,
    description: "Overwrite output files."
  },
  {
    name: "src",
    type: String,
    multiple: true,
    defaultOption: true,
    description: "The source file.",
    typeLabel: "{underline file}",
  },
]

cli()

function cli() {
  const options = parseOptions()
  if (!options)
    return
  // console.dir(options)
  if (options["help"]) {
    printHelp()
    return
  }
  try {
    processFiles(options)
  } catch (err) {
    if (err.causeCode === "invalidArgument") {
      console.log(`Error: ${err.message}`)
      printHelp()
    } else {
      console.error(`Error: ${err.message}`)
    }
  }
}

function printHelp() {
  const sections = [
    {
      header: "Universal DDL",
      content: "Parse a DDL in a universal format, then generates DDL for your DBMS."
    },
    {
      header: "Options",
      optionList: optionDefinitions
    }
  ]
  const usage = commandLineUsage(sections)
  console.log(usage)
}

function parseOptions(): object | undefined {
  try {
    return commandLineArgs(optionDefinitions)
  } catch (err) {
    console.log(`Error: ${err.message}`)
    printHelp()
  }
}

function processFiles(options) {
  if (!options.src)
    throw new InvalidArgumentError("Missing source file.")
  options.src.map(file => processFile(file, options))
}

function processFile(file: string, options) {
  let input: string
  try {
    input = readFileSync(file, { encoding: options.encoding || "utf8" }) as any
  } catch (err) {
    throw new InvalidArgumentError(`Cannot read file: ${file}`)
  }
  const bnad = baseNameAndDir(file)
  const ast = parseDdl(input, { freeze: true })
  if (options.postgresql)
    writeDdl("postgresql", ast, options, bnad)
  if (options.sqlite)
    writeDdl("sqlite", ast, options, bnad)
  if (options.mariadb)
    writeDdl("mariadb", ast, options, bnad)
  if (options["universal-ddl"])
    writeDdl("universalddl", ast, options, bnad)
}

function writeDdl(dialect: Dialect, ast: Ast, options, bnad: BaseNameAndDir) {
  const ddl = generateDdl(dialect, ast)
  const dir = normalizePath(options["output-dir"], bnad.directory)
  const file = `${dir}/${bnad.fileBaseName}.${dialect}${bnad.extension}`
  if (!options.force && existsSync(file))
    throw new Error(`Cannot overwrite existing file: ${file}`)
  writeFileSync(file, ddl, {
    encoding: options.encoding || "utf8",
  })
}

function normalizePath(path: string | undefined, defaultPath?: string): string | undefined {
  if (!path)
    return defaultPath
  path = path.replace(/\/+$/, "")
  if (path)
    return path
}

interface BaseNameAndDir {
  directory: string
  fileBaseName: string
  extension: string
}

function baseNameAndDir(file: string): BaseNameAndDir {
  const extension = extname(file)
  return {
    directory: dirname(file),
    fileBaseName: basename(file, extension),
    extension
  }
}