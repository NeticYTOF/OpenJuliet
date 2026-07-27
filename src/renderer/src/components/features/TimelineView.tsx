import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  LayoutList,
  Code,
  TestTube,
  Eye,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  AlertCircle,
  SkipForward,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

// ─── Types ───────────────────────────────────────────────────────────────────

export type StageStatus = 'pending' | 'active' | 'completed' | 'failed' | 'skipped'

export type StageId =
  | 'analyze'
  | 'plan'
  | 'implement'
  | 'test'
  | 'review'
  | 'commit'
  | 'pr'

export interface StageDetail {
  label: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  durationMs?: number
}

export interface StageData {
  id: StageId
  label: string
  status: StageStatus
  icon: React.ReactNode
  /** Duration in ms (shown when completed) */
  durationMs?: number
  /** Error count (shown when failed) */
  errorCount?: number
  /** Sub-steps / details expanded */
  details?: StageDetail[]
}

export interface TimelineViewProps {
  /** Array of stage data to render */
  stages: StageData[]
  /** Optional class name override */
  className?: string
  /** Callback when a stage is clicked */
  onStageClick?: (stageId: StageId) => void
}

// ─── Stage Icon Map ─────────────────────────────────────────────────────────

const STAGE_ICONS: Record<StageId, React.ReactNode> = {
  analyze: <Search size={16} />,
  plan: <LayoutList size={16} />,
  implement: <Code size={16} />,
  test: <TestTube size={16} />,
  review: <Eye size={16} />,
  commit: <GitCommit size={16} />,
  pr: <GitPullRequest size={16} />
}

const STAGE_LABELS: Record<StageId, string> = {
  analyze: 'Analyze',
  plan: 'Plan',
  implement: 'Implement',
  test: 'Test',
  review: 'Review',
  commit: 'Commit',
  pr: 'Pull Request'
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatStageDuration(ms: number | undefined): string {
  if (ms === undefined || ms === 0) return ''
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function getStageColor(status: StageStatus): string {
  switch (status) {
    case 'completed':
      return 'var(--color-success)'
    case 'active':
      return 'var(--color-accent)'
    case 'failed':
      return 'var(--color-error)'
    case 'skipped':
      return 'var(--color-text-muted)'
    case 'pending':
    default:
      return 'var(--color-border)'
  }
}

function getStageBg(status: StageStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-[var(--color-success-bg)]'
    case 'active':
      return 'bg-[var(--color-accent-subtle)]'
    case 'failed':
      return 'bg-[var(--color-error-bg)]'
    case 'skipped':
      return 'bg-[var(--color-bg-tertiary)] opacity-40'
    case 'pending':
    default:
      return 'bg-[var(--color-bg-tertiary)]'
  }
}

// ─── Connecting Line ────────────────────────────────────────────────────────

interface ConnectingLineProps {
  status: StageStatus
  nextStatus: StageStatus
}

function ConnectingLine({ status, nextStatus }: ConnectingLineProps): JSX.Element {
  const isComplete = status === 'completed'
  const isNextCompleteOrActive =
    nextStatus === 'completed' || nextStatus === 'active'
  const showAnimation = isComplete && !isNextCompleteOrActive

  return (
    <div className="flex justify-center" style={{ width: 16 }}>
      <div className="relative w-0.5 h-8">
        {/* Background line */}
        <div className="absolute inset-0 bg-[var(--color-border)] rounded-full" />

        {/* Animated fill line */}
        <motion.div
          initial={showAnimation ? { height: '0%' } : false}
          animate={
            isComplete
              ? { height: '100%' }
              : nextStatus === 'active'
                ? { height: '50%' }
                : { height: '0%' }
          }
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-0 left-0 right-0 bg-[var(--color-success)] rounded-full"
        />
      </div>
    </div>
  )
}

// ─── Status Icon ────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: StageStatus }): JSX.Element | null {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={16} className="text-[var(--color-success)]" />
    case 'failed':
      return <XCircle size={16} className="text-[var(--color-error)]" />
    case 'active':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={16} className="text-[var(--color-accent)]" />
        </motion.div>
      )
    case 'skipped':
      return <SkipForward size={16} className="text-[var(--color-text-muted)]" />
    case 'pending':
    default:
      return null
  }
}

