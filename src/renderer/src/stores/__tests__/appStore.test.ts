import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore } from '../appStore'

// Helper to reset the store between tests
function resetStore(): void {
  useAppStore.setState({
    activeView: 'dashboard',
    sidebarOpen: true,
    theme: 'dark',
    currentProject: null,
    currentTask: null,
    notifications: [],
    hasCompletedOnboarding: false,
    isFirstLaunch: true
  })
}

beforeEach(() => {
  // Clear localStorage and reset store
  localStorage.clear()
  resetStore()
})

describe('appStore', () => {
  it('has correct initial state', () => {
    const state = useAppStore.getState()
    expect(state.activeView).toBe('dashboard')
    expect(state.sidebarOpen).toBe(true)
    expect(state.theme).toBe('dark')
    expect(state.currentProject).toBeNull()
    expect(state.currentTask).toBeNull()
    expect(state.notifications).toEqual([])
    expect(state.isFirstLaunch).toBe(true)
  })

  describe('toggleSidebar', () => {
    it('toggles sidebarOpen from true to false', () => {
      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarOpen).toBe(false)
    })

    it('toggles sidebarOpen from false to true', () => {
      useAppStore.getState().setSidebarOpen(false)
      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarOpen).toBe(true)
    })
  })

  describe('setSidebarOpen', () => {
    it('sets sidebarOpen to the given value', () => {
      useAppStore.getState().setSidebarOpen(false)
      expect(useAppStore.getState().sidebarOpen).toBe(false)
    })
  })

  describe('setView', () => {
    it('updates activeView', () => {
      useAppStore.getState().setView('settings')
      expect(useAppStore.getState().activeView).toBe('settings')
    })
  })

  describe('setTheme', () => {
    it('updates the theme', () => {
      useAppStore.getState().setTheme('light')
      expect(useAppStore.getState().theme).toBe('light')
    })
  })

  describe('setCurrentProject', () => {
    it('sets the current project id', () => {
      useAppStore.getState().setCurrentProject('proj-1')
      expect(useAppStore.getState().currentProject).toBe('proj-1')
    })

    it('clears the current project id when null', () => {
      useAppStore.getState().setCurrentProject('proj-1')
      useAppStore.getState().setCurrentProject(null)
      expect(useAppStore.getState().currentProject).toBeNull()
    })
  })

  describe('setCurrentTask', () => {
    it('sets the current task id', () => {
      useAppStore.getState().setCurrentTask('task-1')
      expect(useAppStore.getState().currentTask).toBe('task-1')
    })
  })

  describe('addNotification', () => {
    it('adds a notification and returns its id', () => {
      const id = useAppStore.getState().addNotification('info', 'Test title', 'Test message')
      expect(typeof id).toBe('string')
      const state = useAppStore.getState()
      expect(state.notifications).toHaveLength(1)
      expect(state.notifications[0]).toMatchObject({
        id,
        type: 'info',
        title: 'Test title',
        message: 'Test message'
      })
    })

    it('adds multiple notifications', () => {
      useAppStore.getState().addNotification('success', 'First')
      useAppStore.getState().addNotification('error', 'Second')
      expect(useAppStore.getState().notifications).toHaveLength(2)
    })
  })

  describe('dismissNotification', () => {
    it('removes a notification by id', () => {
      const id = useAppStore.getState().addNotification('info', 'To dismiss')
      expect(useAppStore.getState().notifications).toHaveLength(1)
      useAppStore.getState().dismissNotification(id)
      expect(useAppStore.getState().notifications).toHaveLength(0)
    })
  })

  describe('clearNotifications', () => {
    it('clears all notifications', () => {
      useAppStore.getState().addNotification('info', 'A')
      useAppStore.getState().addNotification('warning', 'B')
      useAppStore.getState().clearNotifications()
      expect(useAppStore.getState().notifications).toEqual([])
    })
  })

  describe('completeOnboarding', () => {
    it('marks onboarding as completed', () => {
      expect(useAppStore.getState().hasCompletedOnboarding).toBe(false)
      useAppStore.getState().completeOnboarding()
      expect(useAppStore.getState().hasCompletedOnboarding).toBe(true)
      expect(useAppStore.getState().isFirstLaunch).toBe(false)
    })

    it('persists to localStorage', () => {
      useAppStore.getState().completeOnboarding()
      expect(localStorage.getItem('openjuliet:onboarding')).toBe('true')
    })
  })
})
