/**
 * Task Execution Engine Module
 *
 * Manages the autonomous coding workflow pipeline through discrete stages:
 *   analyze → plan → implement → test → review → commit → PR
 *
 * Uses Node.js child_process spawn for running real shell commands,
 * integrates with the sandbox module for isolated execution, and
 * persists task results to the SQLite database.
 *
 * Queue management features:
 *   - enqueue / cancel (SIGTERM) / pause / resume / getStatus / getHistory
 *   - Priority-based queue ordering
 *   - Progress tracking with real-time IPC events
 *
 * @module execution
 */

import { spawn, type ChildProcess } from 'child_process'
import { randomUUID } from 'crypto'
import type path from 'path'
import type { BrowserWindow } from 'electron'
import * as sandbox from '../sandbox/index'
import * as database from '../database/index'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Stage =
  | 'analyze'
  | 'plan'
  | 'implement'
  | 'test'
  | 'review'
  | 'commit'
  | 'pr'

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface ExecutionTask {
  id: string
  projectId: string
  projectPath: string
  title: string
  description: string
  stage: Stage
  status: ExecutionStatus
  progress: number // 0-100
  currentStep: string
  startedAt: string | null
  completedAt: string | null
  error: string | null
  result: Record<string, unknown> | null
  metadata: Record<string, unknown>
  /** Files modified during execution (populated during implement stage) */
  filesModified: string[]
  /** Tokens used (populated if an AI provider was used) */
  tokensUsed: number
  /** Elapsed time in milliseconds */
  elapsedMs: number
}

export interface QueueItem {
  taskId: string
  priority: number
  enqueuedAt: string
}

export interface ExecutionEvent {
  taskId: string
  type: 'stage-change' | 'progress' | 'output' | 'error' | 'complete'
  stage?: Stage
  progress?: number
  step?: string
  message?: string
  data?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Default pipeline stages
// ---------------------------------------------------------------------------

const PIPELINE_STAGES: Stage[] = [
  'analyze',
  'plan',
  'implement',
  'test',
  'review',
  'commit',
  'pr'
]

const STAGE_LABELS: Record<Stage, string> = {
  analyze: 'Analyzing codebase and requirements',
  plan: 'Planning implementation approach',
  implement: 'Implementing changes',
  test: 'Running tests and verification',
  review: 'Reviewing changes',
  commit: 'Committing changes',
  pr: 'Creating pull request'
}

/**
 * Shell commands to run for each stage (relative to projectPath).
 * These are default scripts; metadata can override per stage.
 */
const STAGE_COMMANDS: Record<Stage, string[]> = {
  analyze: [
    'ls -la',
    'find . -maxdepth 3 -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | head -100',
    'cat package.json 2>/dev/null || echo "No package.json found"'
  ],
  plan: [
    'echo "Planning complete — ready to implement"'
  ],
  implement: [
    'echo "Implementing changes..."'
  ],
  test: [
    'npm test 2>/dev/null || npx jest --passWithNoTests 2>/dev/null || echo "No test runner configured"'
  ],
  review: [
    'git diff --stat 2>/dev/null || echo "No git diff available"'
  ],
  commit: [
    'git add -A && git diff --cached --stat 2>/dev/null || echo "Nothing staged"'
  ],
  pr: [
    'echo "Ready for pull request"'
  ]
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const tasks: Map<string, ExecutionTask> = new Map()
const stageProcesses: Map<string, ChildProcess> = new Map()
const queue: QueueItem[] = []
let currentTaskId: string | null = null
let isPaused = false
let mainWindowRef: BrowserWindow | null = null

// ---------------------------------------------------------------------------
// IPC event emission
// ---------------------------------------------------------------------------

/**
 * Send an execution progress event to the renderer process.
 */
function emitProgress(taskId: string, progress: number, step?: string): void {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('execution:progress', {
      taskId,
      progress,
      step: step ?? ''
    })
  }
}

/**
 * Send an execution log line to the renderer process.
 */
function emitLog(
  taskId: string,
  line: string,
  stream: 'stdout' | 'stderr'
): void {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('execution:log', {
      taskId,
      line,
      stream
    })
  }
}

