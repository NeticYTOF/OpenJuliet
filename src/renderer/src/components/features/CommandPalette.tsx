import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  GitBranch,
  Bug,
  ListChecks,
  Code,
  Settings,
  Plus,
  Download,
  Rocket,
  Terminal,
  History,
  Search,
  Command
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { NAV_ITEMS } from '../../lib/constants'
import type { ActiveView } from '../../types'

/* ─── Types ─── */

interface CommandItem {
  id: string
  label: string
  icon: string
  shortcut?: string
  section: 'navigation' | 'actions' | 'recent'
  action: () => void
}

/* ─── Lucide icon resolver ─── */

type IconComponent = React.ComponentType<{ className?: string; size?: number }>

const iconMap: Record<string, IconComponent> = {
  LayoutDashboard,
  GitBranch,
  Bug,
  ListChecks,
  Code,
  Settings,
  Plus,
  Download,
  Rocket,
  Terminal,
  History,
  Search,
  Command
}

function resolveIcon(name: string): IconComponent {
  return iconMap[name] || Search
}

/* ─── Simple fuzzy search ─── */

function fuzzyScore(query: string, label: string): number {
  const q = query.toLowerCase().trim()
  const l = label.toLowerCase()
  if (!q) return 1
  /* Exact substring match gets top score */
  if (l.includes(q)) return 2
  /* Character-by-character sequential match */
  let qi = 0
  for (let li = 0; li < l.length && qi < q.length; li++) {
    if (l[li] === q[qi]) qi++
  }
  return qi === q.length ? 1 : 0
}

/* ─── Section colour badges ─── */

const sectionBadge: Record<string, { label: string; style: string }> = {
  navigation: {
    label: 'Navigate',
    style: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[rgba(108,92,231,0.25)]'
  },
  actions: {
    label: 'Action',
    style: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[rgba(69,170,242,0.25)]'
  },
  recent: {
    label: 'Recent',
    style: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
  }
}

/* ─── Animations ─── */

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -12 } as const,
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }
  } as const,
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -12,
    transition: { duration: 0.15, ease: [0.65, 0, 0.35, 1] as const }
  } as const
} as const

/* ─── Component ─── */

