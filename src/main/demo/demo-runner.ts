/**
 * OpenJuliet — Full Autonomous Coding Workflow Demo Runner
 *
 * Simulates the complete 7-stage autonomous coding pipeline:
 *   analyze → plan → implement → test → review → commit → PR
 *
 * Creates a real sample project with an intentional bug (missing import)
 * and walks through each stage, emitting real IPC events so the renderer's
 * ExecutionPanel can display live progress, logs, and completion.
 *
 * @module main/demo
 */

import { promises as fs } from 'fs'
import path from 'path'
import type { BrowserWindow } from 'electron'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DemoStageResult {
  stage: string
  label: string
  status: 'success' | 'failure'
  duration: number
  details: string
}

export interface DemoResult {
  success: boolean
  taskId: string
  projectDir: string
  stages: DemoStageResult[]
  filesCreated: string[]
  filesModified: string[]
  duration: number
  summary: string
}

/** IpcEventSender abstracts the event-emission mechanism so the runner can be
 *  tested without a real BrowserWindow. */
export interface IpcEventSender {
  send(channel: string, data: unknown): void
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let mainWindowRef: BrowserWindow | null = null

// ---------------------------------------------------------------------------
// IPC event helpers
// ---------------------------------------------------------------------------

function getSender(): IpcEventSender | null {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    return mainWindowRef.webContents
  }
  return null
}

function emitProgress(taskId: string, progress: number, step?: string): void {
  const sender = getSender()
  if (sender) {
    sender.send('execution:progress', { taskId, progress, step: step ?? '' })
  }
}

function emitLog(
  taskId: string,
  line: string,
  stream: 'stdout' | 'stderr' = 'stdout'
): void {
  const sender = getSender()
  if (sender) {
    sender.send('execution:log', { taskId, line, stream })
  }
}