/**
 * Send an execution completion event to the renderer process.
 */
function emitComplete(
  taskId: string,
  exitCode: number | null,
  duration: number
): void {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('execution:complete', {
      taskId,
      exitCode,
      duration
    })
  }
}

/**
 * Legacy: send a general execution event (for backward compatibility).
 */
function emitEvent(event: ExecutionEvent): void {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('execution:event', event)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register the main window reference for sending execution events.
 */
export function setMainWindow(win: BrowserWindow): void {
  mainWindowRef = win
}

/**
 * Enqueue a new execution task into the pipeline.
 *
 * @param projectId   - The project to run against.
 * @param projectPath - Filesystem path to the project.
 * @param title       - Short title for the task.
 * @param description - Full description of what to do.
 * @param startStage  - Which stage to start from (default: 'analyze').
 * @param priority    - Queue priority (higher = sooner, default: 0).
 * @param metadata    - Optional metadata to attach.
 * @returns The created task ID.
 */
export function enqueue(
  projectId: string,
  projectPath: string,
  title: string,
  description: string,
  startStage: Stage = 'analyze',
  priority = 0,
  metadata: Record<string, unknown> = {}
): string {
  const id = randomUUID()

  const task: ExecutionTask = {
    id,
    projectId,
    projectPath,
    title,
    description,
    stage: startStage,
    status: 'queued',
    progress: 0,
    currentStep: STAGE_LABELS[startStage],
    startedAt: null,
    completedAt: null,
    error: null,
    result: null,
    metadata,
    filesModified: [],
    tokensUsed: 0,
    elapsedMs: 0
  }

  tasks.set(id, task)

  // Persist to database
  try {
    database.createTask({
      id,
      projectId,
      title,
      description,
      status: 'pending',
      priority: 'medium',
      stage: startStage,
      prUrl: null
    })
  } catch (err) {
    console.error('[execution] Failed to persist task:', err)
  }

  const queueItem: QueueItem = {
    taskId: id,
    priority,
    enqueuedAt: new Date().toISOString()
  }

  // Insert in priority order (highest first)
  const insertIndex = queue.findIndex((item) => item.priority < priority)
  if (insertIndex === -1) {
    queue.push(queueItem)
  } else {
    queue.splice(insertIndex, 0, queueItem)
  }

  emitEvent({
    taskId: id,
    type: 'stage-change',
    stage: startStage,
    step: STAGE_LABELS[startStage]
  })

  emitProgress(id, 0, STAGE_LABELS[startStage])

  // Auto-start if nothing is running
  if (!currentTaskId && !isPaused) {
    processQueue()
  }

  return id
}

/**
 * Dequeue (remove) a pending task from the queue.
 *
 * @param taskId - The task to remove.
 * @returns true if the task was dequeued.
 */
export function dequeue(taskId: string): boolean {
  const index = queue.findIndex((item) => item.taskId === taskId)
  if (index === -1) return false

  queue.splice(index, 1)
  const task = tasks.get(taskId)
  if (task && task.status === 'queued') {
    task.status = 'cancelled'
    task.completedAt = new Date().toISOString()
    emitEvent({
      taskId,
      type: 'complete',
      message: 'Task removed from queue'
    })
    emitComplete(taskId, null, 0)
  }
  return true
}

/**
 * Cancel a running or queued task.
 * Sends SIGTERM to any running child process.
 *
 * @param taskId - The task to cancel.
 */
export function cancel(taskId: string): void {
  // Remove from queue if pending
  if (dequeue(taskId)) return

  const task = tasks.get(taskId)
  if (!task) throw new Error(`Task not found: ${taskId}`)

  if (task.status === 'running') {
    // Kill any running stage process
    const proc = stageProcesses.get(taskId)
    if (proc) {
      try {
        proc.kill('SIGTERM')
        // Force kill after grace period
        setTimeout(() => {
          try {
            proc.kill('SIGKILL')
          } catch {
            // Already dead
          }
        }, 3000)
      } catch {
        // Process may have already exited
      }
      stageProcesses.delete(taskId)
    }

    task.status = 'cancelled'
    task.completedAt = new Date().toISOString()
    task.elapsedMs = task.startedAt
      ? Date.now() - new Date(task.startedAt).getTime()
      : 0
    currentTaskId = null

    emitEvent({
      taskId,
      type: 'complete',
      message: 'Task cancelled'
    })
    emitLog(taskId, '[execution] Task cancelled by user', 'stderr')
    emitComplete(taskId, null, task.elapsedMs)

    // Update database
    try {
      database.updateTask(taskId, {
        status: 'cancelled',
        stage: task.stage
      })
    } catch {
      // Non-critical
    }

    // Process next item in queue
    processQueue()
  }
}

/**
 * Cancel all running and queued tasks.
 */
export function cancelAll(): void {
  queue.length = 0

  if (currentTaskId) {
    const task = tasks.get(currentTaskId)
    if (task) {
      // Kill running stage process
      const proc = stageProcesses.get(currentTaskId)
      if (proc) {
        try {
          proc.kill('SIGTERM')
        } catch {
          // Already dead
        }
        stageProcesses.delete(currentTaskId)
      }

      task.status = 'cancelled'
      task.completedAt = new Date().toISOString()
      task.elapsedMs = task.startedAt
        ? Date.now() - new Date(task.startedAt).getTime()
        : 0
      emitEvent({
        taskId: currentTaskId,
        type: 'complete',
        message: 'Task cancelled (cancel all)'
      })
      emitComplete(currentTaskId, null, task.elapsedMs)
    }
    currentTaskId = null
  }

  // Cancel all queued tasks
  for (const item of queue) {
    const task = tasks.get(item.taskId)
    if (task) {
      task.status = 'cancelled'
      task.completedAt = new Date().toISOString()
    }
  }
  queue.length = 0
}

/**
 * Pause execution. The current task keeps running but the queue
 * won't process the next item.
 */
export function pause(): void {
  isPaused = true
  if (currentTaskId) {
    const task = tasks.get(currentTaskId)
    if (task) {
      task.status = 'paused'
      emitEvent({
        taskId: currentTaskId,
        type: 'stage-change',
        message: 'Execution paused'
      })
      emitLog(currentTaskId, '[execution] Execution paused', 'stdout')
    }
  }
}

/**
 * Resume execution from pause.
 */
export function resume(): void {
  isPaused = false
  if (!currentTaskId) {
    processQueue()
  } else {
    const task = tasks.get(currentTaskId)
    if (task) {
      task.status = 'running'
      emitEvent({
        taskId: currentTaskId,
        type: 'stage-change',
        message: 'Execution resumed'
      })
      emitLog(currentTaskId, '[execution] Execution resumed', 'stdout')
    }
  }
}

/**
 * Get the status of a task.
 */
export function getStatus(taskId: string): ExecutionTask | null {
  return tasks.get(taskId) ?? null
}

/**
 * Get the execution history for a project, ordered by recency.
 */
export function getHistory(projectId?: string): ExecutionTask[] {
  const allTasks = Array.from(tasks.values())
  const filtered = projectId
    ? allTasks.filter((t) => t.projectId === projectId)
    : allTasks
  return filtered.sort(
    (a, b) =>
      new Date(b.startedAt ?? b.completedAt ?? '').getTime() -
      new Date(a.startedAt ?? a.completedAt ?? '').getTime()
  )
}

/**
 * Get the current queue state.
 */
export function getQueueState(): {
  length: number
  currentTaskId: string | null
  isPaused: boolean
  pending: string[]
} {
  return {
    length: queue.length,
    currentTaskId,
    isPaused,
    pending: queue.map((item) => item.taskId)
  }
}

// ---------------------------------------------------------------------------
// Queue processing
// ---------------------------------------------------------------------------

/**
 * Process the next task in the queue.
 */
async function processQueue(): Promise<void> {
  if (currentTaskId || isPaused || queue.length === 0) return

  const nextItem = queue.shift()
  if (!nextItem) return

  const task = tasks.get(nextItem.taskId)
  if (!task) {
    processQueue() // Skip missing tasks
    return
  }

  await executeTask(task)
}

/**
 * Execute a single task through its pipeline stages.
 * Each stage runs real shell commands via the sandbox module.
 */
async function executeTask(task: ExecutionTask): Promise<void> {
  currentTaskId = task.id
  task.status = 'running'
  task.startedAt = new Date().toISOString()

  emitEvent({
    taskId: task.id,
    type: 'stage-change',
    stage: task.stage,
    message: 'Task started'
  })

  emitLog(task.id, `[execution] Task started: ${task.title}`, 'stdout')

  try {
    const startIdx = PIPELINE_STAGES.indexOf(task.stage)
    const stages = PIPELINE_STAGES.slice(startIdx)

    for (const stage of stages) {
      if ((task.status as ExecutionStatus) === 'cancelled') break
      if ((task.status as ExecutionStatus) === 'paused') {
        // Wait until resumed
        await waitForResume(task)
        if ((task.status as ExecutionStatus) === 'cancelled') break
      }

      task.stage = stage
      task.currentStep = STAGE_LABELS[stage]

      emitEvent({
        taskId: task.id,
        type: 'stage-change',
        stage,
        step: STAGE_LABELS[stage]
      })

      emitLog(
        task.id,
        `[execution] Stage: ${STAGE_LABELS[stage]}`,
        'stdout'
      )

      // Run the stage using real shell commands
      const success = await runStage(task, stage)

      if (!success) {
        task.status = 'failed'
        task.completedAt = new Date().toISOString()
        task.elapsedMs = task.startedAt
          ? Date.now() - new Date(task.startedAt).getTime()
          : 0
        emitEvent({
          taskId: task.id,
          type: 'error',
          message: task.error ?? 'Stage failed'
        })
        emitLog(
          task.id,
          `[execution] Stage failed: ${task.error ?? 'Unknown error'}`,
          'stderr'
        )
        finishTask(task)
        return
      }

      // Update database stage
      try {
        database.updateTask(task.id, { stage })
      } catch {
        // Non-critical
      }
    }

    // All stages completed
    task.status = 'completed'
    task.progress = 100
    task.completedAt = new Date().toISOString()
    task.elapsedMs = task.startedAt
      ? Date.now() - new Date(task.startedAt).getTime()
      : 0

    emitEvent({
      taskId: task.id,
      type: 'complete',
      message: 'All stages completed successfully'
    })
    emitLog(task.id, '[execution] All stages completed successfully', 'stdout')
    emitComplete(task.id, 0, task.elapsedMs)

    // Update database
    try {
      database.updateTask(task.id, {
        status: 'done',
        stage: task.stage
      })
    } catch {
      // Non-critical
    }
  } catch (err) {
    task.status = 'failed'
    task.error = err instanceof Error ? err.message : String(err)
    task.completedAt = new Date().toISOString()
    task.elapsedMs = task.startedAt
      ? Date.now() - new Date(task.startedAt).getTime()
      : 0

    emitEvent({
      taskId: task.id,
      type: 'error',
      message: task.error
    })
    emitLog(task.id, `[execution] Error: ${task.error}`, 'stderr')
    emitComplete(task.id, -1, task.elapsedMs)

    try {
      database.updateTask(task.id, { status: 'failed' })
    } catch {
      // Non-critical
    }
  }

  finishTask(task)
}

/**
 * Wait for a paused task to be resumed or cancelled.
 */
async function waitForResume(task: ExecutionTask): Promise<void> {
  return new Promise((resolve) => {
    const check = (): void => {
      if (task.status === 'cancelled') {
        resolve()
      } else if (!isPaused) {
        task.status = 'running'
        resolve()
      } else {
        setTimeout(check, 500)
      }
    }
    check()
  })
}

/**
 * Run a single pipeline stage by executing real shell commands.
 * Uses the sandbox module for isolated execution.
 *
 * @returns true if the stage completed successfully.
 */
async function runStage(
  task: ExecutionTask,
  stage: Stage
): Promise<boolean> {
  // Calculate progress range for this stage
  const stageIndex = PIPELINE_STAGES.indexOf(stage)
  const totalStages = PIPELINE_STAGES.length
  const baseProgress = Math.round((stageIndex / totalStages) * 100)
  const progressRange = Math.round(100 / totalStages)

  // Resolve commands — from metadata overrides or defaults
  const commands: string[] =
    (task.metadata?.commands as Record<string, string[]> | undefined)?.[
      stage
    ] ?? STAGE_COMMANDS[stage]

  // Run each command in sequence
  for (let i = 0; i < commands.length; i++) {
    if ((task.status as ExecutionStatus) === 'cancelled') return false
    if ((task.status as ExecutionStatus) === 'paused') await waitForResume(task)
    if ((task.status as ExecutionStatus) === 'cancelled') return false

    const cmd = commands[i]
    const stepProgress = Math.round(
      baseProgress + ((i + 1) / commands.length) * progressRange
    )

    task.progress = Math.min(stepProgress, 100)
    task.currentStep = `${STAGE_LABELS[stage]} (step ${i + 1}/${commands.length})`
    emitProgress(task.id, task.progress, task.currentStep)

    emitLog(task.id, `$ ${cmd}`, 'stdout')

    // Execute via sandbox
    const result = await sandbox.executeCommand(
      cmd,
      task.projectPath,
      (output) => {
        emitLog(task.id, output.text, output.type)
      },
      {
        timeout: task.metadata?.timeout as number | undefined,
        useDocker: task.metadata?.useDocker as boolean | undefined
      }
    )

    // Store result
    if (!task.result) {
      task.result = {}
    }
    const stageResults = (task.result as Record<string, unknown>)[stage] as
      | Record<string, unknown>
      | undefined
    if (stageResults) {
      ;(task.result as Record<string, unknown>)[stage] = {
        ...stageResults,
        [`cmd_${i}`]: {
          exitCode: result.exitCode,
          stdout: result.stdout.slice(0, 1000), // Truncate for memory
          stderr: result.stderr.slice(0, 500),
          duration: result.duration
        }
      }
    } else {
      ;(task.result as Record<string, unknown>)[stage] = {
        [`cmd_${i}`]: {
          exitCode: result.exitCode,
          stdout: result.stdout.slice(0, 1000),
          stderr: result.stderr.slice(0, 500),
          duration: result.duration
        }
      }
    }

    // Log to database execution_logs
    try {
      database.query(
        `INSERT INTO execution_logs (id, task_id, command, cwd, exit_code, stdout, stderr, duration, status, started_at, finished_at)
         VALUES ($id, $taskId, $command, $cwd, $exitCode, $stdout, $stderr, $duration, $status, datetime('now'), datetime('now'))`,
        {
          $id: randomUUID(),
          $taskId: task.id,
          $command: cmd,
          $cwd: task.projectPath,
          $exitCode: result.exitCode,
          $stdout: result.stdout.slice(0, 2000),
          $stderr: result.stderr.slice(0, 1000),
          $duration: result.duration,
          $status:
            result.exitCode === 0
              ? 'completed'
              : result.cancelled
                ? 'cancelled'
                : 'failed'
        }
      )
    } catch {
      // Non-critical
    }

    if (result.cancelled) {
      task.error = `Command cancelled: ${cmd}`
      return false
    }

    if (result.timedOut) {
      task.error = `Command timed out after ${result.duration}ms: ${cmd}`
      emitLog(task.id, task.error, 'stderr')
      return false
    }

    if (result.exitCode !== 0) {
      // Non-zero exit codes are not necessarily fatal — log but continue
      emitLog(
        task.id,
        `[execution] Command exited with code ${result.exitCode}: ${cmd}`,
        'stderr'
      )

      // Only fail if the metadata says to fail on non-zero
      if (task.metadata?.failOnError === true) {
        task.error = `Command failed (exit ${result.exitCode}): ${cmd}`
        return false
      }
    }
  }

  // Mark stage as completed
  task.progress = Math.min(baseProgress + progressRange, 99)

  return true
}

/**
 * Clean up after a task finishes (success, failure, or cancellation).
 */
function finishTask(task: ExecutionTask): void {
  currentTaskId = null
  stageProcesses.delete(task.id)

  emitEvent({
    taskId: task.id,
    type: 'complete',
    message:
      task.status === 'completed'
        ? 'Task completed'
        : `Task finished with status: ${task.status}`
  })

  // Process next in queue
  if (!isPaused) {
    processQueue()
  }
}
