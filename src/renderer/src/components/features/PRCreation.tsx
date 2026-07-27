import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitPullRequest,
  FileCode,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Edit3,
  Link,
  Users,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  GitBranch,
  Github,
  List
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { ScrollArea } from '../ui/ScrollArea'
import { EmptyState } from '../ui/EmptyState'
import { AnimatedContainer, AnimatedItem } from '../ui/AnimatedContainer'
import { cn } from '../../lib/utils'
import type { DiffFile } from '../editor/DiffViewer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PRType = 'fix' | 'feature' | 'chore' | 'docs' | 'refactor' | 'test' | 'other'

export interface PRCreationProps {
  /** The base branch (e.g. 'main', 'develop') */
  baseBranch: string
  /** The feature/head branch (e.g. 'feat/new-api') */
  headBranch: string
  /** Owner of the repository */
  repoOwner: string
  /** Repository name */
  repoName: string
  /** Files with diffs to summarise in the PR */
  diffFiles: DiffFile[]
  /** Open issues that can be linked */
  availableIssues?: LinkedIssue[]
  /** Available reviewers from git blame / org */
  availableReviewers?: Reviewer[]
  /** Called with the final PR payload */
  onCreatePR: (payload: PRCreationPayload) => Promise<void>
  /** Called to trigger AI generation */
  onGenerateDescription?: () => Promise<{ title: string; body: string } | null>
  /** Whether the creation is in progress */
  isCreating?: boolean
  /** Error from the creation attempt */
  createError?: string | null
  /** Optional pre-filled title */
  initialTitle?: string
  /** Optional pre-filled description */
  initialBody?: string
  /** Additional class name */
  className?: string
}

export interface LinkedIssue {
  number: number
  title: string
  state: 'open' | 'closed'
}

export interface Reviewer {
  login: string
  avatarUrl?: string
  contributions: number
  selected?: boolean
}

export interface PRCreationPayload {
  title: string
  body: string
  head: string
  base: string
  draft: boolean
  issueNumbers: number[]
  reviewers: string[]
}

// ---------------------------------------------------------------------------
// PR Type Detection (client-side helper)
// ---------------------------------------------------------------------------

const PR_TYPE_LABELS: Record<PRType, { label: string; color: string }> = {
  fix: { label: 'Bug Fix', color: 'var(--color-error)' },
  feature: { label: 'Feature', color: 'var(--color-success)' },
  chore: { label: 'Chore', color: 'var(--color-text-muted)' },
  docs: { label: 'Documentation', color: 'var(--color-info)' },
  refactor: { label: 'Refactor', color: 'var(--color-warning)' },
  test: { label: 'Testing', color: 'var(--color-accent)' },
  other: { label: 'Other', color: 'var(--color-text-secondary)' }
}

// ---------------------------------------------------------------------------
// PRCreation Component
// ---------------------------------------------------------------------------

/**
 * PRCreation — Full-featured pull request creation UI.
 *
 * Provides editable title & description, diff summary, draft toggle,
 * issue linking, reviewer selection, and a preview mode before submitting.
 */
