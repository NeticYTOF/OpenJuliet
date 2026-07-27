import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  Copy,
  Trash2,
  ScrollText,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  ChevronDown,
  Filter,
  Terminal
} from 'lucide-react'
import type { LogEntry } from '../../types'
import { cn } from '../../lib/utils'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'
export type Stage =
  | 'analyze'
  | 'plan'
  | 'implement'
  | 'test'
  | 'review'
  | 'commit'
  | 'pr'

export interface ExecutionLogViewerProps {
  /** Array of log entries to display */
  logs: LogEntry[]
  /** If true, show a loading skeleton instead of the viewer */
  loading?: boolean
  /** Optional callback to clear logs */
  onClear?: () => void
  /** Optional callback invoked with the full log text when copy is requested */
  onCopy?: (text: string) => void
  /** Optional external search query (controlled mode) */
  searchQuery?: string
  /** Optional external level filter */
  levelFilter?: LogLevel | 'all'
  /** Optional external stage filter */
  stageFilter?: Stage | 'all'
  /** Optional class name override */
  className?: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STAGES: { value: Stage; label: string }[] = [
  { value: 'analyze', label: 'Analyze' },
  { value: 'plan', label: 'Plan' },
  { value: 'implement', label: 'Implement' },
  { value: 'test', label: 'Test' },
  { value: 'review', label: 'Review' },
  { value: 'commit', label: 'Commit' },
  { value: 'pr', label: 'PR' }
]

const LEVEL_CONFIG: Record<
  LogLevel,
  { icon: typeof Info; color: string; bg: string; label: string }
> = {
  info: {
    icon: Info,
    color: 'text-[var(--color-info)]',
    bg: 'bg-[var(--color-info-bg)]',
    label: 'Info'
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-bg)]',
    label: 'Warn'
  },
  error: {
    icon: AlertCircle,
    color: 'text-[var(--color-error)]',
    bg: 'bg-[var(--color-error-bg)]',
    label: 'Error'
  },
  debug: {
    icon: Bug,
    color: 'text-[var(--color-text-muted)]',
    bg: 'bg-[var(--color-bg-tertiary)]',
    label: 'Debug'
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStageFromMessage(message: string): Stage | null {
  const lower = message.toLowerCase()
  if (lower.includes('[analyze]') || lower.startsWith('analyze')) return 'analyze'
  if (lower.includes('[plan]') || lower.startsWith('plan')) return 'plan'
  if (lower.includes('[implement]') || lower.startsWith('implement')) return 'implement'
  if (lower.includes('[test]') || lower.startsWith('test')) return 'test'
  if (lower.includes('[review]') || lower.startsWith('review')) return 'review'
  if (lower.includes('[commit]') || lower.startsWith('commit')) return 'commit'
  if (lower.includes('[pr]') || lower.startsWith('pr')) return 'pr'
  return null
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false
  })
}