// ─── Stage Node ─────────────────────────────────────────────────────────────

interface StageNodeProps {
  stage: StageData
  isFirst: boolean
  isLast: boolean
  nextStatus?: StageStatus
  onStageClick?: (stageId: StageId) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

function StageNode({
  stage,
  isFirst,
  isLast,
  nextStatus,
  onStageClick,
  isExpanded,
  onToggleExpand
}: StageNodeProps): JSX.Element {
  const color = getStageColor(stage.status)
  const bgClass = getStageBg(stage.status)
  const isActive = stage.status === 'active'
  const hasDetails = stage.details && stage.details.length > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="flex items-start gap-3">
        {/* Timeline column */}
        <div className="flex flex-col items-center shrink-0">
          {/* Stage icon circle */}
          <motion.button
            onClick={() => {
              onStageClick?.(stage.id)
              if (hasDetails) onToggleExpand()
            }}
            animate={
              isActive
                ? {
                    scale: [1, 1.08, 1],
                    boxShadow: [
                      '0 0 0px var(--color-accent-glow)',
                      '0 0 16px var(--color-accent-glow)',
                      '0 0 0px var(--color-accent-glow)'
                    ]
                  }
                : { scale: 1, boxShadow: '0 0 0px transparent' }
            }
            transition={
              isActive
                ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.3 }
            }
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-300',
              bgClass,
              stage.status === 'pending' && 'border-[var(--color-border)] opacity-50',
              stage.status === 'active' && 'border-[var(--color-accent)]',
              stage.status === 'completed' && 'border-[var(--color-success)]',
              stage.status === 'failed' && 'border-[var(--color-error)]',
              stage.status === 'skipped' && 'border-[var(--color-border)] opacity-40',
              hasDetails && 'cursor-pointer hover:brightness-125'
            )}
            style={{ color }}
          >
            {stage.status === 'pending' || stage.status === 'skipped' ? (
              <span className="opacity-50">
                {STAGE_ICONS[stage.id]}
              </span>
            ) : (
              <StatusIcon status={stage.status} />
            )}
          </motion.button>

          {/* Connecting line */}
          {!isLast && nextStatus && (
            <ConnectingLine status={stage.status} nextStatus={nextStatus} />
          )}
        </div>

        {/* Stage content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            {/* Label */}
            <span
              className={cn(
                'text-sm font-medium transition-colors duration-300',
                stage.status === 'pending' && 'text-[var(--color-text-muted)]',
                stage.status === 'active' && 'text-[var(--color-text-primary)]',
                stage.status === 'completed' && 'text-[var(--color-success)]',
                stage.status === 'failed' && 'text-[var(--color-error)]',
                stage.status === 'skipped' && 'text-[var(--color-text-muted)] line-through'
              )}
            >
              {stage.label}
            </span>

            {/* Duration badge (completed) */}
            {stage.status === 'completed' && stage.durationMs !== undefined && stage.durationMs > 0 && (
              <Badge variant="success" size="sm" className="tabular-nums">
                <Clock size={10} className="mr-0.5" />
                {formatStageDuration(stage.durationMs)}
              </Badge>
            )}

            {/* Error count badge (failed) */}
            {stage.status === 'failed' && stage.errorCount !== undefined && stage.errorCount > 0 && (
              <Badge variant="error" size="sm">
                <AlertCircle size={10} className="mr-0.5" />
                {stage.errorCount} error{stage.errorCount !== 1 ? 's' : ''}
              </Badge>
            )}

            {/* Active indicator */}
            {isActive && (
              <Badge variant="accent" size="sm" dot>
                In Progress
              </Badge>
            )}

            {/* Skpped indicator */}
            {stage.status === 'skipped' && (
              <Badge variant="default" size="sm">
                Skipped
              </Badge>
            )}

            {/* Expand toggle */}
            {hasDetails && (
              <button
                onClick={onToggleExpand}
                className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          {/* Sub-steps (expanded) */}
          <AnimatePresence initial={false}>
            {isExpanded && hasDetails && (
              <motion.div
                key="details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 ml-1 space-y-1.5">
                  {stage.details!.map((detail, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.2 }}
                      className="flex items-center gap-2"
                    >
                      {/* Sub-step dot */}
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          detail.status === 'completed' && 'bg-[var(--color-success)]',
                          detail.status === 'running' && 'bg-[var(--color-accent)] animate-pulse',
                          detail.status === 'failed' && 'bg-[var(--color-error)]',
                          detail.status === 'skipped' && 'bg-[var(--color-text-muted)]',
                          detail.status === 'pending' && 'bg-[var(--color-border)]'
                        )}
                      />

                      <span
                        className={cn(
                          'text-xs',
                          detail.status === 'completed' && 'text-[var(--color-text-secondary)]',
                          detail.status === 'running' && 'text-[var(--color-text-primary)]',
                          detail.status === 'failed' && 'text-[var(--color-error)]',
                          detail.status === 'skipped' && 'text-[var(--color-text-muted)] line-through',
                          detail.status === 'pending' && 'text-[var(--color-text-muted)]'
                        )}
                      >
                        {detail.label}
                      </span>

                      {detail.durationMs !== undefined && detail.durationMs > 0 && (
                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono tabular-nums">
                          {formatStageDuration(detail.durationMs)}
                        </span>
                      )}

                      {detail.status === 'running' && (
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-1 h-1 rounded-full bg-[var(--color-accent)]"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Default Stages ─────────────────────────────────────────────────────────

const DEFAULT_STAGES: StageId[] = [
  'analyze',
  'plan',
  'implement',
  'test',
  'review',
  'commit',
  'pr'
]

function createDefaultStage(id: StageId, status: StageStatus): StageData {
  return {
    id,
    label: STAGE_LABELS[id],
    status,
    icon: STAGE_ICONS[id]
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function TimelineView({
  stages,
  className,
  onStageClick
}: TimelineViewProps): JSX.Element {
  const [expandedStages, setExpandedStages] = useState<Set<StageId>>(new Set())

  const handleToggle = useCallback((id: StageId) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // Fill in missing stages with 'pending' status so we always show all 7
  const filledStages: StageData[] = DEFAULT_STAGES.map((id) => {
    const existing = stages.find((s) => s.id === id)
    if (existing) return existing
    return createDefaultStage(id, 'pending')
  })

  return (
    <Card variant="default" padding="md" className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={14} className="text-[var(--color-accent)]" />
        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
          Execution Timeline
        </span>
        <Badge variant="default" size="sm" className="ml-auto tabular-nums">
          {stages.filter((s) => s.status === 'completed' || s.status === 'failed' || s.status === 'skipped').length}
          /
          {DEFAULT_STAGES.length}
        </Badge>
      </div>

      {/* Timeline */}
      <motion.div
        layout
        className="space-y-0"
      >
        {filledStages.map((stage, idx) => (
          <StageNode
            key={stage.id}
            stage={stage}
            isFirst={idx === 0}
            isLast={idx === filledStages.length - 1}
            nextStatus={filledStages[idx + 1]?.status}
            onStageClick={onStageClick}
            isExpanded={expandedStages.has(stage.id)}
            onToggleExpand={() => handleToggle(stage.id)}
          />
        ))}
      </motion.div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-1.5">
          <Loader2 size={10} className="text-[var(--color-accent)] animate-spin" />
          <span className="text-[10px] text-[var(--color-text-muted)]">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={10} className="text-[var(--color-success)]" />
          <span className="text-[10px] text-[var(--color-text-muted)]">Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle size={10} className="text-[var(--color-error)]" />
          <span className="text-[10px] text-[var(--color-text-muted)]">Failed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SkipForward size={10} className="text-[var(--color-text-muted)]" />
          <span className="text-[10px] text-[var(--color-text-muted)]">Skipped</span>
        </div>
      </div>
    </Card>
  )
}

export default TimelineView