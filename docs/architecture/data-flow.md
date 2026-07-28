# OpenJuliet Data Flow Documentation

> Complete documentation of all IPC channels, event flows, streaming events, state synchronization, and error handling in OpenJuliet v1.1.0.

---

## IPC Channel Reference

OpenJuliet uses Electron's `ipcMain.handle` / `ipcRenderer.invoke` for **request-response** patterns and `webContents.send` / `ipcRenderer.on` for **streaming events**. All channels are listed below with their direction, types, and descriptions.

### Communication Model

```
┌──────────────┐    ipcRenderer.invoke(channel, ...args)    ┌──────────────┐
│              │ ──────────────────────────────────────────► │              │
│   RENDERER   │                                             │    MAIN      │
│   (React)    │ ◄────────────────────────────────────────── │   (Node.js)  │
│              │    Promise<{ success, data, error }>         │              │
└──────────────┘                                             └──────────────┘
       │                                                           │
       │    webContents.send(channel, data)                        │
       │ ◄──────────────────────────────────────────────────────── │
       │    (push events: progress, logs, tokens)                  │
```

### Legend

| Direction | Method | Type |
|-----------|--------|------|
| 🟢 Renderer → Main | `invoke` | Request-response (Promise) |
| 🔵 Main → Renderer | `send` | Push event (streaming) |
| 🟣 Both | `invoke` + `send` | Hybrid (request + streaming) |

---

### GitHub Channels (`github:*`)

| Channel | Direction | Request Payload | Response Type | Description |
|---------|-----------|----------------|---------------|-------------|
| `github:list-repos` | 🟢 | — | `{ success, data: GitHubRepo[] }` | List authenticated user's repos |
| `github:get-repo` | 🟢 | `(owner: string, repo: string)` | `{ success, data: GitHubRepo }` | Get single repo details |
| `github:list-issues` | 🟢 | `(owner: string, repo: string, state?: 'open'\|'closed'\|'all')` | `{ success, data: GitHubIssue[] }` | List repo issues |
| `github:get-issue` | 🟢 | `(owner: string, repo: string, issueNumber: number)` | `{ success, data: GitHubIssue }` | Get single issue |
| `github:create-pr` | 🟢 | `(options: { owner, repo, title, head, base, body?, draft? })` | `{ success, data: GitHubPR }` | Create a pull request |
| `github:list-prs` | 🟢 | `(owner: string, repo: string, state?: 'open'\|'closed'\|'all')` | `{ success, data: GitHubPR[] }` | List pull requests |
| `github:authenticate` | 🟢 | `(token: string, type?: 'pat'\|'oauth')` | `{ success }` | Authenticate with GitHub |
| `github:auth-state` | 🟢 | — | `{ success, data: GitHubAuthState }` | Get current auth state |
| `github:clear-auth` | 🟢 | — | `{ success }` | Clear GitHub auth |
| `github:add-comment` | 🟢 | `(owner, repo, issueNumber, body)` | `{ success }` | Comment on issue/PR |
| `github:list-branches` | 🟢 | `(owner: string, repo: string)` | `{ success, data: GitHubBranch[] }` | List repo branches |
| `github:get-contents` | 🟢 | `(owner, repo, path, ref?)` | `{ success, data: GitHubContent }` | Get file/dir contents |

---

### Git Channels (`git:*`)

| Channel | Direction | Request Payload | Response Type | Description |
|---------|-----------|----------------|---------------|-------------|
| `git:clone` | 🟢 | `(url, dir, options?: { branch?, depth? })` | `{ success, data: string }` | Clone repository |
| `git:status` | 🟢 | `(repoPath: string)` | `{ success, data: GitStatus }` | Working tree status |
| `git:branch` | 🟢 | `(repoPath: string)` | `{ success, data: GitBranchInfo }` | List branches |
| `git:commit` | 🟢 | `(repoPath, message, options?: { all? })` | `{ success, data: string }` | Create commit |
| `git:push` | 🟢 | `(repoPath, remote?, branch?)` | `{ success, data: string }` | Push to remote |
| `git:pull` | 🟢 | `(repoPath, remote?, branch?)` | `{ success, data: string }` | Pull from remote |
| `git:diff` | 🟢 | `(repoPath, args?: string[])` | `{ success, data: string }` | Get diff output |
| `git:log` | 🟢 | `(repoPath, maxCount?: number)` | `{ success, data: string }` | Get commit log |

