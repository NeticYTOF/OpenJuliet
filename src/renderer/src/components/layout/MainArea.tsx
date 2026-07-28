import { Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useWindowSize } from '../../hooks/useWindowSize'
import Dashboard from '../features/Dashboard'
import { LazyLoader } from '../ui/LazyLoader'

/* ──── Lazy-loaded feature views ──── */

const GitHubPanel = lazy(() => import('../features/GitHubPanel'))
const TaskManager = lazy(() => import('../features/TaskManager'))
const HistoryView = lazy(() => import('../features/HistoryView'))
const SettingsView = lazy(() => import('../features/SettingsView'))
const EditorView = lazy(() => import('../features/EditorView'))

/**
 * Suspense fallback per active view.
 */
function getFallback(view: string): JSX.Element {
  switch (view) {
    case 'settings':
      return <LazyLoader type="settings" />
    case 'editor':
      return <LazyLoader type="editor" />
    default:
      return <LazyLoader type="list" />
  }
}

/**
 * View component map — routes ActiveView IDs to their components.
 */
const viewComponents: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  repositories: GitHubPanel,
  issues: GitHubPanel,
  tasks: TaskManager,
  history: HistoryView,
  settings: SettingsView,
  editor: EditorView
}

/**
 * Page transition variants for framer-motion AnimatePresence.
 * Easing arrays must use `as const` to be valid Easing tuples for framer-motion.
 */
const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: { duration: 0.18, ease: [0.65, 0, 0.35, 1] as const }
  }
}

/**
 * MainArea — Right content area that renders the active view component.
 * Provides animated page transitions between views.
 * Responsive: adjusts padding and max-width on small screens.
 */
export default function MainArea(): JSX.Element {
  const { activeView } = useAppStore()
  const { isSmall } = useWindowSize()
  const ViewComponent = viewComponents[activeView]

  return (
    <main className="flex-1 overflow-hidden bg-[var(--color-bg-primary)]">
      <div className={isSmall ? 'h-full overflow-y-auto px-3 py-3' : 'h-full overflow-y-auto px-6 py-6'}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            variants={pageVariants as import('framer-motion').Variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={isSmall ? 'w-full mx-auto' : 'w-full max-w-6xl mx-auto'}
          >
            <Suspense fallback={getFallback(activeView)}>
              {ViewComponent ? <ViewComponent /> : <Dashboard />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}
