import { create } from 'zustand'
import type { ActiveView, Notification, NotificationType, ThemeMode } from '../types'
import { generateId } from '../lib/utils'

/**
 * Global application store — manages navigation, theme, notifications, and onboarding state.
 */
interface AppState {
  /* ──── State ──── */
  activeView: ActiveView
  sidebarOpen: boolean
  theme: ThemeMode
  currentProject: string | null
  currentTask: string | null
  notifications: Notification[]
  hasCompletedOnboarding: boolean
  isFirstLaunch: boolean

  /* ──── Actions ──── */
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setView: (view: ActiveView) => void
  setTheme: (theme: ThemeMode) => void
  setCurrentProject: (id: string | null) => void
  setCurrentTask: (id: string | null) => void
  addNotification: (type: NotificationType, title: string, message?: string, duration?: number) => string
  dismissNotification: (id: string) => void
  clearNotifications: () => void
  completeOnboarding: () => void
}

export const useAppStore = create<AppState>((set) => ({
  /* ──── Initial State ──── */
  activeView: 'dashboard',
  sidebarOpen: true,
  theme: 'dark',
  currentProject: null,
  currentTask: null,
  notifications: [],
  hasCompletedOnboarding: localStorage.getItem('openjuliet:onboarding') === 'true',
  isFirstLaunch: !localStorage.getItem('openjuliet:onboarding'),

  /* ──── Actions ──── */
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setView: (view) => set({ activeView: view }),

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },

  setCurrentProject: (id) => set({ currentProject: id }),

  setCurrentTask: (id) => set({ currentTask: id }),

  addNotification: (type, title, message, duration = 5000) => {
    const id = generateId()
    const notification: Notification = { id, type, title, message, timestamp: Date.now(), duration }
    set((state) => ({
      notifications: [...state.notifications, notification]
    }))
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }))
      }, duration)
    }
    return id
  },

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    })),

  clearNotifications: () => set({ notifications: [] }),

  completeOnboarding: () => {
    localStorage.setItem('openjuliet:onboarding', 'true')
    set({ hasCompletedOnboarding: true, isFirstLaunch: false })
  }
}))