---

### Execution Channels (`execution:*`)

| Channel | Direction | Request Payload | Response Type | Description |
|---------|-----------|----------------|---------------|-------------|
| `execution:run` | 🟢 | `(projectId, projectPath, title, description, startStage?, priority?)` | `{ success, data: { taskId } }` | Enqueue and run a task |
| `execution:cancel` | 🟢 | `(taskId: string)` | `{ success }` | Cancel a task |
| `execution:status` | 🟢 | `(taskId: string)` | `{ success, data: ExecutionTask }` | Get task status |
| `execution:history` | 🟢 | `(projectId?: string)` | `{ success, data: ExecutionTask[] }` | Get execution history |
| `execution:queue` | 🟢 | — | `{ success, data: QueueItem[] }` | Get current queue state |
| `execution:pause` | 🟢 | — | `{ success }` | Pause execution queue |
| `execution:resume` | 🟢 | — | `{ success }` | Resume execution queue |
| `execution:cancel-all` | 🟢 | — | `{ success }` | Cancel all tasks |

#### Execution Streaming Events (Main → Renderer)

| Channel | Direction | Payload | Description |
|---------|-----------|---------|-------------|
| `execution:progress` | 🔵 | `{ taskId, progress: number, step?: string }` | Progress update (0-100) |
| `execution:log` | 🔵 | `{ taskId, line: string, stream: 'stdout'\|'stderr' }` | Log line from execution |
| `execution:complete` | 🔵 | `{ taskId, exitCode, duration }` | Task completion |
| `execution:event` | 🔵 | `{ taskId, type, stage?, progress?, step?, message?, data? }` | Generic execution event |

---

### Provider Channels (`provider:*`)

| Channel | Direction | Request Payload | Response Type | Description |
|---------|-----------|----------------|---------------|-------------|
| `provider:list` | 🟢 | — | `{ success, data: Provider[] }` | List configured providers |
| `provider:set-active` | 🟢 | `(id: string)` | `{ success }` | Set active provider |
| `provider:test` | 🟢 | `(id: string)` | `{ success, data: ProviderTestResult }` | Test provider connection |
| `provider:chat` | 🟢 | `(providerId, messages: ChatMessage[], options?: ChatOptions)` | `{ success, data: { content } }` | Non-streaming chat |
| `provider:stream` | 🟢 | `(providerId, messages: ChatMessage[], options?: ChatOptions)` | `{ success }` | Initiate streaming chat |
| `provider:abort` | 🟢 | `(providerId: string)` | `{ success }` | Abort active stream |

#### Provider Streaming Events (Main → Renderer)

| Channel | Direction | Payload | Description |
|---------|-----------|---------|-------------|
| `provider:token` | 🔵 | `{ id, token: string, done: boolean, model: string }` | Token from streaming AI response |

---

### Database Channels (`db:*`)

| Channel | Direction | Request Payload | Response Type | Description |
|---------|-----------|----------------|---------------|-------------|
| `db:query` | 🟢 | `(sql: string, params?: Record<string, unknown> \| unknown[])` | `{ success, data: any[] \| number }` | Execute raw SQL |
| `db:migrate` | 🟢 | — | `{ success }` | Run database migrations |
| `db:get-setting` | 🟢 | `(key: string)` | `{ success, data: string \| null }` | Get a setting value |
| `db:set-setting` | 🟢 | `(key: string, value: string)` | `{ success }` | Set a setting value |

---

### Shell Channels (`shell:*`)

| Channel | Direction | Request Payload | Response Type | Description |
|---------|-----------|----------------|---------------|-------------|
| `shell:exec` | 🟢 | `(command: string, options?: { cwd?, timeout? })` | `{ success, exitCode, stdout, stderr, timedOut }` | Execute shell command |
| `shell:cancel` | 🟢 | `(id: string)` | `{ success }` | Cancel running shell command |

#### Shell Streaming Events (Main → Renderer)

| Channel | Direction | Payload | Description |
|---------|-----------|---------|-------------|
| `shell:output` | 🔵 | `{ id, type: 'stdout'\|'stderr', text: string }` | Real-time shell output |
| `shell:complete` | 🔵 | `{ id, exitCode, timedOut }` | Shell command completion |
| `shell:error` | 🔵 | `{ id, error: string }` | Shell command error |

