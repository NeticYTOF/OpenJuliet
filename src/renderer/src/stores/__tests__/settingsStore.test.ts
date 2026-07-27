import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore } from '../settingsStore'

import type { ThemeMode, GitHubAuth } from '../../types'

const defaults = {
  theme: 'dark' as ThemeMode,
  workspaceDir: '',
  fontSize: 14,
  animationsEnabled: true,
  sidebarCollapsed: false,
  concurrency: 2,
  sandboxEnabled: true,
  executionTimeout: 300_000,
  notificationsEnabled: true,
  gitUser: '',
  gitEmail: '',
  providers: [] as Array<{
    id: string
    name: string
    kind: 'openai' | 'anthropic' | 'google' | 'openrouter' | 'custom'
    baseUrl?: string
    models: Array<{ id: string; name: string; maxTokens: number; supportsVision: boolean; supportsFunctions: boolean }>
    enabled: boolean
  }>,
  github: { isConnected: false, method: 'none' as const } satisfies GitHubAuth
}

beforeEach(() => {
  localStorage.clear()
  useSettingsStore.setState(defaults)
})

describe('settingsStore', () => {
  it('has correct default state', () => {
    const state = useSettingsStore.getState()
    expect(state.theme).toBe('dark')
    expect(state.workspaceDir).toBe('')
    expect(state.fontSize).toBe(14)
    expect(state.animationsEnabled).toBe(true)
    expect(state.sidebarCollapsed).toBe(false)
    expect(state.concurrency).toBe(2)
    expect(state.sandboxEnabled).toBe(true)
    expect(state.executionTimeout).toBe(300_000)
    expect(state.notificationsEnabled).toBe(true)
    expect(state.gitUser).toBe('')
    expect(state.gitEmail).toBe('')
    expect(state.providers).toEqual([])
    expect(state.github).toEqual({ isConnected: false, method: 'none' })
  })

  describe('setTheme', () => {
    it('updates the theme', () => {
      useSettingsStore.getState().setTheme('light')
      expect(useSettingsStore.getState().theme).toBe('light')
    })
  })

  describe('setWorkspaceDir', () => {
    it('updates workspace directory', () => {
      useSettingsStore.getState().setWorkspaceDir('/home/projects/my-app')
      expect(useSettingsStore.getState().workspaceDir).toBe('/home/projects/my-app')
    })
  })

  describe('setFontSize', () => {
    it('sets font size', () => {
      useSettingsStore.getState().setFontSize(16)
      expect(useSettingsStore.getState().fontSize).toBe(16)
    })
  })

  describe('setAnimationsEnabled', () => {
    it('disables animations', () => {
      useSettingsStore.getState().setAnimationsEnabled(false)
      expect(useSettingsStore.getState().animationsEnabled).toBe(false)
    })
  })

  describe('setSidebarCollapsed', () => {
    it('collapses the sidebar', () => {
      useSettingsStore.getState().setSidebarCollapsed(true)
      expect(useSettingsStore.getState().sidebarCollapsed).toBe(true)
    })
  })

  describe('setConcurrency', () => {
    it('sets concurrency within valid range', () => {
      useSettingsStore.getState().setConcurrency(5)
      expect(useSettingsStore.getState().concurrency).toBe(5)
    })

    it('clamps to minimum of 1', () => {
      useSettingsStore.getState().setConcurrency(0)
      expect(useSettingsStore.getState().concurrency).toBe(1)
    })

    it('clamps to maximum of 10', () => {
      useSettingsStore.getState().setConcurrency(20)
      expect(useSettingsStore.getState().concurrency).toBe(10)
    })
  })

  describe('setSandboxEnabled', () => {
    it('disables sandbox', () => {
      useSettingsStore.getState().setSandboxEnabled(false)
      expect(useSettingsStore.getState().sandboxEnabled).toBe(false)
    })
  })

  describe('setExecutionTimeout', () => {
    it('sets execution timeout', () => {
      useSettingsStore.getState().setExecutionTimeout(60_000)
      expect(useSettingsStore.getState().executionTimeout).toBe(60_000)
    })

    it('enforces minimum of 10_000', () => {
      useSettingsStore.getState().setExecutionTimeout(5_000)
      expect(useSettingsStore.getState().executionTimeout).toBe(10_000)
    })
  })

  describe('setNotificationsEnabled', () => {
    it('disables notifications', () => {
      useSettingsStore.getState().setNotificationsEnabled(false)
      expect(useSettingsStore.getState().notificationsEnabled).toBe(false)
    })
  })

  describe('setGitUser / setGitEmail', () => {
    it('sets git user and email', () => {
      useSettingsStore.getState().setGitUser('testuser')
      useSettingsStore.getState().setGitEmail('test@example.com')
      expect(useSettingsStore.getState().gitUser).toBe('testuser')
      expect(useSettingsStore.getState().gitEmail).toBe('test@example.com')
    })
  })

  describe('addProvider', () => {
    it('adds a provider', () => {
      const provider = {
        id: 'my-custom',
        name: 'My Custom',
        kind: 'custom' as const,
        baseUrl: 'http://localhost:8080',
        models: [],
        enabled: true
      }
      useSettingsStore.getState().addProvider(provider)
      expect(useSettingsStore.getState().providers).toHaveLength(1)
      expect(useSettingsStore.getState().providers[0].id).toBe('my-custom')
    })

    it('replaces an existing provider with the same id', () => {
      const p1 = { id: 'p1', name: 'P1', kind: 'custom' as const, models: [], enabled: true }
      const p2 = { id: 'p1', name: 'P1 Updated', kind: 'custom' as const, models: [], enabled: true }
      useSettingsStore.getState().addProvider(p1)
      useSettingsStore.getState().addProvider(p2)
      expect(useSettingsStore.getState().providers).toHaveLength(1)
      expect(useSettingsStore.getState().providers[0].name).toBe('P1 Updated')
    })
  })

  describe('removeProvider', () => {
    it('removes a provider by id', () => {
      const p = { id: 'to-remove', name: 'Remove Me', kind: 'custom' as const, models: [], enabled: false }
      useSettingsStore.getState().addProvider(p)
      expect(useSettingsStore.getState().providers).toHaveLength(1)
      useSettingsStore.getState().removeProvider('to-remove')
      expect(useSettingsStore.getState().providers).toHaveLength(0)
    })
  })

  describe('updateProvider', () => {
    it('updates partial provider fields', () => {
      const p = { id: 'p1', name: 'Original', kind: 'custom' as const, models: [], enabled: false }
      useSettingsStore.getState().addProvider(p)
      useSettingsStore.getState().updateProvider('p1', { name: 'Updated', enabled: true })
      const provider = useSettingsStore.getState().providers[0]
      expect(provider.name).toBe('Updated')
      expect(provider.enabled).toBe(true)
    })
  })

  describe('setGitHubAuth', () => {
    it('sets GitHub auth', () => {
      useSettingsStore.getState().setGitHubAuth({ isConnected: true, method: 'oauth', username: 'octocat' })
      expect(useSettingsStore.getState().github.isConnected).toBe(true)
      expect(useSettingsStore.getState().github.username).toBe('octocat')
    })
  })

  describe('resetSettings', () => {
    it('resets all settings to defaults', () => {
      useSettingsStore.getState().setWorkspaceDir('/tmp')
      useSettingsStore.getState().setFontSize(20)
      useSettingsStore.getState().resetSettings()
      const state = useSettingsStore.getState()
      expect(state.workspaceDir).toBe('')
      expect(state.fontSize).toBe(14)
    })
  })
})
