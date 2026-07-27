import { motion } from 'framer-motion'
import {
  GitBranch,
  ListChecks,
  Clock,
  Activity,
  Github,
  Database,
  Cpu,
  FolderOpen,
  Plus,
  Settings
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { AnimatedContainer, AnimatedItem } from '../ui/AnimatedContainer'
import type { ActiveView } from '../../types'

/**
 * Quick stat card data.
 */
interface StatCard {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string; size?: number }>
  color: string
}

/**
 * Activity feed item.
 */
interface ActivityItem {
  id: string
  title: string
  description: string
  time: string
  type: 'success' | 'info' | 'warning' | 'default'
}

/**
 * Dashboard — Welcome dashboard with quick stats, activity feed, quick actions, and system status.
 */
export default function Dashboard(): JSX.Element {
  const { setView, activeView } = useAppStore()
  const { github, providers, workspaceDir } = useSettingsStore()

  const statCards: StatCard[] = [
    { label: 'Repositories', value: github.isConnected ? '3' : '—', icon: GitBranch, color: 'var(--color-accent)' },
    { label: 'Tasks Completed', value: '12', icon: ListChecks, color: 'var(--color-success)' },
    { label: 'Uptime', value: '2h 14m', icon: Clock, color: 'var(--color-info)' },
    { label: 'Active Tasks', value: '1', icon: Activity, color: 'var(--color-warning)' }
  ]

  const recentActivity: ActivityItem[] = [
    { id: '1', title: 'Code review completed', description: 'Reviewed 4 files in src/renderer', time: '5m ago', type: 'success' },
    { id: '2', title: 'Task paused', description: '"Add auth middleware" — paused by user', time: '18m ago', type: 'warning' },
    { id: '3', title: 'Repository cloned', description: 'Cloned nousresearch/hermes into workspace', time: '1h ago', type: 'info' }
  ]

  return (
    <AnimatedContainer animation="slideUp">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Welcome back
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Here&apos;s what&apos;s happening with your projects
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <AnimatedItem key={stat.label}>
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <span className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                    {stat.value}
                  </span>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon size={20} />
                </div>
              </div>
            </Card>
          </AnimatedItem>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <AnimatedItem>
            <Card variant="default" padding="lg">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="md"
                  icon={<GitBranch size={16} />}
                  fullWidth
                  onClick={() => setView('repositories' as ActiveView)}
                >
                  Clone Repository
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Plus size={16} />}
                  fullWidth
                  onClick={() => setView('tasks' as ActiveView)}
                >
                  New Task
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Settings size={16} />}
                  fullWidth
                  onClick={() => setView('settings' as ActiveView)}
                >
                  Open Settings
                </Button>
              </div>
            </Card>
          </AnimatedItem>

          {/* GitHub Connection */}
          <AnimatedItem>
            <Card variant="default" padding="lg" className="mt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-accent-subtle)]">
                  <Github size={18} className="text-[var(--color-accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {github.isConnected ? 'GitHub Connected' : 'GitHub Disconnected'}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {github.isConnected
                      ? `@${github.username || 'unknown'}`
                      : 'Connect to manage repositories'}
                  </p>
                </div>
                <Badge variant={github.isConnected ? 'success' : 'default'} size="sm" dot>
                  {github.isConnected ? 'Live' : 'Offline'}
                </Badge>
              </div>
            </Card>
          </AnimatedItem>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <AnimatedItem>
            <Card variant="default" padding="lg">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                Recent Activity
              </h3>

              {recentActivity.length === 0 ? (
                <div className="py-8 text-center">
                  <Activity size={32} className="mx-auto text-[var(--color-text-muted)] opacity-50 mb-2" />
                  <p className="text-sm text-[var(--color-text-secondary)]">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-[var(--color-border)]">
                  {recentActivity.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{
                          backgroundColor:
                            item.type === 'success'
                              ? 'var(--color-success)'
                              : item.type === 'warning'
                                ? 'var(--color-warning)'
                                : 'var(--color-info)'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {item.title}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">
                        {item.time}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </AnimatedItem>

          {/* System Status */}
          <AnimatedItem>
            <Card variant="default" padding="lg" className="mt-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                System Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-info-bg)]">
                    <Cpu size={16} className="text-[var(--color-info)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Providers</p>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {providers.filter((p) => p.enabled).length || 0} active
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-accent-subtle)]">
                    <FolderOpen size={16} className="text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Workspace</p>
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {workspaceDir || 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-success-bg)]">
                    <Database size={16} className="text-[var(--color-success)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Memory</p>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">~256 MB</p>
                  </div>
                </div>
              </div>
            </Card>
          </AnimatedItem>
        </div>
      </div>
    </AnimatedContainer>
  )
}