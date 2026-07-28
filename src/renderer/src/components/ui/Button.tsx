import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Button variant options.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'

/**
 * Button size options.
 */
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * Button component props.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: ButtonVariant
  /** Size preset */
  size?: ButtonSize
  /** Show loading spinner and disable interaction */
  loading?: boolean
  /** Optional icon to display before text */
  icon?: ReactNode
  /** Full-width mode */
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-[0_0_12px_var(--color-accent-glow)] hover:shadow-[0_0_20px_var(--color-accent-glow)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]',
  ghost:
    'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]',
  danger:
    'bg-[var(--color-error)] text-white hover:opacity-90 shadow-[0_0_12px_rgba(255,71,87,0.3)]',
  outline:
    'border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] bg-transparent'
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-md',
  md: 'px-4 py-2 text-sm gap-2 rounded-lg',
  lg: 'px-6 py-2.5 text-base gap-2.5 rounded-lg'
}

/**
 * Button — Versatile action button with variants, sizes, loading state, and icon support.
 *
 * @example
 * <Button variant="primary" size="md" icon={<Play />} onClick={handleStart}>
 *   Start Task
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ): JSX.Element => {
  /* Strip HTML event handlers that conflict with framer-motion's motion props */
  const { onDrag: _od, onDragStart: _ods, onDragEnd: _ode, ...safeProps } = props
  return (
    <motion.button
      ref={ref}
      whileHover={disabled || loading ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.98, y: 0 }}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] hover-lift',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...safeProps}
      >
        {loading ? (
          <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children && <span>{children}</span>}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button