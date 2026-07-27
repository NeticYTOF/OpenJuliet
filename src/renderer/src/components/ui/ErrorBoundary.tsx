import { Component, type ErrorInfo, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronRight, Bug } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../lib/utils'

/**
 * ErrorBoundary props.
 */
export interface ErrorBoundaryProps {
  /** Content to render under normal conditions */
  children: ReactNode
  /** Optional fallback UI override */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /** Called when an error is caught (for logging) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Optional className for the wrapper */
  className?: string
}

/**
 * ErrorBoundary state.
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary — React class-based error boundary that catches rendering errors
 * and displays a beautiful error page with error details, stack trace, reload,
 * and home navigation.
 *
 * @example
 * ```tsx
 * <ErrorBoundary onError={(err) => console.error(err)}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  /** Reset the error boundary back to normal rendering */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  /** Reload the entire app window */
  handleReload = (): void => {
    window.location.reload()
  }

  /** Navigate to the app home (dashboard) by dispatching a custom event */
  handleGoHome = (): void => {
    this.handleReset()
    try {
      window.dispatchEvent(new CustomEvent('navigate-home'))
    } catch {
      window.location.hash = '#/dashboard'
    }
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback, className } = this.props

    if (!hasError) {
      return <>{children}</>
    }

    // If a custom fallback is provided, use it
    if (fallback) {
      if (typeof fallback === 'function') {
        return <>{fallback(error!, this.handleReset)}</>
      }
      return <>{fallback}</>
    }

    // Default beautiful error page
    return (
      <DefaultErrorPage
        error={error!}
        errorInfo={errorInfo}
        onReset={this.handleReset}
        onReload={this.handleReload}
        onGoHome={this.handleGoHome}
        className={className}
      />
    )
  }
}

/* ──── Default Error Page ──── */

interface DefaultErrorPageProps {
  error: Error
  errorInfo: ErrorInfo | null
  onReset: () => void
  onReload: () => void
  onGoHome: () => void
  className?: string
}

function DefaultErrorPage({
  error,
  errorInfo,
  onReset,
  onReload,
  onGoHome,
  className
}: DefaultErrorPageProps): JSX.Element {
  const stackTrace = error.stack ?? error.message
  const componentStack = errorInfo?.componentStack ?? ''

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex items-center justify-center min-h-screen w-full p-6',
        'bg-[var(--color-bg-primary)]',
        className
      )}
      role="alert"
    >
      <div className="w-full max-w-lg">
        {/* Main Error Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[rgba(30,30,46,0.6)] backdrop-blur-[12px] border border-[rgba(42,42,62,0.5)] rounded-2xl p-8 shadow-[var(--shadow-lg)]"
        >
          {/* Icon Header */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--color-error)] rounded-full blur-xl opacity-20" />
              <div className="relative w-16 h-16 rounded-full bg-[rgba(255,71,87,0.15)] flex items-center justify-center border-2 border-[rgba(255,71,87,0.3)]">
                <AlertTriangle size={32} className="text-[var(--color-error)]" />
              </div>
            </div>
          </motion.div>

          {/* Error Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="text-xl font-semibold text-[var(--color-text-primary)] text-center mb-2"
          >
            Something went wrong
          </motion.h2>

          {/* Error Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="text-sm text-[var(--color-text-secondary)] text-center mb-6"
          >
            An unexpected error occurred. You can try reloading the page or resetting the view.
          </motion.p>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="mb-4 p-3 rounded-lg bg-[rgba(255,71,87,0.1)] border border-[rgba(255,71,87,0.2)]"
          >
            <p className="text-xs font-mono text-[var(--color-error)] break-words leading-relaxed">
              {error.name && (
                <span className="font-semibold">{error.name}: </span>
              )}
              {error.message}
            </p>
          </motion.div>

          {/* Stack Trace (collapsible) */}
          <StackTraceSection stackTrace={stackTrace} componentStack={componentStack} />

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 mt-6"
          >
            <Button
              variant="primary"
              icon={<RefreshCw size={16} />}
              onClick={onReload}
              className="flex-1"
            >
              Reload App
            </Button>
            <Button
              variant="secondary"
              icon={<Home size={16} />}
              onClick={onGoHome}
              className="flex-1"
            >
              Go Home
            </Button>
            <Button
              variant="ghost"
              icon={<Bug size={16} />}
              onClick={onReset}
              className="flex-1"
            >
              Dismiss
            </Button>
          </motion.div>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="text-center mt-4 text-xs text-[var(--color-text-muted)]"
        >
          If this persists, please check your connection or restart the application.
        </motion.p>
      </div>
    </motion.div>
  )
}

/* ──── Collapsible Stack Trace ──── */

function StackTraceSection({
  stackTrace,
  componentStack
}: {
  stackTrace: string
  componentStack: string
}): JSX.Element {
  const hasComponentStack = componentStack.length > 0

  return (
    <div className="space-y-2">
      {/* Error Stack Trace */}
      <StackCollapsible label="Error stack trace" content={stackTrace} />

      {/* Component Stack Trace */}
      <AnimatePresence>
        {hasComponentStack && (
          <StackCollapsible label="Component stack trace" content={componentStack} />
        )}
      </AnimatePresence>
    </div>
  )
}

function StackCollapsible({
  label,
  content
}: {
  label: string
  content: string
}): JSX.Element {
  const lines = content.split('\n')
  const isLong = lines.length > 3

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="overflow-hidden"
    >
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors py-1 select-none">
          <motion.span
            className="shrink-0"
            animate={{ rotate: undefined }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={12} className="group-open:hidden" />
            <ChevronDown size={12} className="hidden group-open:block" />
          </motion.span>
          <span className="font-medium">{label}</span>
          {isLong && (
            <span className="text-[10px] text-[var(--color-text-muted)]">
              ({lines.length} lines)
            </span>
          )}
        </summary>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mt-1 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] overflow-auto max-h-48"
        >
          <pre className="text-[11px] font-mono text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap break-all">
            {content}
          </pre>
        </motion.div>
      </details>
    </motion.div>
  )
}

export default ErrorBoundary
