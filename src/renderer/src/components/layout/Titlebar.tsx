import { Minus, Square, X, Sparkles, Bell } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { APP_NAME } from '../../lib/constants'
import { NotificationCenter } from '../features/NotificationCenter'
import ThemeToggle from '../features/ThemeToggle'
import type { AppNotification } from '../features/NotificationCenter'

/**
 * Custom frameless titlebar for the Electron window.
 * Provides a draggable region, app branding, current view name, and window controls.
 */
export default function Titlebar(): JSX.Element {
  const {
    activeView,
    panelNotifications,
    markPanelNotificationRead,
    markAllPanelNotificationsRead,
    clearPanelNotification,
    clearAllPanelNotifications,
    addPanelNotification
  } = useAppStore()

  // Map panel notifications to the AppNotification type expected by NotificationCenter
  const notificationItems: AppNotification[] = panelNotifications

  // Map store actions to NotificationCenter's expected callbacks
  const handleMarkAllRead = () => markAllPanelNotificationsRead()
  const handleClearAll = () => clearAllPanelNotifications()
  const handleAction = (notification: AppNotification) => {
    if (notification.action) {
      useAppStore.getState().setView(notification.action as never)
    }
  }

  // Map view IDs to display names
  const viewNames: Record<string, string> = {
    dashboard: 'Dashboard',
    repositories: 'Repositories',
    issues: 'Issues',
    tasks: 'Tasks',
    history: 'History',
    settings: 'Settings'
  }

  const handleMinimize = (): void => window.api?.minimize()
  const handleMaximize = (): void => window.api?.maximize()
  const handleClose = (): void => window.api?.close()

  return (
    <header
      className="drag-region flex items-center justify-between h-[var(--titlebar-height)] px-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] select-none"
      style={{ ['WebkitAppRegion' as string]: 'drag' as unknown as string }}
    >
      {/* Left — App Branding */}
      <div className="flex items-center gap-2 no-drag min-w-0" style={{ ['WebkitAppRegion' as string]: 'no-drag' as unknown as string }}>
        <Sparkles size={16} className="text-[var(--color-accent)] shrink-0" />
        <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
          {APP_NAME}
        </span>
      </div>

      {/* Center — Current View */}
      <div className="absolute left-1/2 -translate-x-1/2 no-drag" style={{ ['WebkitAppRegion' as string]: 'no-drag' as unknown as string }}>
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          {viewNames[activeView] || 'Dashboard'}
        </span>
      </div>

      {/* Right — Notifications, Theme, Window Controls */}
      <div className="flex items-center no-drag gap-1" style={{ ['WebkitAppRegion' as string]: 'no-drag' as unknown as string }}>
        {/* Notification Center */}
        <NotificationCenter
          notifications={notificationItems}
          onMarkRead={markPanelNotificationRead}
          onMarkAllRead={handleMarkAllRead}
          onClear={clearPanelNotification}
          onClearAll={handleClearAll}
          onNotificationAction={handleAction}
        />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Window Controls */}
        <div className="flex items-center ml-1">
        <button
          onClick={handleMinimize}
          className="flex items-center justify-center w-10 h-7 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors rounded"
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="flex items-center justify-center w-10 h-7 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors rounded"
          aria-label="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-10 h-7 text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-error)] transition-colors rounded ml-1"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
      </div>
    </header>
  )
}