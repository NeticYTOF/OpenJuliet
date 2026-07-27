import { describe, it, expect } from 'vitest'
import { APP_NAME, APP_VERSION, APP_DESCRIPTION, NAV_ITEMS, PRIORITIES, PRESET_PROVIDERS } from '../constants'

describe('constants', () => {
  it('has app name', () => {
    expect(APP_NAME).toBe('OpenJuliet')
  })

  it('has version', () => {
    expect(APP_VERSION).toBeTruthy()
    expect(typeof APP_VERSION).toBe('string')
  })

  it('has description', () => {
    expect(APP_DESCRIPTION).toContain('coding agent')
  })

  it('has 7 navigation items', () => {
    expect(NAV_ITEMS).toHaveLength(7)
    const ids = NAV_ITEMS.map((i) => i.id)
    expect(ids).toContain('dashboard')
    expect(ids).toContain('editor')
    expect(ids).toContain('settings')
  })

  it('has 4 priorities', () => {
    expect(PRIORITIES).toHaveLength(4)
    expect(PRIORITIES[0].value).toBe('low')
    expect(PRIORITIES[3].value).toBe('critical')
  })

  it('has preset providers', () => {
    expect(PRESET_PROVIDERS.length).toBeGreaterThanOrEqual(4)
    const names = PRESET_PROVIDERS.map((p) => p.id)
    expect(names).toContain('openai')
    expect(names).toContain('anthropic')
    expect(names).toContain('google')
    expect(names).toContain('openrouter')
  })

  it('each nav item has an icon', () => {
    for (const item of NAV_ITEMS) {
      expect(item.icon).toBeTruthy()
      expect(typeof item.icon).toBe('string')
    }
  })

  it('each priority has a color', () => {
    for (const p of PRIORITIES) {
      expect(p.color).toContain('var(--')
    }
  })
})