function emitComplete(
  taskId: string,
  exitCode: number | null,
  duration: number
): void {
  const sender = getSender()
  if (sender) {
    sender.send('execution:complete', { taskId, exitCode, duration })
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register the main window reference so the demo runner can send IPC events.
 */
export function setMainWindow(win: BrowserWindow): void {
  mainWindowRef = win
}

// ---------------------------------------------------------------------------
// Sample project templates
// ---------------------------------------------------------------------------

const PKG_JSON = `{
  "name": "demo-math-utils",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.1.0"
  }
}`

const TSCONFIG_JSON = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}`

const MATH_TS = `/**
 * demo-math-utils — Simple arithmetic utilities.
 */

/**
 * Add two numbers.
 */
export function add(a: number, b: number): number {
  return a + b
}

/**
 * Subtract two numbers.
 */
export function subtract(a: number, b: number): number {
  return a - b
}

/**
 * Multiply two numbers.
 */
export function multiply(a: number, b: number): number {
  return a * b
}

/**
 * Divide two numbers. Returns NaN if b is zero.
 */
export function divide(a: number, b: number): number {
  if (b === 0) return NaN
  return a / b
}
`

/**
 * BUG: This test file intentionally MISSES the vitest import.
 * The demo workflow detects this and adds it during the 'implement' stage.
 *
 * Correct import that should be added:
 *   import { describe, it, expect } from 'vitest'
 */
const MATH_TEST_TS_BUGGY = `import { add, subtract, multiply, divide } from './math'

describe('Math utilities', () => {
  describe('add', () => {
    it('adds two positive numbers', () => {
      expect(add(2, 3)).toBe(5)
    })

    it('handles negative numbers', () => {
      expect(add(-1, 1)).toBe(0)
      expect(add(-5, -3)).toBe(-8)
    })

    it('handles zero', () => {
      expect(add(0, 5)).toBe(5)
      expect(add(0, 0)).toBe(0)
    })
  })

  describe('subtract', () => {
    it('subtracts correctly', () => {
      expect(subtract(10, 4)).toBe(6)
    })

    it('handles negative results', () => {
      expect(subtract(3, 10)).toBe(-7)
    })
  })

  describe('multiply', () => {
    it('multiplies two numbers', () => {
      expect(multiply(4, 5)).toBe(20)
    })

    it('multiplies by zero', () => {
      expect(multiply(7, 0)).toBe(0)
    })
  })

  describe('divide', () => {
    it('divides two numbers', () => {
      expect(divide(10, 2)).toBe(5)
    })

    it('returns NaN when dividing by zero', () => {
      expect(divide(5, 0)).toBeNaN()
    })
  })
})
`

/** The fixed version of the test file — the import line is the only difference. */
const MATH_TEST_TS_FIXED = `import { describe, it, expect } from 'vitest'
import { add, subtract, multiply, divide } from './math'

describe('Math utilities', () => {
  describe('add', () => {
    it('adds two positive numbers', () => {
      expect(add(2, 3)).toBe(5)
    })

    it('handles negative numbers', () => {
      expect(add(-1, 1)).toBe(0)
      expect(add(-5, -3)).toBe(-8)
    })

    it('handles zero', () => {
      expect(add(0, 5)).toBe(5)
      expect(add(0, 0)).toBe(0)
    })
  })

  describe('subtract', () => {
    it('subtracts correctly', () => {
      expect(subtract(10, 4)).toBe(6)
    })

    it('handles negative results', () => {
      expect(subtract(3, 10)).toBe(-7)
    })
  })

  describe('multiply', () => {
    it('multiplies two numbers', () => {
      expect(multiply(4, 5)).toBe(20)
    })

    it('multiplies by zero', () => {
      expect(multiply(7, 0)).toBe(0)
    })
  })

  describe('divide', () => {
    it('divides two numbers', () => {
      expect(divide(10, 2)).toBe(5)
    })

    it('returns NaN when dividing by zero', () => {
      expect(divide(5, 0)).toBeNaN()
    })
  })
})
`

const INDEX_TS = `/**
 * demo-math-utils — Entry point
 */

export { add, subtract, multiply, divide } from './math'
`

const VITEST_CONFIG_TS = `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node'
  }
})
`

// ---------------------------------------------------------------------------
// Stage simulation helpers
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<string, string> = {
  analyze: 'Analyzing codebase',
  plan: 'Planning implementation',
  implement: 'Implementing changes',
  test: 'Running tests',
  review: 'Reviewing changes',
  commit: 'Committing changes',
  pr: 'Creating pull request'
}

/** Random delay between min and max ms */
function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Stage implementations
// ---------------------------------------------------------------------------

async function stageAnalyze(
  taskId: string,
  projectDir: string,
  srcDir: string
): Promise<DemoStageResult> {
  const startTime = Date.now()
  const details: string[] = []

  emitLog(taskId, '🔍 Starting codebase analysis...', 'stdout')
  emitProgress(taskId, 2, 'Reading project structure')

  await randomDelay(200, 400)

  // List project files
  const files = await fs.readdir(srcDir)
  emitLog(taskId, `  Found ${files.length} source file(s) in src/`, 'stdout')
  details.push(`Scanned src/ — ${files.length} file(s)`)

  emitProgress(taskId, 5, 'Inspecting source files')

  await randomDelay(100, 200)

  // Read the test file to find the bug
  const testContent = await fs.readFile(
    path.join(srcDir, 'math.test.ts'),
    'utf-8'
  )

  emitProgress(taskId, 8, 'Analyzing test file')

  // Detect the missing import
  const hasVitestImport = testContent.includes("from 'vitest'")
  const hasDescribe = testContent.includes('describe')
  const hasIt = testContent.includes('it(')
  const hasExpect = testContent.includes('expect(')

  emitLog(taskId, `  Checking test file: math.test.ts`, 'stdout')
  emitLog(taskId, `    ✓ describe() usage found: ${hasDescribe}`, 'stdout')
  emitLog(taskId, `    ✓ it() usage found: ${hasIt}`, 'stdout')
  emitLog(taskId, `    ✓ expect() usage found: ${hasExpect}`, 'stdout')
  emitLog(taskId, `    ✗ vitest import found: ${hasVitestImport}`, 'stdout')

  await randomDelay(100, 200)

  emitProgress(taskId, 12, 'Reading source implementation')

  // Read the source file
  const mathContent = await fs.readFile(
    path.join(srcDir, 'math.ts'),
    'utf-8'
  )
  const exportedFunctions = ['add', 'subtract', 'multiply', 'divide']
  const found = exportedFunctions.filter((fn) =>
    mathContent.includes(`export function ${fn}`)
  )

  emitLog(taskId, `  Source: math.ts — exports ${found.length}/4 functions`, 'stdout')
  details.push(`Exports: ${found.join(', ')}`)

  await randomDelay(100, 200)

  const diagnostic = !hasVitestImport
    ? 'Missing import: vitest globals (describe, it, expect) not imported in math.test.ts. ' +
      'This will cause a ReferenceError at runtime because vitest globals require an explicit import ' +
      'when globals:true is not set in vitest.config, or when the test file does not declare them.'
    : 'No issues found'

  emitLog(taskId, '', 'stdout')
  emitLog(taskId, `  ⚠ Bug detected: ${diagnostic}`, 'stderr')

  await randomDelay(100, 200)

  emitProgress(taskId, 15, 'Analysis complete')
  emitLog(taskId, `  ✅ Analysis complete — ${!hasVitestImport ? '1 bug found' : 'no issues'}`, 'stdout')

  const duration = Date.now() - startTime
  return {
    stage: 'analyze',
    label: STAGE_LABELS.analyze,
    status: 'success' as const,
    duration,
    details: details.join('\n') + '\n' + diagnostic
  }
}

async function stagePlan(
  taskId: string,
  projectDir: string
): Promise<DemoStageResult> {
  const startTime = Date.now()
  const details: string[] = []

  emitLog(taskId, '📋 Generating fix plan...', 'stdout')
  emitProgress(taskId, 18, 'Evaluating remediation options')

  await randomDelay(150, 300)

  const planSteps = [
    'Add `import { describe, it, expect } from \'vitest\'` to math.test.ts',
    'Verify no other imports are missing',
    'Validate the fix compiles correctly',
    'Run tests to confirm resolution'
  ]

  for (let i = 0; i < planSteps.length; i++) {
    const pct = 20 + (i / planSteps.length) * 12
    emitProgress(taskId, Math.floor(pct), `Planning step ${i + 1}/${planSteps.length}`)
    emitLog(taskId, `  ${i + 1}. ${planSteps[i]}`, 'stdout')
    details.push(planSteps[i])
    await randomDelay(80, 180)
  }

  await randomDelay(100, 200)

  emitProgress(taskId, 32, 'Plan finalized')
  emitLog(
    taskId,
    `  ✅ Plan ready — ${planSteps.length} step(s) to fix the bug`,
    'stdout'
  )

  const duration = Date.now() - startTime
  return {
    stage: 'plan',
    label: STAGE_LABELS.plan,
    status: 'success' as const,
    duration,
    details: details.join('\n')
  }
}

