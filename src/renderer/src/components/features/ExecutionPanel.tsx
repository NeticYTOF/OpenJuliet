import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  Square,
  Terminal,
  FileText,
  Wrench,
  Command,
  Clock,
  Zap,
  Files,
  ChevronDown,
  ChevronRight,
  ScrollText
} from 'lucide-react'
import { useExecutionStore } from '../../stores/executionStore'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { ScrollArea } from '../ui/ScrollArea'
import { EmptyState } from '../ui/EmptyState'
import { AnimatedContainer, AnimatedItem } from '../ui/AnimatedContainer'
import { cn } from '../../lib/utils'

/**
 * ExecutionPanel — Live execution view with progress, logs, timeline, and task controls.
 */
export default function ExecutionPanel(): JSX.Element {
  const { activeTask, progress, isRunning, logs, pause, resume, cancel } = useExecutionStore()
  const [logExpanded, setLogExpanded] = useState(true)
  const [showTimeline, setShowTimeline] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    if (logExpanded && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, logExpanded])

  return (
    <AnimatedContainer animation="slideUp">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {activeTask ? 'Execution' : 'History'}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {activeTask
              ? `Currently ${isRunning ? 'running' : 'paused'} — ${activeTask.title}`
              : 'View completed task executions and logs'}
          </p>
        </div>
      </div>

      {!activeTask && !progress ? (
        <EmptyState
          icon={<Terminal size={40} />}
          title="No active execution"
          description="Start a task to see live execution details here, or browse the history below."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Info + Controls */}
          <div className="lg:col-span-1 space-y-4">
            <AnimatedItem>
              <Card variant="default" padding="lg">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                  Current Task
                </h3>
                {activeTask && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{activeTask.title}</p>
                      {activeTask.description && (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{activeTask.description}</p>
                      )}
                    </div>
                    <Badge
                      variant={isRunning ? 'accent' : 'warning'}
                      size="sm"
                      dot
                    >
                      {isRunning ? 'Running' : 'Paused'}
                    </Badge>
                  </div>
                )}
              </Card>
            </AnimatedItem>

            {/* Stats */}
            <AnimatedItem>
              <Card variant="default" padding="lg">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                  Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <Clock size={14} />
                      Elapsed
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
                      {formatDuration(progress?.elapsedMs || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <Zap size={14} />
                      Tokens
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
                      {progress?.tokenCount?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <Files size={14} />
                      Files Edited
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
                      {progress?.filesEdited || 0}
                    </span>
                  </div>
                </div>
              </Card>
            </AnimatedItem>

            {/* Controls */}
            <AnimatedItem>
              <Card variant="default" padding="lg">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                  Controls
                </h3>
                <div className="flex gap-2">
                  {isRunning ? (
                    <Button variant="secondary" size="sm" icon={<Pause size={14} />} onClick={() => activeTask && pause(activeTask.id)}>
                      Pause
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" icon={<Play size={14} />} onClick={() => activeTask && resume(activeTask.id)}>
                      Resume
                    </Button>
                  )}
                  <Button variant="danger" size="sm" icon={<Square size={14} />} onClick={() => activeTask && cancel(activeTask.id)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            </AnimatedItem>
          </div>

          {/* Progress + Activity + Logs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Progress */}
            <AnimatedItem>
              <Card variant="default" padding="lg">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                  Progress
                </h3>
                <ProgressBar
                  value={progress?.progress || 0}
                  showLabel
                  variant="accent"
                  size="lg"
                />
              </Card>
            </AnimatedItem>

            {/* Activity Feed */}
            <AnimatedItem>
              <Card variant="default" padding="lg">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                  Current Activity
                </h3>
                <div className="space-y-3">
                  {progress?.currentFile && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-info-bg)]">
                      <FileText size={14} className="text-[var(--color-info)]" />
                      <span className="text-xs text-[var(--color-text-primary)] truncate">{progress.currentFile}</span>
                    </div>
                  )}
                  {progress?.currentTool && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-accent-subtle)]">
                      <Wrench size={14} className="text-[var(--color-accent)]" />
                      <span className="text-xs text-[var(--color-text-primary)]">{progress.currentTool}</span>
                    </div>
                  )}
                  {progress?.currentCommand && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-bg-tertiary)]">
                      <Command size={14} className="text-[var(--color-text-muted)]" />
                      <code className="text-xs text-[var(--color-text-primary)] font-mono">{progress.currentCommand}</code>
                    </div>
                  )}
                </div>
              </Card>
            </AnimatedItem>

            {/* Log Viewer */}
            <AnimatedItem>
              <Card variant="default" padding="none">
                <button
                  onClick={() => setLogExpanded(!logExpanded)}
                  className="flex items-center justify-between w-full px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <ScrollText size={16} className="text-[var(--color-text-secondary)]" />
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Logs
                    </span>
                    <Badge variant="default" size="sm">{logs.length}</Badge>
                  </div>
                  {logExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {logExpanded && (
                  <div className="border-t border-[var(--color-border)]">
                    <ScrollArea className="h-64">
                      <div className="p-3 font-mono text-xs space-y-1">
                        {logs.length === 0 ? (
                          <p className="text-[var(--color-text-muted)] italic">No log entries yet.</p>
                        ) : (
                          logs.map((log) => (
                            <div
                              key={log.id}
                              className={cn(
                                'py-0.5',
                                log.level === 'error' && 'text-[var(--color-error)]',
                                log.level === 'warn' && 'text-[var(--color-warning)]',
                                log.level === 'system' && 'text-[var(--color-accent)]',
                                log.level === 'info' && 'text-[var(--color-text-secondary)]',
                                log.level === 'debug' && 'text-[var(--color-text-muted)]'
                              )}
                            >
                              <span className="opacity-50">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              {' '}{log.message}
                            </div>
                          ))
                        )}
                        <div ref={logEndRef} />
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </Card>
            </AnimatedItem>
          </div>
        </div>
      )}
    </AnimatedContainer>
  )
}

/**
 * Format milliseconds into a human-readable duration string.
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}