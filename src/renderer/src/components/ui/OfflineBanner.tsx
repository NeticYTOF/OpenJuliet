import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw, Wifi } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * OfflineBanner component props.
 */
export interface OfflineBannerProps {
  /** Optional className override */
  className?: string
  /** Called when the retry button is clicked */
  onRetry?: () => void
  /** Called when the user comes back online */
  onOnline?: () => void
  /** Called when the user goes offline */
  onOffline?: () => void
}

/**
 * OfflineBanner — A slide-down banner that appears when the app goes offline.
 * Features a beautiful slide animation, icon, message, and retry button.
 * Automatically disappears when connectivity is restored with a reconnection animation.
 *
 * Uses navigator.onLine and the online/offline window events.
 *
 * @example
 * ```tsx
 * <OfflineBanner />
 * // With callbacks
 * <OfflineBanner onRetry={handleRetry} onOnline={handleOnline} />
 * ```
 */
export function OfflineBanner({
  className,
  onRetry,
  onOnline,
  onOffline
}: OfflineBannerProps): JSX.Element {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)

  const handleOnline = useCallback((): void => {
    setIsOnline(true)
    setShowReconnected(true)
    onOnline?.()
    setTimeout(() => setShowReconnected(false), 3000)
  }, [onOnline])

  const handleOffline = useCallback((): void => {
    setIsOnline(false)
    setShowReconnected(false)
    onOffline?.()
  }, [onOffline])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])
  }, [handleOnline, handleOffline])

  const handleRetry = useCallback((): void => {
    onRetry?.()
    // Simple retry: re-check connectivity
    if (navigator.onLine) {
      handleOnline()
    }
  }, [onRetry, handleOnline])

  return (
    <div className={cn('relative z-40', className)}>
      <AnimatePresence>
        {/* Offline Banner */}
        {!isOnline && (
          <motion.div
            key="offline"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              mass: 0.8
            }}
            className="flex items-center gap-3 px-5 py-3 bg-[rgba(255,71,87,0.12)] border-b border-[rgba(255,71,87,0.25)] backdrop-blur-sm"
          >
            {/* Icon container */}
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
              className="shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-[rgba(255,71,87,0.15)] flex items-center justify-center">
                <WifiOff size={16} className="text-[var(--color-error)]" />
              </div>
            </motion.div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                You are offline
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Some features may be unavailable until connection is restored.
              </p>
            </div>

            {/* Retry button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRetry}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-[var(--color-surface)] border border-[var(--color-border)]
                text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]
                transition-colors duration-200"
            >
              <RefreshCw size={13} />
              Retry
            </motion.button>
          </motion.div>
        )}

        {/* Reconnected Banner (briefly shown after coming back online) */}
        {isOnline && showReconnected && (
          <motion.div
            key="reconnected"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              mass: 0.8
            }}
            className="flex items-center gap-3 px-5 py-3 bg-[rgba(39,174,96,0.08)] border-b border-[rgba(39,174,96,0.2)] backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 rounded-full bg-[rgba(39,174,96,0.15)] flex items-center justify-center shrink-0"
            >
              <Wifi size={16} className="text-[var(--color-success)]" />
            </motion.div>

            <div className="flex-1 min-w-0">
              <motion.p
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm font-medium text-[var(--color-success)]"
              >
                Connection restored
              </motion.p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                You are back online. All features are available.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OfflineBanner
