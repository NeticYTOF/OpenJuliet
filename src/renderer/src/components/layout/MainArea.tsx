import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import Dashboard from '../features/Dashboard'
import GitHubPanel from '../features/GitHubPanel'
import TaskManager from '../features/TaskManager'
import HistoryView from '../features/HistoryView'
import SettingsView from '../features/SettingsView'
import EditorView from '../features/EditorView'

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
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: [0.65, 0, 0.35, 1] as const }
  }
}

/**
 * MainArea — Right content area that renders the active view component.
 * Provides animated page transitions between views.
 */
export default function MainArea(): JSX.Element {
  const { activeView } = useAppStore()
  const ViewComponent = viewComponents[activeView]

  return (
    <main className="flex-1 overflow-hidden bg-[var(--color-bg-primary)]">
      <div className="h-full overflow-y-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            variants={pageVariants as import('framer-motion').Variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-6xl mx-auto"
          >
            {ViewComponent ? <ViewComponent /> : <Dashboard />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}