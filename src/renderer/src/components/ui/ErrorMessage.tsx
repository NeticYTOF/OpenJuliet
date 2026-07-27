import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../lib/utils'

/**
 * ErrorMessage display variants.
 */
export type ErrorMessageVariant = 'inline' | 'card' | 'banner'

/**
 * ErrorMessage component props.
 */
export interface ErrorMessageProps {
  /** Error title (shown prominently) */
  title: string
  /** Optional detailed description */
  description?: string
  /** Display variant */
  variant?: ErrorMessageVariant
  /** Optional action button label */
  actionLabel?: string
  /** Optional action button callback */
  onAction?: () => void
  /** Whether the error can be dismissed */
  dismissible?: boolean
  /** Called when the error is dismissed */
  onDismiss?: () => void
  /** Optional icon override (defaults to AlertTriangle) */
  icon?: ReactNode
  /** Optional className override */
  className?: string
  /** Optional children for additional content */
  children?: ReactNode
}

const variantStyles: Record<ErrorMessageVariant, string> = {
  inline:
    'bg-[rgba(255,71,87,0.08)] border border-[rgba(255,71,87,0.2)] rounded-lg p-3',
  card:
    'bg-[rgba(30,30,46,0.6)] backdrop-blur-[12px] border border-[rgba(255,71,87,0.25)] rounded-xl p-5 shadow-[var(--shadow-md)]',
  banner:
    'bg-[rgba(255,71,87,0.12)] border-b border-[rgba(255,71,87,0.25)] px-6 py-3 w-full'
}

const variantLayout: Record<ErrorMessageVariant, string> = {
  inline: 'flex items-start gap-3',
  card: 'flex items-start gap-4',
  banner: 'flex items-center gap-3'
}

/**
 * ErrorMessage — Inline, card, or banner error display component.
 *
 * @example
 * ```tsx
 * // Inline variant
 * <ErrorMessage title="Failed to load" description="Could not fetch data." />
 *
 * // Card variant with action
 * <ErrorMessage
 *   variant="card"
 *   title="Connection Lost"
 *   description="Check your network"
 *   actionLabel="Retry"
 *   onAction={handleRetry}
 *   dismissible
 * />
 *
 * // Banner variant
 * <ErrorMessage variant="banner" title="Read-only mode" />
 * ```
 */
export function ErrorMessage({
  title,
  description,
  variant = 'inline',
  actionLabel,
  onAction,
  dismissible = false,
  onDismiss,
  icon,
  className,
  children
}: ErrorMessageProps): JSX.Element | null {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = (): void => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={
            variant === 'banner'
              ? { opacity: 0, height: 0, y: -20 }
              : { opacity: 0, y: -10, scale: 0.95 }
          }
          animate={
            variant === 'banner'
              ? { opacity: 1, height: 'auto', y: 0 }
              : { opacity: 1, y: 0, scale: 1 }
          }
          exit={
            variant === 'banner'
              ? { opacity: 0, height: 0, y: -20 }
              : { opacity: 0, y: -10, scale: 0.95 }
          }
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={cn(variantStyles[variant], className)}
          role="alert"
        >
          <div className={cn(variantLayout[variant], 'w-full')}>
            {/* Icon */}
            <motion.span
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'shrink-0',
                variant === 'banner' ? 'text-[var(--color-error)]' : 'mt-0.5 text-[var(--color-error)]'
              )}
            >
              {icon ?? <AlertTriangle size={variant === 'inline' ? 16 : variant === 'card' ? 20 : 18} />}
            </motion.span>

            {/* Content */}
            <div className={cn('flex-1 min-w-0', variant === 'banner' && 'flex items-center gap-3')}>
              <div className={variant === 'banner' ? 'flex items-center gap-2' : ''}>
                <p
                  className={cn(
                    'font-medium text-[var(--color-text-primary)]',
                    variant === 'inline' && 'text-xs',
                    variant === 'card' && 'text-sm',
                    variant === 'banner' && 'text-sm'
                  )}
                >
                  {title}
                </p>
                {variant === 'banner' && description && (
                  <span className="text-xs text-[var(--color-text-secondary)] hidden sm:inline">
                    — {description}
                  </span>
                )}
              </div>

              {variant !== 'banner' && description && (
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {description}
                </p>
              )}

              {/* Extra children (e.g. stack trace details) */}
              {children && <div className="mt-2">{children}</div>}
            </div>

            {/* Action + Dismiss buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {actionLabel && onAction && (
                <Button
                  variant="ghost"
                  size={variant === 'inline' ? 'sm' : 'sm'}
                  onClick={onAction}
                  className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[rgba(255,71,87,0.15)]"
                >
                  {actionLabel}
                </Button>
              )}

              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className={cn(
                    'shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors rounded p-0.5',
                    'focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]'
                  )}
                  aria-label="Dismiss error"
                >
                  <X size={variant === 'inline' ? 14 : 16} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ErrorMessage
