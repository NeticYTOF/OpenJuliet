import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitPullRequest,
  FileCode,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  ThumbsUp,
  GitMerge,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Clock,
  Ban,
  Loader2,
  GitBranch,
  Users,
  ChevronLeft,
  CircleDot,
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ScrollArea } from '../ui/ScrollArea'
import { AnimatedContainer, AnimatedItem } from '../ui/AnimatedContainer'
import { cn } from '../../lib/utils'
import type { DiffFile } from '../editor/DiffViewer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewState = 'changes' | 'approve' | 'comment'
export type ReviewDecision = 'approved' | 'changes_requested' | 'pending' | 'dismissed'
export type CIStatus = 'pending' | 'running' | 'passed' | 'failed' | 'cancelled'

export interface CIJob {
  name: string
  status: CIStatus
  duration?: number
  url?: string
}

export interface ReviewComment {
  id: string
  author: string
  authorAvatar?: string
  body: string
  createdAt: number
  filePath?: string
  lineNumber?: number
  resolved: boolean
}

export interface SuggestedReviewer {
  login: string
  avatarUrl?: string
  contributions: number
  reviewCount?: number
  selected?: boolean
}

export interface PRReviewProps {
  /** PR number */
  prNumber: number
  /** PR title */
  title: string
  /** PR body/description */
  body?: string
  /** PR author */
  author: string
  /** Base branch (target) */
  baseBranch: string
  /** Head branch (source) */
  headBranch: string
  /** Files with diffs */
  diffFiles: DiffFile[]
  /** Current review decision */
  reviewDecision: ReviewDecision
  /** CI jobs running for this PR */
  ciJobs?: CIJob[]
  /** Existing review comments */
  existingComments?: ReviewComment[]
  /** Suggested reviewers */
  suggestedReviewers?: SuggestedReviewer[]
  /** Whether all CI checks have passed */
  allChecksPassed?: boolean
  /** Whether the merge is in progress */
  isMerging?: boolean
  /** Whether the user is the PR author (can't self-approve) */
  isAuthor?: boolean
  /** Called to submit a review */
  onSubmitReview: (decision: ReviewState, body: string) => Promise<void>
  /** Called to merge the PR */
  onMerge: () => Promise<void>
  /** Called to add an inline comment */
  onAddComment: (body: string, filePath?: string, lineNumber?: number) => Promise<void>
  /** Called to resolve a comment thread */
  onResolveComment: (commentId: string) => Promise<void>
  /** Called to request reviewers */
  onRequestReviewers: (logins: string[]) => Promise<void>
  /** Called to refresh CI status */
  onRefreshCI?: () => Promise<void>
  /** Additional class name */
  className?: string
}

// ---------------------------------------------------------------------------
// CI Status Config
// ---------------------------------------------------------------------------

const CI_STATUS_CONFIG: Record<CIStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  pending: { label: 'Pending', color: 'var(--color-text-muted)', bg: 'var(--color-bg-tertiary)', icon: Clock },
  running: { label: 'Running', color: 'var(--color-info)', bg: 'var(--color-info-bg)', icon: RefreshCw },
  passed: { label: 'Passed', color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: CheckCircle },
  failed: { label: 'Failed', color: 'var(--color-error)', bg: 'var(--color-error-bg)', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', icon: Ban },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CIStatusBadge({ job }: { job: CIJob }): JSX.Element {
  const cfg = CI_STATUS_CONFIG[job.status]
  const Icon = cfg.icon
  const isSpinning = job.status === 'running'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <Icon
        size={14}
        className={cn('shrink-0', isSpinning && 'animate-spin')}
        style={{ color: cfg.color }}
      />
      <span className="flex-1 text-xs text-[var(--color-text-primary)] truncate">{job.name}</span>
      <span
        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: cfg.bg, color: cfg.color }}
      >
        {cfg.label}
      </span>
      {job.duration && (
        <span className="text-[10px] text-[var(--color-text-muted)]">
          {job.duration}s
        </span>
      )}
    </motion.div>
  )
}

