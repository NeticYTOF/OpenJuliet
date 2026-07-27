import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal as TerminalIcon, X, Copy, Trash2, ChevronDown, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '../../lib/utils'

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

/* ──── ANSI Color Parsing ──── */

interface AnsiSegment {
  text: string
  styles: React.CSSProperties
}

const ANSI_COLORS: Record<string, React.CSSProperties> = {
  '0': { color: 'inherit' }, // reset
  '1': { fontWeight: 'bold' }, // bold
  '3': { fontStyle: 'italic' }, // italic
  '4': { textDecoration: 'underline' }, // underline
  '7': { backgroundColor: 'var(--color-text-muted)', color: 'var(--color-bg-primary)' }, // inverse
  '9': { textDecoration: 'line-through' }, // strikethrough

  /* Foreground colors (30-37) */
  '30': { color: '#4f545c' },
  '31': { color: '#ff4757' },
  '32': { color: '#00d68f' },
  '33': { color: '#ffa640' },
  '34': { color: '#45aaf2' },
  '35': { color: '#c678dd' },
  '36': { color: '#2ed573' },
  '37': { color: '#e8e8f0' },

  /* Bright foreground (90-97) */
  '90': { color: '#606078' },
  '91': { color: '#ff6b81' },
  '92': { color: '#7bed9f' },
  '93': { color: '#eccc68' },
  '94': { color: '#70a1ff' },
  '95': { color: '#c678dd' },
  '96': { color: '#00d2d3' },
  '97': { color: '#ffffff' },

  /* Background colors (40-47) */
  '40': { backgroundColor: '#2d2d3d' },
  '41': { backgroundColor: '#ff4757' },
  '42': { backgroundColor: '#00d68f' },
  '43': { backgroundColor: '#ffa640' },
  '44': { backgroundColor: '#45aaf2' },
  '45': { backgroundColor: '#c678dd' },
  '46': { backgroundColor: '#2ed573' },
  '47': { backgroundColor: '#e8e8f0' },
}

function parseAnsiCodes(text: string): AnsiSegment[] {
  const ansiRegex = /\x1b\[([0-9;]*)m/g
  const segments: AnsiSegment[] = []
  let lastIndex = 0
  let currentStyles: React.CSSProperties = {}

  let match
  while ((match = ansiRegex.exec(text)) !== null) {
    /* Push text before this code */
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        styles: { ...currentStyles },
      })
    }

    const codes = match[1] ? match[1].split(';') : ['0']
    for (const code of codes) {
      if (code === '0' || code === '') {
        currentStyles = {}
      } else if (ANSI_COLORS[code]) {
        currentStyles = { ...currentStyles, ...ANSI_COLORS[code] }
      } else if (code.startsWith('38') && code.includes('5;')) {
        /* 256 color — simplified */
        currentStyles.color = 'var(--color-text-primary)'
      } else if (code.startsWith('48') && code.includes('5;')) {
        currentStyles.backgroundColor = 'var(--color-surface)'
      }
    }

    lastIndex = match.index + match[0].length
  }

  /* Remaining text */
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      styles: { ...currentStyles },
    })
  }

  return segments.length > 0 ? segments : [{ text, styles: {} }]
}

/* ──── AnsiLine Component ──── */

function AnsiLine({ line }: { line: TerminalLine }): JSX.Element {
  const segments = useMemo(() => parseAnsiCodes(line.text), [line.text])

  const typeStyle: React.CSSProperties =
    line.type === 'error'
      ? { color: 'var(--color-error)' }
      : line.type === 'system'
        ? { color: 'var(--color-info)' }
        : line.type === 'info'
          ? { color: 'var(--color-text-muted)' }
          : line.type === 'input'
            ? { color: 'var(--color-accent)' }
            : {}

  return (
    <div
      className="whitespace-pre-wrap break-all font-mono text-xs leading-5"
      style={{ minHeight: '20px', ...typeStyle }}
    >
      {segments.length > 0 ? (
        segments.map((seg, i) => (
          <span key={i} style={seg.styles}>
            {seg.text}
          </span>
        ))
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  )
}

/* ──── Terminal Component ──── */

/**
 * Terminal — A faux terminal emulator with command input, ANSI color support,
 * auto-scroll, and VS Code integrated-terminal styling.
 */
export function Terminal({
  output,
  onCommand,
  connected = true,
  prompt = '$',
  placeholder = 'Type a command...',
  title = 'Terminal',
  maxHeight = 400,
  minHeight = 100,
  className,
}: TerminalProps): JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [selection, setSelection] = useState<string | null>(null)

  /* Auto-scroll to bottom on new output */
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  /* Focus input when terminal becomes visible */
  useEffect(() => {
    if (!isCollapsed) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isCollapsed])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = inputValue.trim()
      if (!trimmed) return

      onCommand?.(trimmed)
      setCommandHistory((prev) => [...prev, trimmed])
      setHistoryIndex(-1)
      setInputValue('')
    },
    [inputValue, onCommand]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (commandHistory.length === 0) return
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInputValue(commandHistory[newIndex])
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (historyIndex === -1) return
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setInputValue('')
        } else {
          setHistoryIndex(newIndex)
          setInputValue(commandHistory[newIndex])
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault()
        /* Clear — parent should handle by clearing output lines */
      }
    },
    [commandHistory, historyIndex]
  )

  /* Copy all output */
  const handleCopyOutput = useCallback(() => {
    const text = output.map((l) => l.text).join('\n')
    navigator.clipboard.writeText(text).catch(() => {})
    setSelection('copied')
    setTimeout(() => setSelection(null), 1500)
  }, [output])

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

      {/* ──── Output Area ──── */}
      {!isCollapsed && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div
            ref={outputRef}
            className="flex-1 overflow-y-auto px-3 py-2"
            onClick={() => inputRef.current?.focus()}
          >
            {output.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-[var(--color-text-muted)]">
                <span className="opacity-50">Terminal ready — type a command to start</span>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {output.map((line, idx) => (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.08, delay: Math.min(idx * 0.003, 0.2) }}
                  >
                    <AnsiLine line={line} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* ──── Input Area ──── */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-primary)] border-t border-[var(--color-border)] shrink-0"
          >
            <span className="text-xs font-mono text-[var(--color-accent)] shrink-0">
              {prompt}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={!connected}
              className="flex-1 bg-transparent text-xs font-mono text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
              autoComplete="off"
              spellCheck={false}
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue('')}
                className="p-0.5 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </form>
        </div>
      )}
    </motion.div>
  )
}

export default Terminal
