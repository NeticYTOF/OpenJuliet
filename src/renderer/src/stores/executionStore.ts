import { create } from 'zustand'
import type { Task, ExecutionProgress, LogEntry } from '../types'
import { generateId } from '../lib/utils'

/**
 * Execution store — manages task queue, active task, and execution history.
 */
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
}

const initialState = {
  queue: [],
  activeTask: null,
  progress: null,
  history: [],
  isRunning: false,
  logs: []
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  ...initialState,

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
    return id
  },

  cancel: (taskId) =>
    set((state) => {
      const updatedQueue = state.queue.map((t) =>
        t.id === taskId ? { ...t, status: 'cancelled' as const, updatedAt: Date.now() } : t
      )
      const active =
        state.activeTask?.id === taskId
          ? { ...state.activeTask, status: 'cancelled' as const, updatedAt: Date.now() }
          : state.activeTask
      const cancelledTask =
        state.queue.find((t) => t.id === taskId) || state.activeTask?.id === taskId
          ? { ...(state.queue.find((t) => t.id === taskId) || state.activeTask!), status: 'cancelled' as const, updatedAt: Date.now() }
          : null
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
          activeTask: { ...state.activeTask, status: 'paused' as const, updatedAt: Date.now() },
          isRunning: false
        }
      }
      return {
        queue: state.queue.map((t) =>
          t.id === taskId ? { ...t, status: 'paused' as const, updatedAt: Date.now() } : t
        )
      }
    }),

  resume: (taskId) =>
    set((state) => {
      if (state.activeTask?.id === taskId) {
        return {
          activeTask: { ...state.activeTask, status: 'running' as const, updatedAt: Date.now() },
          isRunning: true
        }
      }
      return {
        queue: state.queue.map((t) =>
          t.id === taskId ? { ...t, status: 'queued' as const, updatedAt: Date.now() } : t
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

  reset: () => set(initialState)
}))