function DiffSummaryCard({
  diffFiles,
  decisions,
}: {
  diffFiles: DiffFile[]
  decisions: Record<number, ReviewState>
}): JSX.Element {
  const summary = useMemo(() => {
    const added = diffFiles.reduce((sum, f) => sum + f.newCode.split('\n').length - f.oldCode.split('\n').length, 0)
    const removed = diffFiles.reduce((sum, f) => {
      const oldLines = f.oldCode.split('\n').length
      const newLines = f.newCode.split('\n').length
      return sum + Math.max(0, oldLines - newLines)
    }, 0)
    return {
      totalFiles: diffFiles.length,
      added: Math.max(0, added),
      removed: Math.max(0, removed),
      addedFiles: diffFiles.filter((f) => f.status === 'added').length,
      modifiedFiles: diffFiles.filter((f) => f.status === 'modified').length,
      deletedFiles: diffFiles.filter((f) => f.status === 'deleted').length,
    }
  }, [diffFiles])

  return (
    <Card variant="default" padding="lg">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
        <GitPullRequest size={14} className="text-[var(--color-accent)]" />
        Diff Summary
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryStat
          icon={<FileCode size={16} />}
          label="Files Changed"
          value={summary.totalFiles}
          detail={`+${summary.addedFiles} / ~${summary.modifiedFiles} / -${summary.deletedFiles}`}
          color="var(--color-text-primary)"
        />
        <SummaryStat
          icon={<Plus size={16} />}
          label="Additions"
          value={summary.added}
          color="var(--color-success)"
        />
        <SummaryStat
          icon={<Minus size={16} />}
          label="Deletions"
          value={summary.removed}
          color="var(--color-error)"
        />
        <SummaryStat
          icon={<GitBranch size={16} />}
          label="Files Reviewed"
          value={Object.keys(decisions).length}
          detail={`/ ${summary.totalFiles}`}
          color="var(--color-accent)"
        />
      </div>
    </Card>
  )
}

function SummaryStat({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  detail?: string
  color: string
}): JSX.Element {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)] bg-opacity-50">
      <div className="mt-0.5" style={{ color }}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        <p className="text-lg font-bold" style={{ color }}>
          {value}
          {detail && <span className="text-xs font-normal text-[var(--color-text-muted)] ml-0.5">{detail}</span>}
        </p>
      </div>
    </div>
  )
}

