import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, AlertTriangle, Loader2 } from 'lucide-react'
import { Button, type ButtonVariant } from './Button'
import { cn } from '../../lib/utils'

/**
 * RetryButton display variant.
 */
export type RetryButtonVariant = 'inline' | 'card' | 'full-page'

/**
 * RetryButton component props.
 */
export interface RetryButtonProps {
  /** Error message to display */
  error: string
  /** Called when the retry action is triggered */
  onRetry: () => void | Promise<void>
  /** Display variant */
  variant?: RetryButtonVariant
  /** Optional title override */
  title?: string
  /** Optional icon override */
  icon?: ReactNode
  /** Whether a retry is currently in progress */
  loading?: boolean
  /** If > 0, shows a countdown before auto-retrying (seconds) */
  autoRetryCountdown?: number
  /** Custom button label */
  retryLabel?: string
  /** Additional description text */
  description?: string
  /** Additional className */
  className?: string
  /** Called when countdown finishes and auto-retry fires */
  onAutoRetry?: () => void
}

/**
 * Motion variants for shake animation.
 */
const shakeVariants = {
  shake: {
    x: [0, -4, 4, -4, 4, -2, 2, 0],
    transition: { duration: 0.5, ease: 'easeInOut' as const }
  },
  idle: { x: 0 }
}

/**
 * Motion variants for pulse animation.
 */
const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' as const }
  },
  idle: { scale: 1 }
}

/**
 * RetryButton — A reusable retry button with shake-on-error, pulse-on-retry,
 * countdown auto-retry, and three display variants: inline, card, full-page.
 *
 * @example
 * // Inline variant
 * <RetryButton error="Failed to load" onRetry={refetch} />
 *
 * @example
 * // Card variant with auto-retry
 * <RetryButton
 *   variant="card"
 *   error="Connection lost"
 *   description="Check your network and try again"
 *   onRetry={handleRetry}
 *   autoRetryCountdown={10}
 * />
 *
 * @example
 * // Full-page variant
 * <RetryButton
 *   variant="full-page"
 *   error="Something went wrong"
 *   onRetry={reload}
 *   loading={isLoading}
 * />
 */
export function RetryButton({
  error,
  onRetry,
  variant = 'inline',
  title,
  icon,
  loading = false,
  autoRetryCountdown = 0,
  retryLabel = 'Retry',
  description,
  className,
  onAutoRetry
}: RetryButtonProps): JSX.Element {
  const [countdown, setCountdown] = useState(autoRetryCountdown)
  const [hasShaken, setHasShaken] = useState(false)

  // Trigger shake animation on mount / error change
  useEffect(() => {
    if (error) {
      setHasShaken(true)
      const timer = setTimeout(() => setHasShaken(false), 600)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Auto-retry countdown
  useEffect(() => {
    if (!autoRetryCountdown || autoRetryCountdown <= 0) return

    setCountdown(autoRetryCountdown)
    if (loading) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onAutoRetry?.()
          onRetry()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [autoRetryCountdown, loading, onRetry, onAutoRetry])

  const handleRetry = useCallback(() => {
    onRetry()
  }, [onRetry])

  // ── Full-page variant ──
  if (variant === 'full-page') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'flex items-center justify-center min-h-[300px] w-full p-8',
          className
        )}
        role="alert"
      >
        <motion.div
          variants={shakeVariants}
          animate={hasShaken ? 'shake' : 'idle'}
          className="flex flex-col items-center text-center max-w-md"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--color-error)] rounded-full blur-xl opacity-20" />
              <div className="relative w-16 h-16 rounded-full bg-[rgba(255,71,87,0.15)] flex items-center justify-center border-2 border-[rgba(255,71,87,0.3)]">
                {icon ?? <AlertTriangle size={28} className="text-[var(--color-error)]" />}
              </div>
            </div>
          </motion.div>

          {/* Title */}
          {title && (
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              {title}
            </h3>
          )}

          {/* Error message */}
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">
            {error}
          </p>

          {/* Description */}
          {description && (
            <p className="text-xs text-[var(--color-text-muted)] mb-6 max-w-xs">
              {description}
            </p>
          )}

          {/* Retry button */}
          <motion.div
            variants={pulseVariants}
            animate={loading ? 'pulse' : 'idle'}
          >
            <Button
              variant="primary"
              size="md"
              icon={loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              onClick={handleRetry}
              disabled={loading}
            >
              {loading ? 'Retrying...' : countdown > 0 ? `${retryLabel} (${countdown}s)` : retryLabel}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

  // ── Card variant ──
  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'bg-[rgba(30,30,46,0.6)] backdrop-blur-[12px] border border-[rgba(255,71,87,0.25)] rounded-xl p-6 shadow-[var(--shadow-md)]',
          className
        )}
        role="alert"
      >
        <motion.div
          variants={shakeVariants}
          animate={hasShaken ? 'shake' : 'idle'}
          className="flex items-start gap-4"
        >
          {/* Icon */}
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 mt-0.5"
          >
            {icon ?? <AlertTriangle size={20} className="text-[var(--color-error)]" />}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                {title}
              </h4>
            )}
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">{error}</p>
            {description && (
              <p className="text-xs text-[var(--color-text-muted)] mb-4">{description}</p>
            )}

            {/* Retry button */}
            <motion.div variants={pulseVariants} animate={loading ? 'pulse' : 'idle'}>
              <Button
                variant="primary"
                size="sm"
                icon={loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                onClick={handleRetry}
                disabled={loading}
              >
                {loading ? 'Retrying...' : countdown > 0 ? `${retryLabel} (${countdown}s)` : retryLabel}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // ── Inline variant (default) ──
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'bg-[rgba(255,71,87,0.08)] border border-[rgba(255,71,87,0.2)]',
        className
      )}
      role="alert"
    >
      <motion.div
        variants={shakeVariants}
        animate={hasShaken ? 'shake' : 'idle'}
        className="flex items-center gap-3 w-full"
      >
        {/* Icon */}
        <span className="shrink-0 text-[var(--color-error)]">
          {icon ?? <AlertTriangle size={16} />}
        </span>

        {/* Error text */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">{title}</p>
          )}
          <p className="text-xs text-[var(--color-text-secondary)]">{error}</p>
          {description && (
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{description}</p>
          )}
        </div>

        {/* Retry button */}
        <motion.div variants={pulseVariants} animate={loading ? 'pulse' : 'idle'} className="shrink-0">
          <Button
            variant="ghost"
            size="sm"
            icon={loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            onClick={handleRetry}
            disabled={loading}
            className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[rgba(255,71,87,0.15)]"
          >
            {loading ? '...' : countdown > 0 ? `${countdown}s` : retryLabel}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default RetryButton
