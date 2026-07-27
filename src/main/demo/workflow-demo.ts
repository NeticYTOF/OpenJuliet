/**
 * OpenJuliet — Workflow Demo Script
 *
 * Demonstrates the autonomous workflow pipeline by creating a sample
 * React Counter component in the workspace directory.
 *
 * This demo simulates the full workflow lifecycle (analyse → plan →
 * implement → test → review → complete) without requiring an actual
 * AI provider or GitHub connection. It's intended for onboarding,
 * testing the UI pipeline, and showing how stages progress.
 *
 * @module main/demo
 */

import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Progress callback — mirrors the real workflow's progress event signature. */
export type DemoProgressCallback = (
  stage: string,
  progress: number,
  message: string
) => void

/** Result returned by the demo workflow. */
export interface DemoWorkflowResult {
  success: boolean
  workspaceDir: string
  filesCreated: string[]
  stagesCompleted: string[]
  duration: number
  summary: string
}

// ---------------------------------------------------------------------------
// Demo stage definitions
// ---------------------------------------------------------------------------

interface DemoStage {
  id: string
  label: string
  startPct: number
  endPct: number
}

const DEMO_STAGES: DemoStage[] = [
  { id: 'analyse', label: 'Analysing workspace', startPct: 0, endPct: 15 },
  { id: 'plan', label: 'Planning implementation', startPct: 15, endPct: 35 },
  { id: 'implement', label: 'Writing code', startPct: 35, endPct: 70 },
  { id: 'test', label: 'Running tests', startPct: 70, endPct: 85 },
  { id: 'review', label: 'Reviewing changes', startPct: 85, endPct: 95 },
  { id: 'complete', label: 'Finalising', startPct: 95, endPct: 100 }
]

// ---------------------------------------------------------------------------
// Counter component template
// ---------------------------------------------------------------------------

const COUNTER_COMPONENT_TSX = `import { useState, useCallback } from 'react'

/**
 * Counter — A simple interactive counter component.
 *
 * Created by OpenJuliet's autonomous workflow demo.
 * Features increment/decrement/reset with a live display.
 */
export default function Counter(): JSX.Element {
  const [count, setCount] = useState(0)

  const increment = useCallback(() => setCount((c) => c + 1), [])
  const decrement = useCallback(() => setCount((c) => c - 1), [])
  const reset = useCallback(() => setCount(0), [])

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        Interactive Counter
      </h2>

      <div className="text-4xl font-bold tabular-nums text-[var(--color-accent)]">
        {count}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={decrement}
          className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-subtle)] transition-colors"
          aria-label="Decrement"
        >
          −1
        </button>
        <button
          onClick={increment}
          className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
          aria-label="Increment"
        >
          +1
        </button>
        <button
          onClick={reset}
          className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Reset"
        >
          Reset
        </button>
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        Built by OpenJuliet — try editing the component!
      </p>
    </div>
  )
}
`

const COUNTER_STORY_TSX = `import type { Meta, StoryObj } from '@storybook/react'
import Counter from './Counter'

const meta: Meta<typeof Counter> = {
  title: 'Example/Counter',
  component: Counter,
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof Counter>

export const Default: Story = {}
`

const COUNTER_TEST_TSX = `import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Counter from './Counter'

describe('Counter', () => {
  it('renders with initial value of 0', () => {
    render(<Counter />)
    expect(screen.getByText('0')).toBeDefined()
  })

  it('increments when +1 is clicked', () => {
    render(<Counter />)
    fireEvent.click(screen.getByLabelText('Increment'))
    expect(screen.getByText('1')).toBeDefined()
  })

  it('decrements when −1 is clicked', () => {
    render(<Counter />)
    fireEvent.click(screen.getByLabelText('Increment'))
    fireEvent.click(screen.getByLabelText('Decrement'))
    expect(screen.getByText('0')).toBeDefined()
  })

  it('resets to 0 when Reset is clicked', () => {
    render(<Counter />)
    fireEvent.click(screen.getByLabelText('Increment'))
    fireEvent.click(screen.getByLabelText('Increment'))
    fireEvent.click(screen.getByLabelText('Increment'))
    fireEvent.click(screen.getByLabelText('Reset'))
    expect(screen.getByText('0')).toBeDefined()
  })
})
`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Utility sleep — returns a promise that resolves after `ms` milliseconds.
 * Used to simulate real work durations in the demo.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Main demo function
// ---------------------------------------------------------------------------