function FileDiffView({
  file,
  index,
  isExpanded,
  onToggle,
  decision,
}: {
  file: DiffFile
  index: number
  isExpanded: boolean
  onToggle: () => void
  decision?: ReviewState
}): JSX.Element {
  const oldLines = file.oldCode.split('\n')
  const newLines = file.newCode.split('\n')

  const additions = useMemo(
    () => newLines.filter((l, i) => l !== oldLines[i]).length,
    [oldLines, newLines]
  )
  const deletions = useMemo(
    () => oldLines.filter((l, i) => l !== newLines[i]).length,
    [oldLines, newLines]
  )

  const statusColor =
    file.status === 'added'
      ? 'var(--color-success)'
      : file.status === 'deleted'
        ? 'var(--color-error)'
        : 'var(--color-warning)'

  const statusLabel =
    file.status === 'added'
      ? 'Added'
      : file.status === 'deleted'
        ? 'Deleted'
        : 'Modified'

  return (
    <motion.div
      layout
      className="rounded-lg border border-[var(--color-border)] overflow-hidden"
    >
      {/* File header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
          isExpanded
            ? 'bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]'
            : 'bg-[var(--color-surface)] hover:bg-[var(--color-bg-tertiary)]'
        )}
      >
        {isExpanded ? (
          <ChevronDown size={14} className="text-[var(--color-text-muted)] shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-[var(--color-text-muted)] shrink-0" />
        )}
        <FileCode size={14} className="text-[var(--color-accent)] shrink-0" />
        <span className="flex-1 text-sm font-mono text-[var(--color-text-primary)] truncate">
          {file.path}
        </span>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
            color: statusColor,
          }}
        >
          {statusLabel}
        </span>
        <span className="text-xs shrink-0">
          <span className="text-[var(--color-success)]">+{additions}</span>
          {' '}
          <span className="text-[var(--color-error)]">-{deletions}</span>
        </span>
        {decision && (
          <span className="text-xs text-[var(--color-accent)] font-medium shrink-0">
            {decision === 'approve' ? 'Approved' : decision === 'changes' ? 'Changes' : 'Commented'}
          </span>
        )}
      </button>

      {/* Diff content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--color-bg-primary)]">
              {new Array(Math.max(oldLines.length, newLines.length)).fill(null).map((_, lineIdx) => {
                const oldLine = lineIdx < oldLines.length ? oldLines[lineIdx] : null
                const newLine = lineIdx < newLines.length ? newLines[lineIdx] : null
                const isAdded = oldLine === null && newLine !== null
                const isRemoved = oldLine !== null && newLine === null
                const isChanged = oldLine !== null && newLine !== null && oldLine !== newLine
                const lineBg = isAdded
                  ? 'var(--color-success-bg)'
                  : isRemoved
                    ? 'var(--color-error-bg)'
                    : isChanged
                      ? 'var(--color-warning-bg)'
                      : 'transparent'

                return (
                  <div
                    key={lineIdx}
                    className="flex items-start text-xs font-mono leading-5 min-h-[20px] hover:brightness-110 transition-all"
                    style={{ backgroundColor: lineBg }}
                  >
                    {/* Old line number */}
                    <span
                      className="w-[3.5em] text-right px-2 shrink-0 border-r border-[var(--color-border)] text-[var(--color-text-muted)] select-none py-px"
                    >
                      {oldLine !== null ? lineIdx + 1 : ''}
                    </span>
                    {/* New line number */}
                    <span
                      className="w-[3.5em] text-right px-2 shrink-0 border-r border-[var(--color-border)] text-[var(--color-text-muted)] select-none py-px"
                    >
                      {newLine !== null ? lineIdx + 1 : ''}
                    </span>
                    {/* Glyph */}
                    <span
                      className="w-5 text-center shrink-0 select-none font-bold py-px"
                      style={{
                        color: isAdded
                          ? 'var(--color-success)'
                          : isRemoved
                            ? 'var(--color-error)'
                            : isChanged
                              ? 'var(--color-warning)'
                              : 'var(--color-text-muted)',
                      }}
                    >
                      {isAdded ? '+' : isRemoved ? '-' : isChanged ? '~' : ' '}
                    </span>
                    {/* Content */}
                    <span
                      className="flex-1 pl-2 pr-4 overflow-hidden text-ellipsis whitespace-pre py-px"
                      style={{
                        color: isAdded
                          ? 'var(--color-success)'
                          : isRemoved
                            ? 'var(--color-error)'
                            : 'var(--color-text-primary)',
                      }}
                    >
                      {(newLine ?? oldLine ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ReviewActionBar({
  reviewState,
  onSetReviewState,
  onCancelReview,
  onPendingComment,
  hasPendingComment,
}: {
  reviewState: ReviewState | null
  onSetReviewState: (s: ReviewState) => void
  onCancelReview: () => void
  onPendingComment: boolean
  hasPendingComment: boolean
}): JSX.Element {
  const options: { value: ReviewState; label: string; icon: React.ReactNode; color: string }[] = [
    {
      value: 'comment',
      label: 'Comment',
      icon: <MessageSquare size={14} />,
      color: 'var(--color-info)',
    },
    {
      value: 'approve',
      label: 'Approve',
      icon: <ThumbsUp size={14} />,
      color: 'var(--color-success)',
    },
    {
      value: 'changes',
      label: 'Request Changes',
      icon: <AlertCircle size={14} />,
      color: 'var(--color-error)',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-1 rounded-lg bg-[var(--color-bg-tertiary)]"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSetReviewState(opt.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
            reviewState === opt.value
              ? 'text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
          )}
          style={
            reviewState === opt.value
              ? { backgroundColor: opt.color }
              : undefined
          }
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
      <div className="flex-1" />
      {reviewState && (
        <button
          onClick={onCancelReview}
          className="px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Cancel
        </button>
      )}
    </motion.div>
  )
}

function ReviewCommentInput({
  reviewState,
  isSubmitting,
  onSubmit,
}: {
  reviewState: ReviewState | null
  isSubmitting: boolean
  onSubmit: (body: string) => void
}): JSX.Element {
  const [text, setText] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return
    onSubmit(text.trim())
    setText('')
  }, [text, onSubmit])

  const placeholder =
    reviewState === 'approve'
      ? 'Leave an approval comment (optional)...'
      : reviewState === 'changes'
        ? 'Describe what changes are needed...'
        : 'Leave a general comment...'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div
        className={cn(
          'rounded-lg border transition-all duration-200 overflow-hidden',
          isFocused
            ? 'border-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent)]'
            : 'border-[var(--color-border)]'
        )}
      >
        <textarea
          className="w-full bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none resize-y min-h-[80px] max-h-[240px]"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-text-muted)]">
          {reviewState ? `Submitting as "${reviewState}" review` : 'Comment only'}
          {' · '}⌘⏎ to submit
        </span>
        <Button
          variant="primary"
          size="sm"
          icon={isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
          disabled={!text.trim() || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Submitting...' : reviewState === 'approve' ? 'Approve' : reviewState === 'changes' ? 'Request Changes' : 'Comment'}
        </Button>
      </div>
    </motion.div>
  )
}

