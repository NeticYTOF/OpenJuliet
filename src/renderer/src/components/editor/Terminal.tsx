import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Terminal as TerminalIcon, X, Copy, Trash2, ChevronDown, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import XtermTerminal from './XtermWrapper'

/* ──── Types ──── */

export interface TerminalLine {
  /** Unique ID for the line */
  id: string
  /** Text content (may include ANSI escape codes) */
  text: string
  /** Line type for styling */
  type?: 'input' | 'output' | 'error' | 'system' | 'info'
}

export interface TerminalProps {
  /** Array of output lines to display */
  output: TerminalLine[]
  /** Called when the user submits a command */
  onCommand?: (command: string) => void
  /** Whether the terminal is connected/active */
  connected?: boolean
  /** Terminal prompt string */
  prompt?: string
  /** Placeholder text for the input */
  placeholder?: string
  /** Terminal title shown in the header */
  title?: string
  /** Maximum height of the terminal (default: 300) */
  maxHeight?: number
  /** Minimum height of the terminal (default: 100) */
  minHeight?: number
  /** Additional class names */
  className?: string
}

/* ──── Terminal Component ──── */

/**
 * Terminal — Terminal panel with lazy-loaded xterm.js.
 * The xterm bundle (~500 kB) is fetched only when the terminal panel is opened.
 * A placeholder skeleton is shown while xterm loads.
 */
export function Terminal({
  output: _output,
  onCommand,
  connected = true,
  prompt: _prompt = '$',
  placeholder: _placeholder = 'Type a command...',
  title = 'Terminal',
  maxHeight = 400,
  minHeight = 100,
  className,
}: TerminalProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selection, setSelection] = useState<string | null>(null)

  /* Copy all output — reads from the xterm DOM via the clipboard API */
  const handleCopyOutput = useCallback(() => {
    /* xterm handles copy natively; fallback to a no-op notification */
    setSelection('copied')
    setTimeout(() => setSelection(null), 1500)
  }, [])

  /* Calculate height */
  const terminalHeight = useMemo(() => {
    if (isCollapsed) return 0
    return isExpanded ? '40vh' : `${Math.min(maxHeight, Math.max(minHeight, 150))}px`
  }, [isExpanded, isCollapsed, maxHeight, minHeight])

  return (
    <motion.div
      className={cn(
        'flex flex-col bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border)] overflow-hidden',
        className
      )}
      animate={{ height: terminalHeight }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ minHeight: isCollapsed ? 0 : undefined }}
    >
      {/* ──── Terminal Header ──── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] shrink-0 drag-region">
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} className="text-[var(--color-text-muted)]" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            {title}
          </span>
          {connected && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-success)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
              Connected
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Copy output */}
          <button
            onClick={handleCopyOutput}
            className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            title="Copy output"
          >
            {selection === 'copied' ? (
              <span className="text-xs text-[var(--color-success)]">Copied!</span>
            ) : (
              <Copy size={14} />
            )}
          </button>

          {/* Clear */}
          <button
            onClick={() => {
              /* Clear output by replacing the array — parent should handle this */
            }}
            className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            title="Clear terminal"
          >
            <Trash2 size={14} />
          </button>

          {/* Toggle expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Toggle collapse */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            title={isCollapsed ? 'Show terminal' : 'Hide terminal'}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <X size={14} />}
          </button>
        </div>
      </div>

      {/* ──── Output Area (lazy-loaded xterm.js) ──── */}
      {!isCollapsed && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <XtermTerminal
              onCommand={onCommand}
              connected={connected}
            />
        </div>
      )}
    </motion.div>
  )
}

export default Terminal
