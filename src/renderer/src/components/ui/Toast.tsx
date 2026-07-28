import * as ToastPrimitive from '@radix-ui/react-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Notification, NotificationType } from '../../types'

/**
 * Toast component props.
 */
export interface ToastProps {
  /** Array of notifications to display */
  notifications: Notification[]
  /** Called when a notification is dismissed */
  onDismiss: (id: string) => void
}

/**
 * Returns the appropriate icon for a notification type.
 */
function getNotificationIcon(type: NotificationType): React.ComponentType<{ className?: string; size?: number }> {
  const icons: Record<NotificationType, React.ComponentType<{ className?: string; size?: number }>> = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info
  }
  return icons[type]
}

const typeStyles: Record<NotificationType, string> = {
  success: 'border-[var(--color-success)]',
  warning: 'border-[var(--color-warning)]',
  error: 'border-[var(--color-error)]',
  info: 'border-[var(--color-info)]'
}

const typeIconColors: Record<NotificationType, string> = {
  success: 'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
  error: 'text-[var(--color-error)]',
  info: 'text-[var(--color-info)]'
}

/**
 * Toast — Radix toast notification system with animated slide-in.
 *
 * @example
 * <Toast notifications={notifications} onDismiss={dismissNotification} />
 */
export function Toast({ notifications, onDismiss }: ToastProps): JSX.Element {
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type)

          return (
            <ToastPrimitive.Root
              key={notification.id}
              open
              onOpenChange={() => onDismiss(notification.id)}
              duration={notification.duration}
              asChild
            >
              <motion.div
                layout
                initial={{ opacity: 0, x: 80, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, y: -10, scale: 0.9 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 22,
                  mass: 0.8
                }}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-lg bg-[var(--color-surface)] border shadow-lg',
                  'border-l-4',
                  typeStyles[notification.type],
                  'w-[360px]'
                )}
              >
                <Icon size={18} className={cn('shrink-0 mt-0.5', typeIconColors[notification.type])} />

                <div className="flex-1 min-w-0">
                  <ToastPrimitive.Title className="text-sm font-medium text-[var(--color-text-primary)]">
                    {notification.title}
                  </ToastPrimitive.Title>
                  {notification.message && (
                    <ToastPrimitive.Description className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {notification.message}
                    </ToastPrimitive.Description>
                  )}
                </div>

                <ToastPrimitive.Close className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                  <X size={14} />
                </ToastPrimitive.Close>
              </motion.div>
            </ToastPrimitive.Root>
          )
        })}
      </AnimatePresence>

      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[360px] max-h-[80vh] outline-none" />
    </ToastPrimitive.Provider>
  )
}

export default Toast