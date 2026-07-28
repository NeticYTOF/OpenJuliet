# OpenJuliet Architecture Overview

> High-level architecture documentation for OpenJuliet v1.1.0 — a beautiful, open-source, local-first autonomous coding agent built with Electron + React 19.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ELECTRON APPLICATION                             │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      MAIN PROCESS  (Node.js)                      │   │
│  │                                                                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │  Window   │  │    IPC    │  │  Error   │  │    Auto-Update   │   │   │
│  │  │  Manager  │──│  Handlers │  │  Logger  │  │   (updater)      │   │   │
│  │  └──────────┘  └────┬─────┘  └──────────┘  └──────────────────┘   │   │
│  │                      │                                              │   │
│  │         ┌────────────┼────────────┬──────────────┐                  │   │
│  │         ▼            ▼            ▼              ▼                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐           │   │
│  │  │Providers │ │  GitHub  │ │    Git   │ │  Database    │           │   │
│  │  │  (AI)    │ │ (Octokit)│ │ (CLI)    │ │  (sql.js)    │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘           │   │
│  │       │                                       │                     │   │
│  │       ▼                                       ▼                     │   │
│  │  ┌──────────┐                           ┌──────────────┐           │   │
│  │  │Execution │                           │   Sandbox    │           │   │
│  │  │  Engine  │◄──────────────────────────►│  (Docker/    │           │   │
│  │  │          │                           │   Direct)    │           │   │
│  │  └──────────┘                           └──────────────┘           │   │
│  │       │                                                             │   │
│  │       ▼                                                             │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐              │   │
│  │  │ Workflow │  │ Demo Runner  │  │  GitHub PR Gen   │              │   │
│  │  │  Engine  │  │              │  │  (description)    │              │   │
│  │  └──────────┘  └──────────────┘  └──────────────────┘              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                           IPC (contextBridge)                           │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   PRELOAD SCRIPT                                  │   │
│  │                                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │              contextBridge.exposeInMainWorld('api', {        │  │   │
│  │  │  github: { listRepos, getRepo, listIssues, ... }             │  │   │
│  │  │  git: { clone, status, branch, commit, push, pull, ... }     │  │   │
│  │  │  execution: { run, cancel, status, onProgress, onLog, ... }  │  │   │
│  │  │  provider: { list, setActive, test }                          │  │   │
│  │  │  workspace: { select, getState, listProjects }                │  │   │
│  │  │  app: { getVersion, getPlatform, openExternal }               │  │   │
│  │  │  update: { check, download, install }                         │  │   │
│  │  │  shell: { exec }                                              │  │   │
│  │  │  settings: { get, set, getAll }                               │  │   │
│  │  │  db: { query }                                                │  │   │
│  │  │  demo: { start }                                              │  │   │
│  │  │  events: { on }                                               │  │   │
│  │  │  });                                                           │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    RENDERER PROCESS  (React 19)                    │   │
│  │                                                                    │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │                   App Root                                  │    │   │
│  │  │  ┌─────────┐  ┌───────────┐  ┌─────────────────────────┐  │    │   │
│  │  │  │  Error   │  │   Motion  │  │   AnimatePresence       │  │    │   │
│  │  │  │ Boundary │  │   Config  │  │   (Splash→App)          │  │    │   │
│  │  │  └─────────┘  └───────────┘  └─────────────────────────┘  │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                    │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │                   AppLayout                                 │    │   │
│  │  │  ┌──────────┐  ┌───────────────────┐  ┌────────────────┐   │    │   │
│  │  │  │ Titlebar │  │      Sidebar       │  │   MainArea     │   │    │   │
│  │  │  │(frameless)│ │  ┌──────────────┐  │  │  ┌──────────┐  │   │    │   │
│  │  │  └──────────┘  │  │ Nav Items    │  │  │  │Dashboard │  │   │    │   │
│  │  │  ┌──────────┐  │  │ Repositories │  │  │  │Editor    │  │   │    │   │
│  │  │  │Offline   │  │  │ Issues       │  │  │  │Settings  │  │   │    │   │
│  │  │  │Banner    │  │  │ Tasks        │  │  │  │History   │  │   │    │   │
│  │  │  └──────────┘  │  │ History      │  │  │  │GitHub    │  │   │    │   │
│  │  │                 │  │ Settings     │  │  │  │Terminal  │  │   │    │   │
│  │  │                 │  └──────────────┘  │  │  └──────────┘  │   │    │   │
│  │  │                 └───────────────────┘  └────────────────┘   │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                    │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │  Zustand Stores                                             │    │   │
│  │  │  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐  │    │   │
│  │  │  │ appStore │ │executionStore│ │gitStore  │ │settings  │  │    │   │
│  │  │  │ (nav,    │ │ (tasks,      │ │ (repos,  │ │Store     │  │    │   │
│  │  │  │  theme,  │ │  progress,   │ │  issues, │ │(prefs,   │  │    │   │
│  │  │  │  notif.) │ │  logs, queue)│ │  PRs)    │ │providers)│  │    │   │
│  │  │  └──────────┘ └──────────────┘ └──────────┘ └──────────┘  │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Desktop Framework** | Electron | 35.1.x | Cross-platform desktop shell |
| **UI Library** | React | 19.1.x | Component-based UI rendering |
| **Build Tool** | Vite (electron-vite) | 5.4.x / 5.0.x | Fast bundling and HMR |
| **Language** | TypeScript | 5.7.x | Type-safe development |
| **Styling** | Tailwind CSS | 3.4.x | Utility-first CSS framework |
| **State Management** | Zustand | 5.0.x | Lightweight state stores |
| **Code Editor** | Monaco Editor | — | VS Code-quality code editing |
| **Terminal** | xterm.js | 6.0.x | Full-featured terminal emulator |
| **Animations** | Framer Motion | 12.7.x | Declarative animations |
| **UI Primitives** | Radix UI | — | Accessible headless components |
| **Icons** | Lucide React | 0.486.x | Consistent icon library |
| **Database** | sql.js | 1.11.x | SQLite compiled to WebAssembly |
| **GitHub API** | Octokit | 4.1.x | GitHub REST API client |
| **Markdown** | react-markdown | 10.1.x | AI output rendering |
| **Validation** | Zod | 3.24.x | Runtime type validation |
| **Testing** | Vitest | 4.1.x | Unit and component tests |
| **Testing Library** | @testing-library/react | 16.3.x | Component testing utilities |
| **Packaging** | electron-builder | 25.1.x | Cross-platform distribution |
| **Auto-Update** | electron-updater | 6.8.x | In-app update mechanism |

