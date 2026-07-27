import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, FileCode, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

/* ──── Types ──── */

export interface FileTab {
  id: string
  filename: string
  language: string
  code: string
  modified?: boolean
}

export interface CodeViewerProps {
  /** The source code to display */
  code: string
  /** Language for syntax highlighting (e.g. 'typescript', 'python', 'javascript') */
  language?: string
  /** Current filename shown in the tab bar */
  filename?: string
  /** Whether to show line numbers (default: true) */
  lineNumbers?: boolean
  /** If true, code is read-only (default: true) */
  readOnly?: boolean
  /** Called when code changes (only if readOnly=false) */
  onChange?: (code: string) => void
  /** Open file tabs for the tab bar */
  tabs?: FileTab[]
  /** Active tab ID */
  activeTabId?: string
  /** Called when a tab is clicked */
  onTabClick?: (tabId: string) => void
  /** Called when a tab close is requested */
  onTabClose?: (tabId: string) => void
  /** Additional class names */
  className?: string
  /** Whether spotlight/minimap is enabled */
  showMinimap?: boolean
}

/* ──── Supported Languages ──── */

const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  go: 'go',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  md: 'markdown',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  dockerfile: 'dockerfile',
  docker: 'dockerfile',
  graphql: 'graphql',
  gql: 'graphql',
  prisma: 'prisma',
  svelte: 'svelte',
  vue: 'vue',
  astro: 'astro',
  tex: 'latex',
  latex: 'latex',
  clj: 'clojure',
  cljs: 'clojure',
  hs: 'haskell',
  lua: 'lua',
  elm: 'elm',
  erl: 'erlang',
  ex: 'elixir',
  exs: 'elixir',
  fs: 'fsharp',
  dart: 'dart',
  r: 'r',
  scala: 'scala',
  groovy: 'groovy',
  pl: 'perl',
  pm: 'perl',
  cmake: 'cmake',
  makefile: 'makefile',
  mk: 'makefile',
  tf: 'hcl',
  hcl: 'hcl',
  ps1: 'powershell',
  powershell: 'powershell',
  diff: 'diff',
  toml: 'toml',
  ini: 'ini',
  cfg: 'ini',
}

/* ──── Helper ──── */

function detectLanguage(filename?: string, language?: string): string {
  if (language) return language
  if (!filename) return 'typescript'
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return LANGUAGE_MAP[ext] || 'typescript'
}

/* ──── Search Overlay ──── */

interface SearchState {
  open: boolean
  query: string
  matchIndex: number
  totalMatches: number
}

/* ──── CodeViewer Component ──── */

/**
 * CodeViewer — A beautiful code viewer / editor with syntax highlighting,
 * file tabs, search, minimap, and full design-system styling.
 */
