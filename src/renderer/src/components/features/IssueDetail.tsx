import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bug,
  MessageSquare,
  Tag,
  Milestone,
  User,
  GitPullRequest,
  GitBranch,
  GitMerge,
  Calendar,
  ArrowLeft,
  CheckCircle,
  Circle,
  Lock,
  Unlock,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { AnimatedContainer, AnimatedItem } from '../ui/AnimatedContainer'
import { cn, formatRelativeTime } from '../../lib/utils'
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IssueState = 'open' | 'closed'

export interface IssueLabel {
  name: string
  color: string
  description?: string
}

export interface IssueComment {
  id: string
  author: string
  authorAvatar?: string
  body: string
  createdAt: number
  isEdited?: boolean
}

export interface LinkedPR {
  number: number
  title: string
  state: 'open' | 'closed' | 'merged'
}

export interface IssueDetailProps {
  /** Issue number */
  issueNumber: number
  /** Issue title */
  title: string
  /** Issue body/description (markdown supported) */
  body?: string
  /** Current state */
  state: IssueState
  /** Author of the issue */
  author: string
  /** Author avatar URL */
  authorAvatar?: string
  /** When the issue was created */
  createdAt: number
  /** When the issue was last updated */
  updatedAt: number
  /** Labels applied to this issue */
  labels: IssueLabel[]
  /** Milestone name */
  milestone?: string
  /** Current assignees */
  assignees: string[]
  /** Linked pull requests */
  linkedPRs: LinkedPR[]
  /** Existing comments */
  comments: IssueComment[]
  /** Whether the issue is locked */
  isLocked?: boolean
  /** Whether the current user is assigned */
  isAssignedToMe?: boolean
  /** Whether an action is in progress */
  isActionLoading?: boolean
  /** Called to toggle assignment to current user */
  onAssignToMe?: () => Promise<void>
  /** Called to start working on this issue */
  onStartWorking?: () => Promise<void>
  /** Called to create a branch for this issue */
  onCreateBranch?: () => Promise<void>
  /** Called to toggle issue lock */
  onToggleLock?: () => Promise<void>
  /** Called to close/reopen the issue */
  onToggleState?: () => Promise<void>
  /** Called to add a comment */
  onAddComment?: (body: string) => Promise<void>
  /** Called when the back button is pressed */
  onBack?: () => void
  /** Additional class name */
  className?: string
}

// ---------------------------------------------------------------------------
// Simple Markdown Rendering
// ---------------------------------------------------------------------------

function renderMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener noreferrer">$1</a>')
    // Task lists
    .replace(/^- \[ \] (.+)$/gm, '<label class="task-list-item"><input type="checkbox" disabled /> $1</label>')
    .replace(/^- \[x\] (.+)$/gm, '<label class="task-list-item"><input type="checkbox" disabled checked /> $1</label>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="md-hr" />')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="md-paragraph">')
    // Line breaks
    .replace(/\n/g, '<br />')
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function IssueStatusBadge({ state }: { state: IssueState }): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full',
        state === 'open'
          ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
          : 'bg-[var(--color-text-muted)] bg-opacity-20 text-[var(--color-text-muted)]'
      )}
    >
      {state === 'open' ? (
        <Circle size={12} className="fill-current" />
      ) : (
        <CheckCircle size={12} />
      )}
      {state === 'open' ? 'Open' : 'Closed'}
    </span>
  )
}

function AssigneeAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }): JSX.Element {
  const sizeClass = size === 'md' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs'

  return (
    <div
      className={cn(
        'rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0 overflow-hidden border-2 border-[var(--color-border)]',
        sizeClass
      )}
      title={name}
    >
      <span className="font-medium text-[var(--color-text-secondary)]">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

function CommentThread({
  comment,
}: {
  comment: IssueComment
}): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      {/* Author Avatar */}
      <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0 overflow-hidden">
        {comment.authorAvatar ? (
          <img src={comment.authorAvatar} alt={comment.author} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {comment.author.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Comment Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {comment.author}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.isEdited && (
            <span className="text-[10px] text-[var(--color-text-muted)] italic">edited</span>
          )}
        </div>
        <div
          className="text-sm text-[var(--color-text-secondary)] leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.body) }}
        />
      </div>
    </motion.div>
  )
}

function LabelBadge({ label }: { label: IssueLabel }): JSX.Element {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0"
      style={{
        backgroundColor: `${label.color}20`,
        color: label.color,
        borderColor: `${label.color}40`,
      }}
      title={label.description}
    >
      {label.name}
    </span>
  )
}

function LinkedPRBadge({ pr }: { pr: LinkedPR }): JSX.Element {
  const stateConfig = {
    open: { color: 'var(--color-success)', icon: GitPullRequest },
    closed: { color: 'var(--color-text-muted)', icon: GitPullRequest },
    merged: { color: 'var(--color-accent)', icon: GitMerge },
  }

  const cfg = stateConfig[pr.state]
  const Icon = cfg.icon

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
      <Icon size={14} style={{ color: cfg.color }} />
      <span className="flex-1 text-xs text-[var(--color-text-primary)] truncate">{pr.title}</span>
      <span className="text-[10px] font-mono text-[var(--color-text-muted)]">#{pr.number}</span>
    </div>
  )
}

