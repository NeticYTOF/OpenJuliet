import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, ThemeMode, GitHubAuth, AIProvider, AnimationSpeed } from '../types'
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../lib/constants'

/**
 * Settings store — persists all user settings to localStorage.
 * Includes theme customization: accentColor, bgDensity, animationSpeed.
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
  /* ──── Theme customization ──── */
  setAccentColor: (color: string) => void
  setBgDensity: (density: number) => void
  setAnimationSpeed: (speed: AnimationSpeed) => void
}

/**
 * Apply the accent color as a CSS variable on :root.
 */
function applyAccentColor(color: string): void {
  document.documentElement.style.setProperty('--color-accent', color)
  /* Derive a subtle variant for backgrounds */
  document.documentElement.style.setProperty(
    '--color-accent-subtle',
    `${color}1a`
  )
  /* Derive a glow with ~30% opacity */
  document.documentElement.style.setProperty(
    '--color-accent-glow',
    `${color}4d`
  )
  /* Hover variant: slightly brighter (10% lighten simulation via brightness) */
  document.documentElement.style.setProperty(
    '--color-accent-hover',
    color
  )
}

/**
 * Apply background density as a CSS variable.
 * 0 = full black, 100 = default surface color.
 */
function applyBgDensity(density: number): void {
  const alpha = 1 - density / 100
  document.documentElement.style.setProperty(
    '--color-bg-density',
    `rgba(0, 0, 0, ${alpha})`
  )
}

/**
 * Apply animation speed as a CSS class on the root.
 */
function applyAnimationSpeed(speed: AnimationSpeed): void {
  const root = document.documentElement
  root.classList.remove('anim-normal', 'anim-reduced', 'anim-none')
  if (speed === 'normal') {
    root.classList.add('anim-normal')
  } else if (speed === 'reduced') {
    root.classList.add('anim-reduced')
  } else {
    root.classList.add('anim-none')
  }
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

      resetSettings: () => {
        set(DEFAULT_SETTINGS)
        applyAccentColor(DEFAULT_SETTINGS.accentColor)
        applyBgDensity(DEFAULT_SETTINGS.bgDensity)
        applyAnimationSpeed(DEFAULT_SETTINGS.animationSpeed)
      },

      /* ──── Theme customization ──── */
      setAccentColor: (color) => {
        applyAccentColor(color)
        set({ accentColor: color })
      },

      setBgDensity: (density) => {
        const clamped = Math.max(0, Math.min(100, density))
        applyBgDensity(clamped)
        set({ bgDensity: clamped })
      },

      setAnimationSpeed: (speed) => {
        applyAnimationSpeed(speed)
        set({ animationSpeed: speed })
      }
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      version: 1,
      /* Re-apply CSS variables on rehydration */
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            applyAccentColor(state.accentColor)
            applyBgDensity(state.bgDensity)
            applyAnimationSpeed(state.animationSpeed)
          }
        }
      }
    }
  )
)