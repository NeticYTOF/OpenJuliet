/**
 * Minimal type declarations for sql.js
 *
 * sql.js does not ship its own type declarations.
 * This shim provides basic type coverage for the APIs
 * used by the OpenJuliet database module.
 */
declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database
  }

  interface QueryExecResult {
    columns: string[]
    values: unknown[][]
  }

  interface Statement {
    bind(params?: unknown[] | Record<string, unknown>): boolean
    step(): boolean
    getAsObject(): Record<string, unknown>
    free(): boolean
    reset(): void
  }

  interface Database {
    run(sql: string, params?: unknown[] | Record<string, unknown>): Database
    exec(sql: string): QueryExecResult[]
    prepare(sql: string): Statement
    getRowsModified(): number
    export(): Uint8Array
    close(): void
  }

  export { Database }
  export { Database as SqlJsDatabase }

  export default function initSqlJs(
    config?: Record<string, unknown>
  ): Promise<SqlJsStatic>
}