export default function CommandPalette(): JSX.Element {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setView,
    addToCommandPaletteRecent,
    commandPaletteRecent,
    addNotification
  } = useAppStore()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  /* ─── Build all command items ─── */

  const allItems = useMemo<CommandItem[]>(() => {
    const navigation: CommandItem[] = NAV_ITEMS.map((item) => ({
      id: `nav:${item.id}`,
      label: item.label,
      icon: item.icon,
      shortcut: item.shortcut,
      section: 'navigation' as const,
      action: () => {
        setView(item.id as ActiveView)
        addToCommandPaletteRecent(`nav:${item.id}`)
        setCommandPaletteOpen(false)
      }
    }))

    const actions: CommandItem[] = [
      {
        id: 'action:new-task',
        label: 'New Task',
        icon: 'Plus',
        section: 'actions' as const,
        action: () => {
          setView('tasks' as ActiveView)
          addToCommandPaletteRecent('action:new-task')
          setCommandPaletteOpen(false)
          /* Dispatch a custom event so TaskManager can listen */
          window.dispatchEvent(new CustomEvent('openjuliet:new-task'))
        }
      },
      {
        id: 'action:clone-repo',
        label: 'Clone Repo',
        icon: 'Download',
        section: 'actions' as const,
        action: () => {
          addToCommandPaletteRecent('action:clone-repo')
          setCommandPaletteOpen(false)
          addNotification('info', 'Clone Repo', 'Repository cloning will open in the GitHub panel.')
          setView('repositories' as ActiveView)
        }
      },
      {
        id: 'action:run-tests',
        label: 'Run Tests',
        icon: 'Rocket',
        section: 'actions' as const,
        action: () => {
          addToCommandPaletteRecent('action:run-tests')
          setCommandPaletteOpen(false)
          addNotification('info', 'Running Tests', 'Test suite execution started.')
        }
      },
      {
        id: 'action:open-terminal',
        label: 'Open Terminal',
        icon: 'Terminal',
        section: 'actions' as const,
        action: () => {
          setView('editor' as ActiveView)
          addToCommandPaletteRecent('action:open-terminal')
          setCommandPaletteOpen(false)
          window.dispatchEvent(new CustomEvent('openjuliet:open-terminal'))
        }
      }
    ]

    /* Resolve recent items from stored IDs */
    const recent: CommandItem[] = []
    const allMap = new Map<string, CommandItem>()
    for (const item of [...navigation, ...actions]) {
      allMap.set(item.id, item)
    }
    for (const id of commandPaletteRecent) {
      const found = allMap.get(id)
      if (found) {
        recent.push({ ...found, section: 'recent' })
      }
    }

    return [...navigation, ...actions, ...recent]
  }, [commandPaletteRecent, setView, setCommandPaletteOpen, addToCommandPaletteRecent, addNotification])

  /* ─── Filter items by query ─── */

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      /* No query: show navigation, then actions, then up to 5 recent */
      const nav = allItems.filter((i) => i.section === 'navigation')
      const acts = allItems.filter((i) => i.section === 'actions')
      const rec = allItems.filter((i) => i.section === 'recent').slice(0, 5)
      return [...nav, ...acts, ...rec]
    }

    const scored = allItems
      .map((item) => ({
        item,
        score: fuzzyScore(query, item.label)
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => {
        /* Sort by score descending, then recent items last within same score */
        if (b.score !== a.score) return b.score - a.score
        if (a.item.section === 'recent' && b.item.section !== 'recent') return 1
        if (b.item.section === 'recent' && a.item.section !== 'recent') return -1
        return a.item.label.localeCompare(b.item.label)
      })

    return scored.map((x) => x.item)
  }, [query, allItems])

  /* ─── Reset index when results change ─── */

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, filteredItems.length])

  /* ─── Autofocus input when palette opens ─── */

  useEffect(() => {
    if (commandPaletteOpen && inputRef.current) {
      /* Small delay so the animation starts before focus */
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    if (!commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [commandPaletteOpen])

  /* ─── Scroll selected item into view ─── */

  useEffect(() => {
    if (!listRef.current) return
    const items = listRef.current.querySelectorAll<HTMLElement>('[data-cmd-item]')
    const target = items[selectedIndex]
    if (target) {
      target.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  /* ─── Keyboard nav inside the palette ─── */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!commandPaletteOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev <= 0 ? Math.max(filteredItems.length - 1, 0) : prev - 1
          )
          break
        case 'Home':
          e.preventDefault()
          setSelectedIndex(0)
          break
        case 'End':
          e.preventDefault()
          setSelectedIndex(Math.max(filteredItems.length - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredItems[selectedIndex]) {
            filteredItems[selectedIndex].action()
          }
          break
        case 'Escape':
          e.preventDefault()
          setCommandPaletteOpen(false)
          break
      }
    },
    [commandPaletteOpen, filteredItems, selectedIndex, setCommandPaletteOpen]
  )

  /* ─── Render section groups ─── */

  const renderItems = () => {
    const sections = new Set(filteredItems.map((i) => i.section))
    const result: JSX.Element[] = []
    let globalIdx = 0
    const sectionOrder = ['navigation', 'actions', 'recent']

    for (const sectionKey of sectionOrder) {
      if (!sections.has(sectionKey as CommandItem['section'])) continue
      const items = filteredItems.filter((i) => i.section === sectionKey)
      if (items.length === 0) continue

      const badge = sectionBadge[sectionKey]

      result.push(
        <div
          key={`header-${sectionKey}`}
          className="flex items-center gap-2 px-4 pt-3 pb-1.5"
        >
          <span
            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${badge.style}`}
          >
            {badge.label}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {items.length > 1 ? `${items.length} results` : '1 result'}
          </span>
        </div>
      )

      for (const item of items) {
        const idx = globalIdx
        globalIdx++
        const isSelected = idx === selectedIndex
        const Icon = resolveIcon(item.icon)

        result.push(
          <button
            key={item.id}
            data-cmd-item=""
            data-selected={isSelected ? 'true' : 'false'}
            onClick={() => {
              item.action()
            }}
            onMouseEnter={() => setSelectedIndex(idx)}
            className={`group flex items-center w-full text-left px-4 py-2.5 transition-all duration-100 ${
              isSelected
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
            }`}
          >
            {/* Icon */}
            <Icon
              size={16}
              className={`shrink-0 mr-3 ${
                isSelected
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'
              }`}
            />

            {/* Label */}
            <span className="flex-1 text-sm truncate">{item.label}</span>

            {/* Shortcut badge */}
            {item.shortcut && (
              <span className="ml-2 text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
                {item.shortcut}
              </span>
            )}

            {/* Section badge (only show on recent items or when useful) */}
            {item.section === 'recent' && (
              <span
                className={`ml-2 inline-flex items-center px-1 py-0.5 text-[9px] font-medium rounded border ${badge.style}`}
              >
                Recent
              </span>
            )}
          </button>
        )
      }
    }

    if (result.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search size={24} className="text-[var(--color-text-muted)] mb-2" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            No results for &ldquo;{query}&rdquo;
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Try a different search term
          </p>
        </div>
      )
    }

    return result
  }

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            key="cmd-backdrop"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Panel */}
          <motion.div
            key="cmd-panel"
            className="relative z-10 w-full max-w-2xl mx-4"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 border-b border-[var(--color-border)]">
                <Search size={18} className="shrink-0 text-[var(--color-text-muted)]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search commands, navigate to views, run actions…"
                  className="flex-1 h-12 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] border-none outline-none focus:ring-0"
                  spellCheck={false}
                  autoComplete="off"
                />

                {/* Cmd+K hint */}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-1 text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border)]">
                  <Command size={10} />
                  <span>K</span>
                </kbd>
              </div>

              {/* Results List */}
              <div
                ref={listRef}
                className="max-h-[min(60vh,400px)] overflow-y-auto py-2"
              >
                {renderItems()}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 text-[9px] font-mono bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border)]">
                      ↑↓
                    </kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 text-[9px] font-mono bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border)]">
                      ↵
                    </kbd>
                    select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 text-[9px] font-mono bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border)]">
                      esc
                    </kbd>
                    close
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
