import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * Loading spinner size options.
 */
export type SpinnerSize = 'sm' | 'md' | 'lg'

/**
 * LoadingSpinner component props.
 */
export interface LoadingSpinnerProps {
  /** Spinner size */
  size?: SpinnerSize
  /** Optional label displayed below the spinner */
  label?: string
  /** Full-page variant with backdrop overlay */
  fullPage?: boolean
  /** Accent color override (CSS color value) */
  accentColor?: string
  /** Optional className override */
  className?: string
}

const sizeConfig: Record<
  SpinnerSize,
  { dimension: number; strokeWidth: number; fontSize: string }
> = {
  sm: { dimension: 20, strokeWidth: 2.5, fontSize: 'text-[10px]' },
  md: { dimension: 36, strokeWidth: 3, fontSize: 'text-xs' },
  lg: { dimension: 56, strokeWidth: 3.5, fontSize: 'text-sm' }
}

const labelGap: Record<SpinnerSize, string> = {
  sm: 'mt-1.5',
  md: 'mt-2',
  lg: 'mt-3'
}

/**
 * Animated SVG Loading Spinner with configurable size, label, full-page mode,
 * and accent color. Uses a pure SVG circle animation — not a CSS border hack.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingSpinner size="md" label="Loading..." />
 *
 * // Full-page overlay
 * <LoadingSpinner fullPage label="Starting application..." />
 *
 * // Custom accent color
 * <LoadingSpinner accentColor="var(--color-success)" />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  label,
  fullPage = false,
  accentColor,
  className
}: LoadingSpinnerProps): JSX.Element {
  const config = sizeConfig[size]
  const color = accentColor ?? 'var(--color-accent)'
  const circleRadius = config.dimension / 2 - config.strokeWidth
  const circumference = 2 * Math.PI * circleRadius

  const spinnerContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col items-center justify-center',
        fullPage ? 'relative z-10' : '',
        className
      )}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      {/* Animated SVG Spinner */}
      <div className="relative" style={{ width: config.dimension, height: config.dimension }}>
        {/* Track circle */}
        <svg
          width={config.dimension}
          height={config.dimension}
          viewBox={`0 0 ${config.dimension} ${config.dimension}`}
          className="absolute inset-0"
        >
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={circleRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-[var(--color-bg-tertiary)]"
            opacity={0.3}
          />
        </svg>

        {/* Animated arc */}
        <svg
          width={config.dimension}
          height={config.dimension}
          viewBox={`0 0 ${config.dimension} ${config.dimension}`}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <motion.circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={circleRadius}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{
              strokeDashoffset: [circumference, circumference * 0.25, circumference],
              rotate: [0, 360]
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1]
            }}
          />
        </svg>
      </div>

      {/* Label */}
      {label && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className={cn(
            'text-[var(--color-text-secondary)] font-medium',
            config.fontSize,
            labelGap[size]
          )}
        >
          {label}
        </motion.p>
      )}
    </motion.div>
  )

  // Full-page variant with backdrop
  if (fullPage) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,18,30,0.7)] backdrop-blur-sm"
      >
        {spinnerContent}
      </motion.div>
    )
  }

  return spinnerContent
}

export default LoadingSpinner