---

## Main Process Architecture

The main process lives in `src/main/` and is the privileged Node.js backend of the application.

### Window Manager (`src/main/index.ts`)

Creates and manages the `BrowserWindow` with the following configuration:

- **Frameless window** with custom titlebar overlay (`frame: false`)
- **Dark background** (`#0a0a0f`) to prevent white flash
- **Default size**: 1400x900 (min: 900x600)
- **Security**: `contextIsolation: true`, `nodeIntegration: false`
- **Window state persistence**: saves/restores position, size, maximized state to/from SQLite

### Subsystem Initialization Order

```
1. Database (sql.js)    → no dependencies
2. Providers (AI)       → reads provider configs from database
3. GitHub (Octokit)     → restores auth from database
4. Sandbox              → lazy initialization
5. Execution Engine     → depends on providers, sandbox, git, github
6. IPC Handlers         → depends on window reference
7. Auto-Updater         → optional, degrades gracefully
```

### IPC Handler Registry (`src/main/ipc/handlers.ts`)

Organized by domain with 9 handler groups:

| Group | Prefix | Description |
|-------|--------|-------------|
| GitHub | `github:*` | Repository, issue, PR operations via Octokit |
| Git | `git:*` | Local git operations via CLI spawn |
| Execution | `execution:*` | Task queue and pipeline management |
| Provider | `provider:*` | AI provider chat, test, streaming |
| Database | `db:*` | SQL queries and settings |
| Shell | `shell:*` | Command execution with streaming |
| App | `app:*` | Version, platform, path info |
| Workspace | `workspace:*` | Project and workspace management |
| Demo | `demo:*` | Demo workflow runner |

All handlers return a structured response: `{ success: boolean, data?: T, error?: string }`.

### Provider System (`src/main/providers/index.ts`)

Multi-provider AI integration with support for:

- **OpenAI-compatible** (OpenAI, OpenRouter, LM Studio, vLLM, Custom) — POST `/chat/completions`
- **Anthropic** — POST `/v1/messages` with `x-api-key` header
- **Google** — POST `/v1beta/models/{model}:generateContent` with key query param
- **Ollama** — POST `/api/chat` (no auth)

Each provider has:
- Request builder (URL, headers, body per provider type)
- Response parser (non-streaming and streaming)
- Abort controller for cancellation

### Execution Engine (`src/main/execution/`)

The task execution engine manages a 7-stage autonomous pipeline:

```
analyze → plan → implement → test → review → commit → pr
```