async function stageImplement(
  taskId: string,
  srcDir: string
): Promise<DemoStageResult> {
  const startTime = Date.now()
  const details: string[] = []

  emitLog(taskId, '✏️  Applying fix...', 'stdout')
  emitProgress(taskId, 35, 'Writing corrected test file')

  await randomDelay(200, 400)

  // Write the fixed test file
  const testPath = path.join(srcDir, 'math.test.ts')
  await fs.writeFile(testPath, MATH_TEST_TS_FIXED, 'utf-8')

  emitLog(taskId, `  ✓ Fixed: src/math.test.ts — added vitest import`, 'stdout')
  details.push('Added `import { describe, it, expect } from \'vitest\'`')

  await randomDelay(150, 250)

  emitProgress(taskId, 50, 'Verifying source integrity')

  // Re-read and confirm
  const updated = await fs.readFile(testPath, 'utf-8')
  const importFixed = updated.includes("from 'vitest'")

  if (importFixed) {
    emitLog(taskId, `  ✓ Import verified in updated file`, 'stdout')
  } else {
    emitLog(taskId, `  ⚠ Import still missing — re-applying...`, 'stderr')
    await fs.writeFile(testPath, MATH_TEST_TS_FIXED, 'utf-8')
    emitLog(taskId, `  ✓ Re-applied fix`, 'stdout')
  }

  await randomDelay(100, 200)

  emitProgress(taskId, 65, 'Creating vitest configuration')
  await fs.writeFile(path.join(srcDir, '..', 'vitest.config.ts'), VITEST_CONFIG_TS, 'utf-8')
  emitLog(taskId, `  ✓ Created: vitest.config.ts`, 'stdout')
  details.push('Created vitest configuration')

  await randomDelay(100, 200)

  emitProgress(taskId, 70, 'Implementation complete')
  emitLog(taskId, `  ✅ Fix applied successfully — 1 file modified, 1 file created`, 'stdout')

  const duration = Date.now() - startTime
  return {
    stage: 'implement',
    label: STAGE_LABELS.implement,
    status: 'success' as const,
    duration,
    details: details.join('\n')
  }
}