---

### Application Channels (`app:*`)

| Channel | Direction | Request Payload | Response Type | Description |
|---------|-----------|----------------|---------------|-------------|
| `app:get-version` | 🟢 | — | `{ success, data: string }` | Get app version |
| `app:get-platform` | 🟢 | — | `{ success, data: NodeJS.Platform }` | Get OS platform |
| `app:open-external` | 🟢 | `(url: string)` | `{ success }` | Open URL in default browser |
| `app:get-paths` | 🟢 | — | `{ success, data: Paths }` | Get system paths |
| `app:get-config` | 🟢 | — | `{ success, data: AppConfig }` | Get app configuration |

---

### Workspace Channels (`workspace:*`)

| Channel | Direction | Request Payload | Response Type | Description |
|---------|-----------|----------------|---------------|-------------|
| `workspace:select` | 🟢 | `(path: string)` | `{ success, data: Workspace }` | Select a workspace |
| `workspace:get-state` | 🟢 | — | `{ success, data: WorkspaceState }` | Get full workspace state |
| `workspace:list-projects` | 🟢 | — | `{ success, data: Project[] }` | List workspace projects |
| `workspace:create-project` | 🟢 | `(project: { id, name, path, description?, repoUrl? })` | `{ success }` | Create a new project |
| `workspace:delete-project` | 🟢 | `(id: string)` | `{ success }` | Delete a project |

---

### Update Channels (`update:*`)

| Channel | Direction | Request Payload | Response Type | Description |
|---------|-----------|----------------|---------------|-------------|
| `update:check` | 🟢 | — | `{ success, data?: UpdateCheckResult }` | Check for updates |
| `update:download` | 🟢 | — | `{ success }` | Download available update |
| `update:install` | 🟢 | — | `{ success }` | Install downloaded update |

#### Update Streaming Events (Main → Renderer)

| Channel | Direction | Payload | Description |
|---------|-----------|---------|-------------|
| `update:available` | 🔵 | `{ version, releaseDate, releaseNotes }` | Update is available |
| `update:not-available` | 🔵 | — | No updates available |
| `update:download-progress` | 🔵 | `{ percent, bytesPerSecond, total, transferred }` | Download progress |
| `update:downloaded` | 🔵 | `{ version, releaseDate }` | Update downloaded |
| `update:error` | 🔵 | `{ error: string }` | Update error |

---

### Demo Channels (`demo:*`)

| Channel | Direction | Request Payload | Response Type | Description |
|---------|-----------|----------------|---------------|-------------|
| `demo:start` | 🟢 | `(taskId: string)` | `{ success, data: DemoResult }` | Start demo workflow |

The demo runner reuses the `execution:*` streaming channels for progress, log, and completion events.

---

## Event Flow Patterns

### Pattern 1: Request-Response (Standard IPC)

```
Renderer                         Main Process
    │                                │
    │── ipcRenderer.invoke ─────────►│
    │   (channel, ...args)           │
    │                                ├── Route to handler
    │                                ├── Execute operation
    │                                ├── Return result
    │◄──────── Promise.resolve ──────│
    │   { success, data, error }     │
```

**Example — GitHub List Repos:**

```typescript
// Renderer (React component)
const repos = await window.api.github.listRepos()

// Preload bridge
listRepos(): Promise<GitHubRepo[]> {
  return ipcRenderer.invoke('github:list-repos')
}

// Main process handler
ipcMain.handle('github:list-repos', async () => {
  try {
    return { success: true, data: await github.listRepos() }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})
```

### Pattern 2: Streaming Events (Push)

```
Renderer                         Main Process
    │                                │
    │                                ├── Execute long-running operation
    │                                ├── webContents.send('execution:progress')
    │◄──── IPC event (push) ─────────│   { taskId, progress, step }
    │                                ├── webContents.send('execution:log')
    │◄──── IPC event (push) ─────────│   { taskId, line, stream }
    │                                ├── webContents.send('execution:complete')
    │◄──── IPC event (push) ─────────│   { taskId, exitCode, duration }
```

**Example — Execution Progress Streaming:**

