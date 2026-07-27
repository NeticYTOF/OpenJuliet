import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DiffIcon, Plus, Minus, AlertCircle, FileCode } from 'lucide-react'
import { cn } from '../../lib/utils'

/* ──── Types ──── */

export type FileStatus = 'added' | 'modified' | 'deleted'

export interface DiffFile {
  /** Path of the file being compared */
  path: string
  /** File status */
  status: FileStatus
  /** Old content (left side) */
  oldCode: string
  /** New content (right side) */
  newCode: string
}

export interface DiffViewerProps {
  /** Array of files with diffs */
  files: DiffFile[]
  /** Active file index to display */
  activeFileIndex?: number
  /** Called when a file in the summary is clicked */
  onFileClick?: (index: number) => void
  /** Called when the user accepts/rejects a diff */
  onAction?: (action: 'accept' | 'reject', fileIndex: number) => void
  /** Additional class names */
  className?: string
  /** Show file summary panel on the left */
  showSummary?: boolean
}

/* ──── Diff Parsing ──── */

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'changed-header'
  oldLineNum: number | null
  newLineNum: number | null
  content: string
}

function parseDiff(oldCode: string, newCode: string): DiffLine[] {
  const oldLines = oldCode.split('\n')
  const newLines = newCode.split('\n')
  const maxLen = Math.max(oldLines.length, newLines.length)
  const result: DiffLine[] = []

  /* Simple line-by-line diff using LCS-like approach */
  let oldIdx = 0
  let newIdx = 0

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length && oldLines[oldIdx] === newLines[newIdx]) {
      result.push({
        type: 'unchanged',
        oldLineNum: oldIdx + 1,
        newLineNum: newIdx + 1,
        content: oldLines[oldIdx],
      })
      oldIdx++
      newIdx++
    } else if (newIdx < newLines.length && (oldIdx >= oldLines.length || oldLines[oldIdx] !== newLines[newIdx])) {
      result.push({
        type: 'added',
        oldLineNum: null,
        newLineNum: newIdx + 1,
        content: newLines[newIdx],
      })
      newIdx++
    } else if (oldIdx < oldLines.length) {
      result.push({
        type: 'removed',
        oldLineNum: oldIdx + 1,
        newLineNum: null,
        content: oldLines[oldIdx],
      })
      oldIdx++
    }
  }

  return result
}

/* ──── Status Badge ──── */

function StatusBadge({ status }: { status: FileStatus }): JSX.Element {
  const config = {
    added: {
      label: 'Added',
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      icon: Plus,
    },
    modified: {
      label: 'Modified',
      bg: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
      icon: AlertCircle,
    },
    deleted: {
      label: 'Deleted',
      bg: 'var(--color-error-bg)',
      color: 'var(--color-error)',
      icon: Minus,
    },
  } as const

  const cfg = config[status]
  const Icon = cfg.icon

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  )
}

/* ──── Side-by-Side Line ──── */

interface DiffLineRowProps {
  line: DiffLine
  lineNumberWidth: string
}

function DiffLineRow({ line, lineNumberWidth }: DiffLineRowProps): JSX.Element {
  const bgColor =
    line.type === 'added'
      ? 'var(--color-success-bg)'
      : line.type === 'removed'
        ? 'var(--color-error-bg)'
        : 'transparent'

  const textColor =
    line.type === 'added'
      ? 'var(--color-success)'
      : line.type === 'removed'
        ? 'var(--color-error)'
        : 'var(--color-text-primary)'

  const glyph = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '

  return (
    <div
      className="flex items-center text-xs font-mono leading-5 min-h-[20px]"
      style={{ backgroundColor: bgColor }}
    >
      <span
        className="text-center shrink-0 border-r border-[var(--color-border)] text-[var(--color-text-muted)] select-none"
        style={{ width: lineNumberWidth }}
      >
        {line.oldLineNum ?? ''}
      </span>
      <span
        className="text-center shrink-0 border-r border-[var(--color-border)] text-[var(--color-text-muted)] select-none"
        style={{ width: lineNumberWidth }}
      >
        {line.newLineNum ?? ''}
      </span>
      <span
        className="shrink-0 w-4 text-center select-none font-bold"
        style={{ color: textColor }}
      >
        {glyph}
      </span>
      <span
        className="flex-1 pl-1 pr-2 overflow-hidden text-ellipsis whitespace-pre"
        style={{ color: textColor }}
      >
        {line.content}
      </span>
    </div>
  )
}

/* ──── DiffViewer Component ──── */

/**
 * DiffViewer — A side-by-side diff viewer with old vs new code,
 * line numbers, file status badges, and file summary navigation.
 */
