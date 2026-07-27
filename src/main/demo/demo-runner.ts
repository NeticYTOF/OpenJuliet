/**
 * OpenJuliet — Demo Workflow Runner
 *
 * Simulates a full autonomous coding workflow for demo purposes.
 * Creates a sample project, runs through all stages, and emits
 * realistic IPC events so the UI feels alive.
 *
 * @module main/demo
 */

import { BrowserWindow } from 'electron'
import { mkdtempSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DemoResult {
  projectDir: string
  stages: DemoStage[]
  totalDuration: number
  filesCreated: string[]
  summary: string
}

export interface DemoStage {
  name: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  duration: number
  output: string
}

// ---------------------------------------------------------------------------
// Sample Project
// ---------------------------------------------------------------------------

function createSampleProject(dir: string): void {
  const src = join(dir, 'src')
  mkdirSync(src, { recursive: true })

  // Main file with a bug (missing import)
  writeFileSync(
    join(src, 'index.ts'),
    `// Counter Component
// BUG: Missing import for useState

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
}
`
  )

  // Test file that fails
  writeFileSync(
    join(src, 'counter.test.ts'),
    `import { Counter } from './index';

describe('Counter', () => {
  it('should increment', () => {
    // This test is incomplete - will fail
    expect(true).toBe(false);
  });
});
`
  )

  // Package.json
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'demo-project',
        version: '1.0.0',
        scripts: { test: 'echo "Tests: 1 failed, 0 passed"' }
      },
      null,
      2
    )
  )

  // Config file
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true } }, null, 2))
}

// ---------------------------------------------------------------------------
// Demo Runner
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function emit(win: BrowserWindow | null, channel: string, data: unknown): void {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data)
  }
}

/**
 * Run a full demo workflow from start to finish.
 * Creates a temporary project, analyzes it, plans a fix, implements,
 * tests, reviews, commits, and reports.
 */
export async function runFullDemo(win: BrowserWindow | null, projectDir?: string): Promise<DemoResult> {
  const dir = projectDir || mkdtempSync(join(tmpdir(), 'openjuliet-demo-'))
  if (!existsSync(join(dir, 'package.json'))) {
    createSampleProject(dir)
  }

  const stages: DemoStage[] = []
  const filesCreated: string[] = ['src/index.ts', 'src/counter.test.ts', 'package.json', 'tsconfig.json']
  const startTime = Date.now()

  // ── Stage 1: Analyze ──
  emit(win, 'execution:progress', { taskId: 'demo', progress: 0.1, stage: 'analyze', message: 'Analyzing repository...' })
  emit(win, 'execution:log', { taskId: 'demo', line: '[analyze] Reading project structure...', stream: 'stdout' })
  await sleep(600)
  emit(win, 'execution:log', { taskId: 'demo', line: '[analyze] Found 4 files, 1 bug', stream: 'stdout' })
  emit(win, 'execution:log', { taskId: 'demo', line: '[analyze] Detected: Missing import for useState', stream: 'stdout' })
  stages.push({ name: 'analyze', status: 'completed', duration: 600, output: 'Found missing import in src/index.ts' })

  // ── Stage 2: Plan ──
  emit(win, 'execution:progress', { taskId: 'demo', progress: 0.25, stage: 'plan', message: 'Creating implementation plan...' })
  emit(win, 'execution:log', { taskId: 'demo', line: '[plan] Step 1: Add import { useState } from "react"', stream: 'stdout' })
  await sleep(500)
  emit(win, 'execution:log', { taskId: 'demo', line: '[plan] Step 2: Fix test expectations', stream: 'stdout' })
  stages.push({ name: 'plan', status: 'completed', duration: 500, output: '2-step plan created' })

  // ── Stage 3: Implement ──
  emit(win, 'execution:progress', { taskId: 'demo', progress: 0.4, stage: 'implement', message: 'Implementing changes...' })
  await sleep(400)

  // Fix the source file
  writeFileSync(
    join(dir, 'src', 'index.ts'),
    `import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
}
`
  )
  emit(win, 'execution:log', { taskId: 'demo', line: '[implement] Edited src/index.ts — added import', stream: 'stdout' })

  // Fix the test file
  writeFileSync(
    join(dir, 'src', 'counter.test.ts'),
    `import { Counter } from './index';

describe('Counter', () => {
  it('should increment', () => {
    const result = 1 + 1;
    expect(result).toBe(2);
  });

  it('should render without crashing', () => {
    expect(true).toBe(true);
  });
});
`
  )
  emit(win, 'execution:log', { taskId: 'demo', line: '[implement] Edited src/counter.test.ts — fixed tests', stream: 'stdout' })
  stages.push({ name: 'implement', status: 'completed', duration: 800, output: '2 files modified' })
  filesCreated.push('src/index.ts (modified)', 'src/counter.test.ts (modified)')

  // ── Stage 4: Test ──
  emit(win, 'execution:progress', { taskId: 'demo', progress: 0.6, stage: 'test', message: 'Running tests...' })
  await sleep(700)
  emit(win, 'execution:log', { taskId: 'demo', line: '[test] PASS  src/counter.test.ts (2 tests)', stream: 'stdout' })
  emit(win, 'execution:log', { taskId: 'demo', line: '[test] ✓ should increment (2ms)', stream: 'stdout' })
  emit(win, 'execution:log', { taskId: 'demo', line: '[test] ✓ should render without crashing (1ms)', stream: 'stdout' })
  stages.push({ name: 'test', status: 'completed', duration: 700, output: '2 tests passed' })

  // ── Stage 5: Review ──
  emit(win, 'execution:progress', { taskId: 'demo', progress: 0.75, stage: 'review', message: 'Reviewing changes...' })
  await sleep(500)
  emit(win, 'execution:log', { taskId: 'demo', line: '[review] Changes look good. No lint errors.', stream: 'stdout' })
  emit(win, 'execution:log', { taskId: 'demo', line: '[review] Code quality: A - clean implementation', stream: 'stdout' })
  stages.push({ name: 'review', status: 'completed', duration: 500, output: 'Quality score: A' })

  // ── Stage 6: Commit ──
  emit(win, 'execution:progress', { taskId: 'demo', progress: 0.88, stage: 'commit', message: 'Creating commit...' })
  await sleep(400)
  emit(win, 'execution:log', { taskId: 'demo', line: '[commit] Created commit abc1234: fix: add missing import and fix tests', stream: 'stdout' })
  stages.push({ name: 'commit', status: 'completed', duration: 400, output: 'Commit abc1234 created' })

  // ── Stage 7: PR ──
  emit(win, 'execution:progress', { taskId: 'demo', progress: 0.95, stage: 'pr', message: 'Generating pull request...' })
  await sleep(500)
  emit(win, 'execution:log', { taskId: 'demo', line: '[pr] PR #1 created: fix: add missing useState import', stream: 'stdout' })
  emit(win, 'execution:log', { taskId: 'demo', line: '[pr] https://github.com/demo/project/pull/1', stream: 'stdout' })
  stages.push({ name: 'pr', status: 'completed', duration: 500, output: 'PR #1 created' })

  // ── Complete ──
  const totalDuration = Date.now() - startTime
  emit(win, 'execution:progress', { taskId: 'demo', progress: 1.0, stage: 'complete', message: 'Demo complete!' })
  emit(win, 'execution:complete', { taskId: 'demo', exitCode: 0, duration: totalDuration })

  return {
    projectDir: dir,
    stages,
    totalDuration,
    filesCreated,
    summary: `Fixed 1 bug across ${filesCreated.length} files. All 2 tests passing. PR #1 created.`
  }
}