```typescript
// Renderer (React component via useExecutionStore)
useEffect(() => {
  const unsub1 = api.execution.onProgress((data) => {
    // Update progress bar and current step
  })
  const unsub2 = api.execution.onLog((data) => {
    // Append log entry
  })
  const unsub3 = api.execution.onComplete((data) => {
    // Move task to history
  })
  return () => { unsub1(); unsub2(); unsub3() }
}, [])

// Main process (execution engine)
function emitProgress(taskId, progress, step) {
  mainWindow.webContents.send('execution:progress', { taskId, progress, step })
}
```

### Pattern 3: Hybrid (Request + Streaming)

```
Renderer                         Main Process
    │                                │
    │── invoke('provider:stream') ──►│
    │                                ├── Start HTTP request to AI provider
    │                                ├── Parse SSE response stream
    │                                ├── webContents.send('provider:token')
    │◄──── push ─────────────────────│   { id, token: "Hello", done: false }
    │◄──── push ─────────────────────│   { id, token: " world", done: false }
    │◄──── push ─────────────────────│   { id, token: "", done: true, model }
    │◄── Promise.resolve ───────────│   { success: true }
```

---

## Complete Data Flow: Autonomous Workflow Execution

The most complex data flow is the autonomous workflow execution, which combines multiple patterns:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FULL WORKFLOW DATA FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER: Opens issue → clicks "Execute"                                    │
│    │                                                                     │
│    ▼                                                                     │
│  RENDERER (ExecutionPanel.tsx)                                           │
│    │  Calls store.enqueue()                                              │
│    │  Store calls window.api.execution.run(...)                          │
│    │  ── ipcRenderer.invoke('execution:run') ─────────────────►         │
│    │                                                                     │
│    ▼                                                                     │
│  MAIN (ipc/handlers.ts)                                                  │
│    │  Calls execution.enqueue(projectId, path, title, desc)              │
│    │  Creates task with UUID, persists to DB, inserts in priority queue  │
│    │  Auto-starts queue processing if nothing running                    │
│    │  Returns { success, data: { taskId } }                              │
│    │  ◄── Promise.resolve ────────────────                               │
│    │                                                                     │
│    ▼                                                                     │
│  MAIN (execution/workflow.ts: executeWorkflow)                           │
│    │                                                                     │
│    │  ┌─ Stage 1: analyzeRepo ─────────────────────────────────────────┐ │
│    │  │  - reads package.json, tsconfig, source files                   │ │
│    │  │  - detects language, framework, test framework, linter          │ │
│    │  │  - sends execution:progress (5→15%)                             │ │
│    │  │  - sends execution:log with analysis details                    │ │
│    │  └────────────────────────────────────────────────────────────────┘ │
│    │                                                                     │
│    │  ┌─ Stage 2: understandIssue ─────────────────────────────────────┐ │
│    │  │  - AI call: parse issue description into structured reqs        │ │
│    │  │  - sends execution:progress (15→20%)                            │ │
│    │  │  - sends execution:log with extracted criteria                  │ │
│    │  └────────────────────────────────────────────────────────────────┘ │
│    │                                                                     │
│    │  ┌─ Stage 3: createPlan ──────────────────────────────────────────┐ │
│    │  │  - AI call: generate implementation plan from requirements      │ │
│    │  │  - sends execution:progress (25→30%)                            │ │
│    │  │  - sends execution:log with plan steps                          │ │
│    │  └────────────────────────────────────────────────────────────────┘ │
│    │                                                                     │
│    │  ┌─ Stage 4: implementChanges ────────────────────────────────────┐ │
│    │  │  - Execute plan steps (create/modify/delete files)              │ │
│    │  │  - For each step:                                               │ │
│    │  │    - AI call: generate code changes                             │ │
│    │  │    - Write changes to filesystem                                │ │
│    │  │    - sends execution:progress (35→65%)                          │ │
│    │  │    - sends execution:log for each file change                   │ │
│    │  └────────────────────────────────────────────────────────────────┘ │
│    │                                                                     │
│    │  ┌─ Stage 5: runLinter + runTests ───────────────────────────────┐ │
│    │  │  - Spawns child process: npm run lint / npm test                │ │
│    │  │  - Streams stdout/stderr via execution:log                      │ │
│    │  │  - Auto-fixes lint issues if possible                           │ │
│    │  │  - sends execution:progress (65→75%)                            │ │
│    │  └────────────────────────────────────────────────────────────────┘ │
│    │                                                                     │
│    │  ┌─ Stage 6: reviewChanges ───────────────────────────────────────┐ │
│    │  │  - AI call: review diff for quality, security, best practices   │ │
│    │  │  - sends execution:progress (80→85%)                            │ │
│    │  │  - sends execution:log with review score + issues               │ │
│    │  └────────────────────────────────────────────────────────────────┘ │
│    │                                                                     │
│    │  ┌─ Stage 7: commit + createPR ───────────────────────────────────┐ │
│    │  │  - git checkout -b feature-branch                               │ │
│    │  │  - git add -A                                                   │ │
│    │  │  - git commit -m "feat: generated commit message"               │ │
│    │  │  - git push origin feature-branch                               │ │
│    │  │  - AI call: generate PR description from diff + commit messages │ │
│    │  │  - GitHub API: create PR (draft)                                │ │
│    │  │  - sends execution:progress (85→100%)                           │ │
│    │  │  - sends execution:complete                                     │ │
│    │  └────────────────────────────────────────────────────────────────┘ │
│    │                                                                     │
│    ▼                                                                     │
│  RENDERER (executionStore.ts)                                            │
│    │  IPC listeners fire:                                                │
│    │    handleProgressEvent → updates activeTask.progress, progress obj  │
│    │    handleLogEvent → appends to logs array, tracks files/tokens      │
│    │    handleCompleteEvent → moves task to history, resets activeTask   │
│    │    React components re-render with new state                        │
│    │                                                                     │
│    ▼                                                                     │
│  UI updates:                                                             │
│    - ExecutionPanel: progress bar, current step name, live log stream    │
│    - ActivityFeed: new activity entry                                    │
│    - Dashboard: updated stats                                            │
│    - Notification: popup toast on completion                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Streaming Events Summary

