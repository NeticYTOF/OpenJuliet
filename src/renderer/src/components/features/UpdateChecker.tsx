/**
 * OpenJuliet — UpdateChecker Component
 *
 * Auto-update status component that displays the current app version,
 * checks for updates, shows download progress, and prompts installation.
 * Integrates with the main process auto-updater via IPC events.
 *
 * Communication flow:
 *   Main process ──→ IPC events → Renderer (this component)
 *   Renderer   ──→ IPC invoke → Main process (download / install)
 *
 * @module components/features/UpdateChecker
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpCircle, Download, RotateCcw, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Progress payload from the main-process auto-updater. */
interface DownloadProgress {
  percent: number
  bytesPerSecond: number
  total: number
  transferred: number
}

/** Update metadata from the main-process auto-updater. */
interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

/** Combined state tracked by the UpdateChecker. */
interface UpdateState {
  /** Current app version from the main process. */
  currentVersion: string | null
  /** Whether an update check is in progress. */
  checking: boolean
  /** Whether an update is available (null = not yet checked). */
  updateAvailable: boolean | null
  /** Metadata about the available update. */
  updateInfo: UpdateInfo | null
  /** Download progress (null = not downloading). */
  downloadProgress: DownloadProgress | null
  /** Whether the update has been downloaded and is ready to install. */
  readyToInstall: boolean
  /** Error message, if any. */
  error: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Auto-update status indicator.
 *
 * Can be rendered inline or as a dismissible banner/modal. When `compact`
 * is true, shows a minimal version badge with a check-updates button.
 */
export function UpdateChecker({
  compact = false,
  className
}: {
  /** Compact mode — shows a small badge instead of a full panel. */
  compact?: boolean
  className?: string
}): JSX.Element {
  // ── State ──────────────────────────────────────────────────────────────

  const [state, setState] = useState<UpdateState>({
    currentVersion: null,
    checking: false,
    updateAvailable: null,
    updateInfo: null,
    downloadProgress: null,
    readyToInstall: false,
    error: null
  })

  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // ── Lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true

    // Grab the current app version
    const winApi = window.api

    if (winApi?.app?.getVersion) {
      winApi.app
        .getVersion()
        .then((version: string) => {
          if (mounted) setState((s) => ({ ...s, currentVersion: version }))
        })
        .catch(() => {
          // Silently ignore — version is non-critical
        })
    }

    // Register IPC event listeners
    const unsubscribes: (() => void)[] = []

    if (winApi?.events?.on) {
      const { on } = winApi.events

      // Update available
      unsubscribes.push(
        on('update:available', (data) => {
          if (!mounted) return
          const info = data as UpdateInfo
          setState((s) => ({
            ...s,
            checking: false,
            updateAvailable: true,
            updateInfo: info,
            error: null
          }))
        })
      )

      // Update not available
      unsubscribes.push(
        on('update:not-available', () => {
          if (!mounted) return
          setState((s) => ({
            ...s,
            checking: false,
            updateAvailable: false,
            error: null
          }))
        })
      )

      // Download progress
      unsubscribes.push(
        on('update:download-progress', (data) => {
          if (!mounted) return
          const progress = data as DownloadProgress
          setState((s) => ({
            ...s,
            downloadProgress: progress,
            error: null
          }))
        })
      )

      // Update downloaded
      unsubscribes.push(
        on('update:downloaded', (data) => {
          if (!mounted) return
          const info = data as UpdateInfo
          setState((s) => ({
            ...s,
            downloadProgress: null,
            readyToInstall: true,
            updateInfo: info
              ? { ...s.updateInfo, ...info }
              : s.updateInfo,
            error: null
          }))
        })
      )

      // Update error
      unsubscribes.push(
        on('update:error', (data) => {
          if (!mounted) return
          const { error } = data as { error: string }
          setState((s) => ({
            ...s,
            checking: false,
            error: error || 'Update check failed'
          }))
        })
      )
    }

    return () => {
      mounted = false
      unsubscribes.forEach((fn) => fn())
    }
  }, [])

  // ── Actions ────────────────────────────────────────────────────────────

  /**
   * Trigger an update check via IPC.
   * The main process auto-checks on startup and every 30 minutes;
   * this manually triggers an early check.
   */
  const checkForUpdates = useCallback(async (): Promise<void> => {
    setState((s) => ({ ...s, checking: true, error: null }))
    try {
      const result = await window.api.update.check()
      if (!result.success) {
        setState((s) => ({ ...s, checking: false, error: result.error ?? 'Update check failed' }))
      }
    } catch {
      setState((s) => ({ ...s, checking: false, error: 'Failed to check for updates' }))
    }
  }, [])

  /**
   * Start downloading the update.
   * The main process handles the actual download via electron-updater.
   */
  const downloadUpdate = useCallback(async (): Promise<void> => {
    try {
      await window.api.update.download()
    } catch {
      setState((s) => ({ ...s, error: 'Failed to start download' }))
    }
  }, [])

  /**
   * Install the downloaded update and restart.
   */
  const installUpdate = useCallback(async (): Promise<void> => {
    try {
      await window.api.update.install()
    } catch {
      // Installation will happen on next app quit regardless
    }
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  // ── Compact variant ────────────────────────────────────────────────────

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-xs text-[var(--color-text-muted)]">
          v{state.currentVersion ?? '—'}
        </span>
        {state.readyToInstall && (
          <button
            onClick={installUpdate}
            className="flex items-center gap-1 rounded bg-[var(--color-accent)] px-2 py-0.5 text-xs text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            title="Restart to install update"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Restart</span>
          </button>
        )}
        {!state.readyToInstall && (
          <button
            onClick={checkForUpdates}
            disabled={state.checking}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            title="Check for updates"
          >
            <ArrowUpCircle className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }

  // ── Full variant ───────────────────────────────────────────────────────

  if (dismissed && !state.readyToInstall && state.updateAvailable !== true) {
    return <></>
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={cn(
          'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg',
          className
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-[var(--color-accent)]" />
            <span className="text-sm font-medium text-[var(--color-text)]">
              {state.readyToInstall
                ? 'Update Ready'
                : state.downloadProgress
                  ? 'Downloading…'
                  : state.updateAvailable
                    ? `Update ${state.updateInfo?.version ?? ''} Available`
                    : state.currentVersion
                      ? `v${state.currentVersion}`
                      : 'OpenJuliet'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Changelog toggle */}
            {state.updateInfo?.releaseNotes && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                title="Release Notes"
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            {/* Dismiss */}
            <button
              onClick={() => setDismissed(true)}
              className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Status line ─────────────────────────────────────────────── */}
        {!state.readyToInstall && !state.downloadProgress && !state.error && (
          <div className="mt-1 text-xs text-[var(--color-text-muted)]">
            {state.checking
              ? 'Checking for updates…'
              : state.updateAvailable === false
                ? 'You\u2019re up to date'
                : state.updateAvailable === null
                  ? ''
                  : `Version ${state.updateInfo?.version ?? ''} is available`}
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────── */}
        {state.error && (
          <div className="mt-2 text-xs text-[var(--color-error)]">
            {state.error}
          </div>
        )}

        {/* ── Download Progress ───────────────────────────────────────── */}
        {state.downloadProgress && !state.readyToInstall && (
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs text-[var(--color-text-muted)]">
              <span>
                {formatBytes(state.downloadProgress.transferred)} /{' '}
                {formatBytes(state.downloadProgress.total)}
              </span>
              <span>{Math.round(state.downloadProgress.percent)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
              <motion.div
                className="h-full rounded-full bg-[var(--color-accent)]"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(state.downloadProgress.percent, 100)}%`
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className="mt-3 flex items-center gap-2">
          {state.readyToInstall && (
            <Button onClick={installUpdate} size="sm" variant="primary">
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Install & Restart
            </Button>
          )}

          {state.updateAvailable && !state.downloadProgress && !state.readyToInstall && (
            <Button onClick={downloadUpdate} size="sm" variant="primary">
              <Download className="mr-1 h-3.5 w-3.5" />
              Download Update
            </Button>
          )}

          {state.updateAvailable === null && !state.checking && (
            <Button onClick={checkForUpdates} size="sm" variant="ghost">
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Check for Updates
            </Button>
          )}

          {state.error && (
            <Button onClick={checkForUpdates} size="sm" variant="ghost">
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Retry
            </Button>
          )}
        </div>

        {/* ── Changelog / Release Notes ───────────────────────────────── */}
        <AnimatePresence>
          {expanded && state.updateInfo?.releaseNotes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 overflow-hidden"
            >
              <div className="max-h-48 overflow-y-auto rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-2">
                <h4 className="mb-1 text-xs font-semibold text-[var(--color-text)]">
                  Release Notes — v{state.updateInfo.version}
                </h4>
                <div className="whitespace-pre-wrap text-xs text-[var(--color-text-muted)]">
                  {state.updateInfo.releaseNotes}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

export default UpdateChecker