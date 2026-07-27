import { useState, useCallback } from 'react'
import { Play, Loader2, Sparkles } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useExecutionStore } from '../../stores/executionStore'
import { generateId } from '../../lib/utils'
import { Card } from '../ui/Card'
import type { ActiveView } from '../../types'

/**
 * DemoButton — Prominent "Run Demo" button shown on the Dashboard.
 *
 * Starts the full autonomous workflow demo with one click:
 *   1. Creates a task in the execution store
 *   2. Invokes the demo pipeline via IPC
 *   3. Switches to the ExecutionPanel to watch live progress
 *   4. Shows loading state during execution
 *
 * When a demo is already running, the button is disabled.
 */
export default function DemoButton(): JSX.Element {
  const { setView, addNotification } = useAppStore()
  const { activeTask, isRunning } = useExecutionStore()

  const [loading, setLoading] = useState(false)

  const isDemoRunning = isRunning || loading

  const handleStartDemo = useCallback(async () => {
    if (isDemoRunning) return

    setLoading(true)

    try {
      const store = useExecutionStore.getState()
      const taskId = generateId()

      // Create a synthetic active task so the ExecutionPanel shows live state
      // We bypass enqueue() to avoid triggering the real execution:run IPC.
      store.startDemo(
        taskId,
        'Autonomous Workflow Demo',
        'Simulates the full 7-stage coding pipeline: analyze → plan → implement → test → review → commit → PR'
      )

      // Add initial log entry
      store.addLog({
        level: 'system',
        message: '┃ Starting OpenJuliet Autonomous Workflow Demo ┃',
        source: 'stdout'
      })
      store.addLog({
        level: 'system',
        message: 'Initializing demo environment...',
        source: 'stdout'
      })

      // Navigate to the execution panel
      setView('history' as ActiveView)

      // Invoke the demo pipeline in the main process
      const api = (window as any).api
      if (api?.demo?.start) {
        const result = await api.demo.start(taskId)
        if (!result.success) {
          addNotification(
            'error',
            'Demo Failed',
            result.error || 'Unknown error occurred during demo'
          )
        }
      } else {
        // Fallback: simulate demo entirely in the renderer
        addNotification(
          'warning',
          'Demo Running in Simulated Mode',
          'IPC bridge not available — demo will run locally with limited output.'
        )
        await simulateLocalDemo(taskId, store)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      addNotification('error', 'Demo Failed', message)
      console.error('[DemoButton] Demo error:', err)
    } finally {
      setLoading(false)
    }
  }, [isDemoRunning, setView, addNotification])

  return (
    <Card variant="accent" padding="lg" className="relative overflow-hidden">
      {/* Decorative background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/10 via-transparent to-[var(--color-accent-subtle)]/5 pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div className="p-3 rounded-xl bg-[var(--color-accent)]/20 shrink-0">
          <Sparkles size={24} className="text-[var(--color-accent)]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            Try the Autonomous Workflow
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
            See OpenJuliet in action without configuring GitHub or an AI provider.
            Click below to run a simulated 7-stage coding pipeline — analyze, plan,
            implement, test, review, commit, and PR.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap gap-3 mt-3">
            {['Live progress', 'Stage timeline', 'Log output'].map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)]/50 px-2 py-0.5 rounded-full"
              >
                <span className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />
                {feature}
              </span>
            ))}
          </div>

          {/* Action button */}
          <button
            onClick={handleStartDemo}
            disabled={isDemoRunning}
            className={`
              mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold
              transition-all duration-200
              ${
                isDemoRunning
                  ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                  : 'bg-[var(--color-accent)] text-white hover:opacity-90 hover:shadow-lg hover:shadow-[var(--color-accent)]/25 active:scale-[0.98]'
              }
            `}
          >
            {isDemoRunning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Demo Running…
              </>
            ) : (
              <>
                <Play size={16} />
                Run Full Demo
              </>
            )}
          </button>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Renderer-only fallback (when IPC bridge is unavailable)
// ---------------------------------------------------------------------------

/**
 * Simulate the demo entirely in the renderer process.
 * This is a fallback for when the IPC bridge to the main process
 * isn't available (e.g. running outside Electron).
 */
async function simulateLocalDemo(
  taskId: string,
  store: ReturnType<typeof useExecutionStore.getState>
): Promise<void> {
  const stages = [
    { name: 'Analyzing codebase', duration: 600 },
    { name: 'Planning implementation', duration: 500 },
    { name: 'Implementing changes', duration: 800 },
    { name: 'Running tests', duration: 600 },
    { name: 'Reviewing changes', duration: 400 },
    { name: 'Committing changes', duration: 300 },
    { name: 'Creating pull request', duration: 400 }
  ]

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]
    const progressStart = Math.floor((i / stages.length) * 100)
    const progressEnd = Math.floor(((i + 1) / stages.length) * 100)

    store.addLog({
      level: 'info',
      message: `── Stage ${i + 1}/${stages.length}: ${stage.name} ──`,
      source: 'stdout'
    })

    // Simulate progress within the stage
    const steps = 5
    for (let s = 0; s < steps; s++) {
      const pct = progressStart + ((progressEnd - progressStart) * (s + 1)) / steps
      store.addLog({
        level: 'info',
        message: `  [${'█'.repeat(s + 1)}${'░'.repeat(steps - s - 1)}] ${Math.floor(pct)}%`,
        source: 'stdout'
      })
      await new Promise((r) => setTimeout(r, stage.duration / steps))
    }

    store.setProgress({
      taskId,
      currentTool: stage.name,
      progress: progressEnd,
      elapsedMs: (i + 1) * 600,
      tokenCount: Math.floor(Math.random() * 500) + 100,
      filesEdited: i === 2 ? 2 : 0,
      logs: []
    })

    store.addLog({
      level: 'system',
      message: `  ✓ ${stage.name} complete`,
      source: 'stdout'
    })
  }

  store.addLog({
    level: 'system',
    message: 'Demo workflow complete — all 7 stages finished!',
    source: 'stdout'
  })

  store.setProgress(null)
  // The complete handler needs an active task...
  // Since we used startDemo(), we call handleCompleteEvent directly
  store.handleCompleteEvent({
    taskId,
    exitCode: 0,
    duration: stages.reduce((acc, s) => acc + s.duration, 0)
  })
}
