import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  setLocale,
  getLocale,
  getSupportedLocales,
  t,
  hasKey,
  subscribeToLocale
} from '../locale'

// The locale module auto-detects and sets system language on import.
// We need to control the initial state for deterministic testing.

beforeEach(() => {
  // Reset to en-US before each test for a clean baseline
  setLocale('en-US')
})

describe('i18n / locale system', () => {
  describe('getLocale / setLocale', () => {
    it('defaults to en-US', () => {
      expect(getLocale()).toBe('en-US')
    })

    it('sets locale to es', () => {
      setLocale('es')
      expect(getLocale()).toBe('es')
    })

    it('sets locale to fr', () => {
      setLocale('fr')
      expect(getLocale()).toBe('fr')
    })

    it('sets locale to de', () => {
      setLocale('de')
      expect(getLocale()).toBe('de')
    })

    it('sets locale to ja', () => {
      setLocale('ja')
      expect(getLocale()).toBe('ja')
    })

    it('sets locale to zh', () => {
      setLocale('zh')
      expect(getLocale()).toBe('zh')
    })

    it('falls back to en-US for unknown locale', () => {
      setLocale('xx-YY')
      expect(getLocale()).toBe('en-US')
    })

    it('falls back to language match for partial match', () => {
      // 'en-GB' should fall back to 'en-US'
      setLocale('en-GB')
      expect(getLocale()).toBe('en-US')
    })
  })

  describe('getSupportedLocales', () => {
    it('returns all supported locale codes', () => {
      const locales = getSupportedLocales()
      expect(locales).toContain('en-US')
      expect(locales).toContain('es')
      expect(locales).toContain('fr')
      expect(locales).toContain('de')
      expect(locales).toContain('ja')
      expect(locales).toContain('zh')
      expect(locales.length).toBe(6)
    })
  })

  describe('t() - English locale', () => {
    it('translates a simple key', () => {
      expect(t('common.save')).toBe('Save')
    })

    it('translates nested keys', () => {
      expect(t('nav.dashboard')).toBe('Dashboard')
      expect(t('settings.theme')).toBe('Theme')
    })

    it('returns the key itself for unknown key', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key')
    })

    it('translates deeply nested keys', () => {
      expect(t('git.commitTypes.feat')).toBe('New feature')
    })

    it('handles template interpolation', () => {
      expect(t('app.version', { version: '1.2.3' })).toBe('Version 1.2.3')
    })

    it('handles multiple placeholders', () => {
      expect(t('repositories.diverged', { ahead: '3', behind: '2' })).toBe(
        '3 ahead, 2 behind'
      )
    })

    it('leaves {placeholder} as-is when value is missing', () => {
      const result = t('app.version', {})
      expect(result).toBe('Version {version}')
    })

    it('ignores extra params not in template', () => {
      expect(t('common.save', { extra: 'ignored' })).toBe('Save')
    })
  })

  describe('t() - Spanish locale', () => {
    beforeEach(() => {
      setLocale('es')
    })

    it('translates to Spanish where available', () => {
      expect(t('common.save')).toBe('Guardar')
      expect(t('common.cancel')).toBe('Cancelar')
    })

    it('falls back to English for missing Spanish keys', () => {
      // 'settings.keyboardShortcuts' exists in en-US but not in es.json
      setLocale('en-US')
      const enResult = t('settings.keyboardShortcuts')
      setLocale('es')
      expect(t('settings.keyboardShortcuts')).toBe(enResult)
    })

    it('returns key if neither locale has it', () => {
      expect(t('completely.missing.key')).toBe('completely.missing.key')
    })
  })

  describe('t() - French locale', () => {
    beforeEach(() => {
      setLocale('fr')
    })

    it('translates to French', () => {
      // Check that the locale loads without error
      expect(getLocale()).toBe('fr')
    })
  })

  describe('template interpolation', () => {
    it('interpolates string values', () => {
      expect(t('dashboard.welcome', { name: 'Alice' })).toBe(
        'Welcome back, Alice!'
      )
    })

    it('interpolates numeric values', () => {
      expect(t('repositories.ahead', { count: 5 })).toBe('5 ahead')
    })

    it('interpolates multiple values in one string', () => {
      expect(t('validation.minLength', { field: 'Username', min: 3 })).toBe(
        'Username must be at least 3 characters'
      )
    })

    it('handles special characters in values', () => {
      expect(t('dashboard.welcome', { name: 'John <Doe>' })).toBe(
        'Welcome back, John <Doe>!'
      )
    })
  })

  describe('pluralization', () => {
    it('uses singular form for count === 1', () => {
      expect(t('dashboard.totalTasks', { count: 1 })).toBe('1 task')
    })

    it('uses plural form for count > 1', () => {
      expect(t('dashboard.totalTasks', { count: 5 })).toBe('5 tasks')
    })

    it('uses plural form for count === 0', () => {
      expect(t('dashboard.totalTasks', { count: 0 })).toBe('0 tasks')
    })

    it('handles time pluralization: singular', () => {
      expect(t('time.minutesAgo', { count: 1 })).toBe('1 minute ago')
    })

    it('handles time pluralization: plural', () => {
      expect(t('time.minutesAgo', { count: 10 })).toBe('10 minutes ago')
    })

    it('handles hours ago pluralization', () => {
      expect(t('time.hoursAgo', { count: 1 })).toBe('1 hour ago')
      expect(t('time.hoursAgo', { count: 3 })).toBe('3 hours ago')
    })

    it('handles days ago pluralization', () => {
      expect(t('time.daysAgo', { count: 1 })).toBe('1 day ago')
      expect(t('time.daysAgo', { count: 7 })).toBe('7 days ago')
    })

    it('does not pluralize when no count param (returns template with pipes)', () => {
      // Without count, pluralization is skipped and interpolation still runs
      const result = t('dashboard.totalTasks', {})
      expect(result).toBe('{count} task | {count} tasks')
    })

    it('handles Japanese locale (no plural distinction)', () => {
      setLocale('ja')
      // ja.json doesn't have dashboard.totalTasks -> falls back to en-US
      // enPluralRule returns 'one' for count=1, which maps to singular form
      const result = t('dashboard.totalTasks', { count: 1 })
      expect(result).toBe('1 task')
    })

    it('handles comments pluralization', () => {
      expect(t('issues.comments', { count: 1 })).toBe('1 comment')
      expect(t('issues.comments', { count: 3 })).toBe('3 comments')
    })

    it('handles staged count pluralization', () => {
      expect(t('git.stagedCount', { count: 1 })).toBe('1 staged')
      expect(t('git.stagedCount', { count: 5 })).toBe('5 staged')
    })
  })

  describe('fallback behavior', () => {
    it('falls back to English for missing key in non-English locale', () => {
      setLocale('es')
      // 'validation.email' exists in en-US but NOT in es.json
      const result = t('validation.email')
      expect(result).toBe('Please enter a valid email address')
    })

    it('returns key as fallback when neither locale has it', () => {
      setLocale('de')
      expect(t('totally.fake.key.path')).toBe('totally.fake.key.path')
    })

    it('recovers after setting back to en-US', () => {
      setLocale('es')
      expect(t('common.save')).toBe('Guardar')
      setLocale('en-US')
      expect(t('common.save')).toBe('Save')
    })
  })

  describe('hasKey', () => {
    it('returns true for existing keys', () => {
      expect(hasKey('common.save')).toBe(true)
      expect(hasKey('nav.dashboard')).toBe(true)
    })

    it('returns true for keys in fallback locale', () => {
      setLocale('es')
      // Even if es doesn't have it, en-US does
      expect(hasKey('validation.email')).toBe(true)
    })

    it('returns false for completely unknown keys', () => {
      expect(hasKey('nonexistent.key')).toBe(false)
    })

    it('returns false for empty string key', () => {
      expect(hasKey('')).toBe(false)
    })
  })

  describe('subscribeToLocale', () => {
    it('calls callback on locale change', () => {
      const callback = vi.fn()
      const unsubscribe = subscribeToLocale(callback)

      setLocale('es')
      expect(callback).toHaveBeenCalledTimes(1)

      setLocale('fr')
      expect(callback).toHaveBeenCalledTimes(2)

      unsubscribe()
    })

    it('unsubscribe stops callbacks', () => {
      const callback = vi.fn()
      const unsubscribe = subscribeToLocale(callback)

      setLocale('es')
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
      setLocale('de')
      expect(callback).toHaveBeenCalledTimes(1) // Should not increase
    })

    it('handles multiple subscribers', () => {
      const cb1 = vi.fn()
      const cb2 = vi.fn()

      subscribeToLocale(cb1)
      subscribeToLocale(cb2)

      setLocale('fr')
      expect(cb1).toHaveBeenCalledTimes(1)
      expect(cb2).toHaveBeenCalledTimes(1)
    })

    it('does not throw on subscriber error', () => {
      const badCallback = vi.fn(() => {
        throw new Error('Subscriber error')
      })
      const goodCallback = vi.fn()

      subscribeToLocale(badCallback)
      subscribeToLocale(goodCallback)

      expect(() => setLocale('de')).not.toThrow()
      expect(goodCallback).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('handles null/undefined params gracefully', () => {
      const result = t('dashboard.welcome', null as unknown as undefined)
      expect(result).toBe('Welcome back, {name}!')
    })

    it('handles negative count', () => {
      expect(t('dashboard.totalTasks', { count: -1 })).toBe('-1 tasks')
    })

    it('handles large count values', () => {
      expect(t('dashboard.totalTasks', { count: 999999 })).toBe('999999 tasks')
    })

    it('handles falsy count of 0 correctly', () => {
      expect(t('dashboard.totalTasks', { count: 0 })).toBe('0 tasks')
    })

    it('handles deeply missing nested key', () => {
      expect(t('a.b.c.d.e.f.g')).toBe('a.b.c.d.e.f.g')
    })
  })
})
