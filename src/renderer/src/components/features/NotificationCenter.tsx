import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  GitPullRequest,
  Download,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import { ScrollArea } from '../ui/ScrollArea'
import { cn, formatRelativeTime } from '../../lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationKind = 'execution_complete' | 'pr_created' | 'error' | 'update_available' | 'info'

export type NotificationGroupLabel = 'Today' | 'Yesterday' | 'This Week' | 'Earlier'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  message?: string
  timestamp: number
  read: boolean
  /** Optional action URL / route */
  action?: string
  /** Whether the notification is persistent */
  persistent?: boolean
}

export interface NotificationCenterProps {
  /** List of notifications */
  notifications: AppNotification[]
  /** Maximum number to show before "show more" */
  maxVisible?: number
  /** Called when a notification is marked read */
  onMarkRead: (id: string) => void
  /** Called to mark all as read */
  onMarkAllRead: () => void
  /** Called to clear a notification */
  onClear: (id: string) => void
  /** Called to clear all */
  onClearAll: () => void
  /** Called when a notification action is clicked */
  onNotificationAction?: (notification: AppNotification) => void
  /** Additional class name */
  className?: string
}

// ---------------------------------------------------------------------------
// Notification kind config
// ---------------------------------------------------------------------------

interface NotificationKindConfig {
  icon: typeof Bell
  color: string
  bg: string
}

const NOTIFICATION_KIND_CONFIG: Record<NotificationKind, NotificationKindConfig> = {
  execution_complete: {
    icon: CheckCircle,
    color: 'var(--color-success)',
    bg: 'var(--color-success-bg)',
  },
  pr_created: {
    icon: GitPullRequest,
    color: 'var(--color-accent)',
    bg: 'var(--color-accent-subtle)',
  },
  error: {
    icon: AlertCircle,
    color: 'var(--color-error)',
    bg: 'var(--color-error-bg)',
  },
  update_available: {
    icon: Download,
    color: 'var(--color-info)',
    bg: 'var(--color-info-bg)',
  },
  info: {
    icon: Info,
    color: 'var(--color-text-secondary)',
    bg: 'var(--color-bg-tertiary)',
  },
}

// ---------------------------------------------------------------------------
// Group notifications by time
// ---------------------------------------------------------------------------

function groupNotifications(notifications: AppNotification[]): Map<NotificationGroupLabel, AppNotification[]> {
  const groups = new Map<NotificationGroupLabel, AppNotification[]>()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  const thisWeekStart = today - now.getDay() * 86400000

  const sorted = [...notifications].sort((a, b) => b.timestamp - a.timestamp)

  for (const n of sorted) {
    let label: NotificationGroupLabel
    if (n.timestamp >= today) {
      label = 'Today'
    } else if (n.timestamp >= yesterday) {
      label = 'Yesterday'
    } else if (n.timestamp >= thisWeekStart) {
      label = 'This Week'
    } else {
      label = 'Earlier'
    }

    const group = groups.get(label) ?? []
    group.push(n)
    groups.set(label, group)
  }

  return groups
}

// ---------------------------------------------------------------------------
// NotificationPanel Sub-component
// ---------------------------------------------------------------------------

function NotificationItem({
  notification,
  onMarkRead,
  onClear,
  onAction,
}: {
  notification: AppNotification
  onMarkRead: (id: string) => void
  onClear: (id: string) => void
  onAction?: (n: AppNotification) => void
}): JSX.Element {
  const config = NOTIFICATION_KIND_CONFIG[notification.kind]
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative group flex gap-3 px-4 py-3 transition-colors cursor-pointer border-b border-[var(--color-border)] last:border-b-0',
        notification.read
          ? 'bg-transparent hover:bg-[var(--color-bg-tertiary)]'
          : 'bg-[var(--color-accent-subtle)] bg-opacity-30 hover:bg-[var(--color-accent-subtle)]'
      )}
      onClick={() => {
        if (!notification.read) onMarkRead(notification.id)
        onAction?.(notification)
      }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={16} style={{ color: config.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p
            className={cn(
              'text-sm leading-snug flex-1',
              notification.read
                ? 'text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-primary)] font-semibold'
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0 mt-1.5" />
          )}
        </div>
        {notification.message && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {formatRelativeTime(notification.timestamp)}
          </span>
          {notification.action && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--color-accent)] font-medium">
              View <ChevronRight size={10} />
            </span>
          )}
        </div>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkRead(notification.id)
            }}
            className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] transition-colors"
            title="Mark as read"
          >
            <CheckCheck size={14} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClear(notification.id)
          }}
          className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors"
          title="Remove"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  )
}

