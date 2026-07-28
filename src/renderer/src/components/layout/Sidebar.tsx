import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  GitBranch,
  Bug,
  ListChecks,
  History,
  Settings,
  Github,
  ChevronLeft,
  ChevronRight,
  Code,
  HelpCircle,
  GripVertical
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWindowSize } from '../../hooks/useWindowSize'
import { cn } from '../../lib/utils'
import { NAV_ITEMS } from '../../lib/constants'
import type { ActiveView } from '../../types'
import QuickStartGuide from '../features/QuickStartGuide'

/**
 * Navigation icon resolver.
 * Returns the appropriate lucide-react icon component for a given nav item ID.
 */
function getNavIcon(id: string): React.ComponentType<{ className?: string; size?: number }> {
  const icons: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
    dashboard: LayoutDashboard,
    repositories: GitBranch,
    issues: Bug,
    tasks: ListChecks,
    history: History,
    editor: Code,
    settings: Settings
  }
  return icons[id] || LayoutDashboard
}

/**
 * Sidebar — Main navigation sidebar with collapsible support.
 * Features glassmorphism background, animated transitions, active state highlighting,
 * and a bottom section for GitHub connection status.
 */
export default function Sidebar(): JSX.Element {
  const { activeView, setView, sidebarOpen, toggleSidebar, quickStartOpen, setQuickStartOpen, toggleQuickStart } = useAppStore()
  const { github } = useSettingsStore()
  const { isSmall } = useWindowSize()

  // Auto-collapse on small screens
  const effectiveOpen = isSmall ? false : sidebarOpen

  return (
    <motion.aside
      animate={{ width: effectiveOpen ? 240 : 56 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex flex-col h-full glass border-r border-[var(--color-border)] overflow-hidden shrink-0",
        isSmall && "sidebar-overlay"
      )}
    >
      {/* Toggle Button — only shown on medium+ screens */}
      {!isSmall && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-16 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors"
          aria-label={effectiveOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {effectiveOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      )}

      {/* Resizable handle hint on large screens */}
      {!isSmall && effectiveOpen && (
        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group z-10">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical size={8} className="text-[var(--color-text-muted)] absolute -left-1.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = getNavIcon(item.id)
          const isActive = activeView === item.id

          return (
            <motion.button
              key={item.id}
              onClick={() => setView(item.id as ActiveView)}
              whileHover={{ x: 2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'group relative flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              )}
              title={!effectiveOpen ? item.label : undefined}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--color-accent)] rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <Icon
                size={18}
                className={cn(
                  'shrink-0 transition-colors',
                  isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'
                )}
              />

              {/* Label — only visible when sidebar is open */}
              {effectiveOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-3 truncate"
                >
                  {item.label}
                </motion.span>
              )}

              {/* Shortcut badge */}
              {effectiveOpen && item.shortcut && (
                <span className="ml-auto text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
                  {item.shortcut}
                </span>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Bottom Section — GitHub Status + Quick Start */}
      <div className="px-3 py-3 border-t border-[var(--color-border)] space-y-1">
        {/* Help / Quick Start Button */}
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center w-full gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
            'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
          )}
          onClick={toggleQuickStart}
          title={sidebarOpen ? undefined : 'Quick Start Guide'}
        >
          <HelpCircle size={18} className="shrink-0" />
          {sidebarOpen && (
            <span className="text-xs font-medium truncate">Quick Start</span>
          )}
        </motion.button>

        {/* GitHub Status */}
        <motion.div
          whileHover={{ x: 2 }}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
            'hover:bg-[var(--color-bg-tertiary)]'
          )}
          onClick={() => setView('settings')}
          title={sidebarOpen ? undefined : 'GitHub Settings'}
        >
          <div className="relative shrink-0">
            <Github size={18} className="text-[var(--color-text-secondary)]" />
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--color-bg-primary)]',
                github.isConnected ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]'
              )}
            />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--color-text-secondary)] truncate">
                {github.isConnected ? github.username || 'Connected' : 'Not connected'}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                {github.isConnected ? 'GitHub' : 'Connect GitHub'}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* QuickStartGuide Slide-Out Panel */}
      <QuickStartGuide
        open={quickStartOpen}
        onClose={() => setQuickStartOpen(false)}
      />
    </motion.aside>
  )
}