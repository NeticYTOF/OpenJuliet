import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

/**
 * GlowText component props.
 */
export interface GlowTextProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Heading level (h1–h4) */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span'
  /** Gradient direction */
  direction?: 'right' | 'left' | 'bottom-right' | 'bottom-left'
  /** Intensity multiplier for the glow effect */
  intensity?: 'subtle' | 'normal' | 'strong'
  /** Children */
  children: ReactNode
}

const directionStyles: Record<string, string> = {
  right: 'bg-gradient-to-r',
  left: 'bg-gradient-to-l',
  'bottom-right': 'bg-gradient-to-br',
  'bottom-left': 'bg-gradient-to-bl'
}

const intensityStyles: Record<string, string> = {
  subtle: 'from-[var(--color-accent)] via-[var(--color-accent-hover)] to-[var(--color-accent)]',
  normal:
    'from-[var(--color-accent)] via-[var(--color-accent-hover)] to-[var(--color-info)]',
  strong:
    'from-[var(--color-accent)] via-[var(--color-accent-hover)] to-[var(--color-success)]'
}

const headingStyles: Record<string, string> = {
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-semibold',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-medium',
  span: 'text-base font-medium'
}

/**
 * GlowText — Gradient glow text component for headings and emphasis.
 *
 * Renders text with a gradient fill and a subtle glow shadow effect.
 * Supports multiple heading levels, gradient directions, and intensity levels.
 *
 * @example
 * ```tsx
 * <GlowText as="h1" direction="right" intensity="normal">
 *   Welcome to OpenJuliet
 * </GlowText>
 * <GlowText as="h2" intensity="subtle">
 *   Section Title
 * </GlowText>
 * ```
 */
export function GlowText({
  as: Tag = 'h2',
  direction = 'right',
  intensity = 'normal',
  className,
  children,
  ...props
}: GlowTextProps): JSX.Element {
  return (
    <Tag
      className={cn(
        'inline-block bg-clip-text text-transparent',
        directionStyles[direction],
        intensityStyles[intensity],
        headingStyles[Tag],
        'drop-shadow-[0_0_12px_var(--color-accent-glow)]',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export default GlowText
