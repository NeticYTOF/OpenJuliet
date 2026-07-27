import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

/**
 * Divider variant options.
 */
export type DividerVariant = 'default' | 'gradient' | 'subtle'

/**
 * Divider component props.
 */
export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: DividerVariant
  /** Optional label displayed in the center */
  label?: ReactNode
  /** Optional orientation */
  orientation?: 'horizontal' | 'vertical'
}

const variantStyles: Record<DividerVariant, string> = {
  default: 'border-t border-[var(--color-border)]',
  gradient:
    'border-t-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent',
  subtle: 'border-t border-[var(--color-border)] opacity-40'
}

/**
 * Divider — Styled horizontal divider with optional label and gradient accent color.
 *
 * Supports three variants:
 * - `default`: Standard border line matching the design system
 * - `gradient`: Gradient line going from transparent → accent → transparent
 * - `subtle`: Faded border line for subtle separation
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider variant="gradient" />
 * <Divider variant="default" label="or continue with" />
 * ```
 */
export function Divider({
  variant = 'default',
  label,
  orientation = 'horizontal',
  className,
  ...props
}: DividerProps): JSX.Element {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn(
          'h-full w-px self-stretch',
          variant === 'gradient'
            ? 'bg-gradient-to-b from-transparent via-[var(--color-accent)] to-transparent'
            : variant === 'subtle'
              ? 'border-l border-[var(--color-border)] opacity-40'
              : 'border-l border-[var(--color-border)]',
          className
        )}
        {...props}
        role="separator"
        aria-orientation="vertical"
      />
    )
  }

  if (label) {
    return (
      <div
        className={cn('flex items-center gap-3', className)}
        role="separator"
        aria-orientation="horizontal"
        {...props}
      >
        <span
          className={cn(
            'flex-1',
            variant === 'gradient'
              ? 'h-px bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent'
              : variant === 'subtle'
                ? 'border-t border-[var(--color-border)] opacity-40'
                : 'border-t border-[var(--color-border)]'
          )}
        />
        {label && (
          <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap shrink-0">
            {label}
          </span>
        )}
        <span
          className={cn(
            'flex-1',
            variant === 'gradient'
              ? 'h-px bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent'
              : variant === 'subtle'
                ? 'border-t border-[var(--color-border)] opacity-40'
                : 'border-t border-[var(--color-border)]'
          )}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(variantStyles[variant], className)}
      role="separator"
      aria-orientation="horizontal"
      {...props}
    />
  )
}

export default Divider
