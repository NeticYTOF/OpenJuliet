import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

/**
 * Badge variant options.
 */
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'accent'

/**
 * Badge size options.
 */
export type BadgeSize = 'sm' | 'md'

/**
 * Badge component props.
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color variant */
  variant?: BadgeVariant
  /** Size preset */
  size?: BadgeSize
  /** Show dot indicator */
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  success:
    'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[rgba(0,214,143,0.2)]',
  warning:
    'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[rgba(255,166,64,0.2)]',
  error:
    'bg-[var(--color-error-bg)] text-[var(--color-error)] border-[rgba(255,71,87,0.2)]',
  info:
    'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[rgba(69,170,242,0.2)]',
  default:
    'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
  accent:
    'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[rgba(108,92,231,0.2)]'
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs'
}

const dotStyles: Record<BadgeVariant, string> = {
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]',
  error: 'bg-[var(--color-error)]',
  info: 'bg-[var(--color-info)]',
  default: 'bg-[var(--color-text-muted)]',
  accent: 'bg-[var(--color-accent)]'
}

/**
 * Badge — Status badge component for labels, tags, and status indicators.
 *
 * @example
 * <Badge variant="success" dot>Connected</Badge>
 * <Badge variant="accent">v1.0.0</Badge>
 */
export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotStyles[variant]
          )}
        />
      )}
      {children}
    </span>
  )
}

export default Badge