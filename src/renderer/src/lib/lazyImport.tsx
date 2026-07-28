import { lazy, Suspense, type ComponentProps, type ComponentType } from 'react'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { LazyLoader } from '../components/ui/LazyLoader'

/**
 * Wraps React.lazy() with an ErrorBoundary so that chunk-load failures are caught
 * gracefully.  The caller is responsible for providing the `<Suspense>` boundary
 * (usually in the parent component) so they can choose the appropriate
 * `LazyLoader` skeleton type per view.
 *
 * @param factory  Dynamic-import function, e.g. `() => import('./MyComponent')`
 * @param name     Display name for debugging (set on the returned wrapper)
 */
export function lazyImport<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  name: string
): T {
  const LazyInner = lazy(factory)

  function LazyWithErrorBoundary(props: ComponentProps<T>): JSX.Element {
    return (
      <ErrorBoundary key={name}>
        <LazyInner {...props} />
      </ErrorBoundary>
    )
  }
  LazyWithErrorBoundary.displayName = `LazyImport(${name})`

  return LazyWithErrorBoundary as unknown as T
}

/**
 * Convenience: returns a `<Suspense>`-wrapped lazy component whose fallback is a
 * `LazyLoader` skeleton.  Use in simple cases where you do not need a
 * view-specific skeleton.
 *
 * @example
 * const MyPanel = withSuspense(() => import('./MyPanel'), 'MyPanel')
 * // → <MyPanel /> is safe to render directly (Suspense + ErrorBoundary included)
 */
export function withSuspense<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  name: string,
  loaderType?: 'list' | 'editor' | 'settings'
): T {
  const LazyInner = lazy(factory)

  function LazyWithBoundaries(props: ComponentProps<T>): JSX.Element {
    return (
      <ErrorBoundary key={name}>
        <Suspense fallback={<LazyLoader type={loaderType ?? 'list'} />}>
          <LazyInner {...props} />
        </Suspense>
      </ErrorBoundary>
    )
  }
  LazyWithBoundaries.displayName = `withSuspense(${name})`

  return LazyWithBoundaries as unknown as T
}