async function stageTest(
  taskId: string,
  projectDir: string
): Promise<DemoStageResult> {
  const startTime = Date.now()
  const details: string[] = []

  emitLog(taskId, '🧪 Running test suite...', 'stdout')
  emitProgress(taskId, 73, 'Executing vitest')

  await randomDelay(200, 350)

  // Simulate test output
  const testOutput = [
    '> vitest run',
    '',
    ' RUN  v3.1.0  demo-math-utils',
    '',
    ' ✓ src/math.test.ts (10 tests)',
    '   ✓ Math utilities > add > adds two positive numbers',
    '   ✓ Math utilities > add > handles negative numbers',
    '   ✓ Math utilities > add > handles zero',
    '   ✓ Math utilities > subtract > subtracts correctly',
    '   ✓ Math utilities > subtract > handles negative results',
    '   ✓ Math utilities > multiply > multiplies two numbers',
    '   ✓ Math utilities > multiply > multiplies by zero',
    '   ✓ Math utilities > divide > divides two numbers',
    '   ✓ Math utilities > divide > returns NaN when dividing by zero',
    '',
    ' Test Files  1 passed (1)',
    '      Tests  10 passed (10)',
    '   Duration  237ms (transform 42ms, setup 0ms, collect 58ms, tests 137ms)',
    ''
  ]

  for (const line of testOutput) {
    emitLog(taskId, line, 'stdout')
    details.push(line)
    await randomDelay(30, 60)
  }

  await randomDelay(100, 200)

  emitProgress(taskId, 82, 'All tests passed')
  emitLog(taskId, '', 'stdout')
  emitLog(taskId, `  ✅ All 10 tests passed. Bug fix verified.`, 'stdout')

  const duration = Date.now() - startTime
  return {
    stage: 'test',
    label: STAGE_LABELS.test,
    status: 'success' as const,
    duration,
    details: details.join('\n')
  }
}

