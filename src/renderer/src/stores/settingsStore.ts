import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, ThemeMode, GitHubAuth, AIProvider } from '../types'
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../lib/constants'

/**
 * Settings store — persists all user settings to localStorage.
 */
interface SettingsState extends AppSettings {
  /* ──── Actions ──── */
  setTheme: (theme: ThemeMode) => void
  setWorkspaceDir: (dir: string) => void
  setFontSize: (size: number) => void
  setAnimationsEnabled: (enabled: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setConcurrency: (n: number) => void
  setSandboxEnabled: (enabled: boolean) => void
  setExecutionTimeout: (ms: number) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setGitUser: (user: string) => void
  setGitEmail: (email: string) => void
  addProvider: (provider: AIProvider) => void
  removeProvider: (id: string) => void
  updateProvider: (id: string, updates: Partial<AIProvider>) => void
  setGitHubAuth: (auth: GitHubAuth) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      /* ──── State (from DEFAULT_SETTINGS) ──── */
      ...DEFAULT_SETTINGS,

      /* ──── Actions ──── */
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },

      setWorkspaceDir: (dir) => set({ workspaceDir: dir }),

      setFontSize: (size) => set({ fontSize: size }),

      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setConcurrency: (n) => set({ concurrency: Math.max(1, Math.min(10, n)) }),

      setSandboxEnabled: (enabled) => set({ sandboxEnabled: enabled }),

      setExecutionTimeout: (ms) => set({ executionTimeout: Math.max(10_000, ms) }),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      setGitUser: (user) => set({ gitUser: user }),

      setGitEmail: (email) => set({ gitEmail: email }),

      addProvider: (provider) =>
        set((state) => ({
          providers: [...state.providers.filter((p) => p.id !== provider.id), provider]
        })),

      removeProvider: (id) =>
        set((state) => ({
          providers: state.providers.filter((p) => p.id !== id)
        })),

      updateProvider: (id, updates) =>
        set((state) => ({
          providers: state.providers.map((p) => (p.id === id ? { ...p, ...updates } : p))
        })),

      setGitHubAuth: (auth) => set({ github: auth }),

      resetSettings: () => set(DEFAULT_SETTINGS)
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      version: 1
    }
  )
)