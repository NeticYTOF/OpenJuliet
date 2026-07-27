import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

/**
 * Merges Tailwind CSS classes with conflict resolution.
 * Combines clsx conditional classes with tailwind-merge for deduplication.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-accent', 'px-6') // => 'py-2 bg-accent px-6'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a timestamp into a human-readable date string.
 *
 * @param date - Date, timestamp (ms), or ISO string
 * @param fmt - date-fns format string (default: 'MMM d, yyyy')
 */
export function formatDate(
  date: Date | number | string | null | undefined,
  fmt: string = 'MMM d, yyyy'
): string {
  if (!date) return ''
  const d = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return format(d, fmt)
}

/**
 * Format a timestamp as a relative time string (e.g., "2 hours ago").
 */
export function formatRelativeTime(date: Date | number | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return formatDistanceToNow(d, { addSuffix: true })
}

/**
 * Format bytes into a human-readable size string.
 *
 * @example
 * formatBytes(1024)        // => '1 KB'
 * formatBytes(1048576)     // => '1 MB'
 * formatBytes(0)           // => '0 Bytes'
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))
  return `${value.toFixed(decimals)} ${sizes[i]}`
}

/**
 * Truncate a string to a maximum length, appending an ellipsis if needed.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum character count (default: 100)
 */
export function truncate(str: string | null | undefined, maxLength: number = 100): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Creates a debounced function that delays invoking `fn` until after `delayMs` ms
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>): void => {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delayMs)
  }
}

/**
 * Creates a throttled function that only invokes `fn` at most once per `intervalMs`.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  intervalMs: number = 300
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>): void => {
    const now = Date.now()
    if (now - lastCall >= intervalMs) {
      lastCall = now
      fn(...args)
    }
  }
}

/**
 * Generate a simple unique ID (not cryptographically secure).
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Safely access nested object properties with a fallback.
 */
export function get<T>(obj: unknown, path: string, fallback: T): T {
  const keys = path.split('.')
  let result: unknown = obj
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return fallback
    }
    result = (result as Record<string, unknown>)[key]
  }
  return (result as T) ?? fallback
}