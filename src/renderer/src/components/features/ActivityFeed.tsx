import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Search,
  GitCommit,
  Code2,
  Cpu,
  Terminal,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter
} from 'lucide-react'
import { cn, formatRelativeTime, generateId } from '../../lib/utils'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'
import { AnimatedContainer, AnimatedItem } from '../ui/AnimatedContainer'

/**
 * Activity type categories.
 */
export type ActivityType = 'all' | 'code' | 'git' | 'ai' | 'system'

/**
 * Severity level for an activity entry.
 */
export type ActivitySeverity = 'info' | 'success' | 'warning' | 'error'

/**
 * A single activity entry.
 */
export interface ActivityEntry {
  /** Unique identifier */
  id: string
  /** Type category */
  type: Exclude<ActivityType, 'all'>
  /** Severity level */
  severity: ActivitySeverity
  /** Title text */
  title: string
  /** Optional description (shown on expand) */
  description?: string
  /** ISO timestamp or Unix ms */
  timestamp: number
  /** Optional metadata key-value pairs */
  metadata?: Record<string, string>
}

/**
 * ActivityFeed component props.
 */
export interface ActivityFeedProps {
  /** Array of activity entries */
  activities: ActivityEntry[]
  /** Loading state */
  loading?: boolean
  /** Error message if fetch failed */
  error?: string
  /** Called to retry loading */
  onRetry?: () => void
  /** Additional className */
  className?: string
}

/* ──── Type config ──── */

const typeIcons: Record<Exclude<ActivityType, 'all'>, React.ComponentType<{ size?: number; className?: string }>> = {
  code: Code2,
  git: GitCommit,
  ai: Cpu,
  system: Terminal
}

const typeLabels: Record<Exclude<ActivityType, 'all'>, string> = {
  code: 'Code',
  git: 'Git',
  ai: 'AI',
  system: 'System'
}

const severityColors: Record<ActivitySeverity, string> = {
  info: 'var(--color-info)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)'
}

const severityBg: Record<ActivitySeverity, string> = {
  info: 'var(--color-info-bg)',
  success: 'var(--color-success-bg)',
  warning: 'var(--color-warning-bg)',
  error: 'var(--color-error-bg)'
}

const filterOptions: { value: ActivityType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'code', label: 'Code' },
  { value: 'git', label: 'Git' },
  { value: 'ai', label: 'AI' },
  { value: 'system', label: 'System' }
]

/* ──── Animation variants ──── */

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
}

const itemVariantsMotion = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15 }
  }
}

/**
 * ActivityFeed — Real-time activity stream with filtering, search, expand, and loading states.
 *
 * @example
 * <ActivityFeed
 *   activities={activities}
 *   loading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 * />
 */
export function ActivityFeed({
  activities,
  loading = false,
  error,
  onRetry,
  className
}: ActivityFeedProps): JSX.Element {
  const [filter, setFilter] = useState<ActivityType>('all')
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  /* ──── Derived data ──── */

  const filtered = useMemo(() => {
    let result = activities
    if (filter !== 'all') {
      result = result.filter((a) => a.type === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.description ?? '').toLowerCase().includes(q) ||
          (a.type.toLowerCase().includes(q))
      )
    }
    return result
  }, [activities, filter, search])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.timestamp - a.timestamp),
    [filtered]
  )

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  /* ──── Loading state ──── */

  if (loading) {
    return (
      <AnimatedContainer animation="slideUp" className={className}>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
              <Skeleton width="32px" height="32px" rounded="lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton width="55%" height="14px" rounded="sm" />
                <Skeleton width="35%" height="11px" rounded="sm" />
              </div>
              <Skeleton width="48px" height="12px" rounded="sm" />
            </div>
          ))}
        </div>
      </AnimatedContainer>
    )
  }

  /* ──── Error state ──── */

  if (error) {
    return (
      <AnimatedContainer animation="slideUp" className={className}>
        <Card variant="default" padding="lg">
          <EmptyState
            icon={<Activity size={36} />}
            title="Failed to load activity"
            description={error}
            action={
              onRetry ? (
                <button
                  onClick={onRetry}
                  className="text-sm text-[var(--color-accent)] hover:underline"
                >
                  Try again
                </button>
              ) : undefined
            }
          />
        </Card>
      </AnimatedContainer>
    )
  }

  return (
    <AnimatedContainer animation="slideUp" className={className}>
      <Card variant="default" padding="none">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Activity size={16} className="text-[var(--color-accent)]" />
              Activity
            </h2>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {sorted.length} event{sorted.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search activity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-medium rounded-full transition-all duration-200 border',
                  filter === opt.value
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[rgba(108,92,231,0.3)]'
                    : 'bg-transparent text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        {sorted.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={<Activity size={32} />}
              title={
                search
                  ? 'No matching activity'
                  : filter !== 'all'
                    ? `No ${filter} activity yet`
                    : 'No activity yet'
              }
              description={
                search || filter !== 'all'
                  ? 'Try adjusting your filter or search terms.'
                  : 'Activity will appear here as you work.'
              }
            />
          </div>
        ) : (
          <motion.div
            className="divide-y divide-[var(--color-border)]"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {sorted.map((entry) => {
                const Icon = typeIcons[entry.type]
                const isExpanded = expandedIds.has(entry.id)
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    variants={itemVariantsMotion}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={cn(
                      'group cursor-pointer transition-colors duration-150',
                      isExpanded
                        ? 'bg-[var(--color-bg-tertiary)]'
                        : 'hover:bg-[var(--color-bg-tertiary)]'
                    )}
                    onClick={() => toggleExpand(entry.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleExpand(entry.id)
                      }
                    }}
                    aria-expanded={isExpanded}
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className="p-1.5 rounded-lg shrink-0 mt-0.5"
                          style={{ backgroundColor: severityBg[entry.severity], color: severityColors[entry.severity] }}
                        >
                          <Icon size={14} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                              {entry.title}
                            </span>
                            <Badge variant={entry.severity === 'error' ? 'error' : entry.severity === 'warning' ? 'warning' : entry.severity === 'success' ? 'success' : 'info'} size="sm">
                              {typeLabels[entry.type]}
                            </Badge>
                          </div>

                          {isExpanded && entry.description && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed"
                            >
                              {entry.description}
                            </motion.p>
                          )}

                          {isExpanded && entry.metadata && Object.keys(entry.metadata).length > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="mt-2 flex flex-wrap gap-x-4 gap-y-1"
                            >
                              {Object.entries(entry.metadata).map(([key, value]) => (
                                <span key={key} className="text-[11px] text-[var(--color-text-muted)]">
                                  <span className="font-medium">{key}:</span> {value}
                                </span>
                              ))}
                            </motion.div>
                          )}
                        </div>

                        {/* Timestamp + expand */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1 whitespace-nowrap">
                            <Clock size={10} />
                            {formatRelativeTime(entry.timestamp)}
                          </span>
                          <span className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </Card>
    </AnimatedContainer>
  )
}

export default ActivityFeed
