import { useCallback, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAppStore } from '../../stores/appStore'
import Titlebar from './Titlebar'
import Sidebar from './Sidebar'
import MainArea from './MainArea'
import Toast from '../ui/Toast'

/**
 * AppLayout — Root layout component that combines Titlebar, Sidebar, and MainArea.
 * Handles theme initialization, keyboard shortcuts, and resize support.
 */
export default function AppLayout(): JSX.Element {
  const { theme, sidebarOpen } = useAppStore()
  const { sidebarCollapsed, setSidebarCollapsed } = useSettingsStore()
  const { notifications, dismissNotification } = useAppStore()

  /* Sync theme to document */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  /* Sync sidebar collapsed state to settings store */
  useEffect(() => {
    setSidebarCollapsed(!sidebarOpen)
  }, [sidebarOpen, setSidebarCollapsed])

  /* Keyboard shortcuts for navigation */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey

      // Cmd/Ctrl+1-6 — Navigate views
      if (isMeta && e.key >= '1' && e.key <= '6') {
        e.preventDefault()
        const views = ['dashboard', 'repositories', 'issues', 'tasks', 'history', 'editor']
        const index = parseInt(e.key) - 1
        useAppStore.getState().setView(views[index] as never)
      }
    },
    []
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Titlebar */}
      <Titlebar />

      {/* Main Content — Sidebar + MainArea */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainArea />
      </div>

      {/* Global Toast Notifications */}
      <Toast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  )
}