function ReviewersSection({
  reviewers,
  onToggle,
  onRequest,
}: {
  reviewers: SuggestedReviewer[]
  onToggle: (login: string) => void
  onRequest: () => void
}): JSX.Element {
  const selectedCount = reviewers.filter((r) => r.selected).length

  return (
    <Card variant="default" padding="lg">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
        <Users size={14} className="text-[var(--color-accent)]" />
        Suggested Reviewers
      </h3>
      <div className="space-y-1 mb-3">
        {reviewers.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] py-2 text-center">
            No reviewers available
          </p>
        ) : (
          reviewers.map((reviewer) => (
            <motion.button
              key={reviewer.login}
              layout
              onClick={() => onToggle(reviewer.login)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200',
                reviewer.selected
                  ? 'bg-[var(--color-accent-subtle)] border border-[rgba(108,92,231,0.3)]'
                  : 'hover:bg-[var(--color-bg-tertiary)] border border-transparent'
              )}
              whileTap={{ scale: 0.98 }}
            >
              {/* Avatar placeholder */}
              <div className="w-7 h-7 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0 overflow-hidden">
                {reviewer.avatarUrl ? (
                  <img src={reviewer.avatarUrl} alt={reviewer.login} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {reviewer.login.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {reviewer.login}
                  {reviewer.selected && (
                    <Badge variant="accent" size="sm" className="ml-2">Selected</Badge>
                  )}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {reviewer.contributions} contributions
                  {reviewer.reviewCount !== undefined && ` · ${reviewer.reviewCount} reviews`}
                </p>
              </div>
              <UserCheck
                size={16}
                className={cn(
                  'shrink-0 transition-colors',
                  reviewer.selected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                )}
              />
            </motion.button>
          ))
        )}
      </div>
      {selectedCount > 0 && (
        <Button
          variant="secondary"
          size="sm"
          icon={<Users size={14} />}
          fullWidth
          onClick={onRequest}
        >
          Request {selectedCount} reviewer{selectedCount > 1 ? 's' : ''}
        </Button>
      )}
    </Card>
  )
}

