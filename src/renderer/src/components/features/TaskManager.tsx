import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  ListChecks,
  Play,
  Pause,
  Square,
  Trash2,
  GripVertical,
  Clock,
  Zap,
  AlertCircle
} from 'lucide-react'
import { useExecutionStore } from '../../stores/executionStore'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { Dropdown } from '../ui/Dropdown'
import { AnimatedContainer, AnimatedItem } from '../ui/AnimatedContainer'
import { cn } from '../../lib/utils'
import { formatRelativeTime } from '../../lib/utils'
import type { Task, TaskStatus } from '../../types'

const statusConfig: Record<TaskStatus, { variant: 'success' | 'warning' | 'error' | 'info' | 'default' | 'accent'; label: string }> = {
  queued: { variant: 'default', label: 'Queued' },
  running: { variant: 'accent', label: 'Running' },
  paused: { variant: 'warning', label: 'Paused' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'error', label: 'Failed' },
  cancelled: { variant: 'default', label: 'Cancelled' }
}

/**
 * TaskManager — Task queue management with list, search/filter, context menu, and drag-to-reorder.
 */
export default function TaskManager(): JSX.Element {
  const { queue, history, isRunning, activeTask, enqueue, cancel, pause, resume, remove, reorderQueue } = useExecutionStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const allTasks = [...queue, ...(activeTask ? [activeTask] : [])]
  const filtered = allTasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || t.status === filter
    return matchesSearch && matchesFilter
  })

  const handleContextAction = (task: Task, action: string): void => {
    switch (action) {
      case 'play':
        resume(task.id)
        break
      case 'pause':
        pause(task.id)
        break
      case 'cancel':
        cancel(task.id)
        break
      case 'remove':
        remove(task.id)
        break
    }
  }

  return (
    <AnimatedContainer animation="slideUp">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Task Manager
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {allTasks.length} {allTasks.length === 1 ? 'task' : 'tasks'} in queue
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Play size={16} />}
          onClick={() => enqueue({
            title: 'New Task',
            priority: 'medium',
            description: ''
          })}
        >
          New Task
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">All</option>
          <option value="queued">Queued</option>
          <option value="running">Running</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={40} />}
          title="No tasks found"
          description={search ? 'Try a different search term.' : 'Queue a task to get started.'}
          action={!search ? <Button variant="primary" size="sm" icon={<Play size={14} />}>New Task</Button> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((task, index) => {
            const config = statusConfig[task.status]
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
                  task.status === 'running'
                    ? 'bg-[rgba(108,92,231,0.08)] border-[rgba(108,92,231,0.2)]'
                    : 'bg-[rgba(30,30,46,0.4)] border-transparent hover:bg-[var(--color-bg-tertiary)]'
                )}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => { e.preventDefault() }}
                onDrop={() => {
                  if (draggedIndex !== null && draggedIndex !== index) {
                    reorderQueue(draggedIndex, index)
                    setDraggedIndex(null)
                  }
                }}
              >
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
                  <GripVertical size={14} />
                </div>

                {/* Status dot */}
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      task.status === 'running' ? 'var(--color-accent)'
                      : task.status === 'queued' ? 'var(--color-text-muted)'
                      : task.status === 'paused' ? 'var(--color-warning)'
                      : task.status === 'completed' ? 'var(--color-success)'
                      : task.status === 'failed' ? 'var(--color-error)'
                      : 'var(--color-text-muted)'
                  }}
                />

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {task.title}
                    </span>
                    <Badge variant={config.variant} size="sm">{config.label}</Badge>
                    {task.priority === 'high' && <AlertCircle size={12} className="text-[var(--color-warning)]" />}
                    {task.priority === 'critical' && <AlertCircle size={12} className="text-[var(--color-error)]" />}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {formatRelativeTime(task.createdAt)}
                    </span>
                    {task.tokenCount && (
                      <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                        <Zap size={10} />{task.tokenCount.toLocaleString()}
                      </span>
                    )}
                    {task.elapsedMs && (
                      <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                        <Clock size={10} />{formatDuration(task.elapsedMs)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {(task.status === 'paused' || task.status === 'queued') && (
                    <button
                      onClick={() => handleContextAction(task, 'play')}
                      className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-success)] hover:bg-[var(--color-success-bg)] transition-colors"
                      title="Resume"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  {task.status === 'running' && (
                    <button
                      onClick={() => handleContextAction(task, 'pause')}
                      className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-warning)] hover:bg-[var(--color-warning-bg)] transition-colors"
                      title="Pause"
                    >
                      <Pause size={14} />
                    </button>
                  )}
                  {(task.status === 'running' || task.status === 'paused' || task.status === 'queued') && (
                    <button
                      onClick={() => handleContextAction(task, 'cancel')}
                      className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors"
                      title="Cancel"
                    >
                      <Square size={14} />
                    </button>
                  )}
                  {task.status !== 'running' && (
                    <Dropdown
                      trigger={
                        <button className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                          <MoreHorizontal size={14} />
                        </button>
                      }
                      items={[
                        { id: 'remove', label: 'Remove', icon: <Trash2 size={14} />, danger: true, onSelect: () => handleContextAction(task, 'remove') }
                      ]}
                    />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </AnimatedContainer>
  )
}

/**
 * Format milliseconds into a human-readable duration.
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}