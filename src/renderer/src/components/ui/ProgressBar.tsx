import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * ProgressBar component props.
 */
export interface ProgressBarProps {
  /** Progress value (0–100) */
  value: number
  /** Show label text */
  showLabel?: boolean
  /** Custom label format */
  labelFormatter?: (value: number) => string
  /** Size preset */
  size?: 'sm' | 'md' | 'lg'
  /** Color variant */
  variant?: 'accent' | 'success' | 'warning' | 'error'
  /** Additional className */
  className?: string
  /** Show indeterminate animation */
  indeterminate?: boolean
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
}

const variantStyles = {
  accent: 'bg-[var(--color-accent)]',
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]',
  error: 'bg-[var(--color-error)]'
}

/**
 * ProgressBar — Animated progress bar with label and multiple variants.
 *
 * @example
 * <ProgressBar value={65} showLabel variant="success" />
 */
export function ProgressBar({
  value,
  showLabel = false,
  labelFormatter = (v) => `${Math.round(v)}%`,
  size = 'md',
  variant = 'accent',
  className,
  indeterminate = false
}: ProgressBarProps): JSX.Element {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex-1 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden',
          sizeStyles[size]
        )}
      >
        {indeterminate ? (
          <motion.div
            className={cn('h-full rounded-full', variantStyles[variant])}
            animate={{ x: ['-100%', '200%'] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{ width: '50%' }}
          />
        ) : (
          <motion.div
            className={cn('h-full rounded-full', variantStyles[variant])}
            initial={{ width: 0 }}
            animate={{ width: `${clampedValue}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap tabular-nums">
          {labelFormatter(clampedValue)}
        </span>
      )}
    </div>
  )
}

export default ProgressBar