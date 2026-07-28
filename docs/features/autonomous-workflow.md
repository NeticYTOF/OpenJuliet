# Autonomous Workflow

> The 7-stage AI-powered coding pipeline that powers OpenJuliet's autonomous development capabilities.

---

## Table of Contents

- [Overview](#overview)
- [The 7-Stage Pipeline](#the-7-stage-pipeline)
- [Stage 1: Repository Analysis](#stage-1-repository-analysis)
- [Stage 2: Issue Understanding](#stage-2-issue-understanding)
- [Stage 3: Planning](#stage-3-planning)
- [Stage 4: Implementation](#stage-4-implementation)
- [Stage 5: Testing](#stage-5-testing)
- [Stage 6: Review](#stage-6-review)
- [Stage 7: Commit & PR](#stage-7-commit--pr)
- [Demo Mode](#demo-mode)
- [Task Lifecycle Management](#task-lifecycle-management)
- [Error Handling and Retry Logic](#error-handling-and-retry-logic)
- [Execution Store Architecture](#execution-store-architecture)

---

## Overview

OpenJuliet's autonomous workflow is a **7-stage pipeline** that takes a coding task from start to finish without manual intervention. Each stage is managed by the execution engine, with real-time progress updates streamed to the UI via Electron IPC (Inter-Process Communication).

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐
│ Analyze  │→ │  Plan    │→ │Implement │→ │   Test     │
└──────────┘  └──────────┘  └──────────┘  └────────────┘
                                               ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│Commit &  │← │  Review  │← │   Test   │
│   PR     │  └──────────┘  └──────────┘
└──────────┘
```

**Key Features:**
- Fully autonomous — set a task and let OpenJuliet work through the pipeline
- Real-time progress via IPC events (progress %, current stage, log output)
- Pause, resume, and cancel at any point
- Timeout detection — tasks auto-cancel after a configurable duration
- Queue management — up to 50 tasks can be queued with drag-to-reorder
- Demo mode — run the full pipeline without any configuration
- Detailed execution logs with per-stage breakdown

---

## The 7-Stage Pipeline

Each stage produces a result object with the following structure:

```typescript
interface StageResult {
  stage: string        // Stage identifier (e.g., 'analyze', 'plan')
  label: string        // Human-readable label (e.g., 'Analyzing codebase')
  status: 'success' | 'failure'
  duration: number     // Milliseconds
  details: string      // Detailed log output
}
```

The pipeline runs stages sequentially. If any stage fails with a `failure` status, the pipeline can either stop (default) or proceed depending on configuration.

---

## Stage 1: Repository Analysis

**Purpose:** Understand the codebase structure, key files, dependencies, and detect potential issues.

**Actions:**
1. Read the project directory structure
2. Identify key configuration files (`package.json`, `tsconfig.json`, `vitest.config.ts`, etc.)
3. Scan source files for exports, imports, and function signatures
4. Analyze test files for correctness and completeness
5. Detect missing dependencies, broken imports, or incorrect usage patterns
6. Generate a diagnostic report

**Example analysis output:**

```log
🔍 Starting codebase analysis...
  Found 2 source file(s) in src/
  Checking test file: math.test.ts
    ✓ describe() usage found: true
    ✓ it() usage found: true
    ✓ expect() usage found: true
    ✗ vitest import found: false
  Source: math.ts — exports 4/4 functions
  ⚠ Bug detected: Missing import — vitest globals not imported
  ✅ Analysis complete — 1 bug found
```

**Key capabilities:**
- File system scanning via `fs.promises`
- Content analysis for import/export detection
- Pattern matching for common bugs and anti-patterns
- Aggregate file metadata (count, sizes, last modified)

---

## Stage 2: Issue Understanding

**Purpose:** Parse the task description or issue and extract structured requirements.

**Actions:**
1. Parse the task title and description
2. Extract requirements as structured steps
3. Identify affected files and areas
4. Determine the scope of changes needed
5. Map requirements to code locations

**Output:** A structured set of requirements with:
- List of affected files
- Description of required changes
- Success criteria
- Dependencies between changes

---

## Stage 3: Planning

**Purpose:** Create a detailed, step-by-step implementation plan.

**Actions:**
1. Evaluate remediation options based on the analysis
2. Break down the fix into discrete, ordered steps
3. Estimate the impact of each change
4. Validate the plan against known constraints

**Example plan output:**

```log
📋 Generating fix plan...
  1. Add `import { describe, it, expect } from 'vitest'` to math.test.ts
  2. Verify no other imports are missing
  3. Validate the fix compiles correctly
  4. Run tests to confirm resolution
  ✅ Plan ready — 4 step(s) to fix the bug
```

**Plan characteristics:**
- Each step targets a specific file or concern
- Steps are ordered to minimize intermediate broken states
- Dependencies between steps are tracked
- The plan is validated against the analysis results

---

## Stage 4: Implementation

**Purpose:** Apply the planned changes to the codebase — edit files, create new files, and verify changes.

**Actions:**
1. Apply file edits based on the plan
2. Create new files as needed (e.g., configuration files)
3. Verify each edit was applied correctly (re-read and confirm)
4. Re-apply fixes if the initial attempt failed

**Example implementation:**

```log
✏️  Applying fix...
  ✓ Fixed: src/math.test.ts — added vitest import
  ✓ Import verified in updated file
  ✓ Created: vitest.config.ts
  ✅ Fix applied successfully — 1 file modified, 1 file created
```

**Implementation patterns:**
- **Edit in place:** Modify existing files with minimal diff
- **Create:** Generate new files from templates or specifications
- **Verify-after-write:** Re-read files to confirm changes were applied
- **Retry:** If verification fails, re-apply the change

---

## Stage 5: Testing

**Purpose:** Run the test suite and verify that changes work correctly.

**Actions:**
1. Execute the test runner (Vitest)
2. Capture test output and parse results
3. Report pass/fail per test file and per individual test
4. Verify that previously failing tests now pass

**Example test output:**

```log
🧪 Running test suite...
 RUN  v3.1.0  demo-math-utils

 ✓ src/math.test.ts (10 tests)
   ✓ Math utilities > add > adds two positive numbers
   ✓ Math utilities > add > handles negative numbers
   ✓ Math utilities > subtract > subtracts correctly
   ✓ Math utilities > divide > returns NaN when dividing by zero

 Test Files  1 passed (1)
      Tests  10 passed (10)
   Duration  237ms
  ✅ All 10 tests passed. Bug fix verified.
```

---

## Stage 6: Review

**Purpose:** Perform code quality, architecture, and security checks on the changes.

**Actions:**
1. Check for code quality issues (missing JSDoc, console.log, TODO comments)
2. Verify TypeScript strict mode compatibility
3. Ensure proper import/export patterns
4. Check test coverage adequacy
5. Validate no security anti-patterns are introduced

**Example review checks:**

```log
👁️  Reviewing changes...
  ✓ Default exports present
  ✓ TypeScript strict mode compatible
  ✓ Vitest import present
  ✓ No console.log in source
  ✓ Test coverage ≥ 4 test cases
  ✓ Functions have JSDoc
  ✓ No TODO comments remaining
  ✅ Code review passed — 7/7 checks passed
```

**Review dimensions:**

| Check | Purpose |
|-------|---------|
| **Exports present** | Ensure API surfaces are correctly exported |
| **TypeScript compliance** | Verify strict mode compatibility |
| **Import correctness** | Validate all imports are present |
| **No debug artifacts** | Flag console.log, debugger statements |
| **Test coverage** | Ensure adequate test cases exist |
| **Documentation** | Check for JSDoc on public APIs |
| **Clean code** | No TODO, FIXME, or HACK comments |

---

## Stage 7: Commit & PR

**Purpose:** Create a git commit with the changes and generate a pull request summary.

### Commit Phase

1. Initialize a git repository (if not already initialized)
2. Stage all changes with `git add -A`
3. Create a commit with a descriptive message
4. Record the commit hash

**Example commit:**

```log
💾 Committing changes...
  git init
  Initialized empty Git repository in demo-math-utils/.git/
  git add -A
  git commit -m "fix: add missing vitest import"
  [main a1b2c3d] fix: add missing vitest import to math.test.ts
   2 files changed, 3 insertions(+), 0 deletions(-)
   create mode 100644 vitest.config.ts
   modified   src/math.test.ts
  ✅ Committed with hash a1b2c3d4e5f6
```

### Pull Request Phase

1. Generate an AI-powered PR description
2. Summarize changes, rationale, and test results
3. Include a markdown-formatted PR body

**Example PR output:**

```log
🔄 Creating pull request...
  PR #1: fix: add missing vitest import to math.test.ts
  Branch: fix/missing-vitest-import → main
  ## Description
  This PR fixes a missing vitest import in math.test.ts that causes
  a ReferenceError when running the test suite.

  ## Changes
  - **src/math.test.ts**: Added import from vitest
  - **vitest.config.ts**: Created vitest configuration file

  ## Test Results
  - ✅ All 10 tests pass
  - ✅ TypeScript compilation succeeds
  - ✅ Code quality checks: 7/7 passed

  ✅ PR #1 created successfully
```

---

## Demo Mode

OpenJuliet includes a built-in demo workflow that runs the full 7-stage pipeline without requiring an AI provider or GitHub connection.

### Running the Demo

1. Go to **Dashboard** (`⌘1`)
2. Click **"Run Full Demo"** button in the left column
3. Watch the pipeline progress live in the **Execution Panel** (`⌘5`)

### What the Demo Does

The demo (`runFullDemo()` in `src/main/demo/demo-runner.ts`):

1. **Creates a sample project** (`demo-math-utils`) with:
   - `src/math.ts` — Four arithmetic functions (add, subtract, multiply, divide)
   - `src/math.test.ts` — Test file with an **intentional bug** (missing vitest import)
   - `src/index.ts` — Entry point
   - `package.json` and `tsconfig.json`

2. **Runs all 7 pipeline stages** with realistic simulated output:
   - Analyzes the codebase and detects the missing import
   - Plans the fix in 4 steps
   - Implements the correction by adding the import
   - Runs simulated tests (10 tests, all passing)
   - Reviews code quality (7 checks)
   - Creates a simulated commit
   - Generates a PR summary

3. **Emits real IPC events** so the ExecutionPanel displays:
   - Live progress percentage
   - Stage-by-stage log output
   - Completion summary with timing

4. **Cleans up automatically** on app restart

### Demo API

```typescript
// Run the full demo
runFullDemo(projectDir: string, taskId: string): Promise<DemoResult>

// Demo result structure
interface DemoResult {
  success: boolean          // All stages completed successfully
  taskId: string            // Unique task identifier
  projectDir: string        // Path to the demo project
  stages: DemoStageResult[] // Per-stage results
  filesCreated: string[]     // Files created during demo
  filesModified: string[]    // Files modified during demo
  duration: number           // Total duration in milliseconds
  summary: string            // Formatted summary text
}

// Per-stage result
interface DemoStageResult {
  stage: string             // Stage identifier
  label: string             // Human-readable label
  status: 'success' | 'failure'
  duration: number          // Stage duration in milliseconds
  details: string           // Detailed output
}
```

---

## Task Lifecycle Management

### Creating Tasks

```typescript
interface Task {
  id: string
  title: string
  description?: string
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: number
  updatedAt: number
  completedAt?: number
  model?: string
  provider?: string
  files?: string[]
  tokenCount?: number
  elapsedMs?: number
  error?: string
}
```

### Lifecycle States

```
Created → Queued → Running → Paused → Running → Completed
                         ↘             ↗
                       Cancelled → History
                         ↘
                       Failed → History
```

| State | Description |
|-------|-------------|
| `queued` | Task is waiting in the queue |
| `running` | Task is actively executing |
| `paused` | Task execution suspended |
| `completed` | Task finished successfully |
| `failed` | Task finished with errors |
| `cancelled` | Task manually cancelled or timed out |

### Queue Management

- **Maximum queue size:** 50 tasks
- **Order:** Drag-to-reorder via `reorderQueue(fromIndex, toIndex)`
- **Concurrency:** Configurable from 1–10 (default: 2)
- **Auto-start:** Tasks execute as soon as a slot opens

### Controls

| Action | Shortcut | Description |
|--------|----------|-------------|
| **New task** | `⌘N` | Add a task to the queue |
| **Run** | `⌘⇧Enter` | Start or resume execution |
| **Pause** | `⌘P` | Suspend the active task |
| **Cancel** | `⌘.` | Stop the active task |
| **Remove** | — | Remove a task from the queue |

### Monitoring

The **ExecutionPanel** shows live state for the active task:

```typescript
interface ExecutionProgress {
  taskId: string
  currentFile?: string      // File currently being edited
  currentTool?: string      // Current stage/tool name
  currentCommand?: string   // Command being executed
  progress: number          // 0–100 percentage
  elapsedMs: number         // Time elapsed
  tokenCount: number        // Tokens used so far
  filesEdited: number       // Files modified
  logs: LogEntry[]          // Recent log entries (last 50)
}
```

---

## Error Handling and Retry Logic

### Timeout Handling

Tasks have a configurable timeout (default: 30 minutes). The timeout watcher checks every 10 seconds:

```typescript
initTimeoutWatcher(timeoutMs = 30 * 60 * 1000): () => void
```

When a task times out:
1. The task is auto-cancelled with a `failed` status
2. An error message is recorded: `"Task timed out after X minutes"`
3. The task is moved to execution history

### Retry Logic

The implementation stage includes **verify-after-write** retry:

```typescript
// Read the file and verify the fix was applied
const updated = await fs.readFile(testPath, 'utf-8')
const importFixed = updated.includes("from 'vitest'")

if (importFixed) {
  emitLog(taskId, `  ✓ Import verified in updated file`, 'stdout')
} else {
  emitLog(taskId, `  ⚠ Import still missing — re-applying...`, 'stderr')
  await fs.writeFile(testPath, MATH_TEST_TS_FIXED, 'utf-8')
  emitLog(taskId, `  ✓ Re-applied fix`, 'stdout')
}
```

### IPC Error Resilience

The execution store is designed to handle IPC events gracefully:

- **Cancel non-existent task** → Silent no-op
- **Pause already-paused task** → Silent no-op
- **Resume non-paused task** → Silent no-op
- **Queue full** → Warn and reject with error message
- **IPC bridge unavailable** → Fallback to local execution
- **Main process notification fails** → Logged but non-fatal

### Error Recovery Flow

```typescript
// try-catch at the pipeline level
try {
  // Run all stages...
} catch (err) {
  const errorMsg = err instanceof Error ? err.message : String(err)
  emitLog(taskId, `  ❌ Demo failed: ${errorMsg}`, 'stderr')
  emitComplete(taskId, 1, totalDuration)
  return { success: false, ... }
}
```

---

## Execution Store Architecture

The execution store (`src/renderer/src/stores/executionStore.ts`) is built with **Zustand** and manages:

- **Queue:** Ordered list of pending tasks
- **Active task:** Currently executing task
- **Progress:** Real-time execution progress object
- **History:** Completed, failed, and cancelled tasks
- **Logs:** Session-scoped log entries
- **IPC listeners:** Real-time event handlers for main-process communication

### IPC Channels

| Channel | Direction | Payload |
|---------|-----------|---------|
| `execution:progress` | Main → Renderer | `{ taskId, progress, step }` |
| `execution:log` | Main → Renderer | `{ taskId, line, stream }` |
| `execution:complete` | Main → Renderer | `{ taskId, exitCode, duration }` |
| `execution:run` | Renderer → Main | `{ command, projectId }` |
| `execution:cancel` | Renderer → Main | `taskId` |

### Store Setup

```typescript
// Initialize IPC listeners once on app mount
const unsub = useExecutionStore.getState().initIPCListeners()
// Clean up on unmount
unsub()
```

---

## Performance Notes

- **Task timeout:** Configurable from 10 seconds to unlimited (default: 5 minutes for simple tasks, 30 minutes for complex ones)
- **Max queue size:** 50 tasks (to prevent memory issues)
- **Log retention:** Last 50 log entries preserved in the progress object
- **Concurrency limit:** 1–10 simultaneous tasks (configured in Settings)
- **Timeout check interval:** Every 10 seconds
