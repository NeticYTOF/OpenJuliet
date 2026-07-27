import { describe, it, expect } from 'vitest'
import {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  REPO_URL,
  DOCS_URL,
  ISSUES_URL,
  DEFAULT_SETTINGS,
  PRESET_PROVIDERS,
  NAV_ITEMS,
  PRIORITIES,
  KEYBOARD_SHORTCUTS,
  THEME_PRESET_COLORS,
  STORAGE_KEYS
} from '../constants'

describe('constants', () => {
  describe('app metadata', () => {
    it('APP_NAME is "OpenJuliet"', () => {
      expect(APP_NAME).toBe('OpenJuliet')
    })

    it('APP_VERSION is "1.0.0"', () => {
      expect(APP_VERSION).toBe('1.0.0')
    })

    it('APP_DESCRIPTION is defined and non-empty', () => {
      expect(APP_DESCRIPTION).toBeDefined()
      expect(APP_DESCRIPTION.length).toBeGreaterThan(0)
    })
  })

  describe('URLs', () => {
    it('REPO_URL is a valid GitHub URL', () => {
      expect(REPO_URL).toMatch(/^https:\/\/github\.com\//)
    })

    it('DOCS_URL is defined', () => {
      expect(DOCS_URL).toBeDefined()
      expect(DOCS_URL).toMatch(/^https?:\/\//)
    })

    it('ISSUES_URL is derived from REPO_URL', () => {
      expect(ISSUES_URL).toBe(`${REPO_URL}/issues`)
    })
  })

  describe('DEFAULT_SETTINGS', () => {
    it('has all required keys', () => {
      expect(DEFAULT_SETTINGS).toHaveProperty('theme')
      expect(DEFAULT_SETTINGS).toHaveProperty('workspaceDir')
      expect(DEFAULT_SETTINGS).toHaveProperty('fontSize')
      expect(DEFAULT_SETTINGS).toHaveProperty('animationsEnabled')
      expect(DEFAULT_SETTINGS).toHaveProperty('sidebarCollapsed')
      expect(DEFAULT_SETTINGS).toHaveProperty('concurrency')
      expect(DEFAULT_SETTINGS).toHaveProperty('sandboxEnabled')
      expect(DEFAULT_SETTINGS).toHaveProperty('executionTimeout')
      expect(DEFAULT_SETTINGS).toHaveProperty('notificationsEnabled')
      expect(DEFAULT_SETTINGS).toHaveProperty('gitUser')
      expect(DEFAULT_SETTINGS).toHaveProperty('gitEmail')
      expect(DEFAULT_SETTINGS).toHaveProperty('providers')
      expect(DEFAULT_SETTINGS).toHaveProperty('github')
      expect(DEFAULT_SETTINGS).toHaveProperty('accentColor')
      expect(DEFAULT_SETTINGS).toHaveProperty('bgDensity')
      expect(DEFAULT_SETTINGS).toHaveProperty('animationSpeed')
    })

    it('has dark theme as default', () => {
      expect(DEFAULT_SETTINGS.theme).toBe('dark')
    })

    it('has fontSize of 14', () => {
      expect(DEFAULT_SETTINGS.fontSize).toBe(14)
    })

    it('has concurrency of 2', () => {
      expect(DEFAULT_SETTINGS.concurrency).toBe(2)
    })

    it('has executionTimeout of 300000 (5 min)', () => {
      expect(DEFAULT_SETTINGS.executionTimeout).toBe(300_000)
    })

    it('has accentColor of purple', () => {
      expect(DEFAULT_SETTINGS.accentColor).toBe('#6c5ce7')
    })

    it('has bgDensity of 50', () => {
      expect(DEFAULT_SETTINGS.bgDensity).toBe(50)
    })

    it('has animationSpeed of normal', () => {
      expect(DEFAULT_SETTINGS.animationSpeed).toBe('normal')
    })

    it('has empty providers array', () => {
      expect(DEFAULT_SETTINGS.providers).toEqual([])
    })

    it('has GitHub not connected', () => {
      expect(DEFAULT_SETTINGS.github.isConnected).toBe(false)
      expect(DEFAULT_SETTINGS.github.method).toBe('none')
    })
  })

  describe('PRESET_PROVIDERS', () => {
    it('contains the expected providers', () => {
      const providerIds = PRESET_PROVIDERS.map((p) => p.id)
      expect(providerIds).toContain('openai')
      expect(providerIds).toContain('anthropic')
      expect(providerIds).toContain('google')
      expect(providerIds).toContain('openrouter')
    })

    it('all providers start disabled', () => {
      PRESET_PROVIDERS.forEach((provider) => {
        expect(provider.enabled).toBe(false)
      })
    })

    it('each provider has at least one model', () => {
      PRESET_PROVIDERS.forEach((provider) => {
        expect(provider.models.length).toBeGreaterThan(0)
      })
    })

    it('each provider has a valid kind', () => {
      const validKinds = ['openai', 'anthropic', 'google', 'openrouter', 'custom']
      PRESET_PROVIDERS.forEach((provider) => {
        expect(validKinds).toContain(provider.kind)
      })
    })
  })

  describe('NAV_ITEMS', () => {
    it('contains all expected navigation items', () => {
      const itemIds = NAV_ITEMS.map((n) => n.id)
      expect(itemIds).toContain('dashboard')
      expect(itemIds).toContain('repositories')
      expect(itemIds).toContain('issues')
      expect(itemIds).toContain('tasks')
      expect(itemIds).toContain('history')
      expect(itemIds).toContain('editor')
      expect(itemIds).toContain('settings')
    })

    it('each item has required properties', () => {
      NAV_ITEMS.forEach((item) => {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('icon')
        expect(typeof item.id).toBe('string')
        expect(typeof item.label).toBe('string')
        expect(typeof item.icon).toBe('string')
      })
    })

    it('has correct total count of nav items', () => {
      expect(NAV_ITEMS).toHaveLength(7)
    })
  })

  describe('PRIORITIES', () => {
    it('has all four priority levels', () => {
      const values = PRIORITIES.map((p) => p.value)
      expect(values).toEqual(['low', 'medium', 'high', 'critical'])
    })

    it('each priority has label and color', () => {
      PRIORITIES.forEach((p) => {
        expect(p).toHaveProperty('value')
        expect(p).toHaveProperty('label')
        expect(p).toHaveProperty('color')
      })
    })
  })

  describe('KEYBOARD_SHORTCUTS', () => {
    it('contains shortcuts across all categories', () => {
      const categories = Array.from(new Set(KEYBOARD_SHORTCUTS.map((s) => s.category)))
      expect(categories).toContain('Navigation')
      expect(categories).toContain('Editor')
      expect(categories).toContain('Tasks')
      expect(categories).toContain('GitHub')
      expect(categories).toContain('General')
    })

    it('each shortcut has required fields', () => {
      KEYBOARD_SHORTCUTS.forEach((shortcut) => {
        expect(shortcut).toHaveProperty('keys')
        expect(shortcut).toHaveProperty('description')
        expect(shortcut).toHaveProperty('category')
        expect(Array.isArray(shortcut.keys)).toBe(true)
        expect(shortcut.keys.length).toBeGreaterThan(0)
      })
    })

    it('has a reasonable number of shortcuts', () => {
      expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThan(10)
    })
  })

  describe('THEME_PRESET_COLORS', () => {
    it('contains 10 color presets', () => {
      expect(THEME_PRESET_COLORS).toHaveLength(10)
    })

    it('each color has name and value', () => {
      THEME_PRESET_COLORS.forEach((color) => {
        expect(color).toHaveProperty('name')
        expect(color).toHaveProperty('value')
        expect(color.value).toMatch(/^#/)
      })
    })
  })

  describe('STORAGE_KEYS', () => {
    it('has all required storage keys', () => {
      expect(STORAGE_KEYS.SETTINGS).toBe('openjuliet:settings')
      expect(STORAGE_KEYS.ONBOARDING).toBe('openjuliet:onboarding')
      expect(STORAGE_KEYS.RECENT_PROJECTS).toBe('openjuliet:recent-projects')
    })

    it('all keys start with "openjuliet:" prefix', () => {
      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(key).toMatch(/^openjuliet:/)
      })
    })
  })
})
