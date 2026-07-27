import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { StatusDot } from './StatusDot'
import { cn } from '../../lib/utils'

/**
 * NetworkStatus component props.
 */
export interface NetworkStatusProps {
  /** Show as a subtle indicator instead of a full banner */
  subtle?: boolean
  /** Optional className override */
  className?: string
  /** Called when connectivity changes */
  onConnectivityChange?: (isOnline: boolean) => void
}

/**
 * NetworkStatus — Monitors browser online/offline connectivity status
 * and displays a status indicator. Shows a banner when offline.
 *
 * Uses navigator.onLine and the online/offline window events.
 *
 * @example
 * ```tsx
 * // Subtle indicator in the titlebar
 * <NetworkStatus subtle />
 *
 * // Full with connectivity callback
 * <NetworkStatus onConnectivityChange={(online) => console.log(online)} />
 * ```
 */
export function NetworkStatus({
  subtle = false,
  className,
  onConnectivityChange
}: NetworkStatusProps): JSX.Element {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)
  const [showReconnectAnimation, setShowReconnectAnimation] = useState(false)

  const handleOnline = useCallback((): void => {
    setIsOnline(true)
    setWasOffline(true)
    setShowReconnectAnimation(true)
    onConnectivityChange?.(true)

    // Brief "reconnected" animation
    setTimeout(() => {
      setShowReconnectAnimation(false)
      setWasOffline(false)
    }, 3000)
  }, [onConnectivityChange])

  const handleOffline = useCallback((): void => {
    setIsOnline(false)
    setWasOffline(true)
    onConnectivityChange?.(false)
  }, [onConnectivityChange])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Subtle indicator mode — just a small dot/icon
  if (subtle) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)} title={isOnline ? 'Online' : 'Offline'}>
        <AnimatePresence mode="wait">
          {isOnline ? (
            <motion.span
              key="online"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <StatusDot
                status={showReconnectAnimation ? 'connected' : 'connected'}
                size="sm"
              />
            </motion.span>
          ) : (
            <motion.span
              key="offline"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <StatusDot status="error" size="sm" />
            </motion.span>
          )}
        </AnimatePresence>
        {showReconnectAnimation && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-[10px] text-[var(--color-success)] font-medium"
          >
            Reconnected
          </motion.span>
        )}
      </span>
    )
  }

  // Full indicator — shows a connection bar
  return (
    <AnimatePresence>
      {!isOnline ? (
        <motion.div
          key="offline-banner"
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'flex items-center gap-2 px-4 py-1.5 bg-[rgba(255,71,87,0.12)] border-b border-[rgba(255,71,87,0.2)]',
            className
          )}
        >
          <WifiOff size={14} className="text-[var(--color-error)] shrink-0" />
          <span className="text-xs text-[var(--color-error)] font-medium">
            You are offline — some features may be unavailable
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="ml-auto text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
          >
            <RefreshCw size={12} />
            Retry
          </motion.button>
        </motion.div>
      ) : showReconnectAnimation && wasOffline ? (
        <motion.div
          key="reconnected-banner"
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'flex items-center gap-2 px-4 py-1.5 bg-[rgba(39,174,96,0.1)] border-b border-[rgba(39,174,96,0.2)]',
            className
          )}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Wifi size={14} className="text-[var(--color-success)] shrink-0" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs text-[var(--color-success)] font-medium"
          >
            Connection restored
          </motion.span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default NetworkStatus
