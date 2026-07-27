import { describe, it, expect, vi } from 'vitest'
import { cn, formatDate, formatRelativeTime, formatBytes, truncate, debounce, throttle, generateId, clamp, get } from '../utils'

describe('cn', () => {
  it('merges tailwind class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    expect(cn('px-4', false && 'hidden', 'py-2')).toBe('px-4 py-2')
    expect(cn('px-4', true && 'hidden', 'py-2')).toBe('px-4 hidden py-2')
  })

  it('handles undefined / null inputs gracefully', () => {
    expect(cn('px-4', undefined, null, 'py-2')).toBe('px-4 py-2')
  })

  it('resolves tailwind conflicts (last wins)', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })

  it('returns empty string when no arguments', () => {
    expect(cn()).toBe('')
  })
})

describe('formatDate', () => {
  it('formats a Date object', () => {
    const d = new Date(2024, 0, 15)
    expect(formatDate(d)).toBe('Jan 15, 2024')
  })

  it('formats a timestamp (number)', () => {
    expect(formatDate(1705276800000)).toBe('Jan 15, 2024')
  })

  it('formats an ISO string', () => {
    expect(formatDate('2024-01-15T00:00:00.000Z')).toBe('Jan 15, 2024')
  })

  it('accepts a custom format string', () => {
    const d = new Date(2024, 0, 15)
    expect(formatDate(d, 'yyyy-MM-dd')).toBe('2024-01-15')
  })

  it('returns empty string for null / undefined', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('')
  })
})

describe('formatRelativeTime', () => {
  it('returns a relative time string', () => {
    const now = new Date()
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const result = formatRelativeTime(fiveMinAgo)
    expect(result).toMatch(/5 minutes? ago/)
  })

  it('returns empty string for null / undefined', () => {
    expect(formatRelativeTime(null)).toBe('')
    expect(formatRelativeTime(undefined)).toBe('')
  })

  it('returns empty string for invalid date', () => {
    expect(formatRelativeTime('garbage')).toBe('')
  })
})

describe('formatBytes', () => {
  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.00 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1.00 MB')
  })

  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1.00 GB')
  })

  it('respects decimal places', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB')
  })
})

describe('truncate', () => {
  it('returns the string unchanged when shorter than max length', () => {
    expect(truncate('hello')).toBe('hello')
  })

  it('truncates and appends ellipsis when longer', () => {
    const long = 'a'.repeat(150)
    const result = truncate(long, 100)
    expect(result).toHaveLength(101) // 100 chars + ellipsis
    expect(result.endsWith('…')).toBe(true)
  })

  it('returns empty string for null / undefined', () => {
    expect(truncate(null)).toBe('')
    expect(truncate(undefined)).toBe('')
  })

  it('uses default maxLength of 100', () => {
    const result = truncate('x'.repeat(200))
    expect(result).toHaveLength(101)
  })
})

describe('debounce', () => {
  it('delays invocation', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('cancels previous invocation on rapid calls', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    debounced()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})

describe('throttle', () => {
  it('only invokes once per interval', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    throttled()
    throttled()

    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    throttled()
    expect(fn).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })
})

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string')
  })

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe('clamp', () => {
  it('clamps below minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps above maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
})

describe('get', () => {
  const obj = { a: { b: { c: 42 } }, x: null }

  it('accesses a nested property', () => {
    expect(get(obj, 'a.b.c', null)).toBe(42)
  })

  it('returns fallback for missing property', () => {
    expect(get(obj, 'a.b.z', 'default')).toBe('default')
  })

  it('returns fallback when intermediate is null', () => {
    expect(get(obj, 'x.y.z', 'fallback')).toBe('fallback')
  })

  it('returns fallback when obj is null', () => {
    expect(get(null, 'a.b', 'nope')).toBe('nope')
  })
})
