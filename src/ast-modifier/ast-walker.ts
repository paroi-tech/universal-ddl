import { AstColumnConstraint, AstOrder, AstTableConstraint, AstTableEntry } from "../parser/ast"

export type NodeWalker = ObjectWalker | ArrayWalker | NodeWalkerProvider

export interface ObjectWalker {
  hookName?: string
  type: "object",
  children?: { [childName: string]: NodeWalker }
}

export interface ArrayWalker {
  hookName?: string
  type: "array",
  child?: NodeWalker
}

export type NodeWalkerProvider = ((node: any) => NodeWalker)

export interface NodeWalkers {
  [name: string]: NodeWalker
}

export function isObjectWalker(nodeWalker: NodeWalker): nodeWalker is ObjectWalker {
  return typeof nodeWalker === "object" && nodeWalker["type"] === "object"
}

export function isArrayWalker(nodeWalker: NodeWalker): nodeWalker is ArrayWalker {
  return typeof nodeWalker === "object" && nodeWalker["type"] === "array"
}

export function isNodeWalkerProvider(nodeWalker: NodeWalker): nodeWalker is NodeWalkerProvider {
  return typeof nodeWalker === "function"
}

export const astWalker: NodeWalker = {
  hookName: "ast",
  type: "object",
  children: {
    orders: {
      hookName: "orders",
      type: "array",
      child: ({ orderType }: AstOrder) => orderWalkers[orderType]
    }
  }
}

const orderWalkers: NodeWalkers = {
  createTable: {
    hookName: "createTable",
    type: "object",
    children: {
      entries: {
        hookName: "tableEntries",
        type: "array",
        child: ({ entryType }: AstTableEntry) => tableEntryWalkers[entryType]
      }
    }
  },
  alterTable: {
    hookName: "alterTable",
    type: "object",
    children: {
      add: {
        hookName: "tableEntries",
        type: "array",
        child: ({ entryType }: AstTableEntry) => tableEntryWalkers[entryType]
      }
    }
  },
  createIndex: {
    hookName: "createIndex",
    type: "object",
    children: {
      index: {
        hookName: "index",
        type: "object"
      }
    }
  },
}

const tableEntryWalkers: NodeWalkers = {
  column: {
    hookName: "column",
    type: "object",
    children: {
      constraintCompositions: {
        hookName: "columnConstraintCompositions",
        type: "object",
        children: {
          constraints: {
            hookName: "columnConstraints",
            type: "array",
            child: ({ constraintType }: AstColumnConstraint) => columnConstraintWalkers[constraintType]
          }
        }
      }
    }
  },
  constraintComposition: {
    hookName: "tableConstraintCompositions",
    type: "object",
    children: {
      constraints: {
        hookName: "tableConstraints",
        type: "array",
        child: ({ constraintType }: AstTableConstraint) => tableConstraintWalkers[constraintType]
      }
    }
  },
}

const tableConstraintWalkers: NodeWalkers = {
  primaryKey: {
    hookName: "",
    type: "object",
  },
  foreignKey: {
    hookName: "",
    type: "object",
  },
  unique: {
    hookName: "",
    type: "object",
  },
}

const columnConstraintWalkers: NodeWalkers = {
  notNull: {
    hookName: "notNull",
    type: "object",
  },
  null: {
    hookName: "null",
    type: "object",
  },
  default: {
    hookName: "default",
    type: "object",
  },
  autoincrement: {
    hookName: "autoincrement",
    type: "object",
  },
  primaryKey: {
    hookName: "primaryKey",
    type: "object",
  },
  foreignKey: {
    hookName: "foreignKey",
    type: "object",
  },
  unique: {
    hookName: "unique",
    type: "object",
  },
}