Features:
- Priority-based queue with automatic processing
- Per-task stage tracking and progress (0-100%)
- Child process management with timeout
- Real-time IPC events: `execution:progress`, `execution:log`, `execution:complete`
- Pause/resume/cancel lifecycle
- Database persistence for history

### Workflow Engine (`src/main/execution/workflow.ts`)

The autonomous workflow engine runs the full pipeline:

```
analyzeRepo → understandIssue → createPlan → implementChanges
  → runTests → runLinter → reviewChanges → createCommit → createPR
  → generateSummary
```

Key types:
- `WorkflowContext` — taskId, projectPath, description, repo info
- `RepoAnalysis` — structure, language, framework, test framework, linter
- `ImplementationPlan` — ordered steps with file operations
- `WorkflowSummary` — status, branch, commit hash, PR number, metrics

### GitHub Integration (`src/main/github/`)

- Uses Octokit REST API for all GitHub operations
- Supports PAT and OAuth authentication
- Mappers normalize Octokit response shapes to application types
- Automatic PR description generation via AI

### Git Operations (`src/main/git/`)

- Spawns `git` CLI directly for all operations
- Streaming output capture
- Comprehensive git hook system (pre-commit, commit-msg, post-merge)
- Conventional commit validation

### Database (`src/main/database/index.ts`)

- **sql.js** — SQLite compiled to WebAssembly, runs in-process
- Schema: `projects`, `tasks`, `execution_logs`, `settings`, `github_auth`, `provider_configs`, `conversations`, `cache`
- All tables use `IF NOT EXISTS` for idempotent migrations
- WAL journal mode for performance
- Foreign keys enforced
- Auto-save to disk after each write operation

### Sandbox (`src/main/sandbox/index.ts`)

- Manages temporary directories for isolated execution
- Optional Docker-based sandboxing
- Process lifecycle tracking with configurable timeout
- SIGTERM → SIGKILL escalation after grace period
- Auto-cleanup of temp directories

### Security Model (`src/main/index.ts`)

```
┌─────────────────────────────────────────────┐
│              SECURITY MEASURES               │
├─────────────────────────────────────────────┤
│ contextIsolation: true    │ Renderer can't   │
│                           │ access Node.js   │
├───────────────────────────┼─────────────────┤
│ nodeIntegration: false    │ No require()     │
│                           │ in renderer      │
├───────────────────────────┼─────────────────┤
│ webSecurity: !is.dev      │ Strict CORS in   │
│                           │ production       │
├───────────────────────────┼─────────────────┤
│ setWindowOpenHandler      │ External links   │
│ → shell.openExternal      │ never load in    │
│                           │ Electron         │
├───────────────────────────┼─────────────────┤
│ CSP (default Vite config) │ XSS protection   │
├───────────────────────────┼─────────────────┤
│ Docker sandbox            │ Optional isolated │
│                           │ execution        │
└───────────────────────────┴─────────────────┘
```

---

## Preload Script Architecture

The preload script (`src/preload/index.ts`) uses Electron's `contextBridge` to expose a typed `window.api` object to the renderer process.

### Exposed API Namespaces

| Namespace | Methods | Type |
|-----------|---------|------|
| `api.github` | `listRepos`, `getRepo`, `listIssues`, `createPR`, `listPRs`, `authenticate` | Request-response |
| `api.git` | `clone`, `status`, `branch`, `commit`, `push`, `pull`, `diff`, `log` | Request-response |
| `api.execution` | `run`, `cancel`, `getStatus`, `getHistory`, `onProgress`, `onLog`, `onComplete` | Mixed |
| `api.provider` | `list`, `setActive`, `test` | Request-response |
| `api.workspace` | `select`, `getState`, `getProjects` | Request-response |
| `api.app` | `getVersion`, `getPlatform`, `openExternal` | Request-response |
| `api.update` | `check`, `download`, `install` | Request-response |
| `api.shell` | `exec` | Request-response |
| `api.settings` | `get`, `set`, `getAll` | Request-response |
| `api.db` | `query` | Request-response |
| `api.demo` | `start` | Request-response |
| `api.events` | `on` | Streaming listener |

**Total: 30+ IPC channels** exposed through contextBridge.

Streaming events use a helper `onIpcEvent<T>(channel, callback)` that returns an unsubscribe function, matching React's `useEffect` cleanup pattern.

---

## Renderer Architecture

### Entry Point (`src/renderer/src/main.tsx`)

Mounts React 19's `<App />` inside `<React.StrictMode>` at the `#root` DOM element.

### App Component Tree

