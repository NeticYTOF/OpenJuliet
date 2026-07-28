import { useState, useCallback, type ReactNode, type MouseEvent } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * HoverCard variant options.
 */
export type HoverCardVariant = 'elevated' | 'glow' | 'outlined'

/**
 * HoverCard component props.
 */
export interface HoverCardProps {
  /** Visual variant */
  variant?: HoverCardVariant
  /** Card content */
  children: ReactNode
  /** Optional header content */
  header?: ReactNode
  /** Optional footer content */
  footer?: ReactNode
  /** Enable ripple effect on click */
  ripple?: boolean
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Additional class name */
  className?: string
}

/* ──── Padding presets ──── */

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
}

/* ──── Variant styles ──── */

const variantStyles: Record<HoverCardVariant, string> = {
  elevated:
    'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)] rounded-xl overflow-hidden',
  glow:
    'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-glow)] rounded-xl overflow-hidden',
  outlined:
    'bg-transparent border border-[var(--color-border)] rounded-xl overflow-hidden'
}

/* ──── Animation variants ──── */

const cardVariants: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    borderColor: 'rgba(42, 42, 62, 0.5)',
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
  },
  hover: {
    y: -4,
    boxShadow:
      '0 8px 32px rgba(108, 92, 231, 0.15), 0 4px 16px rgba(0, 0, 0, 0.15)',
    borderColor: 'rgba(108, 92, 231, 1)',
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
  }
}

const glowVariants: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 0 12px rgba(108, 92, 231, 0.15)',
    borderColor: 'rgba(108, 92, 231, 0.3)',
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
  },
  hover: {
    y: -4,
    boxShadow:
      '0 0 32px rgba(108, 92, 231, 0.25), 0 8px 24px rgba(0, 0, 0, 0.12)',
    borderColor: 'rgba(108, 92, 231, 1)',
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
  }
}

const outlinedVariants: Variants = {
  rest: {
    y: 0,
    boxShadow: 'none',
    borderColor: 'rgba(42, 42, 62, 0.5)',
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
  },
  hover: {
    y: -2,
    boxShadow: '0 0 20px rgba(108, 92, 231, 0.15)',
    borderColor: 'rgba(108, 92, 231, 1)',
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
  }
}

const variantMap: Record<HoverCardVariant, Variants> = {
  elevated: cardVariants,
  glow: glowVariants,
  outlined: outlinedVariants
}

/* ──── Ripple component ──── */

interface Ripple {
  id: number
  x: number
  y: number
}

function RippleEffect({ ripples }: { ripples: Ripple[] }): JSX.Element {
  return (
    <>
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ width: 0, height: 0, opacity: 0.4, x: r.x, y: r.y }}
          animate={{
            width: 400,
            height: 400,
            opacity: 0,
            x: r.x - 200,
            y: r.y - 200
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute rounded-full bg-[var(--color-accent-subtle)] pointer-events-none"
          style={{ transform: 'translate(-50%, -50%)' }}
        />
      ))}
    </>
  )
}

let rippleIdCounter = 0

/* ──── HoverCard Component ──── */

/**
 * HoverCard — Animated card with elevation/glow effects on hover and
 * optional ripple effect on click.
 *
 * Features:
 * - Three variants: elevated (default), glow, outlined
 * - Smooth border transitions using accent color
 * - Optional click ripple effect
 * - Uses design system CSS variables
 *
 * @example
 * <HoverCard variant="glow" ripple padding="lg">
 *   <p>Hover over me</p>
 * </HoverCard>
 */
export function HoverCard({
  variant = 'elevated',
  children,
  header,
  footer,
  ripple = false,
  padding = 'md',
  className
}: HoverCardProps): JSX.Element {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const variants = variantMap[variant]

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!ripple) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = ++rippleIdCounter

      setRipples((prev) => [...prev, { id, x, y }])

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)
    },
    [ripple]
  )

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden',
        variantStyles[variant],
        'cursor-default',
        className
      )}
      variants={variants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      onClick={handleClick}
    >
      {/* Ripple layer */}
      <AnimatePresence>
        {ripples.length > 0 && <RippleEffect ripples={ripples} />}
      </AnimatePresence>

      {/* Header */}
      {header && (
        <div className="px-4 pt-4 pb-2 border-b border-[var(--color-border)] relative z-[1]">
          {header}
        </div>
      )}

      {/* Body */}
      <div className={cn(paddingStyles[padding], 'relative z-[1]')}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)] bg-opacity-50 relative z-[1]">
          {footer}
        </div>
      )}
    </motion.div>
  )
}

export default HoverCard
