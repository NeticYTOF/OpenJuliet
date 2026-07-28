import { cn } from '../../lib/utils'
import { Skeleton } from './Skeleton'

/* ──── Types ──── */

export interface LazyLoaderProps {
  /** Which skeleton layout to show while the lazy chunk loads. */
  type?: 'list' | 'editor' | 'settings'
  /** Additional class names for the outer container. */
  className?: string
}

/* ──── Helpers ──── */

/**
 * A shimmer line that mirrors the app's signal-bars pattern.
 * The animated gradient is inherited from the existing `.animate-shimmer` class.
 */
function ShimmerLine({
  width,
  className
}: {
  width: string
  className?: string
}): JSX.Element {
  return (
    <Skeleton
      width={width}
      height="14px"
      rounded="sm"
      className={cn('mb-2', className)}
    />
  )
}

function ShimmerBlock({
  width,
  height = '40px',
  className
}: {
  width: string
  height?: string
  className?: string
}): JSX.Element {
  return (
    <Skeleton
      width={width}
      height={height}
      rounded="md"
      className={cn('mb-3', className)}
    />
  )
}

/* ──── List Skeleton ──── */

/**
 * For GitHubPanel, TaskManager, HistoryView — card lists with icon + text rows.
 */
function ListSkeleton(): JSX.Element {
  return (
    <div className="space-y-3" aria-label="Loading content…">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(30,30,46,0.6)] border border-[rgba(42,42,62,0.5)]"
        >
          {/* Icon placeholder */}
          <Skeleton width="36px" height="36px" rounded="lg" className="shrink-0" />
          {/* Text lines */}
          <div className="flex-1 min-w-0">
            <ShimmerLine width="55%" className="mb-1.5" />
            <ShimmerLine width="80%" className="mb-0" />
          </div>
          {/* Badge / timestamp */}
          <Skeleton width="48px" height="18px" rounded="full" className="shrink-0" />
        </div>
      ))}
    </div>
  )
}

/* ──── Editor Skeleton ──── */

/**
 * For EditorView — code-editor shaped skeleton with tab bar, toolbar, and code lines.
 */
function EditorSkeleton(): JSX.Element {
  return (
    <div
      className="rounded-lg bg-[rgba(30,30,46,0.6)] border border-[rgba(42,42,62,0.5)] overflow-hidden"
      aria-label="Loading editor…"
    >
      {/* Tab bar */}
      <div className="flex items-center h-10 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] px-3 gap-2">
        <Skeleton width="80px" height="20px" rounded="sm" />
        <Skeleton width="60px" height="20px" rounded="sm" />
        <div className="flex-1" />
        <Skeleton width="20px" height="20px" rounded="sm" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center h-8 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] px-4 gap-2">
        <Skeleton width="100px" height="12px" rounded="sm" />
        <div className="flex-1" />
        <Skeleton width="60px" height="12px" rounded="sm" />
      </div>

      {/* Code lines area */}
      <div className="p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            {/* Line number */}
            <Skeleton width="24px" height="12px" rounded="sm" className="opacity-40" />
            {/* Code text */}
            <ShimmerLine width={`${50 + Math.sin(i * 1.5) * 30}%`} className="mb-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──── Settings Skeleton ──── */

/**
 * For SettingsView — form-shaped skeleton with labelled sections and controls.
 */
function SettingsSkeleton(): JSX.Element {
  return (
    <div className="space-y-5" aria-label="Loading settings…">
      {/* Header block */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton width="40px" height="40px" rounded="lg" />
        <div>
          <ShimmerLine width="140px" className="mb-1" />
          <ShimmerLine width="200px" className="mb-0" />
        </div>
      </div>

      {/* Sections */}
      {Array.from({ length: 3 }).map((_, section) => (
        <div
          key={section}
          className="p-5 rounded-xl bg-[rgba(30,30,46,0.6)] border border-[rgba(42,42,62,0.5)]"
        >
          {/* Section title */}
          <ShimmerBlock width="35%" height="18px" className="mb-4" />

          {/* Form fields */}
          {Array.from({ length: 2 + (section % 2) }).map((_, field) => (
            <div
              key={field}
              className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0"
            >
              <div className="flex-1">
                <ShimmerLine width="45%" className="mb-1" />
                <ShimmerLine width="60%" className="mb-0" />
              </div>
              <Skeleton width="80px" height="28px" rounded="md" className="shrink-0 ml-4" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ──── Terminal Placeholder ──── */

/**
 * Placeholder shown while the xterm bundle loads.
 */
export function TerminalPlaceholder(): JSX.Element {
  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-primary)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Skeleton width="14px" height="14px" rounded="sm" />
          <Skeleton width="60px" height="12px" rounded="sm" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton width="14px" height="14px" rounded="sm" />
          <Skeleton width="14px" height="14px" rounded="sm" />
          <Skeleton width="14px" height="14px" rounded="sm" />
        </div>
      </div>
      {/* Output area */}
      <div className="flex-1 p-3 space-y-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <ShimmerLine
            key={i}
            width={`${60 + Math.sin(i * 2) * 30}%`}
            className="mb-0"
          />
        ))}
      </div>
    </div>
  )
}

/* ──── Main LazyLoader ──── */

/**
 * LazyLoader — Standardised Suspense fallback that shows skeletons matching
 * the component's layout.  Choose `type` to match the view being loaded.
 *
 * @example
 * ```tsx
 * <Suspense fallback={<LazyLoader type="list" />}>
 *   <GitHubPanel />
 * </Suspense>
 * ```
 */
export function LazyLoader({
  type = 'list',
  className
}: LazyLoaderProps): JSX.Element {
  return (
    <div
      className={cn('w-full animate-pulse', className)}
      role="status"
      aria-label={`Loading ${type} view…`}
    >
      {type === 'editor' && <EditorSkeleton />}
      {type === 'settings' && <SettingsSkeleton />}
      {type === 'list' && <ListSkeleton />}
    </div>
  )
}

export default LazyLoader
