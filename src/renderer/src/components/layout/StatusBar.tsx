import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWindowSize } from '../../hooks/useWindowSize'
import { StatusDot } from '../ui/StatusDot'
import { UpdateChecker } from '../features/UpdateChecker'

/**
 * StatusBar — Bottom bar showing app status, git branch, and system info.
 */
export default function StatusBar(): JSX.Element {
  const { activeView } = useAppStore()
  const { github, workspaceDir } = useSettingsStore()
  const { isSmall } = useWindowSize()

  return (
    <motion.footer
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-7 px-4 flex items-center justify-between text-[11px] text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border)] shrink-0 select-none"
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <span className="capitalize">{activeView || 'dashboard'}</span>
        {workspaceDir && !isSmall && (
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />
            <span className="truncate max-w-[120px]">{workspaceDir}</span>
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <StatusDot status={github.isConnected ? 'connected' : 'disconnected'} size={6} />
          {isSmall ? '' : (github.isConnected ? 'GitHub' : 'Offline')}
        </span>
        <UpdateChecker compact />
      </div>
    </motion.footer>
  )
}