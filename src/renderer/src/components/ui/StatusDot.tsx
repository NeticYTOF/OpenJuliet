import { type HTMLAttributes } from 'react'
import { motion, type TargetAndTransition } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * Status state options.
 */
export type StatusState = 'connected' | 'disconnected' | 'loading' | 'warning' | 'error'

/**
 * StatusDot component props.
 */
export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  /** The connection/status state */
  status?: StatusState
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show label next to dot */
  label?: string
}

const statusColors: Record<StatusState, string> = {
  connected: 'bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]',
  disconnected: 'bg-[var(--color-text-muted)]',
  loading: 'bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent-glow)]',
  warning: 'bg-[var(--color-warning)] shadow-[0_0_8px_var(--color-warning)]',
  error: 'bg-[var(--color-error)] shadow-[0_0_8px_var(--color-error)]'
}

const sizeStyles: Record<string, string> = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3'
}

/**
 * Pulse animation variants per status.
 */
const pulseVariants = {
  connected: {
    scale: [1, 1.4, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  disconnected: {
    scale: 1,
    opacity: 0.4,
    transition: { duration: 0 }
  },
  loading: {
    scale: [1, 1.3, 1],
    opacity: [1, 0.6, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  warning: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  error: {
    scale: 1,
    opacity: 0.8,
    transition: { duration: 0 }
  }
}

/**
 * StatusDot — Animated status indicator dot with pulse animation.
 *
 * Renders a small circular dot that pulses based on the current status:
 * - `connected`: Slow green pulse
 * - `disconnected`: Static muted gray
 * - `loading`: Fast accent-colored pulse
 * - `warning`: Slow amber pulse
 * - `error`: Static red (no pulse)
 *
 * @example
 * ```tsx
 * <StatusDot status="connected" size="md" label="API Connected" />
 * <StatusDot status="loading" />
 * ```
 */
export function StatusDot({
  status = 'disconnected',
  size = 'md',
  label,
  className,
  ...props
}: StatusDotProps): JSX.Element {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    >
      <motion.span
        className={cn(
          'rounded-full shrink-0',
          statusColors[status],
          sizeStyles[size]
        )}
        animate={pulseVariants[status]}
        aria-label={status}
      />
      {label && (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {label}
        </span>
      )}
    </span>
  )
}

export default StatusDot