```
<App>
  <ErrorBoundary>
    <MotionConfig>
      <AnimatePresence>
        <SplashScreen />             (first launch splash animation)
        ├── <WelcomeScreen />        (onboarding for new users)
        └── <AppLayout>              (main application shell)
              ├── <Titlebar />        (frameless draggable titlebar)
              ├── <OfflineBanner />   (network connectivity banner)
              ├── <Sidebar>           (navigation sidebar)
              │     └── Nav items     (dashboard, repos, issues, tasks, etc.)
              ├── <MainArea>          (content area)
              │     ├── <Dashboard />       (overview with stats and activity)
              │     ├── <GitHubPanel />     (repository/issue/PR browser)
              │     ├── <EditorView />      (Monaco editor + file explorer)
              │     ├── <ExecutionPanel />  (task execution progress)
              │     ├── <SettingsView />    (full settings page)
              │     ├── <HistoryView />     (execution history)
              │     ├── <TimelineView />    (activity timeline)
              │     └── ...
              ├── <CommandPalette />       (⌘K quick actions)
              ├── <KeyboardShortcutsModal />
              └── <Toast />                (notification toasts)
```

### Feature Components (`src/renderer/src/components/features/`)

| Component | Description |
|-----------|-------------|
| `Dashboard` | Main overview with stats and quick actions |
| `GitHubPanel` | Repository, issue, and PR browsing |
| `EditorView` | Monaco code editor interface |
| `SettingsView` | Full application settings |
| `ExecutionPanel` | Live task execution monitoring |
| `ExecutionLogViewer` | Detailed execution log viewer |
| `HistoryView` | Past execution history |
| `TimelineView` | Chronological activity view |
| `TaskManager` | Queue management with drag-reorder |
| `CommandPalette` | Quick command search and execution |
| `ThemeCustomizer` | Visual theme customization |
| `CodeViewer` | Read-only code display with syntax highlighting |
| `DiffViewer` | Side-by-side unified diff display |
| `FileExplorer` | Project file tree with decorations |
| `Terminal` / `XtermWrapper` | Integrated terminal |
| `ActivityFeed` | Real-time activity stream |
| `NotificationCenter` | In-app notifications panel |
| `QuickStartGuide` | Guided feature tour |
| `SplashScreen` | Animated launch screen |
| `WelcomeScreen` | First-run onboarding |
| `AboutModal` | Application info modal |

### UI Components (`src/renderer/src/components/ui/`)

Reusable primitives built on Radix UI: `Button`, `Card`, `Dialog`, `Modal`, `Dropdown`, `Select`, `Switch`, `Tabs`, `Toast`, `Tooltip`, `ScrollArea`, `ProgressBar`, `Badge`, `Input`, `Skeleton`, `EmptyState`, `ErrorBoundary`, `ErrorBoundary`, `NetworkStatus`, `OfflineBanner`, `LoadingSpinner`, `GlowText`, `AnimatedContainer`, `MotionConfig`, `LazyLoader`, `HoverCard`, `Kbd`, `StatusDot`, `Divider`, `NetworkRetry`, `RetryButton`.

---

## State Management

OpenJuliet uses **Zustand** with 4 stores:

### `appStore` — Global Application State

```typescript
interface AppState {
  activeView: ActiveView           // current navigation view
  sidebarOpen: boolean             // sidebar visibility
  theme: ThemeMode                 // 'dark' | 'light'
  currentProject: string | null    // active project ID
  currentTask: string | null       // active task ID
  notifications: Notification[]    // toast notifications
  panelNotifications: PanelNotification[]  // notification center items
  hasCompletedOnboarding: boolean
  isFirstLaunch: boolean
  commandPaletteOpen: boolean
  keyboardShortcutsOpen: boolean
  quickStartOpen: boolean
  // + actions for each state field
}
```

### `executionStore` — Task Execution State

```typescript
interface ExecutionState {
  queue: Task[]                    // queued tasks
  activeTask: Task | null          // currently executing task
  progress: ExecutionProgress | null  // 0-100, current tool, elapsed
  history: Task[]                  // completed/failed/cancelled tasks
  isRunning: boolean
  logs: LogEntry[]                 // live execution logs
  // + enqueue, cancel, pause, resume, IPC listener initialization
}
```

### `githubStore` — GitHub Integration State

```typescript
interface GitHubState {
  repos: Repository[]
  issues: Issue[]
  prs: PullRequest[]
  selectedRepo: Repository | null
  selectedIssue: Issue | null
  searchQuery: string
  // + loading/error states, fetch actions
}
```

### `settingsStore` — Application Settings (persisted to localStorage)