async function stageReview(
  taskId: string,
  srcDir: string
): Promise<DemoStageResult> {
  const startTime = Date.now()
  const details: string[] = []

  emitLog(taskId, '👁️  Reviewing changes...', 'stdout')
  emitProgress(taskId, 85, 'Inspecting code quality')

  await randomDelay(150, 300)

  // Read both files and check quality metrics
  const mathContent = await fs.readFile(path.join(srcDir, 'math.ts'), 'utf-8')
  const testContent = await fs.readFile(path.join(srcDir, 'math.test.ts'), 'utf-8')

  const checks = [
    { name: 'Default exports present', passed: mathContent.includes('export function') },
    { name: 'TypeScript strict mode compatible', passed: !mathContent.includes('any') && !testContent.includes('any') },
    { name: 'Vitest import present', passed: testContent.includes("from 'vitest'") },
    { name: 'No console.log in source', passed: !mathContent.includes('console.log') },
    { name: 'Test coverage ≥ 4 test cases', passed: (testContent.match(/it\(/g) || []).length >= 4 },
    { name: 'Functions have JSDoc', passed: mathContent.includes('/**') },
    { name: 'No TODO comments remaining', passed: !testContent.includes('TODO') && !mathContent.includes('TODO') }
  ]

  for (let i = 0; i < checks.length; i++) {
    const pct = 86 + (i / checks.length) * 8
    emitProgress(taskId, Math.floor(pct), `Review check ${i + 1}/${checks.length}`)
    const icon = checks[i].passed ? '✓' : '✗'
    emitLog(taskId, `  ${icon} ${checks[i].name}`, checks[i].passed ? 'stdout' : 'stderr')
    details.push(`${icon} ${checks[i].name}`)
    await randomDelay(60, 150)
  }

  const allPassed = checks.every((c) => c.passed)

  await randomDelay(100, 200)

  emitProgress(taskId, 94, 'Review complete')
  emitLog(
    taskId,
    `  ✅ Code review ${allPassed ? 'passed' : 'has issues'} — ${checks.filter((c) => c.passed).length}/${checks.length} checks passed`,
    'stdout'
  )

  const duration = Date.now() - startTime
  return {
    stage: 'review',
    label: STAGE_LABELS.review,
    status: allPassed ? 'success' as const : 'failure' as const,
    duration,
    details: details.join('\n')
  }
}

async function stageCommit(
  taskId: string,
  projectDir: string
): Promise<DemoStageResult> {
  const startTime = Date.now()
  const details: string[] = []

  emitLog(taskId, '💾 Committing changes...', 'stdout')
  emitProgress(taskId, 95, 'Initializing git repository')

  await randomDelay(200, 400)

  // We don't actually run git here (might not be installed), but simulate it
  const commitHash = 'a1b2c3d' + Math.random().toString(16).slice(2, 8)

  const commitLog = [
    `[main ${commitHash}] fix: add missing vitest import to math.test.ts`,
    ' 2 files changed, 3 insertions(+), 0 deletions(-)',
    '  create mode 100644 vitest.config.ts',
    '  modified   src/math.test.ts'
  ]

  emitLog(taskId, `  git init`, 'stdout')
  await randomDelay(50, 100)
  emitLog(taskId, `  Initialized empty Git repository in ${projectDir}.git/`, 'stdout')
  details.push('Initialized git repository')

  emitLog(taskId, `  git add -A`, 'stdout')
  await randomDelay(50, 100)
  emitLog(taskId, `  git commit -m "fix: add missing vitest import"`, 'stdout')
  await randomDelay(100, 200)

  for (const line of commitLog) {
    emitLog(taskId, `  ${line}`, 'stdout')
    details.push(line)
    await randomDelay(50, 100)
  }

  await randomDelay(100, 150)

  emitProgress(taskId, 98, 'Commit created')
  emitLog(taskId, `  ✅ Committed with hash ${commitHash}`, 'stdout')

  const duration = Date.now() - startTime
  return {
    stage: 'commit',
    label: STAGE_LABELS.commit,
    status: 'success' as const,
    duration,
    details: details.join('\n')
  }
}

async function stagePR(
  taskId: string,
  projectDir: string
): Promise<DemoStageResult> {
  const startTime = Date.now()
  const details: string[] = []

  emitLog(taskId, '🔄 Creating pull request...', 'stdout')
  emitProgress(taskId, 99, 'Generating PR summary')

  await randomDelay(200, 400)

  const prBody = [
    '## Description',
    '',
    'This PR fixes a missing vitest import in `math.test.ts` that causes',
    'a `ReferenceError` when running the test suite. The test file uses',
    '`describe`, `it`, and `expect` without importing them from vitest.',
    '',
    '## Changes',
    '',
    '- **src/math.test.ts**: Added `import { describe, it, expect } from \'vitest\'`',
    '- **vitest.config.ts**: Created vitest configuration file',
    '',
    '## Test Results',
    '',
    '- ✅ All 10 tests pass',
    '- ✅ TypeScript compilation succeeds',
    '- ✅ Code quality checks: 7/7 passed',
    '',
    '## Related Issue',
    '',
    'Fixes the broken test suite — no issue number assigned.'
  ]

  emitLog(taskId, `  PR #1: fix: add missing vitest import to math.test.ts`, 'stdout')
  emitLog(taskId, `  Branch: fix/missing-vitest-import → main`, 'stdout')
  await randomDelay(80, 150)

  for (const line of prBody) {
    emitLog(taskId, `  ${line}`, 'stdout')
    details.push(line)
    await randomDelay(15, 40)
  }

  await randomDelay(100, 200)

  emitProgress(taskId, 100, 'Pull request created')
  emitLog(taskId, '', 'stdout')
  emitLog(
    taskId,
    `  ✅ PR #1 created successfully — https://github.com/demo/math-utils/pull/1`,
    'stdout'
  )

  const duration = Date.now() - startTime
  return {
    stage: 'pr',
    label: STAGE_LABELS.pr,
    status: 'success' as const,
    duration,
    details: details.join('\n')
  }
}

// ---------------------------------------------------------------------------
// Main demo runner
// ---------------------------------------------------------------------------

/**
 * runFullDemo — Runs the complete autonomous workflow demo.
 *
 * Creates a sample project with an intentional bug (missing vitest import),
 * then walks through all 7 pipeline stages, emitting real IPC events
 * so the ExecutionPanel can display live progress.
 *
 * @param projectDir - Directory where the demo project will be created.
 * @param taskId     - Unique identifier for this demo execution.
 * @returns A summary of all stages and their outcomes.
 */
export async function runFullDemo(
  projectDir: string,
  taskId: string
): Promise<DemoResult> {
  const overallStart = Date.now()
  const stages: DemoStageResult[] = []
  const filesCreated: string[] = []
  const filesModified: string[] = []

  const srcDir = path.join(projectDir, 'src')

  try {
    // ── Bootstrap the demo project ────────────────────────────────────

    emitLog(taskId, '', 'stdout')
    emitLog(taskId, '╔══════════════════════════════════════════════╗', 'stdout')
    emitLog(taskId, '║   OpenJuliet — Autonomous Workflow Demo     ║', 'stdout')
    emitLog(taskId, '╚══════════════════════════════════════════════╝', 'stdout')
    emitLog(taskId, '', 'stdout')
    emitLog(
      taskId,
      `Starting demo workflow in ${projectDir}...`,
      'stdout'
    )

    // Create project directory structure
    await fs.mkdir(srcDir, { recursive: true })

    // Write project files
    await fs.writeFile(path.join(projectDir, 'package.json'), PKG_JSON, 'utf-8')
    filesCreated.push('package.json')

    await fs.writeFile(path.join(projectDir, 'tsconfig.json'), TSCONFIG_JSON, 'utf-8')
    filesCreated.push('tsconfig.json')

    await fs.writeFile(path.join(srcDir, 'math.ts'), MATH_TS, 'utf-8')
    filesCreated.push('src/math.ts')

    await fs.writeFile(path.join(srcDir, 'math.test.ts'), MATH_TEST_TS_BUGGY, 'utf-8')
    filesCreated.push('src/math.test.ts')

    await fs.writeFile(path.join(srcDir, 'index.ts'), INDEX_TS, 'utf-8')
    filesCreated.push('src/index.ts')

    emitLog(
      taskId,
      `  Created demo project with ${filesCreated.length} file(s)`,
      'stdout'
    )
    emitLog(
      taskId,
      `  Bug introduced: missing vitest import in src/math.test.ts`,
      'stdout'
    )
    emitLog(taskId, '', 'stdout')

    // ── Stage 1: Analyze ──────────────────────────────────────────────
    emitLog(taskId, `── Stage 1/7: ${STAGE_LABELS.analyze} ──────────────`, 'stdout')
    const analyzeResult = await stageAnalyze(taskId, projectDir, srcDir)
    stages.push(analyzeResult)
    emitLog(taskId, '', 'stdout')

    // ── Stage 2: Plan ─────────────────────────────────────────────────
    emitLog(taskId, `── Stage 2/7: ${STAGE_LABELS.plan} ──────────────────`, 'stdout')
    const planResult = await stagePlan(taskId, projectDir)
    stages.push(planResult)
    emitLog(taskId, '', 'stdout')

    // ── Stage 3: Implement ────────────────────────────────────────────
    emitLog(taskId, `── Stage 3/7: ${STAGE_LABELS.implement} ─────────────`, 'stdout')
    const implementResult = await stageImplement(taskId, srcDir)
    stages.push(implementResult)
    filesModified.push('src/math.test.ts')
    filesCreated.push('vitest.config.ts')
    emitLog(taskId, '', 'stdout')

    // ── Stage 4: Test ─────────────────────────────────────────────────
    emitLog(taskId, `── Stage 4/7: ${STAGE_LABELS.test} ──────────────────`, 'stdout')
    const testResult = await stageTest(taskId, projectDir)
    stages.push(testResult)
    emitLog(taskId, '', 'stdout')

    // ── Stage 5: Review ───────────────────────────────────────────────
    emitLog(taskId, `── Stage 5/7: ${STAGE_LABELS.review} ────────────────`, 'stdout')
    const reviewResult = await stageReview(taskId, srcDir)
    stages.push(reviewResult)
    emitLog(taskId, '', 'stdout')

    // ── Stage 6: Commit ───────────────────────────────────────────────
    emitLog(taskId, `── Stage 6/7: ${STAGE_LABELS.commit} ────────────────`, 'stdout')
    const commitResult = await stageCommit(taskId, projectDir)
    stages.push(commitResult)
    emitLog(taskId, '', 'stdout')

    // ── Stage 7: PR ───────────────────────────────────────────────────
    emitLog(taskId, `── Stage 7/7: ${STAGE_LABELS.pr} ────────────────────`, 'stdout')
    const prResult = await stagePR(taskId, projectDir)
    stages.push(prResult)
    emitLog(taskId, '', 'stdout')

    // ── Summary ───────────────────────────────────────────────────────
    const totalDuration = Date.now() - overallStart
    const successfulStages = stages.filter((s) => s.status === 'success').length

    const summaryLines = [
      '',
      '╔══════════════════════════════════════════════╗',
      '║           Demo Workflow Complete             ║',
      '╚══════════════════════════════════════════════╝',
      '',
      `  Status:  ${successfulStages === stages.length ? '✓ All stages passed' : `⚠ ${stages.length - successfulStages} stage(s) failed`}`,
      `  Stages:  ${stages.map((s) => s.stage).join(' → ')}`,
      `  Time:    ${(totalDuration / 1000).toFixed(1)}s`,
      `  Files:   ${filesCreated.length} created, ${filesModified.length} modified`,
      '',
      '  Stage Breakdown:',
      ...stages.map(
        (s) =>
          `    ${s.status === 'success' ? '✓' : '✗'} ${s.label.padEnd(30)} ${(s.duration / 1000).toFixed(1)}s`
      ),
      '',
      `  Demo project written to: ${projectDir}`,
      ''
    ]

    for (const line of summaryLines) {
      emitLog(taskId, line, 'stdout')
    }

    // Send completion event
    emitComplete(taskId, 0, totalDuration)

    // Wait a tick so the renderer has time to process the completer event
    await new Promise((resolve) => setTimeout(resolve, 100))

    return {
      success: successfulStages === stages.length,
      taskId,
      projectDir,
      stages,
      filesCreated,
      filesModified,
      duration: totalDuration,
      summary: summaryLines.join('\n')
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    const totalDuration = Date.now() - overallStart

    emitLog(taskId, `  ❌ Demo failed: ${errorMsg}`, 'stderr')
    emitComplete(taskId, 1, totalDuration)

    return {
      success: false,
      taskId,
      projectDir,
      stages,
      filesCreated,
      filesModified,
      duration: totalDuration,
      summary: `Demo failed: ${errorMsg}`
    }
  }
}
