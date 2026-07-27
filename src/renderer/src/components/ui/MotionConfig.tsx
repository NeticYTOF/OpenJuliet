import { type ReactNode, useState, useEffect } from 'react'
import { MotionConfig as FramerMotionConfig } from 'framer-motion'

/**
 * MotionConfig — Global motion configuration provider.
 *
 * Wraps framer-motion's MotionConfig with:
 * - Automatic reduced-motion detection via `prefers-reduced-motion` media query
 * - Consistent transition defaults matching the design system
 * - Accessible animation opt-out for vestibular disorders
 *
 * @example
 * ```tsx
 * <MotionConfig>
 *   <App />
 * </MotionConfig>
 * ```
 */
export function MotionConfig({ children }: { children: ReactNode }): JSX.Element {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)

    const handler = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <FramerMotionConfig
      reducedMotion={prefersReducedMotion ? 'always' : 'user'}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] // --ease-out from design system
      }}
    >
      {children}
    </FramerMotionConfig>
  )
}

export default MotionConfig
