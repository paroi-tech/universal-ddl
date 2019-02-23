# universal-ddl

## Install

Install a JVM on your system.

Download the `antlr` JAR file in the project's root directory:

```sh
wget https://www.antlr.org/download/antlr-4.7.2-complete.jar
```

## Build

```sh
npm run build
```

## Run the demonstrations

```sh
node dist/example.js
```

## Contribute

With VS Code, our recommanded plugins are:

- **TODO Highlight** from Wayou Liu (`wayou.vscode-todo-highlight`)
- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)

## Optional — Use the Java tool for testing

Notices:

* We are not using Java. But the tool provided by ANTLR to test grammars works only with Java.
* A Java compiler must be installed on your system.

To generate and build lexer and parser:

```sh
npm run java-build
```

Then you can test the grammar with:

```sh
npm run java-test
```