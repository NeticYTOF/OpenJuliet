import { lazy, Suspense } from 'react'
import type { ComponentProps } from 'react'

/**
 * Lazy-loaded Monaco Editor.
 * The @monaco-editor/react package is ~1.3 MB — only loaded when first used.
 */
const MonacoEditor = lazy(() => import('@monaco-editor/react'))

type MonacoEditorProps = ComponentProps<typeof MonacoEditor>

/**
 * Fallback shown while the Monaco chunk loads.
 * Uses the existing react-syntax-highlighter-based UI as a minimal placeholder.
 */
function MonacoFallback(): JSX.Element {
  return (
    <div
      className="flex items-center justify-center h-full bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] animate-pulse"
      role="status"
      aria-label="Loading editor…"
    >
      <div className="text-center">
        <div className="mx-auto mb-3 w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        <p className="text-xs text-[var(--color-text-muted)]">Loading editor…</p>
      </div>
    </div>
  )
}

/**
 * CodeMirror-compatible wrapper around `@monaco-editor/react` that loads
 * the Monaco bundle lazily inside a Suspense boundary.
 *
 * All props are forwarded directly to the `<Editor>` component.
 */
export function LazyMonacoEditor(props: MonacoEditorProps): JSX.Element {
  return (
    <Suspense fallback={<MonacoFallback />}>
      <MonacoEditor {...props} />
    </Suspense>
  )
}

export default LazyMonacoEditor
