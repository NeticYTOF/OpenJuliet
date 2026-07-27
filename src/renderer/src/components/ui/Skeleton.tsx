import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

/**
 * Skeleton component props.
 */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Width (Tailwind class or arbitrary value) */
  width?: string
  /** Height (Tailwind class or arbitrary value) */
  height?: string
  /** Border radius variant */
  rounded?: 'sm' | 'md' | 'lg' | 'full' | 'none'
}

const roundedStyles = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
  none: 'rounded-none'
}

/**
 * Skeleton — Loading skeleton placeholder with shimmer animation.
 *
 * @example
 * <Skeleton className="h-4 w-24" />
 * <Skeleton width="100%" height="80px" rounded="lg" />
 */
export function Skeleton({
  width,
  height,
  rounded = 'md',
  className,
  style,
  ...props
}: SkeletonProps): JSX.Element {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-[var(--color-bg-tertiary)] via-[var(--color-surface)] to-[var(--color-bg-tertiary)]',
        roundedStyles[rounded],
        className
      )}
      style={{
        width: width || '100%',
        height: height || '16px',
        backgroundSize: '200% 100%',
        ...style
      }}
      aria-hidden="true"
      {...props}
    />
  )
}

/**
 * CardSkeleton — Pre-composed skeleton for card loading states.
 */
export function CardSkeleton({ count = 1 }: { count?: number }): JSX.Element {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-[rgba(30,30,46,0.6)] border border-[rgba(42,42,62,0.5)] space-y-3"
        >
          <Skeleton width="60%" height="18px" rounded="md" />
          <Skeleton width="100%" height="12px" rounded="sm" />
          <Skeleton width="80%" height="12px" rounded="sm" />
          <div className="flex gap-2 pt-2">
            <Skeleton width="60px" height="20px" rounded="full" />
            <Skeleton width="40px" height="20px" rounded="full" />
          </div>
        </div>
      ))}
    </>
  )
}

/**
 * TableSkeleton — Pre-composed skeleton for table loading states.
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton width="30px" height="16px" rounded="sm" />
          <Skeleton width="40%" height="16px" rounded="sm" />
          <Skeleton width="20%" height="16px" rounded="sm" className="ml-auto" />
          <Skeleton width="60px" height="20px" rounded="full" />
        </div>
      ))}
    </div>
  )
}

export default Skeleton