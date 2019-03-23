export interface ConsistencyCheckerReport {
  valid: boolean
  errors?: string[]
}

export interface GeneratorOptions {
  indentUnit?: string
  generateDrop?: boolean
}

export type Dialect = "universalddl" | "postgresql" | "sqlite" | "mariadb"
