import { type ReactNode, type HTMLAttributes } from 'react'
import { motion, type Variants } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * Standard animation variants for consistent page/component animations.
 */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
}

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
}

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
}

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }
}

export const staggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
  }
}

/**
 * Animation type presets.
 */
export type AnimationVariant = 'fadeIn' | 'slideUp' | 'slideDown' | 'scaleIn' | 'stagger' | 'none'

const variantMap: Record<AnimationVariant, Variants> = {
  fadeIn: fadeInVariants,
  slideUp: slideUpVariants,
  slideDown: slideDownVariants,
  scaleIn: scaleInVariants,
  stagger: staggerVariants,
  none: { hidden: {}, visible: {} }
}

/**
 * AnimatedContainer component props.
 */
export interface AnimatedContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Animation preset */
  animation?: AnimationVariant
  /** Custom variants (overrides preset) */
  customVariants?: Variants
  /** Animation delay in seconds */
  delay?: number
  /** Children */
  children: ReactNode
}

/**
 * AnimatedContainer — Framer-motion animated div wrapper for consistent animations.
 * Provides reusable animation variants (fadeIn, slideUp, slideDown, scaleIn, stagger).
 *
 * @example
 * <AnimatedContainer animation="slideUp" delay={0.1}>
 *   <Card>Content</Card>
 * </AnimatedContainer>
 */
export function AnimatedContainer({
  animation = 'fadeIn',
  customVariants,
  delay = 0,
  className,
  children,
  ...props
}: AnimatedContainerProps): JSX.Element {
  const variants = customVariants || variantMap[animation]
  const isStagger = animation === 'stagger'

  /* Strip HTML event handlers that conflict with framer-motion's motion props */
  const { onDrag: _od, onDragStart: _ods, onDragEnd: _ode, ...safeProps } = props

  if (animation === 'none') {
    return <div className={className}>{children}</div>
  }

  if (isStagger) {
    return (
      <motion.div
        className={cn(className)}
        variants={staggerVariants}
        initial="hidden"
        animate="visible"
        {...safeProps}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      {...safeProps}
    >
      {children}
    </motion.div>
  )
}

/**
 * AnimatedItem — For use inside stagger containers.
 */
export function AnimatedItem({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
  /* Strip HTML event handlers that conflict with framer-motion's motion props */
  const { onDrag: _od, onDragStart: _ods, onDragEnd: _ode, ...safeProps } = props

  return (
    <motion.div className={cn(className)} variants={itemVariants} {...safeProps}>
      {children}
    </motion.div>
  )
}

