# Universal DDL — `universal-ddl`

[![Build Status](https://travis-ci.com/tomko-team/universal-ddl.svg?branch=master)](https://travis-ci.com/tomko-team/universal-ddl)
[![Dependencies Status](https://david-dm.org/tomko-team/universal-ddl/status.svg)](https://david-dm.org/tomko-team/universal-ddl)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/aaf18d43bfa14f7d9de6e4bf2299588d)](https://www.codacy.com/manual/paleo/universal-ddl?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=tomko-team/universal-ddl&amp;utm_campaign=Badge_Grade)
[![npm](https://img.shields.io/npm/dm/universal-ddl)](https://www.npmjs.com/package/universal-ddl)
![Type definitions](https://img.shields.io/npm/types/universal-ddl)
[![GitHub](https://img.shields.io/github/license/tomko-team/universal-ddl)](https://github.com/tomko-team/universal-ddl)

Parse DDL scripts in a universal format, then generates DDL scripts for several DBMS.

This package provides a CLI and a programmatic API for Node.js.

## How to use the Command Line Interface

Example:

```sh
npx universal-ddl --autofix --postgresql --sqlite path/to/ddl-file.sql
```

This command will generate two new files `path/to/ddl-file.postgresql.sql` and `path/to/ddl-file.sqlite.sql`.

Available options:

```
  -h, --help                   Print this help message.
  -a, --autofix                Enable autofix.
  -o, --output-dir directory   The output directory (optional).
  -p, --postgresql             Generate a DDL for Postgresql.
  -s, --sqlite                 Generate a DDL for SQLite.
  -m, --mariadb                Generate a DDL for Mariadb or MySQL.
  -u, --universal-ddl          Generate a DDL using the Universal DDL syntax.
  -d, --generate-drop          Generate drop statements (except for the Universal DDL output).
  -e, --encoding string        Encoding for input and output file(s) (default is utf8).
  -f, --force                  Overwrite output files.
  --src file                   The source file (by default at last position).
```

## How to use the API from Node.js

Install as a dependency:

```sh
npm install universal-ddl
```

Then, use it:

```js
const { parseDdl, generateDdl, createRds, parseDdlToRds } = require("universal-ddl")

const input = `
  create table t1 (
    a integer not null primary key autoincrement
  );
  `

// Parse the input DDL and create an AST
const ast = parseDdl(input, {
  autofix: true,
  checkConsistency: true,
  freeze: true
})

// The AST is a pure JSON format, it can be stringified
console.log(JSON.stringify(ast, undefined, 2))

// How to generate a specific DDL for your DBMS
console.log(generateDdl(ast, "postgresql"))

// Create a RDS (Relational Database Structure). It is a POJO object, higher
// level than an AST. It is recursive, so it can't be stringified.
const rds = createRds(ast, { freeze: true })

// Or, create the same RDS using a shortcut
const rds2 = parseDdlToRds(input, { autofix: true, freeze: true })

// Use the RDS
console.log(rds.tables["t1"].columns["a"].constraints.notNull) // true
```

## Contribute

### Install and build

We need a JVM (Java Virtual Machine) to build the parser because we use [ANTLR](https://www.antlr.org/), which is a Java program. So, at first, install a JVM on your system.

In a terminal, open the cloned `universal-ddl/` repository. Then:

```sh
# Download once the ANTLR JAR file in the project's root directory
wget https://www.antlr.org/download/antlr-4.7.2-complete.jar

# Install once all Node.js dependencies
npm install

# Build
npm run build

# Run tests
npm run test
```

### Development environment

With VS Code, our recommanded plugins are:

- **ANTLR4 grammar syntax support** from Mike Lischke (`mike-lischke.vscode-antlr4`)
- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