export function PRCreation({
  baseBranch,
  headBranch,
  repoOwner,
  repoName,
  diffFiles,
  availableIssues = [],
  availableReviewers = [],
  onCreatePR,
  onGenerateDescription,
  isCreating = false,
  createError = null,
  initialTitle = '',
  initialBody = '',
  className
}: PRCreationProps): JSX.Element {
  // ──── State ────
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const [isDraft, setIsDraft] = useState(true)
  const [selectedIssues, setSelectedIssues] = useState<number[]>([])
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showIssueDropdown, setShowIssueDropdown] = useState(false)
  const [showReviewerDropdown, setShowReviewerDropdown] = useState(false)
  const [issueSearch, setIssueSearch] = useState('')
  const [reviewerSearch, setReviewerSearch] = useState('')
  const [activeSection, setActiveSection] = useState<'editor' | 'preview'>('editor')

  // ──── Diff summary ────
  const diffSummary = useMemo(() => {
    const added = diffFiles.reduce((sum, f) => {
      const addLines = f.newCode.split('\n').filter((l, i) => {
        const oldLines = f.oldCode.split('\n')
        return l !== oldLines[i]
      }).length
      return sum + addLines
    }, 0)
    const removed = diffFiles.reduce((sum, f) => {
      const remLines = f.oldCode.split('\n').filter((l, i) => {
        const newLines = f.newCode.split('\n')
        return l !== newLines[i]
      }).length
      return sum + remLines
    }, 0)

    return {
      totalFiles: diffFiles.length,
      added,
      removed,
      addedFiles: diffFiles.filter((f) => f.status === 'added').length,
      modifiedFiles: diffFiles.filter((f) => f.status === 'modified').length,
      deletedFiles: diffFiles.filter((f) => f.status === 'deleted').length
    }
  }, [diffFiles])

  // ──── Detect PR type from title ────
  const prType = useMemo((): PRType => {
    const t = title.trim().toLowerCase()
    if (/^(fix|bugfix|hotfix)[:(]?\s/.test(t)) return 'fix'
    if (/^(feat|feature)[:(]?\s/.test(t)) return 'feature'
    if (/^(chore|build|ci|deps)[:(]?\s/.test(t)) return 'chore'
    if (/^docs?(\(.+\))?[:]?\s/.test(t)) return 'docs'
    if (/^(refactor|refactoring)[:(]?\s/.test(t)) return 'refactor'
    if (/^tests?(\(.+\))?[:]?\s/.test(t)) return 'test'
    return 'other'
  }, [title])

  // ──── Filtered issues ────
  const filteredIssues = useMemo(() => {
    if (!issueSearch) return availableIssues
    const q = issueSearch.toLowerCase()
    return availableIssues.filter(
      (i) =>
        `#${i.number}`.includes(q) ||
        i.title.toLowerCase().includes(q)
    )
  }, [availableIssues, issueSearch])

  // ──── Filtered reviewers ────
  const filteredReviewers = useMemo(() => {
    if (!reviewerSearch) return availableReviewers
    const q = reviewerSearch.toLowerCase()
    return availableReviewers.filter((r) => r.login.toLowerCase().includes(q))
  }, [availableReviewers, reviewerSearch])

  // ──── Generate description ────
  const handleGenerate = useCallback(async () => {
    if (!onGenerateDescription) return
    setIsGenerating(true)
    try {
      const result = await onGenerateDescription()
      if (result) {
        if (result.title) setTitle(result.title)
        if (result.body) setBody(result.body)
      }
    } finally {
      setIsGenerating(false)
    }
  }, [onGenerateDescription])

  // ──── Toggle issue selection ────
  const toggleIssue = useCallback((num: number) => {
    setSelectedIssues((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    )
  }, [])

  // ──── Toggle reviewer selection ────
  const toggleReviewer = useCallback((login: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(login) ? prev.filter((l) => l !== login) : [...prev, login]
    )
  }, [])

  // ──── Submit ────
  const handleCreate = useCallback(async () => {
    if (!title.trim()) return
    await onCreatePR({
      title: title.trim(),
      body: body.trim(),
      head: headBranch,
      base: baseBranch,
      draft: isDraft,
      issueNumbers: selectedIssues,
      reviewers: selectedReviewers
    })
  }, [title, body, headBranch, baseBranch, isDraft, selectedIssues, selectedReviewers, onCreatePR])

  // ──── Compute preview body ────
  const previewBody = useMemo(() => {
    let preview = body
    if (selectedIssues.length > 0) {
      const closingLine = `Closes ${selectedIssues.map((n) => `#${n}`).join(', ')}`
      preview = preview.includes('Closes') ? preview : `${preview}\n\n---\n\n${closingLine}`
    }
    return preview
  }, [body, selectedIssues])

  return (
    <AnimatedContainer animation="slideUp">
      <div className={cn('space-y-6', className)}>
        {/* ──── Header ──── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              New Pull Request
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              <span className="font-mono">{repoOwner}/{repoName}</span>
              {' '}·{' '}
              <span className="font-mono text-[var(--color-accent)]">{headBranch}</span>
              {' → '}
              <span className="font-mono">{baseBranch}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={showPreview ? <Edit3 size={14} /> : <Eye size={14} />}
              onClick={() => {
                setShowPreview(!showPreview)
                setActiveSection(showPreview ? 'editor' : 'preview')
              }}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={isCreating ? <Loader2 size={14} className="animate-spin" /> : <GitPullRequest size={14} />}
              disabled={!title.trim() || isCreating}
              onClick={handleCreate}
            >
              {isCreating ? 'Creating...' : isDraft ? 'Create Draft PR' : 'Create PR'}
            </Button>
          </div>
        </div>

        {createError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-error-bg)] border border-[var(--color-error)] text-sm text-[var(--color-error)]">
            <AlertCircle size={16} />
            {createError}
          </div>
        )}

        {/* ──── Diff Summary ──── */}
        <AnimatedItem>
          <Card variant="default" padding="lg">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
              Diff Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SummaryStat
                icon={<FileCode size={16} />}
                label="Files Changed"
                value={diffSummary.totalFiles}
                color="var(--color-text-primary)"
              />
              <SummaryStat
                icon={<Plus size={16} />}
                label="Additions"
                value={diffSummary.added}
                color="var(--color-success)"
              />
              <SummaryStat
                icon={<Minus size={16} />}
                label="Deletions"
                value={diffSummary.removed}
                color="var(--color-error)"
              />
              <SummaryStat
                icon={<Badge variant={prType === 'other' ? 'default' : 'accent'} size="sm">
                  {PR_TYPE_LABELS[prType].label}
                </Badge>}
                label="PR Type"
                value={''}
                color="var(--color-text-secondary)"
              />
            </div>
            {diffFiles.length > 0 && (
              <div className="mt-3 space-y-1">
                {diffFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2 py-1 rounded text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                  >
                    <FileStatusDot status={file.status} />
                    <span className="truncate font-mono">{file.path}</span>
                    <span className="ml-auto shrink-0">
                      <span className="text-[var(--color-success)]">
                        +{file.newCode.split('\n').filter((l, i) => l !== file.oldCode.split('\n')[i]).length}
                      </span>
                      {' '}
                      <span className="text-[var(--color-error)]">
                        -{file.oldCode.split('\n').filter((l, i) => l !== file.newCode.split('\n')[i]).length}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </AnimatedItem>

        {/* ──── Editor / Preview ──── */}
        <AnimatePresence mode="wait">
          {activeSection === 'editor' ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Title */}
              <AnimatedItem>
                <Card variant="default" padding="lg">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                      Title
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge variant="accent" size="sm" dot>
                        {PR_TYPE_LABELS[prType].label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<RefreshCw size={12} />}
                        onClick={handleGenerate}
                        loading={isGenerating}
                      >
                        Auto-generate
                      </Button>
                    </div>
                  </div>
                  <input
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
                    placeholder="feat: Summarize your changes in one line..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {title.length}/200 · Conventional commit format recommended
                  </p>
                </Card>
              </AnimatedItem>

              {/* Body */}
              <AnimatedItem>
                <Card variant="default" padding="lg">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                      Description
                    </label>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Supports GitHub Flavored Markdown
                    </span>
                  </div>
                  <textarea
                    className="w-full h-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] resize-y font-mono"
                    placeholder="## Summary&#10;&#10;Describe what this PR does and why.&#10;&#10;## Changes&#10;- Bullet list of specific changes&#10;&#10;## Testing&#10;How were these changes verified?"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </Card>
              </AnimatedItem>

              {/* Options Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Draft Toggle */}
                <AnimatedItem>
                  <Card variant="default" padding="lg">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                      Options
                    </h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <button
                        role="switch"
                        aria-checked={isDraft}
                        onClick={() => setIsDraft(!isDraft)}
                        className={cn(
                          'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
                          isDraft
                            ? 'bg-[var(--color-accent)]'
                            : 'bg-[var(--color-bg-tertiary)]'
                        )}
                      >
                        <span
                          className={cn(
                            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition-transform',
                            isDraft ? 'translate-x-4' : 'translate-x-0'
                          )}
                        />
                      </button>
                      <div>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          Create as Draft
                        </span>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Draft PRs cannot be merged until marked ready
                        </p>
                      </div>
                    </label>
                  </Card>
                </AnimatedItem>

                {/* Issue Linking */}
                <AnimatedItem>
                  <Card variant="default" padding="lg">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                      Linked Issues
                    </h3>
                    <div className="relative">
                      <button
                        onClick={() => setShowIssueDropdown(!showIssueDropdown)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors"
                      >
                        <Link size={14} className="text-[var(--color-text-muted)]" />
                        {selectedIssues.length > 0
                          ? `${selectedIssues.length} issue${selectedIssues.length > 1 ? 's' : ''} linked`
                          : 'Link issues...'}
                      </button>

                      {showIssueDropdown && (
                        <div className="absolute z-20 mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden">
                          <div className="p-2 border-b border-[var(--color-border)]">
                            <input
                              className="w-full bg-[var(--color-bg-tertiary)] rounded px-2 py-1 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                              placeholder="Search issues..."
                              value={issueSearch}
                              onChange={(e) => setIssueSearch(e.target.value)}
                              autoFocus
                            />
                          </div>
                          <ScrollArea className="max-h-48">
                            {filteredIssues.length === 0 ? (
                              <div className="p-3 text-xs text-[var(--color-text-muted)] text-center">
                                No issues found
                              </div>
                            ) : (
                              filteredIssues.map((issue) => (
                                <button
                                  key={issue.number}
                                  onClick={() => toggleIssue(issue.number)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedIssues.includes(issue.number)}
                                    readOnly
                                    className="accent-[var(--color-accent)]"
                                  />
                                  <span className={cn(
                                    'w-2 h-2 rounded-full shrink-0',
                                    issue.state === 'open' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]'
                                  )} />
                                  <span className="text-[var(--color-text-primary)] truncate">
                                    #{issue.number} {issue.title}
                                  </span>
                                </button>
                              ))
                            )}
                          </ScrollArea>
                        </div>
                      )}
                    </div>

                    {selectedIssues.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedIssues.map((num) => (
                          <Badge key={num} variant="accent" size="sm">
                            #{num}
                            <button
                              onClick={() => toggleIssue(num)}
                              className="ml-1 hover:text-[var(--color-error)]"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </AnimatedItem>

                {/* Reviewer Selection */}
                <AnimatedItem>
                  <Card variant="default" padding="lg">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                      Reviewers
                    </h3>
                    <div className="relative">
                      <button
                        onClick={() => setShowReviewerDropdown(!showReviewerDropdown)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors"
                      >
                        <Users size={14} className="text-[var(--color-text-muted)]" />
                        {selectedReviewers.length > 0
                          ? `${selectedReviewers.length} reviewer${selectedReviewers.length > 1 ? 's' : ''} selected`
                          : 'Select reviewers...'}
                      </button>

                      {showReviewerDropdown && (
                        <div className="absolute z-20 mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden">
                          <div className="p-2 border-b border-[var(--color-border)]">
                            <input
                              className="w-full bg-[var(--color-bg-tertiary)] rounded px-2 py-1 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                              placeholder="Search reviewers..."
                              value={reviewerSearch}
                              onChange={(e) => setReviewerSearch(e.target.value)}
                              autoFocus
                            />
                          </div>
                          <ScrollArea className="max-h-48">
                            {filteredReviewers.length === 0 ? (
                              <div className="p-3 text-xs text-[var(--color-text-muted)] text-center">
                                No reviewers found
                              </div>
                            ) : (
                              filteredReviewers.map((reviewer) => (
                                <button
                                  key={reviewer.login}
                                  onClick={() => toggleReviewer(reviewer.login)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedReviewers.includes(reviewer.login)}
                                    readOnly
                                    className="accent-[var(--color-accent)]"
                                  />
                                  <div className="w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center text-[10px] font-medium text-[var(--color-accent)]">
                                    {reviewer.login.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-[var(--color-text-primary)]">
                                    {reviewer.login}
                                  </span>
                                  <span className="ml-auto text-[var(--color-text-muted)]">
                                    {reviewer.contributions} files
                                  </span>
                                </button>
                              ))
                            )}
                          </ScrollArea>
                        </div>
                      )}
                    </div>

                    {selectedReviewers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedReviewers.map((login) => (
                          <Badge key={login} variant="default" size="sm">
                            {login}
                            <button
                              onClick={() => toggleReviewer(login)}
                              className="ml-1 hover:text-[var(--color-error)]"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </AnimatedItem>
              </div>
            </motion.div>
          ) : (
            /* ──── Preview ──── */
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <AnimatedItem>
                <Card variant="default" padding="lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {title || 'Untitled PR'}
                      </h2>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        <Github size={12} className="inline mr-1" />
                        {repoOwner}/{repoName} · {headBranch} → {baseBranch}
                        {isDraft && <Badge variant="warning" size="sm" className="ml-2">Draft</Badge>}
                      </p>
                    </div>
                    <Badge variant="accent" size="sm">{PR_TYPE_LABELS[prType].label}</Badge>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-xs text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1">
                      <FileCode size={12} />
                      {diffSummary.totalFiles} files
                    </span>
                    <span className="text-[var(--color-success)]">
                      +{diffSummary.added}
                    </span>
                    <span className="text-[var(--color-error)]">
                      -{diffSummary.removed}
                    </span>
                    {selectedIssues.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Link size={12} />
                        {selectedIssues.map((n) => `#${n}`).join(', ')}
                      </span>
                    )}
                  </div>

                  {selectedReviewers.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Users size={12} className="text-[var(--color-text-muted)]" />
                      {selectedReviewers.map((r) => (
                        <Badge key={r} variant="default" size="sm">{r}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-[var(--color-border)] pt-4">
                    <div className="prose prose-invert max-w-none text-sm text-[var(--color-text-primary)] whitespace-pre-wrap font-mono">
                      {previewBody ? (
                        <RenderMarkdown text={previewBody} />
                      ) : (
                        <p className="text-[var(--color-text-muted)] italic">
                          No description provided.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </AnimatedItem>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedContainer>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryStat({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}): JSX.Element {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
      <div className="shrink-0" style={{ color }}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        {value !== '' && (
          <p className="text-sm font-semibold" style={{ color }}>
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

function FileStatusDot({ status }: { status: DiffFile['status'] }): JSX.Element {
  const colors: Record<string, string> = {
    added: 'bg-[var(--color-success)]',
    modified: 'bg-[var(--color-warning)]',
    deleted: 'bg-[var(--color-error)]'
  }
  return <span className={cn('w-2 h-2 rounded-full shrink-0', colors[status])} />
}

/**
 * Simple inline markdown renderer for the preview.
 * Renders basic GitHub-flavoured elements without pulling in the full
 * react-markdown stack for this component.
 */
function RenderMarkdown({ text }: { text: string }): JSX.Element {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Headers
    if (/^###\s/.test(trimmed)) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-[var(--color-text-primary)] mt-4 mb-2">
          {trimmed.replace(/^###\s+/, '')}
        </h3>
      )
      continue
    }
    if (/^##\s/.test(trimmed)) {
      elements.push(
        <h2 key={i} className="text-lg font-semibold text-[var(--color-text-primary)] mt-5 mb-2">
          {trimmed.replace(/^##\s+/, '')}
        </h2>
      )
      continue
    }

    // Horizontal rule
    if (/^---/.test(trimmed)) {
      elements.push(<hr key={i} className="my-3 border-[var(--color-border)]" />)
      continue
    }

    // Unordered list
    if (/^-\s/.test(trimmed)) {
      const items: string[] = [trimmed.replace(/^-\s+/, '')]
      while (i + 1 < lines.length && /^\s*-\s/.test(lines[i + 1])) {
        i++
        items.push(lines[i].trim().replace(/^-\s+/, ''))
      }
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-1 text-sm text-[var(--color-text-primary)] mb-2">
          {items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      )
      continue
    }

    // Empty line
    if (trimmed === '') {
      elements.push(<div key={i} className="h-2" />)
      continue
    }

    // Regular paragraph with inline code support
    const parts = trimmed.split(/(`[^`]+`)/g)
    const children = parts.map((part, j) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={j} className="px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-accent)] text-xs font-mono">
            {part.slice(1, -1)}
          </code>
        )
      }
      return <span key={j}>{part}</span>
    })

    elements.push(
      <p key={i} className="text-sm text-[var(--color-text-primary)] mb-1 leading-relaxed">
        {children}
      </p>
    )
  }

  return <div>{elements}</div>
}