```typescript
interface SettingsState extends AppSettings {
  theme, workspaceDir, fontSize, animationsEnabled,
  sidebarCollapsed, concurrency, sandboxEnabled,
  executionTimeout, notificationsEnabled,
  gitUser, gitEmail, providers, github,
  accentColor, bgDensity, animationSpeed
  // + setter actions and theme customization
}
```

Uses Zustand's `persist` middleware with localStorage. Theme customization applies CSS variables at runtime.

---

## Database Schema

```
┌─────────────────────┐    ┌─────────────────────┐
│      projects        │    │       tasks          │
├─────────────────────┤    ├─────────────────────┤
│ id (PK)             │◄───│ project_id (FK)      │
│ name                 │    │ id (PK)              │
│ path                 │    │ title                │
│ description          │    │ description          │
│ repo_url             │    │ status               │
│ default_branch       │    │ priority             │
│ created_at           │    │ stage                │
│ updated_at           │    │ pr_url               │
└─────────────────────┘    │ created_at           │
                           │ updated_at           │
┌─────────────────────┐    └─────────────────────┘
│   execution_logs     │           │
├─────────────────────┤           │
│ id (PK)              │           │
│ task_id (FK)         │◄──────────┘
│ command              │
│ cwd                  │    ┌─────────────────────┐
│ exit_code            │    │    provider_configs  │
│ stdout               │    ├─────────────────────┤
│ stderr               │    │ id (PK)              │
│ duration             │    │ name                 │
│ status               │    │ base_url             │
│ started_at           │    │ api_key              │
│ finished_at          │    │ models               │
└─────────────────────┘    │ type                 │
                           │ is_active            │
┌─────────────────────┐    └─────────────────────┘
│      settings        │
├─────────────────────┤    ┌─────────────────────┐
│ key (PK)             │    │     conversations    │
│ value                │    ├─────────────────────┤
│ updated_at           │    │ id (PK)              │
└─────────────────────┘    │ title                │
                           │ provider_id          │
┌─────────────────────┐    │ model                │
│     github_auth      │    │ messages             │
├─────────────────────┤    │ created_at           │
│ id (PK, auto)        │    │ updated_at           │
│ token                │    └─────────────────────┘
│ type                 │
│ username             │    ┌─────────────────────┐
│ created_at           │    │       cache          │
└─────────────────────┘    ├─────────────────────┤
                           │ key (PK)              │
                           │ value                 │
                           │ expires_at            │
                           │ created_at            │
                           └─────────────────────┘
```

---

## Plugin System Architecture

The `plugins/` directory at the project root contains the plugin system. Plugins can extend:

- **Provider plugins** — Add new AI provider types
- **Execution plugins** — Custom execution workflow stages
- **Custom prompts** — Override system prompts for AI interactions
- **Workflow templates** — Define custom workflow pipelines
- **Hooks** — Execute custom code at specific workflow stages

See [docs/features/extensibility.md](../features/extensibility.md) for detailed plugin documentation.

---

## Build & Distribution Pipeline

```
Source Code (TypeScript)
    │
    ▼
electron-vite build
    │
    ├── out/main/index.js      (main process bundle)
    ├── out/preload/index.js   (preload bundle)
    └── out/renderer/          (static HTML/CSS/JS)
         │
         ▼
electron-builder
    │
    ├── --win    → NSIS installer (.exe) x64 + arm64
    ├── --mac    → DMG package (.dmg) x64 + arm64
    └── --linux  → AppImage + DEB (.deb) x64 + arm64
```

---

## Key Design Patterns

### 1. Response Envelope Pattern

All IPC handlers return a consistent envelope:
```typescript
{ success: boolean, data?: T, error?: string }
```

### 2. Subsystem Initialization

All subsystems follow the same init pattern:
```typescript
async function initSubsystems(): Promise<void> {
  await database.init()
  providers.initialize(configs)
  github.authenticate(token)
  // ...
}
```

### 3. IPC Event Emitter Pattern

Main process modules emit events to the renderer via `webContents.send()`:
```typescript
function emitProgress(taskId: string, progress: number, step?: string): void {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('execution:progress', { taskId, progress, step })
  }
}
```

### 4. Unsubscribe Return Pattern

Preload event listeners return an unsubscribe function for clean React hooks lifecycle:
```typescript
const unsub = api.execution.onProgress(handleProgress)
// Later: unsub()
```

### 5. Graceful Degradation

Non-critical features degrade gracefully:
- Auto-updater: `try/catch` around `require('electron-updater')`
- Demo runner: emits IPC events only if window reference is alive
- Git operations: return `{ success: false, error: ... }` instead of throwing