function CommentInput({
  onSubmit,
}: {
  onSubmit: (body: string) => Promise<void>
}): JSX.Element {
  const [text, setText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit(text.trim())
      setText('')
    } finally {
      setIsSubmitting(false)
    }
  }, [text, isSubmitting, onSubmit])

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'rounded-lg border transition-all duration-200 overflow-hidden',
          isFocused
            ? 'border-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent)]'
            : 'border-[var(--color-border)]'
        )}
      >
        <textarea
          className="w-full bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none resize-y min-h-[100px] max-h-[300px]"
          placeholder="Leave a comment..."
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
          Supports GitHub Flavored Markdown · ⌘⏎ to submit
        </span>
        <Button
          variant="primary"
          size="sm"
          icon={isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
          disabled={!text.trim() || isSubmitting}
          onClick={handleSubmit}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Posting...' : 'Comment'}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// IssueDetail Main Component
// ---------------------------------------------------------------------------

/**
 * IssueDetail — Full issue detail view with description, comments thread,
 * labels, milestone, assignees, status, linked PRs, and action buttons.
 */
export function IssueDetail({
  issueNumber,
  title,
  body,
  state,
  author,
  authorAvatar,
  createdAt,
  updatedAt,
  labels = [],
  milestone,
  assignees = [],
  linkedPRs = [],
  comments = [],
  isLocked = false,
  isAssignedToMe = false,
  isActionLoading = false,
  onAssignToMe,
  onStartWorking,
  onCreateBranch,
  onToggleLock,
  onToggleState,
  onAddComment,
  onBack,
  className,
}: IssueDetailProps): JSX.Element {
  const [showMetadata, setShowMetadata] = useState(true)

  const handleAddComment = useCallback(
    async (body: string) => {
      if (!onAddComment) return
      await onAddComment(body)
    },
    [onAddComment]
  )

  return (
    <AnimatedContainer animation="slideUp">
      <div className={cn('space-y-6', className)}>
        {/* ──── Back button ──── */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Issues
          </button>
        )}

        {/* ──── Header ──── */}
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <Bug size={20} className="text-[var(--color-accent)] shrink-0" />
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <IssueStatusBadge state={state} />
              <span>
                <span className="font-mono">#{issueNumber}</span>
              </span>
              <span>
                {author} opened {formatRelativeTime(createdAt)}
              </span>
              <span>· updated {formatRelativeTime(updatedAt)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleState && (
              <Button
                variant={state === 'open' ? 'secondary' : 'primary'}
                size="sm"
                icon={state === 'open' ? <CheckCircle size={14} /> : <Unlock size={14} />}
                onClick={onToggleState}
                loading={isActionLoading}
              >
                {state === 'open' ? 'Close Issue' : 'Reopen'}
              </Button>
            )}
            {onToggleLock && (
              <Button
                variant="ghost"
                size="sm"
                icon={isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                onClick={onToggleLock}
                title={isLocked ? 'Unlock conversation' : 'Lock conversation'}
              />
            )}
          </div>
        </div>

        {/* ──── Main Content Grid ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Description + Comments */}
          <div className="lg:col-span-3 space-y-4">
            {/* Issue Description */}
            {body && (
              <AnimatedItem>
                <Card variant="default" padding="lg">
                  {/* Author header */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--color-border)]">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0 overflow-hidden">
                      {authorAvatar ? (
                        <img src={authorAvatar} alt={author} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                          {author.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{author}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatRelativeTime(createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Description body with markdown */}
                  <div
                    className="text-sm text-[var(--color-text-secondary)] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
                  />

                  {/* Inline styles for markdown rendering */}
                  <style>{`
                    .md-h1 { font-size: 1.25rem; font-weight: 700; color: var(--color-text-primary); margin: 1rem 0 0.5rem; }
                    .md-h2 { font-size: 1.1rem; font-weight: 600; color: var(--color-text-primary); margin: 0.75rem 0 0.375rem; }
                    .md-h3 { font-size: 1rem; font-weight: 600; color: var(--color-text-primary); margin: 0.5rem 0 0.25rem; }
                    .md-paragraph { margin-bottom: 0.75rem; }
                    .md-link { color: var(--color-accent); text-decoration: underline; text-underline-offset: 2px; }
                    .md-link:hover { opacity: 0.85; }
                    .md-blockquote { border-left: 3px solid var(--color-accent); padding-left: 1rem; margin: 0.5rem 0; color: var(--color-text-secondary); font-style: italic; }
                    .md-hr { border: none; border-top: 1px solid var(--color-border); margin: 1rem 0; }
                    .md-li { list-style: disc; margin-left: 1.5rem; padding-left: 0.25rem; margin-bottom: 0.25rem; }
                    .task-list-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-bottom: 0.25rem; cursor: default; }
                    .code-block { background: var(--color-bg-tertiary); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1rem; overflow-x: auto; font-size: 0.8125rem; line-height: 1.5; margin: 0.75rem 0; }
                    .code-block code { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
                    .inline-code { background: var(--color-bg-tertiary); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8125rem; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
                    del { text-decoration: line-through; opacity: 0.7; }
                  `}</style>
                </Card>
              </AnimatedItem>
            )}

            {/* Comments Section */}
            <AnimatedItem>
              <Card variant="default" padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <MessageSquare size={14} className="text-[var(--color-accent)]" />
                    Comments ({comments.length})
                  </h3>
                </div>

                {comments.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquare size={32} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
                    <p className="text-sm text-[var(--color-text-muted)]">No comments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <CommentThread key={comment.id} comment={comment} />
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                {onAddComment && !isLocked && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <CommentInput onSubmit={handleAddComment} />
                  </div>
                )}

                {isLocked && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-bg-tertiary)] text-xs text-[var(--color-text-muted)]">
                      <Lock size={14} />
                      This conversation has been locked. New comments cannot be added.
                    </div>
                  </div>
                )}
              </Card>
            </AnimatedItem>
          </div>

          {/* Right: Sidebar Metadata */}
          <div className="lg:col-span-1 space-y-4">
            {/* Toggle metadata visibility on mobile */}
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="flex lg:hidden items-center gap-2 w-full px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]"
            >
              {showMetadata ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showMetadata ? 'Hide Details' : 'Show Details'}
            </button>

            <AnimatePresence>
              {showMetadata && (
                <motion.div
                  className="space-y-4 overflow-hidden lg:block"
                >
                  {/* Action Buttons */}
                  <AnimatedItem>
                    <Card variant="default" padding="md">
                      <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                        Actions
                      </h3>
                      <div className="space-y-2">
                        {onAssignToMe && (
                          <Button
                            variant={isAssignedToMe ? 'secondary' : 'outline'}
                            size="sm"
                            icon={<User size={14} />}
                            fullWidth
                            onClick={onAssignToMe}
                            loading={isActionLoading}
                          >
                            {isAssignedToMe ? 'Assigned to me' : 'Assign to me'}
                          </Button>
                        )}
                        {onStartWorking && state === 'open' && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<GitBranch size={14} />}
                            fullWidth
                            onClick={onStartWorking}
                            loading={isActionLoading}
                          >
                            Start Working
                          </Button>
                        )}
                        {onCreateBranch && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<GitBranch size={14} />}
                            fullWidth
                            onClick={onCreateBranch}
                            loading={isActionLoading}
                          >
                            Create Branch
                          </Button>
                        )}
                      </div>
                    </Card>
                  </AnimatedItem>

                  {/* Labels */}
                  {labels.length > 0 && (
                    <AnimatedItem>
                      <Card variant="default" padding="md">
                        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Tag size={12} />
                          Labels
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {labels.map((label) => (
                            <LabelBadge key={label.name} label={label} />
                          ))}
                        </div>
                      </Card>
                    </AnimatedItem>
                  )}

                  {/* Milestone */}
                  {milestone && (
                    <AnimatedItem>
                      <Card variant="default" padding="md">
                        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Milestone size={12} />
                          Milestone
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)]">
                          <Milestone size={14} className="text-[var(--color-accent)] shrink-0" />
                          <span className="text-sm text-[var(--color-text-primary)]">{milestone}</span>
                        </div>
                      </Card>
                    </AnimatedItem>
                  )}

                  {/* Assignees */}
                  <AnimatedItem>
                    <Card variant="default" padding="md">
                      <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <User size={12} />
                        Assignees
                      </h3>
                      {assignees.length === 0 ? (
                        <p className="text-xs text-[var(--color-text-muted)] italic">No one assigned</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {assignees.map((assignee) => (
                            <AssigneeAvatar key={assignee} name={assignee} />
                          ))}
                        </div>
                      )}
                    </Card>
                  </AnimatedItem>

                  {/* Linked PRs */}
                  {linkedPRs.length > 0 && (
                    <AnimatedItem>
                      <Card variant="default" padding="md">
                        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <GitPullRequest size={12} />
                          Linked PRs
                        </h3>
                        <div className="space-y-1.5">
                          {linkedPRs.map((pr) => (
                            <LinkedPRBadge key={pr.number} pr={pr} />
                          ))}
                        </div>
                      </Card>
                    </AnimatedItem>
                  )}

                  {/* Dates */}
                  <AnimatedItem>
                    <Card variant="default" padding="md">
                      <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Calendar size={12} />
                        Dates
                      </h3>
                      <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-[var(--color-text-muted)]" />
                          Created {formatRelativeTime(createdAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-[var(--color-text-muted)]" />
                          Updated {formatRelativeTime(updatedAt)}
                        </div>
                      </div>
                    </Card>
                  </AnimatedItem>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AnimatedContainer>
  )
}

export default IssueDetail