function highlightText(text: string, query: string): JSX.Element {
  if (!query.trim()) return <>{text}</>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-[var(--color-accent-subtle)] text-[var(--color-accent)] rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function LogSkeleton(): JSX.Element {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="h-3 w-14 rounded bg-[var(--color-bg-tertiary)]" />
          <div
            className="h-3 rounded bg-[var(--color-bg-tertiary)]"
            style={{ width: `${40 + Math.random() * 50}%` }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Filter Bar ─────────────────────────────────────────────────────────────

interface FilterBarProps {
  levelFilter: LogLevel | 'all'
  stageFilter: Stage | 'all'
  searchQuery: string
  onLevelChange: (level: LogLevel | 'all') => void
  onStageChange: (stage: Stage | 'all') => void
  onSearchChange: (query: string) => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
  totalCount: number
  filteredCount: number
  onClear: () => void
  onCopy: () => void
  hasLogs: boolean
}

function FilterBar({
  levelFilter,
  stageFilter,
  searchQuery,
  onLevelChange,
  onStageChange,
  onSearchChange,
  searchInputRef,
  totalCount,
  filteredCount,
  onClear,
  onCopy,
  hasLogs
}: FilterBarProps): JSX.Element {
  const [showFilters, setShowFilters] = useState(false)
  const hasActiveFilter = levelFilter !== 'all' || stageFilter !== 'all' || searchQuery !== ''

  return (
    <div className="border-b border-[var(--color-border)]">
      {/* ─── Search row ─── */}
      <div className="flex items-center gap-2 p-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search logs…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              'w-full h-8 pl-8 pr-8 rounded-md text-xs',
              'bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
              'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent-subtle)]',
              'transition-all duration-200'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-all duration-200',
            showFilters || hasActiveFilter
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[rgba(108,92,231,0.2)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] border border-transparent'
          )}
        >
          <Filter size={14} />
          <span>Filters</span>
          {hasActiveFilter && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
          )}
        </button>
      </div>

      {/* ─── Filter chips ─── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {/* Level filter */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                  Level
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'info', 'warn', 'error', 'debug'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => onLevelChange(lvl)}
                      className={cn(
                        'px-2 py-1 rounded text-[10px] font-medium transition-all duration-150',
                        levelFilter === lvl
                          ? lvl === 'all'
                            ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[rgba(108,92,231,0.2)]'
                            : `${LEVEL_CONFIG[lvl].bg} ${LEVEL_CONFIG[lvl].color} border border-current/20`
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-transparent hover:text-[var(--color-text-secondary)]'
                      )}
                    >
                      {lvl === 'all' ? 'All' : LEVEL_CONFIG[lvl].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stage filter */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                  Stage
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => onStageChange('all')}
                    className={cn(
                      'px-2 py-1 rounded text-[10px] font-medium transition-all duration-150',
                      stageFilter === 'all'
                        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[rgba(108,92,231,0.2)]'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-transparent hover:text-[var(--color-text-secondary)]'
                    )}
                  >
                    All
                  </button>
                  {STAGES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => onStageChange(s.value)}
                      className={cn(
                        'px-2 py-1 rounded text-[10px] font-medium transition-all duration-150',
                        stageFilter === s.value
                          ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[rgba(108,92,231,0.2)]'
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-transparent hover:text-[var(--color-text-secondary)]'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Info bar ─── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)] bg-opacity-50">
        <span className="text-[10px] text-[var(--color-text-muted)]">
          {hasLogs ? (
            <>
              Showing <span className="text-[var(--color-text-secondary)] font-medium">{filteredCount}</span> of{' '}
              <span className="text-[var(--color-text-secondary)] font-medium">{totalCount}</span> entries
            </>
          ) : (
            'No entries'
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onCopy}
            disabled={!hasLogs}
            className={cn(
              'p-1 rounded transition-all duration-150',
              hasLogs
                ? 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
                : 'text-[var(--color-text-muted)] opacity-30 cursor-not-allowed'
            )}
            title="Copy all logs"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={onClear}
            disabled={!hasLogs}
            className={cn(
              'p-1 rounded transition-all duration-150',
              hasLogs
                ? 'text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)]'
                : 'text-[var(--color-text-muted)] opacity-30 cursor-not-allowed'
            )}
            title="Clear logs"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Log Entry ──────────────────────────────────────────────────────────────

interface LogEntryItemProps {
  entry: LogEntry
  searchQuery: string
  isNew: boolean
}

function LogEntryItem({ entry, searchQuery, isNew }: LogEntryItemProps): JSX.Element {
  const config = LEVEL_CONFIG[entry.level as LogLevel] ?? LEVEL_CONFIG.info
  const Icon = config.icon
  const detectedStage = getStageFromMessage(entry.message)

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -16, height: 0 } : false}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group flex items-start gap-2 px-3 py-1.5 rounded-md transition-colors duration-150',
        'hover:bg-[var(--color-bg-tertiary)]',
        entry.level === 'error' && 'bg-[var(--color-error-bg)] bg-opacity-30',
        entry.level === 'warn' && 'bg-[var(--color-warning-bg)] bg-opacity-20'
      )}
    >
      {/* Level icon */}
      <Icon
        size={13}
        className={cn('mt-0.5 shrink-0', config.color)}
      />

      {/* Timestamp */}
      <span className="text-[11px] text-[var(--color-text-muted)] font-mono tabular-nums shrink-0 w-14">
        {formatTimestamp(entry.timestamp)}
      </span>

      {/* Stage badge (if detected) */}
      {detectedStage && (
        <Badge variant="accent" size="sm" className="shrink-0 leading-none opacity-60 group-hover:opacity-100 transition-opacity">
          {detectedStage}
        </Badge>
      )}

      {/* Message */}
      <span
        className={cn(
          'text-xs font-mono leading-relaxed break-all min-w-0',
          entry.level === 'error' && 'text-[var(--color-error)]',
          entry.level === 'warn' && 'text-[var(--color-warning)]',
          entry.level === 'debug' && 'text-[var(--color-text-muted)]',
          (entry.level === 'info' || entry.level === 'system') && 'text-[var(--color-text-secondary)]'
        )}
      >
        {searchQuery ? highlightText(entry.message, searchQuery) : entry.message}
      </span>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ExecutionLogViewer({
  logs,
  loading = false,
  onClear,
  onCopy,
  searchQuery: externalSearchQuery,
  levelFilter: externalLevelFilter,
  stageFilter: externalStageFilter,
  className
}: ExecutionLogViewerProps): JSX.Element {
  const [internalSearch, setInternalSearch] = useState('')
  const [internalLevel, setInternalLevel] = useState<LogLevel | 'all'>('all')
  const [internalStage, setInternalStage] = useState<Stage | 'all'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [prevLogCount, setPrevLogCount] = useState(0)

  const logEndRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external state
  const searchQuery = externalSearchQuery ?? internalSearch
  const levelFilter = externalLevelFilter ?? internalLevel
  const stageFilter = externalStageFilter ?? internalStage

  // Track new log entries for animation
  useEffect(() => {
    setPrevLogCount(logs.length)
  }, [logs.length])

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [logs, autoScroll])

  // Detect manual scroll to disable auto-scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40
    if (isAtBottom !== autoScroll) {
      setAutoScroll(isAtBottom)
    }
  }, [autoScroll])

  // Keyboard shortcut: Ctrl+F to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      // Level filter
      if (levelFilter !== 'all' && entry.level !== levelFilter) return false
      // Stage filter
      if (stageFilter !== 'all') {
        const detected = getStageFromMessage(entry.message)
        if (detected !== stageFilter) return false
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        if (!entry.message.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [logs, levelFilter, stageFilter, searchQuery])

  // Determine which entries are "new" (added since last render)
  const newCount = logs.length - prevLogCount
  const newIndices = useMemo(() => {
    if (newCount <= 0) return new Set<number>()
    const indices = new Set<number>()
    // The last `newCount` entries in the filtered list that correspond to the latest logs
    const latestLogIds = new Set(logs.slice(-newCount).map((l) => l.id))
    filteredLogs.forEach((entry, idx) => {
      if (latestLogIds.has(entry.id)) indices.add(idx)
    })
    return indices
  }, [logs, filteredLogs, newCount])

  const handleClear = useCallback(() => {
    setInternalSearch('')
    setInternalLevel('all')
    setInternalStage('all')
    onClear?.()
  }, [onClear])

  const handleCopy = useCallback(() => {
    const text = filteredLogs
      .map((e) => `[${formatTimestamp(e.timestamp)}] [${e.level.toUpperCase()}] ${e.message}`)
      .join('\n')
    if (onCopy) {
      onCopy(text)
    } else {
      navigator.clipboard.writeText(text).catch(() => {
        // Clipboard write failed silently
      })
    }
  }, [filteredLogs, onCopy])

  // ── Loading state ──
  if (loading) {
    return (
      <Card variant="default" padding="none" className={className}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
          <ScrollText size={16} className="text-[var(--color-text-secondary)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Execution Logs</span>
        </div>
        <LogSkeleton />
      </Card>
    )
  }

  return (
    <Card variant="default" padding="none" className={cn('overflow-hidden', className)}>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <ScrollText size={16} className="text-[var(--color-text-secondary)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Execution Logs
          </span>
          {logs.length > 0 && (
            <Badge variant="default" size="sm">
              {logs.length}
            </Badge>
          )}
        </div>
        <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:inline">
          Ctrl+F to search
        </span>
      </div>

      {/* ─── Filter bar ─── */}
      <FilterBar
        levelFilter={levelFilter}
        stageFilter={stageFilter}
        searchQuery={searchQuery}
        onLevelChange={setInternalLevel}
        onStageChange={setInternalStage}
        onSearchChange={setInternalSearch}
        searchInputRef={searchInputRef}
        totalCount={logs.length}
        filteredCount={filteredLogs.length}
        onClear={handleClear}
        onCopy={handleCopy}
        hasLogs={logs.length > 0}
      />

      {/* ─── Log entries ─── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto"
        style={{ maxHeight: 400 }}
      >
        {filteredLogs.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Terminal size={32} />}
              title={logs.length === 0 ? 'No log entries' : 'No matching entries'}
              description={
                logs.length === 0
                  ? 'Log entries will appear here as tasks are executed.'
                  : 'Try adjusting your search query or filters.'
              }
            />
          </div>
        ) : (
          <div className="py-1">
            <AnimatePresence mode="popLayout">
              {filteredLogs.map((entry, idx) => (
                <LogEntryItem
                  key={entry.id}
                  entry={entry}
                  searchQuery={searchQuery}
                  isNew={newIndices.has(idx)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={logEndRef} className="h-px" />

        {/* ─── Scroll to bottom indicator ─── */}
        {!autoScroll && filteredLogs.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => {
              logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
              setAutoScroll(true)
            }}
            className={cn(
              'sticky bottom-2 left-1/2 -translate-x-1/2',
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              'bg-[var(--color-surface)] border border-[var(--color-border)]',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              'shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-glow)]',
              'transition-all duration-200'
            )}
          >
            <ChevronDown size={14} />
            <span>New logs below</span>
          </motion.button>
        )}
      </div>
    </Card>
  )
}

export default ExecutionLogViewer