function NotificationGroup({
  label,
  notifications,
  onMarkRead,
  onClear,
  onAction,
}: {
  label: NotificationGroupLabel
  notifications: AppNotification[]
  onMarkRead: (id: string) => void
  onClear: (id: string) => void
  onAction?: (n: AppNotification) => void
}): JSX.Element {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-tertiary)]">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {label}
        </span>
        {unreadCount > 0 && (
          <Badge variant="accent" size="sm">
            {unreadCount} unread
          </Badge>
        )}
      </div>
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={onMarkRead}
            onClear={onClear}
            onAction={onAction}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NotificationCenter Main Component
// ---------------------------------------------------------------------------

/**
 * NotificationCenter — Bell icon with badge count and animated dropdown panel.
 *
 * Groups notifications by time (Today, Yesterday, This Week, Earlier),
 * supports mark as read, mark all read, clear all, and individual clear.
 * Includes backdrop overlay and smooth animations.
 */
export function NotificationCenter({
  notifications,
  maxVisible = 5,
  onMarkRead,
  onMarkAllRead,
  onClear,
  onClearAll,
  onNotificationAction,
  className,
}: NotificationCenterProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // ──── Computed values ────
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const grouped = useMemo(() => groupNotifications(notifications), [notifications])

  const visibleNotifications = useMemo(() => {
    if (showAll) return notifications
    // Show at most maxVisible across all groups
    let count = 0
    const result: AppNotification[] = []
    for (const [, group] of grouped) {
      for (const n of group) {
        if (count >= maxVisible) break
        result.push(n)
        count++
      }
      if (count >= maxVisible) break
    }
    return result
  }, [notifications, grouped, showAll, maxVisible])

  const hasMore = notifications.length > maxVisible && !showAll

  // ──── Close on outside click ────
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    // Delay adding listener to avoid the trigger click itself
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // ──── Toggle panel ────
  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev)
    if (isOpen) setShowAll(false)
  }, [isOpen])

  // ──── Handle mark all read ────
  const handleMarkAllRead = useCallback(() => {
    onMarkAllRead()
  }, [onMarkAllRead])

  // ──── Handle clear all ────
  const handleClearAll = useCallback(() => {
    onClearAll()
    setShowAll(false)
  }, [onClearAll])

  return (
    <div className={cn('relative', className)}>
      {/* ──── Bell Button ──── */}
      <button
        ref={buttonRef}
        onClick={togglePanel}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-all duration-200"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-error)] text-white text-[9px] font-bold leading-none shadow-lg"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* ──── Dropdown Panel ──── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 z-50 w-[400px] max-h-[600px] rounded-xl overflow-hidden
                bg-[var(--color-surface)] backdrop-blur-[20px]
                border border-[var(--color-border)] shadow-lg
                flex flex-col"
              style={{
                maxHeight: 'min(600px, calc(100vh - 100px))',
              }}
            >
              {/* ──── Header ──── */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] shrink-0">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-[var(--color-accent)]" />
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <Badge variant="accent" size="sm">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] rounded transition-colors"
                    >
                      <CheckCheck size={12} />
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[var(--color-error)] hover:bg-[var(--color-error-bg)] rounded transition-colors"
                    >
                      <Trash2 size={12} />
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* ──── Notification List ──── */}
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell size={40} className="text-[var(--color-text-muted)] mb-3" />
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    No notifications
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    You&apos;re all caught up!
                  </p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1">
                    <div className="divide-y divide-[var(--color-border)]">
                      {[...grouped.entries()].map(([label, groupNotifications]) => {
                        // If not showing all, only show groups that have visible items
                        const visibleItems = showAll
                          ? groupNotifications
                          : groupNotifications.filter((n) =>
                              visibleNotifications.some((vn) => vn.id === n.id)
                            )
                        if (visibleItems.length === 0) return null

                        return (
                          <NotificationGroup
                            key={label}
                            label={label}
                            notifications={visibleItems}
                            onMarkRead={onMarkRead}
                            onClear={onClear}
                            onAction={onNotificationAction}
                          />
                        )
                      })}
                    </div>
                  </ScrollArea>

                  {/* ──── Footer ──── */}
                  <div className="flex items-center justify-center px-4 py-2 border-t border-[var(--color-border)] shrink-0 bg-[var(--color-bg-tertiary)]">
                    {hasMore ? (
                      <button
                        onClick={() => setShowAll(true)}
                        className="flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:opacity-80 transition-opacity"
                      >
                        Show all {notifications.length} notifications
                        <ChevronRight size={12} />
                      </button>
                    ) : notifications.length > maxVisible ? (
                      <button
                        onClick={() => setShowAll(false)}
                        className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        Show less
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