/**
 * runDemoWorkflow — Creates a sample React Counter component in the workspace.
 *
 * Walks through the simulated autonomous workflow stages:
 *   1. Analyse   — Inspects the target workspace directory.
 *   2. Plan      — Determines what files to create.
 *   3. Implement — Writes the Counter component, story, and test files.
 *   4. Test      — Validates that files were created correctly.
 *   5. Review    — Checks file integrity and structure.
 *   6. Complete  — Generates a summary of what was accomplished.
 *
 * @param workspaceDir - Target directory (defaults to a 'demo' sub-folder).
 * @param onProgress   - Optional callback for real-time progress display.
 * @returns A summary of what was created and how long it took.
 */
export async function runDemoWorkflow(
  workspaceDir?: string,
  onProgress?: DemoProgressCallback
): Promise<DemoWorkflowResult> {
  const startTime = Date.now()
  const stagesCompleted: string[] = []
  const filesCreated: string[] = []
  const errors: string[] = []

  // Resolve workspace — default to CWD/demo-output
  const baseDir = workspaceDir || path.join(process.cwd(), 'demo-output')
  const demoDir = path.join(baseDir, 'components', 'demo')

  const progress = (stage: string, pct: number, msg: string): void => {
    onProgress?.(stage, pct, msg)
  }

  try {
    // ─── Stage 1: Analyse ───────────────────────────────────────────────
    progress('analyse', 2, 'Inspecting workspace directory...')
    await sleep(300)

    // Check if the directory exists
    let dirExists = false
    try {
      await fs.access(baseDir)
      dirExists = true
    } catch {
      // Directory doesn't exist yet — we'll create it
    }

    progress(
      'analyse',
      8,
      dirExists
        ? `Workspace found at ${baseDir}`
        : 'Workspace does not exist — will create'
    )

    // Determine if components directory has existing files
    let existingFiles: string[] = []
    if (dirExists) {
      try {
        existingFiles = await fs.readdir(path.join(baseDir, 'components'))
      } catch {
        // No components dir yet
      }
    }

    progress(
      'analyse',
      12,
      existingFiles.length > 0
        ? `Found ${existingFiles.length} existing component(s)`
        : 'Clean workspace — no existing components'
    )
    await sleep(200)
    stagesCompleted.push('analyse')
    progress('analyse', 15, 'Analysis complete')

    // ─── Stage 2: Plan ──────────────────────────────────────────────────
    progress('plan', 18, 'Generating implementation plan...')
    await sleep(400)

    const plan = [
      { file: 'Counter.tsx', description: 'Main counter component' },
      { file: 'Counter.stories.tsx', description: 'Storybook story file' },
      { file: 'Counter.test.tsx', description: 'Unit tests' }
    ]

    for (const item of plan) {
      progress(
        'plan',
        20 + (plan.indexOf(item) / plan.length) * 15,
        `Planning: ${item.file} — ${item.description}`
      )
      await sleep(150)
    }

    stagesCompleted.push('plan')
    progress('plan', 35, `Plan ready — ${plan.length} files to create`)
    await sleep(100)

    // ─── Stage 3: Implement ──────────────────────────────────────────────
    progress('implement', 38, 'Creating directory structure...')
    await fs.mkdir(demoDir, { recursive: true })
    await sleep(200)

    // Write Counter.tsx
    progress('implement', 45, 'Writing Counter.tsx...')
    const counterPath = path.join(demoDir, 'Counter.tsx')
    await fs.writeFile(counterPath, COUNTER_COMPONENT_TSX, 'utf-8')
    filesCreated.push(counterPath)
    await sleep(300)

    // Write Counter.stories.tsx
    progress('implement', 55, 'Writing Counter.stories.tsx...')
    const storyPath = path.join(demoDir, 'Counter.stories.tsx')
    await fs.writeFile(storyPath, COUNTER_STORY_TSX, 'utf-8')
    filesCreated.push(storyPath)
    await sleep(200)

    // Write Counter.test.tsx
    progress('implement', 65, 'Writing Counter.test.tsx...')
    const testPath = path.join(demoDir, 'Counter.test.tsx')
    await fs.writeFile(testPath, COUNTER_TEST_TSX, 'utf-8')
    filesCreated.push(testPath)
    await sleep(200)

    stagesCompleted.push('implement')
    progress('implement', 70, 'All files created')
    await sleep(100)

    // ─── Stage 4: Test ──────────────────────────────────────────────────
    progress('test', 73, 'Validating file integrity...')
    await sleep(300)

    // Verify each file was written correctly
    for (const filePath of filesCreated) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        if (content.length === 0) {
          errors.push(`${path.basename(filePath)} is empty`)
          progress(
            'test',
            75 + (filesCreated.indexOf(filePath) / filesCreated.length) * 8,
            `⚠ ${path.basename(filePath)} is empty`
          )
        } else {
          progress(
            'test',
            75 + (filesCreated.indexOf(filePath) / filesCreated.length) * 8,
            `✓ ${path.basename(filePath)} — ${content.length} bytes`
          )
        }
        await sleep(150)
      } catch (err) {
        errors.push(`Cannot read ${path.basename(filePath)}: ${err}`)
      }
    }

    stagesCompleted.push('test')
    progress('test', 85, errors.length === 0 ? 'All files verified' : `${errors.length} issue(s) found`)
    await sleep(100)

    // ─── Stage 5: Review ─────────────────────────────────────────────────
    progress('review', 87, 'Reviewing code quality...')
    await sleep(300)

    // Check that Counter.tsx defines a default export
    const counterContent = await fs.readFile(counterPath, 'utf-8')
    const hasExportDefault = counterContent.includes('export default')
    const hasJSXReturn = counterContent.includes('return (')
    const hasUseState = counterContent.includes('useState')
    const hasUseCallback = counterContent.includes('useCallback')

    const reviewChecks = [
      { name: 'Default export present', passed: hasExportDefault },
      { name: 'JSX render function', passed: hasJSXReturn },
      { name: 'State management (useState)', passed: hasUseState },
      { name: 'Performance optimisation (useCallback)', passed: hasUseCallback },
      { name: 'Test file present', passed: filesCreated.some((f) => f.endsWith('.test.tsx')) }
    ]

    for (const check of reviewChecks) {
      progress(
        'review',
        88 + (reviewChecks.indexOf(check) / reviewChecks.length) * 6,
        check.passed ? `✓ ${check.name}` : `✗ ${check.name}`
      )
      await sleep(200)
    }

    const allChecksPassed = reviewChecks.every((c) => c.passed)
    stagesCompleted.push('review')
    progress(
      'review',
      95,
      allChecksPassed ? 'Code review passed' : 'Some checks failed — review manually'
    )
    await sleep(100)

    // ─── Stage 6: Complete ───────────────────────────────────────────────
    progress('complete', 97, 'Generating summary...')
    await sleep(300)

    const duration = Date.now() - startTime
    const totalBytes = filesCreated.reduce((sum, f) => sum + counterContent.length, 0)

    const summary = [
      `Created ${filesCreated.length} file(s) in ${demoDir}`,
      `Files: ${filesCreated.map((f) => path.basename(f)).join(', ')}`,
      `Total size: ~${(totalBytes / 1024).toFixed(1)} KB`,
      `Stages: ${stagesCompleted.join(' → ')}`,
      `Duration: ${(duration / 1000).toFixed(1)}s`,
      errors.length > 0 ? `Warnings: ${errors.length}` : 'No issues'
    ].join('\n')

    stagesCompleted.push('complete')
    progress('complete', 100, 'Workflow demo complete')

    return {
      success: true,
      workspaceDir: demoDir,
      filesCreated,
      stagesCompleted,
      duration,
      summary
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    errors.push(errorMsg)

    return {
      success: false,
      workspaceDir: demoDir,
      filesCreated,
      stagesCompleted,
      duration: Date.now() - startTime,
      summary: `Demo failed at stage "${stagesCompleted[stagesCompleted.length - 1] || 'init'}": ${errorMsg}`
    }
  }
}