| Stream Channel | Frequency | Payload | Consumer |
|----------------|-----------|---------|----------|
| `execution:progress` | Per sub-stage | `{ taskId, progress, step }` | ExecutionPanel, Dashboard |
| `execution:log` | Per output line | `{ taskId, line, stream }` | ExecutionLogViewer, Terminal |
| `execution:complete` | Once per task | `{ taskId, exitCode, duration }` | Store, History, Notifications |
| `execution:event` | Per state change | `{ taskId, type, stage?, message? }` | ActivityFeed |
| `provider:token` | Per token | `{ id, token, done, model }` | Provider chat UI |
| `shell:output` | Per chunk | `{ id, type, text }` | Terminal component |
| `shell:complete` | Once per command | `{ id, exitCode, timedOut }` | Shell execution handler |
| `shell:error` | On error | `{ id, error }` | Error handler |
| `update:available` | On check | `{ version, releaseDate, releaseNotes }` | UpdateChecker |
| `update:not-available` | On check | — | UpdateChecker |
| `update:download-progress` | Periodic | `{ percent, bytesPerSecond, total, transferred }` | Update progress UI |
| `update:downloaded` | Once | `{ version, releaseDate }` | Update notification |
| `update:error` | On error | `{ error }` | Error handler |

---

## State Synchronization

### Between Main Process and Renderer

The main process is the **source of truth** for:
- Task execution state (queue, active task, history)
- Provider configurations and active provider
- GitHub authentication state
- Database contents

The renderer maintains **local copies** of this state in Zustand stores, synchronized via IPC events:

```
MAIN PROCESS                    RENDERER (Zustand)
─────────────                   ──────────────────
execution state ──push events──► executionStore
                                 (queue, activeTask, progress, logs, history)

provider state ──request/response─► settingsStore
                                    (providers array)

GitHub auth ──request/response──► githubStore
                                   (repos, issues, prs)

settings ──request/response──► settingsStore (persisted via localStorage)
                                (theme, fontSize, etc.)
```

### Persistence Model

```
┌─────────────────────┐         ┌─────────────────────┐
│   Main Process DB   │         │  Renderer localStorage│
│   (sql.js / SQLite) │         │  (Zustand persist)    │
├─────────────────────┤         ├─────────────────────┤
│ Projects            │         │ Theme settings       │
│ Tasks               │         │ UI preferences       │
│ Execution logs      │         │ Provider configs     │
│ Settings (key-value)│         │ GitHub auth          │
│ GitHub auth         │         │ Recent search        │
│ Provider configs    │         │ Onboarding state     │
│ Conversations       │         │                      │
│ Cache               │         │                      │
└─────────────────────┘         └─────────────────────┘
```

Settings are stored in both — the main process persists data to SQLite, while the renderer caches UI preferences in localStorage via Zustand's `persist` middleware.

---

## Error Handling Patterns

### Pattern 1: Structured Error Response

All IPC handlers return a consistent envelope:

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string }
```

### Pattern 2: Try/Catch in Handlers

Every IPC handler wraps its logic in try/catch:

```typescript
ipcMain.handle('github:list-repos', async () => {
  try {
    return { success: true, data: await github.listRepos() }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})
```

### Pattern 3: Graceful Error Recovery

Non-critical subsystems degrade gracefully:

```typescript
// Auto-updater not installed → silent degradation
let updater = null
try {
  updater = require('electron-updater').autoUpdater
} catch {
  console.warn('[main] electron-updater not available')
}

// Database persistence failure → non-critical warning
try {
  database.createTask({ ... })
} catch (err) {
  console.error('[execution] Failed to persist task:', err)
}
```

### Pattern 4: Process Error Escalation

Child process cancellation uses a two-phase approach — SIGTERM first, then SIGKILL after grace period:

```typescript
// Graceful kill
proc.kill('SIGTERM')
// Force kill after 3s
setTimeout(() => {
  try { proc.kill('SIGKILL') } catch { /* already dead */ }
}, 3000)
```

### Pattern 5: Window Destruction Guard

All IPC event emissions check if the window is still alive:

```typescript
function emitProgress(taskId, progress, step) {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('execution:progress', { ... })
  }
}
```

### Pattern 6: Store-Level Error Handling

Zustand stores implement defensive patterns:

```typescript
// Silent no-op: cancel non-existent task
cancel: (taskId) => set((state) => {
  const taskInQueue = state.queue.find((t) => t.id === taskId)
  const isActive = state.activeTask?.id === taskId
  if (!taskInQueue && !isActive) return state  // no-op
  // ... proceed with cancellation
})

// Queue full → warn and reject
enqueue: (taskData) => {
  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn(`[executionStore] Queue full. Task rejected.`)
    return null
  }
  // ...
}
```

### Pattern 7: AI Provider Error Handling

Provider errors are caught at multiple levels:

```typescript
// Network-level: fetch() can throw
// Response-level: parse response body
// Streaming-level: skip malformed JSON lines
try {
  const parsed = JSON.parse(payload)
  // ...
} catch {
  // Skip malformed JSON lines in SSE stream
}
```

---

## IPC Channel Type Definitions

All types are defined in `src/preload/types.d.ts` and re-exported through the preload bridge.

**Full list of typed interfaces exposed to the renderer:**

| TypeScript Interface | Properties/Methods |
|---------------------|-------------------|
| `GitHubRepo` | id, name, fullName, owner, private, description, defaultBranch, language, stars, forks, ... |
| `GitHubIssue` | id, number, title, body, state, author, labels, assignees, createdAt, ... |
| `GitHubPR` | id, number, title, body, state, author, baseBranch, headBranch, draft, merged, ... |
| `GitHubBranch` | name, commitSha, protected |
| `GitHubContent` | path, content, encoding, size, type |
| `ExecutionTask` | id, command, cwd, status, exitCode, pid, progress, timeout, ... |
| `Provider` | id, name, type, apiEndpoint, models, active, config |
| `ProviderConfig` | apiKey?, baseUrl?, organizationId?, temperature?, maxTokens?, ... |
| `Workspace` | path, name, projects, lastOpened, settings? |
| `Project` | id, name, path, language?, framework?, lastOpened, ... |
| `Settings` | theme?, fontSize?, fontFamily?, shell?, editor?, gitUser?, ... |
| `GitStatus` | current, behind, ahead, clean, staged, unstaged, untracked, conflicted |
| `GitLogEntry` | hash, abbreviatedHash, author, committer, subject, body, refs, parents |
| `ShellOutput` | stdout, stderr, exitCode, duration, command |
| `ElectronAPI` | github, git, execution, provider, workspace, app, shell, settings, db, demo, events, update |
