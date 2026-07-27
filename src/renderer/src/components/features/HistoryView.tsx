import { useMemo } from 'react'
import { Activity, Terminal } from 'lucide-react'
import { Tabs } from '../ui/Tabs'
import { ActivityFeed } from './ActivityFeed'
import ExecutionPanel from './ExecutionPanel'
import { useExecutionStore } from '../../stores/executionStore'
import type { ActivityEntry, ActivitySeverity } from './ActivityFeed'

/**
 * HistoryView — Tabbed view combining ExecutionPanel (task history) and ActivityFeed.
 *
 * Tab 1: Execution Panel — shows task execution history
 * Tab 2: Activity Feed — shows a live stream of code/git/AI/system events
 */
export default function HistoryView(): JSX.Element {
  const { history, logs, activeTask } = useExecutionStore()

  // Derive ActivityFeed entries from the execution store
  const activities: ActivityEntry[] = useMemo(() => {
    const entries: ActivityEntry[] = []

    // Convert execution history items to activity entries
    for (const task of history) {
      let severity: ActivitySeverity = 'info'
      if (task.status === 'completed') severity = 'success'
      else if (task.status === 'failed') severity = 'error'
      else if (task.status === 'cancelled') severity = 'warning'

      entries.push({
        id: `task-${task.id}`,
        type: 'system',
        severity,
        title: task.title,
        description: task.status === 'completed'
          ? `Completed in ${Math.round((task.elapsedMs ?? 0) / 1000)}s`
          : task.status === 'failed'
            ? task.error ?? 'Task failed'
            : `Task ${task.status}`,
        timestamp: task.completedAt ?? task.updatedAt,
        metadata: {
          Status: task.status,
          Duration: task.elapsedMs ? `${Math.round(task.elapsedMs / 1000)}s` : '—',
          ...(task.model ? { Model: task.model } : {})
        }
      })
    }

    // Convert active task to an activity entry
    if (activeTask) {
      entries.push({
        id: `active-${activeTask.id}`,
        type: 'ai',
        severity: 'info',
        title: activeTask.title,
        description: 'Currently running…',
        timestamp: activeTask.updatedAt,
        metadata: {
          Status: 'running',
          ...(activeTask.model ? { Model: activeTask.model } : {})
        }
      })
    }

    // Convert log entries to activity entries
    for (const log of logs.slice(-20)) {
      let severity: ActivitySeverity = 'info'
      if (log.level === 'error') severity = 'error'
      else if (log.level === 'warn') severity = 'warning'

      entries.push({
        id: `log-${log.id}`,
        type: 'system',
        severity,
        title: log.message.slice(0, 80),
        timestamp: log.timestamp,
        metadata: log.source ? { Source: log.source } : undefined
      })
    }

    // Sort by timestamp descending
    return entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50)
  }, [history, logs, activeTask])

  const tabs = [
    {
      value: 'execution',
      label: 'Execution History',
      icon: <Terminal size={16} />
    },
    {
      value: 'activity',
      label: 'Activity Feed',
      icon: <Activity size={16} />
    }
  ]

  return (
    <Tabs tabs={tabs} defaultValue="execution" size="sm">
      {/* Tab 1: Execution Panel */}
      <div className="pt-4">
        <ExecutionPanel />
      </div>

      {/* Tab 2: Activity Feed */}
      <div className="pt-4">
        <ActivityFeed
          activities={activities}
          loading={false}
        />
      </div>
    </Tabs>
  )
}