// ---------------------------------------------------------------------------
// CLI entry point (when run directly via `npx ts-node` or `electron`)
// ---------------------------------------------------------------------------

/**
 * If this script is executed directly, run the demo and print the result.
 */
if (require.main === module) {
  const customDir = process.argv[2]

  const logProgress: DemoProgressCallback = (stage, pct, msg) => {
    console.log(`[${stage.toUpperCase().padEnd(10)}] ${pct.toString().padStart(3)}%  ${msg}`)
  }

  runDemoWorkflow(customDir, logProgress)
    .then((result) => {
      console.log('\n═══════════════════════════════════════')
      console.log('  Demo Workflow Result')
      console.log('═══════════════════════════════════════')
      console.log(`  Status:  ${result.success ? '✓ Success' : '✗ Failed'}`)
      console.log(`  Dir:     ${result.workspaceDir}`)
      console.log(`  Files:   ${result.filesCreated.length}`)
      console.log(`  Stages:  ${result.stagesCompleted.join(' → ')}`)
      console.log(`  Time:    ${(result.duration / 1000).toFixed(1)}s`)
      console.log('───────────────────────────────────────')
      console.log(result.summary)
      console.log('═══════════════════════════════════════\n')
    })
    .catch((err) => {
      console.error('Demo failed with unexpected error:', err)
      process.exit(1)
    })
}