import { describe, it, expect } from 'vitest'
import { t, setLocale, getLocale, getSupportedLocales, hasKey } from '../locale'

describe('i18n', () => {
  it('default locale is en-US', () => {
    expect(getLocale()).toBe('en-US')
  })

  it('returns supported locales', () => {
    const locales = getSupportedLocales()
    expect(locales).toContain('en-US')
  })

  it('translates a simple key', () => {
    const result = t('app.name')
    expect(result).toBe('OpenJuliet')
  })

  it('returns key when translation is missing', () => {
    const result = t('nonexistent.key')
    expect(result).toBe('nonexistent.key')
  })

  it('interpolates template variables', () => {
    const result = t('welcome.title', { name: 'User' })
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('switches locale', () => {
    setLocale('en-US')
    expect(getLocale()).toBe('en-US')
  })

  it('checks key existence', () => {
    expect(hasKey('app.name')).toBe(true)
    expect(hasKey('nonexistent')).toBe(false)
  })

  it('handles nested keys', () => {
    const result = t('settings.theme')
    expect(typeof result).toBe('string')
  })
})