function ExistingCommentsSection({
  comments,
  onResolve,
}: {
  comments: ReviewComment[]
  onResolve: (id: string) => void
}): JSX.Element {
  if (comments.length === 0) return <></>

  return (
    <Card variant="default" padding="lg">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
        <MessageSquare size={14} className="text-[var(--color-accent)]" />
        Comments ({comments.length})
      </h3>
      <div className="space-y-3">
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'p-3 rounded-lg border',
              comment.resolved
                ? 'border-[var(--color-success)] bg-[var(--color-success-bg)] bg-opacity-30'
                : 'border-[var(--color-border)] bg-[var(--color-surface)]'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0 overflow-hidden">
                {comment.authorAvatar ? (
                  <img src={comment.authorAvatar} alt={comment.author} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">
                    {comment.author.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{comment.author}</span>
                  {comment.filePath && (
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono truncate">
                      {comment.filePath}:{comment.lineNumber}
                    </span>
                  )}
                  {comment.resolved && (
                    <Badge variant="success" size="sm">Resolved</Badge>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap">{comment.body}</p>
              </div>
              {!comment.resolved && (
                <button
                  onClick={() => onResolve(comment.id)}
                  className="shrink-0 px-2 py-1 text-[10px] font-medium text-[var(--color-success)] hover:bg-[var(--color-success-bg)] rounded transition-colors"
                >
                  Resolve
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// PRReview Main Component
// ---------------------------------------------------------------------------

/**
 * PRReview — Full-featured pull request review interface.
 *
 * Provides diff summary, per-file diff view, approve/request changes/comment actions,
 * review comment input, suggested reviewers, CI status badges, and merge button.
 * All transitions are animated with framer-motion.
 */
export function PRReview({
  prNumber,
  title,
  body,
  author,
  baseBranch,
  headBranch,
  diffFiles,
  reviewDecision = 'pending',
  ciJobs = [],
  existingComments = [],
  suggestedReviewers = [],
  allChecksPassed = false,
  isMerging = false,
  isAuthor = false,
  onSubmitReview,
  onMerge,
  onAddComment,
  onResolveComment,
  onRequestReviewers,
  onRefreshCI,
  className,
}: PRReviewProps): JSX.Element {
  // ──── State ────
  const [expandedFiles, setExpandedFiles] = useState<Record<number, boolean>>({})
  const [reviewState, setReviewState] = useState<ReviewState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileDecisions, setFileDecisions] = useState<Record<number, ReviewState>>({})

  // ──── Toggle file expansion ────
  const toggleFile = useCallback((index: number) => {
    setExpandedFiles((prev) => ({ ...prev, [index]: !prev[index] }))
  }, [])

  // ──── Handle review state change ────
  const handleSetReviewState = useCallback((state: ReviewState) => {
    setReviewState((prev) => (prev === state ? null : state))
  }, [])

  // ──── Cancel review ────
  const handleCancelReview = useCallback(() => {
    setReviewState(null)
  }, [])

  // ──── Submit review ────
  const handleSubmitReview = useCallback(
    async (body: string) => {
      if (!reviewState) return
      setIsSubmitting(true)
      try {
        await onSubmitReview(reviewState, body)
        setReviewState(null)
      } finally {
        setIsSubmitting(false)
      }
    },
    [reviewState, onSubmitReview]
  )

  // ──── Toggle reviewer selection ────
  const handleToggleReviewer = useCallback(
    (login: string) => {
      onRequestReviewers([login])
    },
    [onRequestReviewers]
  )

  // ──── CI summary ────
  const ciSummary = useMemo(() => {
    const total = ciJobs.length
    const passed = ciJobs.filter((j) => j.status === 'passed').length
    const failed = ciJobs.filter((j) => j.status === 'failed').length
    const running = ciJobs.filter((j) => j.status === 'running').length
    return { total, passed, failed, running }
  }, [ciJobs])

  // ──── Review decision display ────
  const decisionConfig: Record<ReviewDecision, { label: string; color: string; icon: typeof CheckCircle }> = {
    approved: { label: 'Approved', color: 'var(--color-success)', icon: CheckCircle },
    changes_requested: { label: 'Changes Requested', color: 'var(--color-error)', icon: AlertCircle },
    pending: { label: 'Awaiting Review', color: 'var(--color-text-muted)', icon: Clock },
    dismissed: { label: 'Review Dismissed', color: 'var(--color-text-secondary)', icon: EyeOff },
  }
  const decisionInfo = decisionConfig[reviewDecision]
  const DecisionIcon = decisionInfo.icon

  return (
    <AnimatedContainer animation="slideUp">
      <div className={cn('space-y-6', className)}>
        {/* ──── Header ──── */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <GitPullRequest size={20} className="text-[var(--color-accent)] shrink-0" />
              <h1 className="text-xl font-bold text-[var(--color-text-primary)] truncate">
                {title}
              </h1>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              #{prNumber} · {author} wants to merge{' '}
              <span className="font-mono text-[var(--color-accent)]">{headBranch}</span>
              {' → '}
              <span className="font-mono">{baseBranch}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border"
              style={{
                backgroundColor: `color-mix(in srgb, ${decisionInfo.color} 15%, transparent)`,
                color: decisionInfo.color,
                borderColor: `color-mix(in srgb, ${decisionInfo.color} 30%, transparent)`,
              }}
            >
              <DecisionIcon size={14} />
              {decisionInfo.label}
            </span>
          </div>
        </div>

        {/* ──── Body (if any) ──── */}
        {body && (
          <AnimatedItem>
            <Card variant="default" padding="lg">
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                {body}
              </p>
            </Card>
          </AnimatedItem>
        )}

        {/* ──── Diff Summary ──── */}
        <AnimatedItem>
          <DiffSummaryCard diffFiles={diffFiles} decisions={fileDecisions} />
        </AnimatedItem>

        {/* ──── CI Status ──── */}
        {ciJobs.length > 0 && (
          <AnimatedItem>
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <CircleDot size={14} className="text-[var(--color-accent)]" />
                  CI Checks
                  <span className="text-xs font-normal text-[var(--color-text-muted)]">
                    {ciSummary.passed}/{ciSummary.total} passed
                    {ciSummary.running > 0 && ` · ${ciSummary.running} running`}
                    {ciSummary.failed > 0 && ` · ${ciSummary.failed} failed`}
                  </span>
                </h3>
                {onRefreshCI && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RefreshCw size={12} />}
                    onClick={onRefreshCI}
                  >
                    Refresh
                  </Button>
                )}
              </div>
              <div className="space-y-1.5">
                {ciJobs.map((job, idx) => (
                  <CIStatusBadge key={idx} job={job} />
                ))}
              </div>
            </Card>
          </AnimatedItem>
        )}

        {/* ──── File-by-file Diffs ──── */}
        <AnimatedItem>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <FileCode size={14} className="text-[var(--color-accent)]" />
              Changed Files ({diffFiles.length})
            </h3>
            {diffFiles.map((file, idx) => (
              <FileDiffView
                key={`${file.path}-${idx}`}
                file={file}
                index={idx}
                isExpanded={expandedFiles[idx] ?? false}
                onToggle={() => toggleFile(idx)}
                decision={fileDecisions[idx]}
              />
            ))}
          </div>
        </AnimatedItem>

        {/* ──── Existing Comments ──── */}
        <AnimatedItem>
          <ExistingCommentsSection comments={existingComments} onResolve={onResolveComment} />
        </AnimatedItem>

        {/* ──── Side-by-side: Reviewers + Review Actions ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Suggested Reviewers */}
          <div className="lg:col-span-1">
            <AnimatedItem>
              <ReviewersSection
                reviewers={suggestedReviewers}
                onToggle={handleToggleReviewer}
                onRequest={() =>
                  onRequestReviewers(
                    suggestedReviewers.filter((r) => r.selected).map((r) => r.login)
                  )
                }
              />
            </AnimatedItem>
          </div>

          {/* Review Actions */}
          <div className="lg:col-span-2 space-y-4">
            {!isAuthor && (
              <AnimatedItem>
                <ReviewActionBar
                  reviewState={reviewState}
                  onSetReviewState={handleSetReviewState}
                  onCancelReview={handleCancelReview}
                  onPendingComment={false}
                  hasPendingComment={false}
                />
              </AnimatedItem>
            )}

            <AnimatePresence mode="wait">
              {reviewState && (
                <motion.div
                  key="review-input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ReviewCommentInput
                    reviewState={reviewState}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmitReview}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Merge Button */}
            <AnimatedItem>
              <Card variant="default" padding="lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {allChecksPassed
                        ? 'All checks have passed'
                        : 'Waiting for checks to pass'}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {allChecksPassed
                        ? 'This branch has no conflicts with the base branch'
                        : ciSummary.failed > 0
                          ? `${ciSummary.failed} check${ciSummary.failed > 1 ? 's' : ''} failed`
                          : 'Checks are still running'}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    icon={
                      isMerging ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <GitMerge size={16} />
                      )
                    }
                    disabled={!allChecksPassed || isMerging || reviewDecision === 'changes_requested'}
                    onClick={onMerge}
                  >
                    {isMerging ? 'Merging...' : 'Merge Pull Request'}
                  </Button>
                </div>
              </Card>
            </AnimatedItem>
          </div>
        </div>
      </div>
    </AnimatedContainer>
  )
}

export default PRReview