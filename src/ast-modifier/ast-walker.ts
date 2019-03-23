import { AstColumnConstraint, AstOrder, AstTableConstraint, AstTableEntry } from "../ast"

export type NodeWalker = ObjectWalker | ArrayWalker | NodeWalkerProvider

export interface ObjectWalker {
  hookName?: string
  type: "object",
  self?: NodeWalker
  children?: { [childName: string]: NodeWalker }
}

export interface ArrayWalker {
  hookName?: string
  type: "array",
  child?: NodeWalker
}

export type NodeWalkerProvider = ((node: any) => NodeWalker | undefined)

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
      constraints: {
        hookName: "columnConstraints",
        type: "array",
        child: ({ constraintType }: AstColumnConstraint) => columnConstraintWalkers[constraintType]
      }
    }
  },
  constraint: {
    hookName: "tableConstraint",
    type: "object",
    self: ({ constraintType }: AstTableConstraint) => tableConstraintWalkers[constraintType]
  },
}

const tableConstraintWalkers: NodeWalkers = {
  primaryKey: {
    hookName: "primaryKeyTableConstraint",
    type: "object",
  },
  foreignKey: {
    hookName: "foreignKeyTableConstraint",
    type: "object",
  },
  unique: {
    hookName: "uniqueTableConstraint",
    type: "object",
  },
}

const columnConstraintWalkers: NodeWalkers = {
  notNull: {
    hookName: "notNullColumnConstraint",
    type: "object",
  },
  null: {
    hookName: "nullColumnConstraint",
    type: "object",
  },
  default: {
    hookName: "defaultColumnConstraint",
    type: "object",
  },
  autoincrement: {
    hookName: "autoincrementColumnConstraint",
    type: "object",
  },
  primaryKey: {
    hookName: "primaryKeyColumnConstraint",
    type: "object",
  },
  foreignKey: {
    hookName: "foreignKeyColumnConstraint",
    type: "object",
  },
  unique: {
    hookName: "uniqueColumnConstraint",
    type: "object",
  },
}
