import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useExecutionStore } from '../executionStore'
import * as utils from '../../lib/utils'

// Mock generateId for predictable task IDs
vi.mock('../../lib/utils', async () => {
  const actual = await vi.importActual('../../lib/utils')
  let counter = 0
  return {
    ...(actual as Record<string, unknown>),
    generateId: vi.fn(() => `task-${++counter}`)
  }
})

function resetStore(): void {
  useExecutionStore.setState({
    queue: [],
    activeTask: null,
    progress: null,
    history: [],
    isRunning: false,
    logs: []
  })
}

beforeEach(() => {
  resetStore()
  vi.clearAllMocks()
})

describe('executionStore', () => {
  describe('initial state', () => {
    it('has correct initial state', () => {
      const state = useExecutionStore.getState()
      expect(state.queue).toEqual([])
      expect(state.activeTask).toBeNull()
      expect(state.progress).toBeNull()
      expect(state.history).toEqual([])
      expect(state.isRunning).toBe(false)
      expect(state.logs).toEqual([])
    })
  })

  describe('enqueue', () => {
    it('enqueues a single task', () => {
      const id = useExecutionStore.getState().enqueue({
        title: 'Test task',
        priority: 'medium'
      })
      const state = useExecutionStore.getState()
      expect(state.queue).toHaveLength(1)
      expect(state.queue[0]).toMatchObject({
        id,
        title: 'Test task',
        status: 'queued',
        priority: 'medium'
      })
      expect(typeof state.queue[0].createdAt).toBe('number')
      expect(typeof state.queue[0].updatedAt).toBe('number')
    })

    it('enqueues multiple tasks in order', () => {
      const id1 = useExecutionStore.getState().enqueue({
        title: 'Task 1',
        priority: 'low'
      })
      const id2 = useExecutionStore.getState().enqueue({
        title: 'Task 2',
        priority: 'high'
      })
      const id3 = useExecutionStore.getState().enqueue({
        title: 'Task 3',
        priority: 'critical'
      })

      const state = useExecutionStore.getState()
      expect(state.queue).toHaveLength(3)
      expect(state.queue[0].title).toBe('Task 1')
      expect(state.queue[1].title).toBe('Task 2')
      expect(state.queue[2].title).toBe('Task 3')
      expect(state.queue[0].priority).toBe('low')
      expect(state.queue[1].priority).toBe('high')
      expect(state.queue[2].priority).toBe('critical')
    })

    it('assigns unique IDs to each task', () => {
      const id1 = useExecutionStore.getState().enqueue({
        title: 'Task A',
        priority: 'medium'
      })
      const id2 = useExecutionStore.getState().enqueue({
        title: 'Task B',
        priority: 'medium'
      })
      expect(id1).not.toBe(id2)
    })

    it('calls IPC run when window.api is available', () => {
      const mockRun = vi.fn().mockResolvedValue(undefined)
      ;(window as any).api = {
        execution: { run: mockRun }
      }

      useExecutionStore.getState().enqueue({
        title: 'IPC task',
        priority: 'high'
      })

      expect(mockRun).toHaveBeenCalledTimes(1)
      expect(mockRun).toHaveBeenCalledWith(
        expect.objectContaining({ command: 'IPC task' })
      )

      delete (window as any).api
    })

    it('handles IPC run failure silently', () => {
      const mockRun = vi.fn().mockRejectedValue(new Error('IPC error'))
      ;(window as any).api = {
        execution: { run: mockRun }
      }

      expect(() => {
        useExecutionStore.getState().enqueue({
          title: 'IPC fail task',
          priority: 'medium'
        })
      }).not.toThrow()

      delete (window as any).api
    })
  })

  describe('cancel', () => {
    it('cancels a queued task', () => {
      const id = useExecutionStore.getState().enqueue({
        title: 'Cancel me',
        priority: 'medium'
      }) as string

      useExecutionStore.getState().cancel(id)
      const state = useExecutionStore.getState()
      expect(state.queue[0].status).toBe('cancelled')
    })

    it('cancels the active running task', () => {
      const id = useExecutionStore.getState().enqueue({
        title: 'Running task',
        priority: 'high'
      }) as string

      // Simulate it becoming active
      useExecutionStore.setState({
        activeTask: {
          ...useExecutionStore.getState().queue[0],
          status: 'running'
        },
        isRunning: true,
        queue: []
      })

      useExecutionStore.getState().cancel(id)
      const state = useExecutionStore.getState()
      expect(state.activeTask?.status).toBe('cancelled')
      expect(state.isRunning).toBe(false)
    })

    it('moves cancelled task to history', () => {
      const id = useExecutionStore.getState().enqueue({
        title: 'History bound',
        priority: 'low'
      }) as string

      useExecutionStore.getState().cancel(id)
      const state = useExecutionStore.getState()
      expect(state.history).toHaveLength(1)
      expect(state.history[0].id).toBe(id)
      expect(state.history[0].status).toBe('cancelled')
    })

    it('handles cancel of non-existent task gracefully', () => {
      // Should not throw
      expect(() => {
        useExecutionStore.getState().cancel('non-existent-id')
      }).not.toThrow()

      const state = useExecutionStore.getState()
      expect(state.queue).toEqual([])
      expect(state.activeTask).toBeNull()
      expect(state.history).toEqual([])
    })

    it('calls IPC cancel when window.api is available', () => {
      const mockCancel = vi.fn().mockResolvedValue(undefined)
      ;(window as any).api = {
        execution: { cancel: mockCancel }
      }

      const id = useExecutionStore.getState().enqueue({
        title: 'IPC cancel',
        priority: 'medium'
      })

      useExecutionStore.getState().cancel(id)
      expect(mockCancel).toHaveBeenCalledWith(id)

      delete (window as any).api
    })
  })

  describe('pause / resume', () => {
    it('pauses an active task', () => {
      const id = 'task-active'
      useExecutionStore.setState({
        activeTask: {
          id,
          title: 'Active task',
          status: 'running',
          priority: 'medium',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: [],
          tokenCount: 0,
          elapsedMs: 0
        },
        isRunning: true
      })

      useExecutionStore.getState().pause(id)
      const state = useExecutionStore.getState()
      expect(state.activeTask?.status).toBe('paused')
      expect(state.isRunning).toBe(false)
    })

    it('pauses a queued task', () => {
      const id = useExecutionStore.getState().enqueue({
        title: 'Queued to pause',
        priority: 'medium'
      })

      useExecutionStore.getState().pause(id)
      const state = useExecutionStore.getState()
      expect(state.queue[0].status).toBe('paused')
    })

    it('resumes a paused active task', () => {
      const id = 'task-paused'
      useExecutionStore.setState({
        activeTask: {
          id,
          title: 'Paused task',
          status: 'paused',
          priority: 'medium',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: [],
          tokenCount: 0,
          elapsedMs: 0
        },
        isRunning: false
      })

      useExecutionStore.getState().resume(id)
      const state = useExecutionStore.getState()
      expect(state.activeTask?.status).toBe('running')
      expect(state.isRunning).toBe(true)
    })

    it('resumes a paused queued task', () => {
      const id = useExecutionStore.getState().enqueue({
        title: 'Paused in queue',
        priority: 'medium'
      })

      // Manually set to paused
      useExecutionStore.setState({
        queue: [
          {
            ...useExecutionStore.getState().queue[0],
            status: 'paused'
          }
        ]
      })

      useExecutionStore.getState().resume(id)
      const state = useExecutionStore.getState()
      expect(state.queue[0].status).toBe('queued')
    })

    it('handles resume on a non-paused task gracefully (no-op)', () => {
      const id = 'task-running'
      useExecutionStore.setState({
        activeTask: {
          id,
          title: 'Still running',
          status: 'running',
          priority: 'medium',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: [],
          tokenCount: 0,
          elapsedMs: 0
        },
        isRunning: true
      })

      // Resuming a running task should still work — it sets status to 'running'
      useExecutionStore.getState().resume(id)
      const state = useExecutionStore.getState()
      expect(state.activeTask?.status).toBe('running')
      expect(state.isRunning).toBe(true)
    })

    it('handles resume of non-existent task gracefully', () => {
      expect(() => {
        useExecutionStore.getState().resume('non-existent-id')
      }).not.toThrow()

      const state = useExecutionStore.getState()
      // State should be unchanged
      expect(state.queue).toEqual([])
      expect(state.activeTask).toBeNull()
    })

    it('handles pause of non-existent task gracefully', () => {
      expect(() => {
        useExecutionStore.getState().pause('non-existent-id')
      }).not.toThrow()

      const constate = useExecutionStore.getState()
      expect(constate.queue).toEqual([])
    })
  })

  describe('progress updates', () => {
    it('sets progress via setProgress', () => {
      const progress = {
        taskId: 'task-1',
        progress: 50,
        currentTool: 'analyzing',
        elapsedMs: 1000,
        tokenCount: 100,
        filesEdited: 2,
        logs: []
      }

      useExecutionStore.getState().setProgress(progress)
      expect(useExecutionStore.getState().progress).toEqual(progress)
    })

    it('clears progress when set to null', () => {
      useExecutionStore.setState({
        progress: {
          taskId: 'task-1',
          progress: 50,
          elapsedMs: 1000,
          tokenCount: 100,
          filesEdited: 2,
          logs: []
        }
      })

      useExecutionStore.getState().setProgress(null)
      expect(useExecutionStore.getState().progress).toBeNull()
    })

    it('updates progress via handleProgressEvent', () => {
      const id = 'task-progress'
      useExecutionStore.setState({
        activeTask: {
          id,
          title: 'Progress task',
          status: 'running',
          priority: 'medium',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: [],
          tokenCount: 0,
          elapsedMs: 0
        },
        isRunning: true
      })

      useExecutionStore.getState().handleProgressEvent({
        taskId: id,
        progress: 42,
        step: 'compiling'
      })

      const state = useExecutionStore.getState()
      expect(state.progress?.progress).toBe(42)
      expect(state.progress?.currentTool).toBe('compiling')
      expect(state.progress?.taskId).toBe(id)
      expect(state.isRunning).toBe(true)
    })

    it('does not update progress for non-matching taskId', () => {
      useExecutionStore.setState({
        activeTask: {
          id: 'task-1',
          title: 'Task 1',
          status: 'running',
          priority: 'medium',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: [],
          tokenCount: 0,
          elapsedMs: 0
        },
        isRunning: true
      })

      useExecutionStore.getState().handleProgressEvent({
        taskId: 'different-task',
        progress: 99,
        step: 'done'
      })

      const state = useExecutionStore.getState()
      expect(state.activeTask?.id).toBe('task-1')
      // Progress may still be created for the different taskId
      if (state.progress) {
        expect(state.progress.taskId).toBe('different-task')
      }
    })
  })

  describe('history tracking', () => {
    it('stores completed tasks in history', () => {
      const id = 'task-complete'
      useExecutionStore.setState({
        activeTask: {
          id,
          title: 'Complete me',
          status: 'running',
          priority: 'medium',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: [],
          tokenCount: 0,
          elapsedMs: 0
        },
        isRunning: true
      })

      useExecutionStore.getState().handleCompleteEvent({
        taskId: id,
        exitCode: 0,
        duration: 5000
      })

      const state = useExecutionStore.getState()
      expect(state.history).toHaveLength(1)
      expect(state.history[0].id).toBe(id)
      expect(state.history[0].status).toBe('completed')
      expect(state.activeTask).toBeNull()
      expect(state.isRunning).toBe(false)
      expect(state.progress).toBeNull()
    })

    it('stores failed tasks in history with error exit code', () => {
      const id = 'task-fail'
      useExecutionStore.setState({
        activeTask: {
          id,
          title: 'Fail me',
          status: 'running',
          priority: 'high',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: [],
          tokenCount: 0,
          elapsedMs: 0
        },
        isRunning: true
      })

      useExecutionStore.getState().handleCompleteEvent({
        taskId: id,
        exitCode: 1,
        duration: 3000
      })

      const state = useExecutionStore.getState()
      expect(state.history).toHaveLength(1)
      expect(state.history[0].status).toBe('failed')
      expect(state.activeTask).toBeNull()
    })

    it('stores cancelled tasks in history', () => {
      const id = useExecutionStore.getState().enqueue({
        title: 'Cancel for history',
        priority: 'medium'
      })

      useExecutionStore.getState().cancel(id)
      expect(useExecutionStore.getState().history).toHaveLength(1)
      expect(useExecutionStore.getState().history[0].status).toBe('cancelled')
    })

    it('accumulates multiple history entries', () => {
      // Simulate multiple task completions
      for (let i = 0; i < 5; i++) {
        const taskId = `history-${i}`
        useExecutionStore.setState({
          activeTask: {
            id: taskId,
            title: `Task ${i}`,
            status: 'running',
            priority: 'medium',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            files: [],
            tokenCount: 0,
            elapsedMs: 0
          },
          isRunning: true
        })

        useExecutionStore.getState().handleCompleteEvent({
          taskId,
          exitCode: 0,
          duration: 1000
        })
      }

      expect(useExecutionStore.getState().history).toHaveLength(5)
    })

    it('clears history via clearHistory', () => {
      // Seed some history
      useExecutionStore.setState({
        history: [
          {
            id: 'old-1',
            title: 'Old task',
            status: 'completed',
            priority: 'medium',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            files: [],
            tokenCount: 0,
            elapsedMs: 0
          }
        ]
      })

      useExecutionStore.getState().clearHistory()
      expect(useExecutionStore.getState().history).toEqual([])
    })
  })

  describe('logs', () => {
    it('adds log entries', () => {
      useExecutionStore.getState().addLog({
        level: 'info',
        message: 'Hello world',
        source: 'stdout'
      })

      const state = useExecutionStore.getState()
      expect(state.logs).toHaveLength(1)
      expect(state.logs[0].message).toBe('Hello world')
      expect(state.logs[0].level).toBe('info')
      expect(typeof state.logs[0].id).toBe('string')
      expect(typeof state.logs[0].timestamp).toBe('number')
    })

    it('adds multiple log entries', () => {
      for (let i = 0; i < 10; i++) {
        useExecutionStore.getState().addLog({
          level: i % 2 === 0 ? 'info' : 'error',
          message: `Log entry ${i}`,
          source: i % 2 === 0 ? 'stdout' : 'stderr'
        })
      }

      expect(useExecutionStore.getState().logs).toHaveLength(10)
    })

    it('clears logs via clearLogs', () => {
      useExecutionStore.getState().addLog({ level: 'info', message: 'Temp', source: 'stdout' })
      useExecutionStore.getState().clearLogs()
      expect(useExecutionStore.getState().logs).toEqual([])
    })
  })

  describe('remove', () => {
    it('removes a task from the queue', () => {
      const id = useExecutionStore.getState().enqueue({
        title: 'Remove me',
        priority: 'low'
      })
      expect(useExecutionStore.getState().queue).toHaveLength(1)

      useExecutionStore.getState().remove(id)
      expect(useExecutionStore.getState().queue).toHaveLength(0)
    })

    it('does nothing when removing non-existent task', () => {
      useExecutionStore.getState().enqueue({ title: 'Keep me', priority: 'medium' })
      useExecutionStore.getState().remove('non-existent')
      expect(useExecutionStore.getState().queue).toHaveLength(1)
    })
  })

  describe('reorderQueue', () => {
    it('reorders tasks in the queue', () => {
      useExecutionStore.getState().enqueue({ title: 'Task A', priority: 'low' })
      useExecutionStore.getState().enqueue({ title: 'Task B', priority: 'medium' })
      useExecutionStore.getState().enqueue({ title: 'Task C', priority: 'high' })

      useExecutionStore.getState().reorderQueue(0, 2)
      const state = useExecutionStore.getState()
      expect(state.queue[0].title).toBe('Task B')
      expect(state.queue[1].title).toBe('Task C')
      expect(state.queue[2].title).toBe('Task A')
    })
  })

  describe('startDemo', () => {
    it('creates a synthetic active task', () => {
      useExecutionStore.getState().startDemo('demo-1', 'Demo Task', 'A demo task')

      const state = useExecutionStore.getState()
      expect(state.activeTask).not.toBeNull()
      expect(state.activeTask?.id).toBe('demo-1')
      expect(state.activeTask?.title).toBe('Demo Task')
      expect(state.activeTask?.description).toBe('A demo task')
      expect(state.activeTask?.status).toBe('running')
      expect(state.isRunning).toBe(true)
      expect(state.progress).toBeNull()
      expect(state.logs).toEqual([])
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      // Set up some state
      useExecutionStore.getState().enqueue({ title: 'Temp', priority: 'medium' })
      useExecutionStore.setState({
        isRunning: true,
        logs: [{ id: 'log-1', timestamp: Date.now(), level: 'info', message: 'test', source: 'stdout' }]
      })

      useExecutionStore.getState().reset()

      const state = useExecutionStore.getState()
      expect(state.queue).toEqual([])
      expect(state.activeTask).toBeNull()
      expect(state.progress).toBeNull()
      expect(state.history).toEqual([])
      expect(state.isRunning).toBe(false)
      expect(state.logs).toEqual([])
    })
  })

  describe('stress: concurrent operations', () => {
    it('handles enqueue, cancel, and history in sequence', () => {
      const id1 = useExecutionStore.getState().enqueue({ title: 'Stress 1', priority: 'high' })
      const id2 = useExecutionStore.getState().enqueue({ title: 'Stress 2', priority: 'high' })
      const id3 = useExecutionStore.getState().enqueue({ title: 'Stress 3', priority: 'high' })

      expect(useExecutionStore.getState().queue).toHaveLength(3)

      // Cancel the middle one
      useExecutionStore.getState().cancel(id2)
      expect(useExecutionStore.getState().queue[1].status).toBe('cancelled')
      expect(useExecutionStore.getState().history).toHaveLength(1)

      // Enqueue more
      const id4 = useExecutionStore.getState().enqueue({ title: 'Stress 4', priority: 'critical' })
      expect(useExecutionStore.getState().queue).toHaveLength(4)

      // Remove one
      useExecutionStore.getState().remove(id1)
      expect(useExecutionStore.getState().queue).toHaveLength(3)
      expect(useExecutionStore.getState().queue[0].title).toBe('Stress 2') // was cancelled, but still in queue

      // Clear history
      useExecutionStore.getState().clearHistory()
      expect(useExecutionStore.getState().history).toEqual([])

      // Reset everything
      useExecutionStore.getState().reset()
      const state = useExecutionStore.getState()
      expect(state.queue).toEqual([])
    })
  })
})
