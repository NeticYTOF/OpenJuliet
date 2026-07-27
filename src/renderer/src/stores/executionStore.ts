import { create } from 'zustand'
import type { Task, ExecutionProgress, LogEntry } from '../types'
import { generateId } from '../lib/utils'

/**
 * Execution store — manages task queue, active task, and execution history.
 *
 * Listens to IPC events from the main process for real-time progress tracking:
 *   - execution:progress  => updates active task progress + step
 *   - execution:log       => appends log entries
 *   - execution:complete  => moves active task to history, updates elapsed time
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
  enqueue: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => string
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
    if (typeof window !== 'undefined' && window.api?.execution?.run) {
      window.api.execution
        .run({
          command: taskData.title,
          projectId: taskData.id
        })
        .catch((err) => {
          console.error('[executionStore] Failed to notify main process:', err)
        })
    }

    return id
  },

  cancel: (taskId) =>
    set((state) => {
      const updatedQueue = state.queue.map((t) =>
        t.id === taskId
          ? { ...t, status: 'cancelled' as const, updatedAt: Date.now() }
          : t
      )
      const active =
        state.activeTask?.id === taskId
          ? { ...state.activeTask, status: 'cancelled' as const, updatedAt: Date.now() }
          : state.activeTask
      const cancelledTask =
        state.queue.find((t) => t.id === taskId) || state.activeTask?.id === taskId
          ? {
              ...(state.queue.find((t) => t.id === taskId) || state.activeTask!),
              status: 'cancelled' as const,
              updatedAt: Date.now()
            }
          : null

      // Notify main process via IPC
      if (typeof window !== 'undefined' && window.api?.execution?.cancel) {
        window.api.execution.cancel(taskId).catch(() => {})
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

    if (
      typeof window !== 'undefined' &&
      window.api?.execution
    ) {
      // Attach to preload bridge listeners
      if (window.api.execution.onProgress) {
        unsubs.push(window.api.execution.onProgress(handleProgressEvent))
      }
      if (window.api.execution.onLog) {
        unsubs.push(window.api.execution.onLog(handleLogEvent))
      }
      if (window.api.execution.onComplete) {
        unsubs.push(window.api.execution.onComplete(handleCompleteEvent))
      }
    } else {
      // Fallback: use generic event bus if the execution API is not exposed
      if (
        typeof window !== 'undefined' &&
        window.api?.events?.on
      ) {
        unsubs.push(
          window.api.events.on('execution:progress', (data) => {
            handleProgressEvent(data as { taskId: string; progress: number; step?: string })
          })
        )
        unsubs.push(
          window.api.events.on('execution:log', (data) => {
            handleLogEvent(data as { taskId: string; line: string; stream: 'stdout' | 'stderr' })
          })
        )
        unsubs.push(
          window.api.events.on('execution:complete', (data) => {
            handleCompleteEvent(data as { taskId: string; exitCode: number | null; duration: number })
          })
        )
      }
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