export function CodeViewer({
  code,
  language,
  filename,
  lineNumbers = true,
  readOnly = true,
  onChange,
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  className,
  showMinimap = true,
}: CodeViewerProps): JSX.Element {
  const normLang = detectLanguage(filename, language)
  const [search, setSearch] = useState<SearchState>({
    open: false,
    query: '',
    matchIndex: 0,
    totalMatches: 0,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(code)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const codeContainerRef = useRef<HTMLDivElement>(null)
  const lineHeight = 20

  /* Sync editValue when code prop changes */
  useEffect(() => {
    setEditValue(code)
  }, [code])

  /* Search match highlighting */
  const highlightedCode = useMemo(() => {
    if (!search.query || search.query.length === 0) return code

    const escaped = search.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = code.split(new RegExp(`(${escaped})`, 'gi'))
    return parts
      .map((part) =>
        part.toLowerCase() === search.query.toLowerCase()
          ? `\x1b[38;2;255;255;0m${part}\x1b[0m`
          : part
      )
      .join('')
  }, [code, search.query])

  /* Handle search */
  const handleSearch = useCallback(
    (query: string) => {
      if (!query) {
        setSearch((s) => ({ ...s, query, totalMatches: 0, matchIndex: 0 }))
        return
      }
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const matches = code.match(new RegExp(escaped, 'gi'))
      const total = matches ? matches.length : 0
      setSearch((s) => ({
        ...s,
        query,
        totalMatches: total,
        matchIndex: total > 0 ? Math.min(s.matchIndex + 1, total) : 0,
      }))
    },
    [code]
  )

  const toggleSearch = useCallback(() => {
    setSearch((s) => {
      const next = !s.open
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
      return { ...s, open: next, query: '', totalMatches: 0, matchIndex: 0 }
    })
  }, [])

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        toggleSearch()
      }
      if (e.key === 'Escape' && search.open) {
        setSearch((s) => ({ ...s, open: false, query: '', totalMatches: 0, matchIndex: 0 }))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSearch, search.open])

  /* Custom Prism theme with purple accent overrides */
  const theme = useMemo(() => {
    const base = { ...oneDark }
    return {
      ...base,
      'code[class*="language-"]': {
        ...base['code[class*="language-"]'],
        background: 'transparent',
        fontSize: '13px',
        lineHeight: `${lineHeight}px`,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      },
      'pre[class*="language-"]': {
        ...base['pre[class*="language-"]'],
        background: 'transparent',
        margin: 0,
        padding: 0,
        fontSize: '13px',
        lineHeight: `${lineHeight}px`,
      },
      keyword: { ...base.keyword, color: '#c678dd' },
      builtin: { ...base.builtin, color: '#c678dd' },
      'attr-name': { ...base['attr-name'], color: '#c678dd' },
      selector: { ...base.selector, color: '#c678dd' },
      'attr-value': { ...base['attr-value'], color: '#98c379' },
      string: { ...base.string, color: '#98c379' },
      punctuation: { ...base.punctuation, color: '#abb2bf' },
      operator: { ...base.operator, color: '#56b6c2' },
      function: { ...base.function, color: '#61afef' },
      variable: { ...base.variable, color: '#e06c75' },
      number: { ...base.number, color: '#d19a66' },
      comment: { ...base.comment, color: '#5c6370', fontStyle: 'italic' },
    }
  }, [])

  /* Handle code change in editable mode */
  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      setEditValue(val)
      onChange?.(val)
    },
    [onChange]
  )

  /* Build minimap lines */
  const minimapLines = useMemo(() => {
    if (!showMinimap) return null
    const lines = code.split('\n')
    return lines.map((line) => ({
      line,
      height: Math.max(2, 100 / lines.length),
    }))
  }, [code, showMinimap])

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden',
        className
      )}
    >
      {/* ──── Tab Bar ──── */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center h-10 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] overflow-x-auto shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabClick?.(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 h-full text-xs border-r border-[var(--color-border)] whitespace-nowrap transition-colors',
                tab.id === activeTabId
                  ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border-b-2 border-b-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
              )}
            >
              <FileCode size={14} className="shrink-0 text-[var(--color-accent)]" />
              <span>{tab.filename}</span>
              {tab.modified && (
                <span className="w-2 h-2 rounded-full bg-[var(--color-warning)] shrink-0" />
              )}
              {onTabClose && (
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose(tab.id)
                  }}
                  className="ml-1 p-0.5 rounded hover:bg-[var(--color-surface)] transition-colors"
                >
                  <X size={12} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ──── Toolbar ──── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] shrink-0">
        <span className="text-xs text-[var(--color-text-muted)] font-mono">
          {filename || 'untitled'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSearch}
            className={cn(
              'p-1 rounded transition-colors',
              search.open
                ? 'text-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
            )}
            title="Search (⌘F)"
          >
            <Search size={14} />
          </button>
          <span className="text-xs text-[var(--color-text-muted)] font-mono">
            {code.split('\n').length} lines
          </span>
        </div>
      </div>

      {/* ──── Search Bar ──── */}
      <AnimatePresence>
        {search.open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-[var(--color-border)]"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface)]">
              <Search size={14} className="text-[var(--color-text-muted)] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search.query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search in file…"
                className="flex-1 bg-transparent text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
              />
              {search.query && (
                <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                  {search.totalMatches > 0
                    ? `${search.matchIndex} of ${search.totalMatches}`
                    : 'No results'}
                </span>
              )}
              <button
                onClick={() =>
                  setSearch((s) => ({ ...s, open: false, query: '', totalMatches: 0, matchIndex: 0 }))
                }
                className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──── Code Area ──── */}
      <div className="flex flex-1 overflow-hidden">
        <div
          ref={codeContainerRef}
          className="relative flex-1 overflow-auto"
        >
          {/* Read-only view with syntax highlighting */}
          {readOnly ? (
            <div className="p-4">
              <SyntaxHighlighter
                language={normLang}
                style={theme}
                showLineNumbers={lineNumbers}
                wrapLines
                customStyle={{
                  background: 'transparent',
                  padding: 0,
                  margin: 0,
                }}
                lineNumberStyle={{
                  minWidth: '3em',
                  paddingRight: '1em',
                  color: 'var(--color-text-muted)',
                  userSelect: 'none',
                  textAlign: 'right',
                  borderRight: '1px solid var(--color-border)',
                  marginRight: '1em',
                  fontSize: '12px',
                }}
                lineProps={{
                  style: {
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                  },
                }}
              >
                {search.query ? highlightedCode : code}
              </SyntaxHighlighter>
            </div>
          ) : (
            /* Editable mode — textarea overlaid on syntax-highlighted pre */
            <div className="relative p-4">
              <SyntaxHighlighter
                language={normLang}
                style={theme}
                showLineNumbers={lineNumbers}
                wrapLines
                customStyle={{
                  background: 'transparent',
                  padding: 0,
                  margin: 0,
                  pointerEvents: 'none',
                }}
                lineNumberStyle={{
                  minWidth: '3em',
                  paddingRight: '1em',
                  color: 'var(--color-text-muted)',
                  userSelect: 'none',
                  textAlign: 'right',
                  borderRight: '1px solid var(--color-border)',
                  marginRight: '1em',
                  fontSize: '12px',
                }}
              >
                {editValue}
              </SyntaxHighlighter>
              <textarea
                value={editValue}
                onChange={handleEditChange}
                className="absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-[var(--color-accent)] font-mono text-[13px] leading-5 p-4 outline-none"
                spellCheck={false}
                style={{
                  whiteSpace: 'pre',
                  overflowWrap: 'normal',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  tabSize: 2,
                }}
              />
            </div>
          )}
        </div>

        {/* ──── Minimap ──── */}
        {showMinimap && minimapLines && (
          <div className="hidden lg:flex flex-col w-12 bg-[var(--color-bg-tertiary)] border-l border-[var(--color-border)] overflow-hidden shrink-0">
            <div className="flex flex-col gap-px p-1 overflow-hidden">
              {minimapLines.map((line, i) => (
                <div
                  key={i}
                  className="w-full rounded-sm"
                  style={{
                    height: `${line.height}px`,
                    backgroundColor:
                      line.line.trim()
                        ? 'var(--color-text-muted)'
                        : 'transparent',
                    opacity: line.line.trim() ? 0.3 : 0,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ──── Status Bar ──── */}
      <div className="flex items-center justify-between px-4 py-1 bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span className="font-mono">{normLang}</span>
          <span>{code.split('\n').length} lines</span>
          {readOnly && <span className="text-[var(--color-accent)]">Read-only</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span>Ln 1, Col 1</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  )
}

export default CodeViewer