export function DiffViewer({
  files,
  activeFileIndex = 0,
  onFileClick,
  onAction,
  className,
  showSummary = true,
}: DiffViewerProps): JSX.Element {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')
  const activeFile = files[activeFileIndex]

  /* Parse diff lines for the active file */
  const diffLines = useMemo(
    () => (activeFile ? parseDiff(activeFile.oldCode, activeFile.newCode) : []),
    [activeFile]
  )

  /* Compute line number column width based on total lines */
  const lineNumberWidth = useMemo(() => {
    const totalLines = Math.max(
      activeFile ? activeFile.oldCode.split('\n').length : 0,
      activeFile ? activeFile.newCode.split('\n').length : 0
    )
    const digits = Math.max(2, String(totalLines).length)
    return `${digits * 0.6 + 1}em`
  }, [activeFile])

  if (!activeFile) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]',
          className
        )}
      >
        <div className="text-center">
          <DiffIcon size={48} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-muted)]">No changes to display</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden',
        className
      )}
    >
      {/* ──── File Summary Panel ──── */}
      {showSummary && (
        <div className="flex flex-col w-56 bg-[var(--color-bg-tertiary)] border-r border-[var(--color-border)] shrink-0 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider border-b border-[var(--color-border)]">
            Changes
          </div>
          <div className="flex flex-col">
            {files.map((file, idx) => (
              <button
                key={`${file.path}-${idx}`}
                onClick={() => onFileClick?.(idx)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors border-b border-[var(--color-border)]',
                  idx === activeFileIndex
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-text-primary)] border-l-2 border-l-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
                )}
              >
                <FileCode size={14} className="shrink-0 text-[var(--color-accent)]" />
                <span className="flex-1 truncate">{file.path}</span>
                <StatusBadge status={file.status} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ──── Diff Content ──── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* ──── File Header ──── */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileCode size={16} className="shrink-0 text-[var(--color-accent)]" />
            <span className="text-sm font-mono text-[var(--color-text-primary)] truncate">
              {activeFile.path}
            </span>
            <StatusBadge status={activeFile.status} />
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-[var(--color-bg-primary)] rounded-md border border-[var(--color-border)] p-0.5">
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  'px-2 py-0.5 text-xs rounded transition-colors',
                  viewMode === 'split'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={cn(
                  'px-2 py-0.5 text-xs rounded transition-colors',
                  viewMode === 'unified'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                Unified
              </button>
            </div>

            {onAction && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onAction('reject', activeFileIndex)}
                  className="px-2 py-1 text-xs rounded bg-[var(--color-error-bg)] text-[var(--color-error)] hover:opacity-80 transition-opacity"
                >
                  Reject
                </button>
                <button
                  onClick={() => onAction('accept', activeFileIndex)}
                  className="px-2 py-1 text-xs rounded bg-[var(--color-success-bg)] text-[var(--color-success)] hover:opacity-80 transition-opacity"
                >
                  Accept
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ──── Diff Table ──── */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'split' ? (
            /* ── Split View ── */
            <div className="flex h-full">
              {/* Old (left) */}
              <div className="flex-1 border-r border-[var(--color-border)]">
                <div className="sticky top-0 z-10 px-3 py-1 text-xs font-semibold text-[var(--color-error)] bg-[var(--color-error-bg)] border-b border-[var(--color-border)]">
                  Old
                </div>
                {diffLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-center text-xs font-mono leading-5 min-h-[20px]"
                    style={{
                      backgroundColor:
                        line.type === 'removed' ? 'var(--color-error-bg)' : 'transparent',
                    }}
                  >
                    <span
                      className="text-center shrink-0 border-r border-[var(--color-border)] text-[var(--color-text-muted)] select-none"
                      style={{ width: lineNumberWidth }}
                    >
                      {line.oldLineNum ?? ''}
                    </span>
                    <span className="shrink-0 w-4 text-center select-none font-bold text-[var(--color-error)]">
                      {line.type === 'removed' ? '-' : ' '}
                    </span>
                    <span
                      className="flex-1 pl-1 pr-2 overflow-hidden text-ellipsis whitespace-pre"
                      style={{
                        color:
                          line.type === 'removed'
                            ? 'var(--color-error)'
                            : 'var(--color-text-primary)',
                      }}
                    >
                      {line.content}
                    </span>
                  </div>
                ))}
              </div>

              {/* New (right) */}
              <div className="flex-1">
                <div className="sticky top-0 z-10 px-3 py-1 text-xs font-semibold text-[var(--color-success)] bg-[var(--color-success-bg)] border-b border-[var(--color-border)]">
                  New
                </div>
                {diffLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-center text-xs font-mono leading-5 min-h-[20px]"
                    style={{
                      backgroundColor:
                        line.type === 'added' ? 'var(--color-success-bg)' : 'transparent',
                    }}
                  >
                    <span
                      className="text-center shrink-0 border-r border-[var(--color-border)] text-[var(--color-text-muted)] select-none"
                      style={{ width: lineNumberWidth }}
                    >
                      {line.newLineNum ?? ''}
                    </span>
                    <span className="shrink-0 w-4 text-center select-none font-bold text-[var(--color-success)]">
                      {line.type === 'added' ? '+' : ' '}
                    </span>
                    <span
                      className="flex-1 pl-1 pr-2 overflow-hidden text-ellipsis whitespace-pre"
                      style={{
                        color:
                          line.type === 'added'
                            ? 'var(--color-success)'
                            : 'var(--color-text-primary)',
                      }}
                    >
                      {line.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── Unified View ── */
            <div>
              <div className="sticky top-0 z-10 flex bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)]">
                <span className="text-center shrink-0 border-r border-[var(--color-border)] py-1"
                  style={{ width: lineNumberWidth }}>
                  Old
                </span>
                <span className="text-center shrink-0 border-r border-[var(--color-border)] py-1"
                  style={{ width: lineNumberWidth }}>
                  New
                </span>
                <span className="flex-1 px-2 py-1">Content</span>
              </div>
              {diffLines.map((line, idx) => (
                <DiffLineRow key={idx} line={line} lineNumberWidth={lineNumberWidth} />
              ))}
            </div>
          )}

          {/* ── Diff Stats ── */}
          <div className="sticky bottom-0 flex items-center gap-3 px-4 py-1.5 bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
            <span>
              <span className="text-[var(--color-success)] font-medium">
                +{diffLines.filter((l) => l.type === 'added').length}
              </span>
              {' '}added
            </span>
            <span>
              <span className="text-[var(--color-error)] font-medium">
                -{diffLines.filter((l) => l.type === 'removed').length}
              </span>
              {' '}removed
            </span>
            <span>
              {diffLines.filter((l) => l.type === 'unchanged').length} unchanged
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiffViewer
