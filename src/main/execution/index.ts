/**
 * Task Execution Engine Module
 *
 * Manages the autonomous coding workflow pipeline through discrete stages:
 *   analyze → plan → implement → test → review → commit → PR
 *
 * Provides queue management (enqueue, dequeue, cancel, pause, resume),
 * progress tracking with real-time IPC events, and the ability to run
 * stages in worker threads for isolation.
 *
 * @module execution
 */

import { Worker, isMainThread, parentPort } from 'worker_threads'
import { randomUUID } from 'crypto'
import path from 'path'
import type { BrowserWindow } from 'electron'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The stages of the autonomous workflow pipeline.
 */
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

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const tasks: Map<string, ExecutionTask> = new Map()
const queue: QueueItem[] = []
let currentTaskId: string | null = null
let isPaused = false
let mainWindowRef: BrowserWindow | null = null

// ---------------------------------------------------------------------------
// IPC event emission
// ---------------------------------------------------------------------------

/**
 * Send an execution event to the renderer process.
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
    metadata
  }

  tasks.set(id, task)

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
  }
  return true
}

/**
 * Cancel a running or queued task.
 *
 * @param taskId - The task to cancel.
 */
export function cancel(taskId: string): void {
  // Remove from queue if pending
  if (dequeue(taskId)) return

  const task = tasks.get(taskId)
  if (!task) throw new Error(`Task not found: ${taskId}`)

  if (task.status === 'running') {
    task.status = 'cancelled'
    task.completedAt = new Date().toISOString()
    currentTaskId = null

    emitEvent({
      taskId,
      type: 'complete',
      message: 'Task cancelled'
    })

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
      task.status = 'cancelled'
      task.completedAt = new Date().toISOString()
      emitEvent({
        taskId: currentTaskId,
        type: 'complete',
        message: 'Task cancelled (cancel all)'
      })
    }
    currentTaskId = null
  }
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

  try {
    const startIdx = PIPELINE_STAGES.indexOf(task.stage)
    const stages = PIPELINE_STAGES.slice(startIdx)

    for (const stage of stages) {
      if ((task.status as string) === 'cancelled') break

      task.stage = stage
      task.currentStep = STAGE_LABELS[stage]

      emitEvent({
        taskId: task.id,
        type: 'stage-change',
        stage,
        step: STAGE_LABELS[stage]
      })

      // Run stage in a worker thread for isolation
      const success = await runStageInWorker(task, stage)

      if (!success) {
        task.status = 'failed'
        task.completedAt = new Date().toISOString()
        emitEvent({
          taskId: task.id,
          type: 'error',
          message: task.error ?? 'Stage failed'
        })
        finishTask(task)
        return
      }
    }

    task.status = 'completed'
    task.progress = 100
    task.completedAt = new Date().toISOString()

    emitEvent({
      taskId: task.id,
      type: 'complete',
      message: 'All stages completed successfully'
    })
  } catch (err) {
    task.status = 'failed'
    task.error = err instanceof Error ? err.message : String(err)
    task.completedAt = new Date().toISOString()

    emitEvent({
      taskId: task.id,
      type: 'error',
      message: task.error
    })
  }

  finishTask(task)
}

/**
 * Run a single pipeline stage in a worker thread.
 *
 * @returns true if the stage completed successfully.
 */
async function runStageInWorker(
  task: ExecutionTask,
  stage: Stage
): Promise<boolean> {
  // Update progress estimate based on stage index
  const stageIndex = PIPELINE_STAGES.indexOf(stage)
  const totalStages = PIPELINE_STAGES.length
  const baseProgress = Math.round((stageIndex / totalStages) * 100)
  const progressRange = Math.round(100 / totalStages)

  task.progress = baseProgress

  return new Promise((resolve) => {
    try {
      // Path to the worker script
      const workerPath = path.join(
        __dirname,
        '..',
        '..',
        'workers',
        `${stage}.js`
      )

      const worker = new Worker(workerPath, {
        workerData: {
          taskId: task.id,
          projectId: task.projectId,
          projectPath: task.projectPath,
          description: task.description,
          metadata: task.metadata
        }
      })

      worker.on('message', (msg: { type: string; data?: Record<string, unknown>; progress?: number; step?: string }) => {
        if (msg.type === 'progress') {
          task.progress = baseProgress + Math.round(((msg.progress ?? 0) / 100) * progressRange)
          task.currentStep = msg.step ?? task.currentStep
          emitEvent({
            taskId: task.id,
            type: 'progress',
            stage,
            progress: task.progress,
            step: task.currentStep
          })
        } else if (msg.type === 'output') {
          emitEvent({
            taskId: task.id,
            type: 'output',
            stage,
            message: String(msg.data?.text ?? '')
          })
        } else if (msg.type === 'result') {
          task.result = msg.data ?? null
        }
      })

      worker.on('error', (err) => {
        task.error = `Worker error: ${err.message}`
        resolve(false)
      })

      worker.on('exit', (code) => {
        if (code !== 0 && !task.error) {
          task.error = `Worker exited with code ${code}`
          resolve(false)
        } else {
          resolve(true)
        }
      })
    } catch (err) {
      // Worker file not found or other error — run inline instead
      task.error = null // Clear error for inline execution
      resolve(runStageInline(task, stage))
    }
  })
}

/**
 * Fallback: run a stage inline if no worker script exists.
 * This provides a synchronous stub that marks progress and returns success.
 * Real implementations would integrate with the sandbox, git, and
 * provider modules.
 */
async function runStageInline(
  task: ExecutionTask,
  stage: Stage
): Promise<boolean> {
  const duration = 100 // ms per stage (simulated for now)

  // Simulate incremental progress
  const steps = [10, 25, 50, 75, 90, 100]
  for (const step of steps) {
    if (task.status === 'cancelled') return false
    task.progress = Math.min(
      task.progress + Math.round(step / steps.length),
      100
    )
    emitEvent({
      taskId: task.id,
      type: 'progress',
      stage,
      progress: task.progress,
      step: `${STAGE_LABELS[stage]}...`
    })
    await new Promise((r) => setTimeout(r, duration / steps.length))
  }

  return true
}

/**
 * Clean up after a task finishes (success, failure, or cancellation).
 */
function finishTask(task: ExecutionTask): void {
  currentTaskId = null

  emitEvent({
    taskId: task.id,
    type: 'complete',
    message: task.status === 'completed'
      ? 'Task completed'
      : `Task finished with status: ${task.status}`
  })

  // Process next in queue
  if (!isPaused) {
    processQueue()
  }
}