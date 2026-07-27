import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Command, Keyboard } from 'lucide-react'
import { cn } from '../../lib/utils'
import { KEYBOARD_SHORTCUTS, type ShortcutEntry } from '../../lib/constants'
import { useAppStore } from '../../stores/appStore'

/* ──── Category visual config ──── */

const CATEGORY_CONFIG: Record<
  ShortcutEntry['category'],
  { label: string; icon: string; color: string; bgColor: string }
> = {
  Navigation: {
    label: 'Navigation',
    icon: '⌂',
    color: 'text-[var(--color-accent)]',
    bgColor: 'bg-[var(--color-accent-subtle)]'
  },
  Editor: {
    label: 'Editor',
    icon: '✎',
    color: 'text-[var(--color-info)]',
    bgColor: 'bg-[var(--color-info-bg)]'
  },
  Tasks: {
    label: 'Tasks',
    icon: '☑',
    color: 'text-[var(--color-success)]',
    bgColor: 'bg-[var(--color-success-bg)]'
  },
  GitHub: {
    label: 'GitHub',
    icon: '◇',
    color: 'text-[var(--color-warning)]',
    bgColor: 'bg-[var(--color-warning-bg)]'
  },
  General: {
    label: 'General',
    icon: '⚙',
    color: 'text-[var(--color-text-secondary)]',
    bgColor: 'bg-[var(--color-bg-tertiary)]'
  }
}

/* ──── Animation variants ──── */

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.15, ease: 'easeIn' as const }
  }
}

/* ──── Fuzzy filter ──── */

function matchesQuery(shortcut: ShortcutEntry, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase().trim()
  const haystack = `${shortcut.description} ${shortcut.keys.join(' ')} ${shortcut.category}`.toLowerCase()
  return haystack.includes(q)
}

/* ──── Component ──── */

/**
 * KeyboardShortcutsModal — Animated modal showing all keyboard shortcuts,
 * grouped by category with search and filter. Triggered via Cmd/Ctrl+Shift+K.
 */
export default function KeyboardShortcutsModal(): JSX.Element {
  const { keyboardShortcutsOpen, setKeyboardShortcutsOpen } = useAppStore()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  /* Close on Escape */
  useEffect(() => {
    if (!keyboardShortcutsOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setKeyboardShortcutsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keyboardShortcutsOpen, setKeyboardShortcutsOpen])

  /* Reset state on open/close */
  useEffect(() => {
    if (!keyboardShortcutsOpen) {
      setQuery('')
      setActiveCategory(null)
    }
  }, [keyboardShortcutsOpen])

  /* Group and filter shortcuts */
  const grouped = useMemo(() => {
    const filtered = KEYBOARD_SHORTCUTS.filter((s) => matchesQuery(s, query))
    const groups = new Map<ShortcutEntry['category'], ShortcutEntry[]>()
    for (const shortcut of filtered) {
      const existing = groups.get(shortcut.category) ?? []
      existing.push(shortcut)
      groups.set(shortcut.category, existing)
    }
    return groups
  }, [query])

  const categoryOrder: ShortcutEntry['category'][] = [
    'Navigation',
    'Editor',
    'Tasks',
    'GitHub',
    'General'
  ]

  const visibleCategories = categoryOrder.filter(
    (cat) => grouped.has(cat) && (activeCategory === null || activeCategory === cat)
  )

  const handleClose = (): void => {
    setKeyboardShortcutsOpen(false)
  }

  return (
    <AnimatePresence>
      {keyboardShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-accent-subtle)]">
                  <Keyboard size={18} className="text-[var(--color-accent)]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {KEYBOARD_SHORTCUTS.length} shortcuts available
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg p-1.5 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="relative px-4 py-3 border-b border-[var(--color-border)]">
              <Search
                size={16}
                className="absolute left-7 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shortcuts…"
                className="w-full pl-8 pr-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />

              {/* Category filter pills */}
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className={cn(
                    'px-2 py-1 text-[10px] font-medium rounded-md border transition-colors',
                    activeCategory === null
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent)]'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)]'
                  )}
                >
                  All
                </button>
                {categoryOrder.map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat]
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setActiveCategory(activeCategory === cat ? null : cat)
                      }
                      className={cn(
                        'px-2 py-1 text-[10px] font-medium rounded-md border transition-colors',
                        activeCategory === cat
                          ? `${cfg.bgColor} ${cfg.color} border-current`
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)]'
                      )}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Shortcuts list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {visibleCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search size={24} className="text-[var(--color-text-muted)] mb-2" />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    No shortcuts match &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                visibleCategories.map((category) => {
                  const shortcuts = grouped.get(category)!
                  const cfg = CATEGORY_CONFIG[category]

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Category header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold',
                            cfg.bgColor,
                            cfg.color
                          )}
                        >
                          {cfg.icon}
                        </span>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                          {cfg.label}
                        </h3>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {shortcuts.length}
                        </span>
                      </div>

                      {/* Shortcut rows */}
                      <div className="grid gap-0.5">
                        {shortcuts.map((shortcut, idx) => (
                          <motion.div
                            key={`${shortcut.keys.join('+')}-${idx}`}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15, delay: idx * 0.02 }}
                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors group"
                          >
                            <span className="text-sm text-[var(--color-text-primary)]">
                              {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, ki) => (
                                <kbd
                                  key={ki}
                                  className={cn(
                                    'inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[10px] font-mono font-medium rounded',
                                    'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]',
                                    'group-hover:border-[var(--color-accent-subtle)] transition-colors'
                                  )}
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1">
                  <Command size={10} />
                  <span>⌘ = Cmd / Ctrl</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 text-[9px] font-mono bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border)]">
                    esc
                  </kbd>
                  close
                </span>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                Cmd/Ctrl + Shift + K to open
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}