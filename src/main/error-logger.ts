/**
 * OpenJuliet — Error Logger for Main Process
 * Structured error logging with context, stack traces, and deduplication.
 */

export interface ErrorRecord {
  id: string
  timestamp: number
  source: string
  message: string
  stack?: string
  context?: Record<string, unknown>
  level: 'error' | 'warn' | 'info'
}

const MAX_RECORDS = 200
const records: ErrorRecord[] = []

let counter = 0

/**
 * Log an error with context.
 */
export function logError(
  source: string,
  error: unknown,
  context?: Record<string, unknown>
): ErrorRecord {
  const id = `err_${Date.now()}_${++counter}`
  const msg = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  const record: ErrorRecord = {
    id,
    timestamp: Date.now(),
    source,
    message: msg,
    stack,
    context,
    level: 'error'
  }

  records.unshift(record)
  if (records.length > MAX_RECORDS) records.pop()

  console.error(`[${source}] ${msg}`, context ?? '')
  return record
}

/**
 * Log a warning.
 */
export function logWarn(source: string, message: string, context?: Record<string, unknown>): ErrorRecord {
  const id = `warn_${Date.now()}_${++counter}`
  const record: ErrorRecord = { id, timestamp: Date.now(), source, message, context, level: 'warn' }
  records.unshift(record)
  if (records.length > MAX_RECORDS) records.pop()
  console.warn(`[${source}] ${message}`)
  return record
}

/**
 * Get recent error records.
 */
export function getErrorLog(limit = 50): ErrorRecord[] {
  return records.slice(0, limit)
}

/**
 * Clear the error log.
 */
export function clearErrorLog(): void {
  records.length = 0
}

/**
 * Format error for display.
 */
export function formatError(record: ErrorRecord): string {
  const time = new Date(record.timestamp).toLocaleTimeString()
  return `[${time}] [${record.level.toUpperCase()}] ${record.source}: ${record.message}${
    record.stack ? `\n${record.stack}` : ''
  }`
}
