import { type HTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * Card variant options.
 */
export type CardVariant = 'default' | 'interactive' | 'elevated'

/**
 * Card component props.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: CardVariant
  /** Optional padding override */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Optional header content */
  header?: ReactNode
  /** Optional footer content */
  footer?: ReactNode
}

const variantStyles: Record<CardVariant, string> = {
  default:
    'bg-[rgba(30,30,46,0.6)] backdrop-blur-[12px] border border-[rgba(42,42,62,0.5)] shadow-[var(--shadow-md)]',
  interactive:
    'bg-[rgba(30,30,46,0.6)] backdrop-blur-[12px] border border-[rgba(42,42,62,0.5)] shadow-[var(--shadow-md)] cursor-pointer hover:border-[rgba(108,92,231,0.3)] hover:shadow-[var(--shadow-glow)] transition-all duration-300',
  elevated:
    'bg-[rgba(30,30,46,0.8)] backdrop-blur-[20px] border border-[rgba(42,42,62,0.6)] shadow-[var(--shadow-lg)]'
}

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
}

/**
 * Card — Glassmorphic card component with multiple variants.
 * Features backdrop blur, semi-transparent backgrounds, and subtle border styling.
 *
 * @example
 * <Card variant="interactive" header={<h3>Stats</h3>}>
 *   <p>Content here</p>
 * </Card>
 */
export function Card({
  variant = 'default',
  padding = 'md',
  header,
  footer,
  className,
  children,
  ...props
}: CardProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-xl overflow-hidden',
        variantStyles[variant],
        className
      )}
      whileHover={variant === 'interactive' ? { y: -2 } : undefined}
      {...props}
    >
      {header && (
        <div className="px-4 pt-4 pb-2 border-b border-[var(--color-border)]">
          {header}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)] bg-opacity-50">
          {footer}
        </div>
      )}
    </motion.div>
  )
}

export default Card