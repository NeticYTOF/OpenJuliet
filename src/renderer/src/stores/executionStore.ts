import { create } from 'zustand'
import type { Task, ExecutionProgress, LogEntry } from '../types'
import { generateId } from '../lib/utils'

/**
 * Maximum number of tasks allowed in the queue at once.
 */
const MAX_QUEUE_SIZE = 50

/**
 * Default execution timeout in milliseconds (30 minutes).
 */
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000

/**
 * Check interval for task timeout watcher in milliseconds.
 */
const TIMEOUT_CHECK_INTERVAL = 10_000

/**
 * Execution store — manages task queue, active task, and execution history.
 *
 * Listens to IPC events from the main process for real-time progress tracking:
 *   - execution:progress  => updates active task progress + step
 *   - execution:log       => appends log entries
 *   - execution:complete  => moves active task to history, updates elapsed time
 *
 * Edge case handling:
 *   - Cancel non-existent task → silent no-op
 *   - Pause already-paused task → silent no-op
 *   - Resume non-paused task → silent no-op
 *   - Queue full → warn and reject
 *   - Task timeout → auto-cancel with error
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExecutionState {
  /* ──── State ──── */
  queue: Task[]
  activeTask: Task | null
  progress: ExecutionProgress | null
  history: Task[]
  isRunning: boolean
  logs: LogEntry[]

  /* ──── Actions ──── */
  enqueue: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => string | null
  cancel: (taskId: string) => void
  pause: (taskId: string) => void
  resume: (taskId: string) => void
  remove: (taskId: string) => void
  setProgress: (progress: ExecutionProgress | null) => void
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
  clearLogs: () => void
  reorderQueue: (fromIndex: number, toIndex: number) => void
  clearHistory: () => void
  reset: () => void
  /** Initialize timeout watcher that auto-cancels tasks exceeding their timeout */
  initTimeoutWatcher: (timeoutMs?: number) => () => void

  /** Create a synthetic active task for the demo workflow.
   *  Sets up the store state so that IPC progress/log/complete events
   *  from the demo runner are handled correctly. */
  startDemo: (taskId: string, title: string, description: string) => void

  /* ──── IPC-powered actions ──── */
  /** Initialize IPC listeners (call once on app mount) */
  initIPCListeners: () => () => void
  /** Handle an incoming progress event from the main process */
  handleProgressEvent: (data: { taskId: string; progress: number; step?: string }) => void
  /** Handle an incoming log event from the main process */
  handleLogEvent: (data: { taskId: string; line: string; stream: 'stdout' | 'stderr' }) => void
  /** Handle an incoming completion event from the main process */
  handleCompleteEvent: (data: { taskId: string; exitCode: number | null; duration: number }) => void
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState = {
  queue: [],
  activeTask: null,
  progress: null,
  history: [],
  isRunning: false,
  logs: []
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  ...initialState,

  /* ──── Standard Actions ──── */

  enqueue: (taskData) => {
    const { queue } = get()

    // Queue full → warn and reject
    if (queue.length >= MAX_QUEUE_SIZE) {
      console.warn(
        `[executionStore] Queue full (${MAX_QUEUE_SIZE} tasks). Task "${taskData.title}" rejected.`
      )
      return null
    }

    const id = generateId()
    const now = Date.now()
    const task: Task = {
      ...taskData,
      id,
      status: 'queued',
      createdAt: now,
      updatedAt: now
    }
    set((state) => ({
      queue: [...state.queue, task]
    }))

    // Also notify the main process via IPC if available
    const api = (window as any).api
    if (api?.execution?.run) {
      api.execution
        .run({
          command: taskData.title,
          projectId: id
        })
        .catch((err: Error) => {
          console.error('[executionStore] Failed to notify main process:', err)
        })
    }

    return id
  },

  cancel: (taskId) =>
    set((state) => {
      // Silent no-op: task doesn't exist
      const taskInQueue = state.queue.find((t) => t.id === taskId)
      const isActive = state.activeTask?.id === taskId
      if (!taskInQueue && !isActive) {
        return state
      }

      const updatedQueue = state.queue.map((t) =>
        t.id === taskId
          ? { ...t, status: 'cancelled' as const, updatedAt: Date.now() }
          : t
      )
      const active =
        state.activeTask?.id === taskId
          ? { ...state.activeTask, status: 'cancelled' as const, updatedAt: Date.now() }
          : state.activeTask
      const cancelledTask = taskInQueue || isActive
        ? {
            ...(taskInQueue || state.activeTask!),
            status: 'cancelled' as const,
            updatedAt: Date.now()
          }
        : null

      // Notify main process via IPC
      const api = typeof window !== 'undefined' ? (window as any).api : null
      if (api?.execution?.cancel) {
        api.execution.cancel(taskId).catch(() => {})
      }

      return {
        queue: updatedQueue,
        activeTask: active,
        isRunning: active?.status === 'running',
        history: cancelledTask ? [...state.history, cancelledTask] : state.history
      }
    }),

  pause: (taskId) =>
    set((state) => {
      // Silent no-op: already paused or task doesn't exist
      const taskInQueue = state.queue.find((t) => t.id === taskId)
      const isActive = state.activeTask?.id === taskId
      if (!taskInQueue && !isActive) {
        return state
      }
      if (taskInQueue?.status === 'paused' || state.activeTask?.status === 'paused') {
        return state
      }

      if (state.activeTask?.id === taskId) {
        return {
          activeTask: {
            ...state.activeTask,
            status: 'paused' as const,
            updatedAt: Date.now()
          },
          isRunning: false
        }
      }
      return {
        queue: state.queue.map((t) =>
          t.id === taskId
            ? { ...t, status: 'paused' as const, updatedAt: Date.now() }
            : t
        )
      }
    }),

  resume: (taskId) =>
    set((state) => {
      // Silent no-op: task doesn't exist or isn't paused
      const taskInQueue = state.queue.find((t) => t.id === taskId)
      const isActive = state.activeTask?.id === taskId
      if (!taskInQueue && !isActive) {
        return state
      }
      if (state.activeTask?.status !== 'paused' && taskInQueue?.status !== 'paused') {
        return state
      }

      if (state.activeTask?.id === taskId) {
        return {
          activeTask: {
            ...state.activeTask,
            status: 'running' as const,
            updatedAt: Date.now()
          },
          isRunning: true
        }
      }
      return {
        queue: state.queue.map((t) =>
          t.id === taskId
            ? { ...t, status: 'queued' as const, updatedAt: Date.now() }
            : t
        )
      }
    }),

  remove: (taskId) =>
    set((state) => ({
      queue: state.queue.filter((t) => t.id !== taskId)
    })),

  setProgress: (progress) => set({ progress }),

  addLog: (entry) => {
    const log: LogEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now()
    }
    set((state) => ({
      logs: [...state.logs, log]
    }))
  },

  clearLogs: () => set({ logs: [] }),

  reorderQueue: (fromIndex, toIndex) =>
    set((state) => {
      const newQueue = [...state.queue]
      const [moved] = newQueue.splice(fromIndex, 1)
      newQueue.splice(toIndex, 0, moved)
      return { queue: newQueue }
    }),

  clearHistory: () => set({ history: [] }),

  reset: () => set(initialState),

  /**
   * initTimeoutWatcher — Starts an interval that monitors the active task
   * for timeout. If the task runs longer than timeoutMs, it is automatically
   * cancelled with an error.
   *
   * @returns An unsubscribe function to stop the watcher.
   */
  initTimeoutWatcher: (timeoutMs = DEFAULT_TIMEOUT_MS) => {
    const intervalId = setInterval(() => {
      const state = get()

      if (!state.activeTask || state.activeTask.status !== 'running') {
        return // No active running task to watch
      }

      const elapsed = Date.now() - state.activeTask.createdAt
      if (elapsed > timeoutMs) {
        const taskId = state.activeTask.id
        console.warn(
          `[executionStore] Task "${state.activeTask.title}" timed out after ${Math.floor(elapsed / 1000)}s`
        )

        // Auto-cancel with error
        const timedOutTask: Task = {
          ...state.activeTask,
          status: 'failed',
          error: `Task timed out after ${Math.floor(timeoutMs / 60000)} minutes`,
          updatedAt: Date.now()
        }

        set({
          activeTask: null,
          isRunning: false,
          progress: null,
          history: [...state.history, timedOutTask]
        })
      }
    }, TIMEOUT_CHECK_INTERVAL)

    return () => {
      clearInterval(intervalId)
    }
  },

  /**
   * startDemo — Sets up a synthetic active task for the demo workflow.
   *
   * Creates a fake Task entry in activeTask so that the IPC event handlers
   * (handleProgressEvent, handleCompleteEvent) can match on taskId and
   * update the store state correctly.  The task is never persisted.
   */
  startDemo: (taskId, title, description) => {
    const now = Date.now()
    set({
      activeTask: {
        id: taskId,
        title,
        description,
        status: 'running',
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
        files: [],
        tokenCount: 0,
        elapsedMs: 0
      } as Task,
      isRunning: true,
      progress: null,
      logs: []
    })
  },

  /* ──── IPC-powered Actions ──── */

  /**
   * Initialize IPC listeners for real-time execution tracking.
   * Must be called once when the app mounts (e.g. in a layout useEffect).
   *
   * @returns An unsubscribe function to clean up listeners.
   */
  initIPCListeners: () => {
    const unsubs: (() => void)[] = []
    const { handleProgressEvent, handleLogEvent, handleCompleteEvent } = get()
    const api = typeof window !== 'undefined' ? (window as any).api : null

    if (api?.execution) {
      // Attach to preload bridge listeners
      if (api.execution.onProgress) {
        unsubs.push(api.execution.onProgress(handleProgressEvent))
      }
      if (api.execution.onLog) {
        unsubs.push(api.execution.onLog(handleLogEvent))
      }
      if (api.execution.onComplete) {
        unsubs.push(api.execution.onComplete(handleCompleteEvent))
      }
    } else if (api?.events?.on) {
      // Fallback: use generic event bus
      unsubs.push(
        api.events.on('execution:progress', (data: unknown) => {
          handleProgressEvent(data as { taskId: string; progress: number; step?: string })
        })
      )
      unsubs.push(
        api.events.on('execution:log', (data: unknown) => {
          handleLogEvent(data as { taskId: string; line: string; stream: 'stdout' | 'stderr' })
        })
      )
      unsubs.push(
        api.events.on('execution:complete', (data: unknown) => {
          handleCompleteEvent(data as { taskId: string; exitCode: number | null; duration: number })
        })
      )
    }

    // Return a combined unsubscribe function
    return () => {
      unsubs.forEach((fn) => fn())
    }
  },

  /**
   * Handle an incoming progress event from the main process.
   * Updates the active task's progress and the ExecutionProgress object.
   */
  handleProgressEvent: (data) => {
    const { taskId, progress, step } = data
    set((state) => {
      // Update active task progress
      const activeTask =
        state.activeTask?.id === taskId
          ? {
              ...state.activeTask,
              progress,
              updatedAt: Date.now(),
              elapsedMs: state.activeTask.createdAt
                ? Date.now() - state.activeTask.createdAt
                : 0
            }
          : state.activeTask

      // Update ExecutionProgress object
      const progressObj: ExecutionProgress | null = state.progress
        ? {
            ...state.progress,
            progress,
            currentTool: step ?? state.progress.currentTool,
            elapsedMs: Date.now() - (state.activeTask?.createdAt ?? Date.now()),
            logs: state.logs.slice(-50) // Keep last 50 logs
          }
        : {
            taskId,
            progress,
            currentTool: step,
            elapsedMs: 0,
            tokenCount: 0,
            filesEdited: 0,
            logs: state.logs.slice(-50)
          }

      return {
        activeTask,
        progress: progressObj,
        isRunning: true
      }
    })
  },

  /**
   * Handle an incoming log event from the main process.
   * Appends a log entry and tracks metrics (files edited, tokens used).
   */
  handleLogEvent: (data) => {
    const { taskId, line, stream } = data
    const level =
      stream === 'stderr' ? 'error' : ('info' as LogEntry['level'])

    // Track files modified from stdout lines matching common edit patterns
    let filesEdited = 0
    const fileMatch = line.match(
      /^(?:Edited|Modified|Created|Updated|Changed)\s+(.+?)(?:\s|$)/i
    )
    if (fileMatch) {
      filesEdited = 1
    }

    // Track token usage from provider log lines
    let tokensUsed = 0
    const tokenMatch = line.match(
      /(?:tokens|token_count|total_tokens)[:\s]*(\d+)/i
    )
    if (tokenMatch) {
      tokensUsed = parseInt(tokenMatch[1], 10)
    }

    set((state) => {
      const log: LogEntry = {
        id: generateId(),
        timestamp: Date.now(),
        level,
        message: line,
        source: stream
      }

      return {
        logs: [...state.logs, log],
        progress: state.progress
          ? {
              ...state.progress,
              filesEdited: state.progress.filesEdited + filesEdited,
              tokenCount: state.progress.tokenCount + tokensUsed,
              logs: [...state.logs.slice(-49), log]
            }
          : state.progress,
        activeTask:
          state.activeTask?.id === taskId
            ? {
                ...state.activeTask,
                files: fileMatch
                  ? [
                      ...(state.activeTask.files ?? []),
                      fileMatch[1]
                    ]
                  : state.activeTask.files,
                tokenCount:
                  (state.activeTask.tokenCount ?? 0) + tokensUsed
              }
            : state.activeTask
      }
    })
  },

  /**
   * Handle an incoming completion event from the main process.
   * Moves the active task to history and updates elapsed time.
   */
  handleCompleteEvent: (data) => {
    const { taskId, exitCode, duration } = data
    set((state) => {
      if (!state.activeTask || state.activeTask.id !== taskId) {
        return state
      }

      const isSuccess = exitCode === 0
      const completedTask: Task = {
        ...state.activeTask,
        status: isSuccess ? 'completed' : 'failed',
        completedAt: Date.now(),
        updatedAt: Date.now(),
        elapsedMs: duration > 0 ? duration : state.activeTask.elapsedMs
      }

      return {
        activeTask: null,
        queue: state.queue.filter((t) => t.id !== taskId),
        isRunning: false,
        progress: null,
        history: [...state.history, completedTask]
      }
    })
  }
}))
