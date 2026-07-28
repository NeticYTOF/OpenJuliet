import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw, AlertTriangle, Loader2, Wifi } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../lib/utils'

/**
 * Maximum number of retry attempts before offline fallback.
 */
const MAX_RETRIES = 3

/**
 * Base delay for exponential backoff in milliseconds.
 */
const BASE_DELAY = 1000

/**
 * Network retry state.
 */
export type NetworkRetryState = 'idle' | 'retrying' | 'failed' | 'offline'

/**
 * NetworkRetry component props.
 */
export interface NetworkRetryProps {
  /** Children rendered when online / no error */
  children?: ReactNode
  /** Fallback rendered when the operation fails after max retries */
  fallback?: ReactNode | ((retry: () => void, state: NetworkRetryState) => ReactNode)
  /** The async operation to retry (returns data or throws) */
  operation: () => Promise<unknown>
  /** Called on successful operation */
  onSuccess?: (data: unknown) => void
  /** Called after max retries exhausted */
  onMaxRetriesReached?: () => void
  /** Called on each retry attempt */
  onRetry?: (attempt: number, error: unknown) => void
  /** Whether to show inline instead of wrapping children */
  inline?: boolean
  /** Additional className */
  className?: string
  /** Custom error message prefix */
  errorMessage?: string
  /** Automatically trigger on mount */
  autoTrigger?: boolean
}

/**
 * NetworkRetry — Catches IPC / network errors from window.api calls,
 * shows inline error with retry, performs 3 retries with exponential backoff,
 * and falls back to offline mode after max retries.
 *
 * @example
 * <NetworkRetry
 *   operation={() => window.api.github.listRepos()}
 *   onSuccess={(data) => setRepos(data)}
 * >
 *   <RepositoryList repos={repos} />
 * </NetworkRetry>
 */
export function NetworkRetry({
  children,
  fallback,
  operation,
  onSuccess,
  onMaxRetriesReached,
  onRetry,
  inline = false,
  className,
  errorMessage = 'Network request failed',
  autoTrigger = true
}: NetworkRetryProps): JSX.Element {
  const [state, setState] = useState<NetworkRetryState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [offlineSince, setOfflineSince] = useState<number | null>(null)

  const mountedRef = useRef(true)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  const execute = useCallback(async (): Promise<void> => {
    setState('retrying')
    setAttempt((prev) => prev + 1)

    try {
      const data = await operation()
      if (!mountedRef.current) return

      setState('idle')
      setError(null)
      setAttempt(0)
      setOfflineSince(null)
      onSuccess?.(data)
    } catch (err) {
      if (!mountedRef.current) return

      const message =
        err instanceof Error ? err.message : typeof err === 'string' ? err : errorMessage
      setError(message)
      onRetry?.(attempt + 1, err)

      if (attempt + 1 >= MAX_RETRIES) {
        // Max retries reached — go offline
        setState('offline')
        setOfflineSince(Date.now())
        onMaxRetriesReached?.()
      } else {
        // Schedule retry with exponential backoff
        const delay = BASE_DELAY * Math.pow(2, attempt)
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            execute()
          }
        }, delay)
        setState('failed')
      }
    }
  }, [operation, onSuccess, onMaxRetriesReached, onRetry, errorMessage, attempt])

  // Auto-trigger on mount
  useEffect(() => {
    if (autoTrigger) {
      execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRetry = useCallback(() => {
    setAttempt(0)
    setError(null)
    setOfflineSince(null)
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    execute()
  }, [execute])

  // If idle (success), render children
  if (state === 'idle' && !error) {
    return <>{children}</>
  }

  // If custom fallback provided for failed/offline states
  if (fallback && (state === 'failed' || state === 'offline')) {
    const fb =
      typeof fallback === 'function'
        ? fallback(handleRetry, state)
        : fallback
    return <>{fb}</>
  }

  // ── Retrying state ──
  if (state === 'retrying') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('flex items-center gap-2 p-3 rounded-lg', className)}
      >
        <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
        <span className="text-xs text-[var(--color-text-secondary)]">
          Retrying... (attempt {attempt}/{MAX_RETRIES})
        </span>
      </motion.div>
    )
  }

  // ── Offline state ──
  if (state === 'offline') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'flex flex-col items-center justify-center py-8 px-4 text-center',
          className
        )}
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-3"
        >
          <WifiOff size={40} className="text-[var(--color-text-muted)]" />
        </motion.div>
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
          Offline Mode
        </h4>
        <p className="text-xs text-[var(--color-text-secondary)] mb-1">
          Unable to reach the server after {MAX_RETRIES} attempts.
        </p>
        {offlineSince && (
          <p className="text-[10px] text-[var(--color-text-muted)] mb-4">
            Offline since {new Date(offlineSince).toLocaleTimeString()}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={handleRetry}
          >
            Try Again
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Wifi size={14} />}
            onClick={() => {
              setState('idle')
              setError(null)
            }}
          >
            Dismiss
          </Button>
        </div>
      </motion.div>
    )
  }

  // ── Failed (between retries) / error state ──
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg',
        'bg-[rgba(255,71,87,0.08)] border border-[rgba(255,71,87,0.2)]',
        className
      )}
      role="alert"
    >
      <AlertTriangle size={16} className="shrink-0 mt-0.5 text-[var(--color-error)]" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--color-text-primary)]">
          {error}
        </p>
        <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
          Attempt {attempt}/{MAX_RETRIES} — retrying in ~{BASE_DELAY * Math.pow(2, attempt - 1) / 1000}s
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        icon={<RefreshCw size={12} />}
        onClick={handleRetry}
        disabled={false}
        className="shrink-0 text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[rgba(255,71,87,0.15)]"
      >
        Retry
      </Button>
    </motion.div>
  )
}

export default NetworkRetry
