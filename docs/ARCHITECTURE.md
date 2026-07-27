# OpenJuliet Architecture

> Version 1.0.0 — An open-source, local-first autonomous coding agent built with Electron, React, and TypeScript.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Architecture Layers](#architecture-layers)
   - [Main Process (Electron)](#main-process-electron)
   - [Preload / Context Bridge](#preload--context-bridge)
   - [Renderer Process (React)](#renderer-process-react)
4. [Module Relationships](#module-relationships)
5. [Data Flow: IPC Between Main and Renderer](#data-flow-ipc-between-main-and-renderer)
6. [State Management (Zustand Stores)](#state-management-zustand-stores)
7. [Plugin System Design](#plugin-system-design)
8. [Provider System Architecture](#provider-system-architecture)
9. [Workflow Engine Design](#workflow-engine-design)
10. [Database Layer](#database-layer)
11. [Security Model](#security-model)
12. [Extension Points](#extension-points)
13. [Build & Distribution Pipeline](#build--distribution-pipeline)

---

## Project Overview

OpenJuliet is a desktop application that brings autonomous AI-powered software engineering to the local machine. It connects to GitHub, browses repositories, selects issues, and executes an end-to-end workflow — analyzing, planning, implementing, testing, and generating pull requests — all under user supervision.

**Tech Stack:**

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Desktop Shell  | Electron 35                                     |
| UI             | React 19, Framer Motion, Radix UI primitives    |
| Styling        | Tailwind CSS 3, PostCSS                         |
| Build          | Vite (via electron-vite)                        |
| State          | Zustand 5                                       |
| Database       | SQLite (sql.js WASM)                            |
| GitHub API     | Octokit 4                                       |
| AI Providers   | OpenAI, Anthropic, Google, OpenRouter, Ollama, LM Studio, vLLM, Custom |
| Packaging      | electron-builder (NSIS, DMG, AppImage, DEB)     |

---

## Directory Structure

```
OpenJuliet/
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts                   # App entry, window creation, lifecycle
│   │   ├── github/
│   │   │   └── index.ts              # GitHub API integration (Octokit)
│   │   ├── providers/
│   │   │   └── index.ts              # AI provider management & API calls
│   │   ├── execution/
│   │   │   └── index.ts              # Workflow pipeline engine (worker threads)
│   │   ├── database/
│   │   │   └── index.ts              # SQLite persistence layer
│   │   ├── sandbox/
│   │   │   └── index.ts              # Secure command execution (optional Docker)
│   │   └── ipc/
│   │       └── handlers.ts           # All ipcMain.handle() registrations
│   ├── preload/
│   │   ├── index.ts                  # contextBridge.exposeInMainWorld('api', ...)
│   │   ├── index.d.ts                # re-exports for types
│   │   └── types.d.ts                # IPC API TypeScript interfaces
│   └── renderer/                     # React frontend
│       ├── index.html
│       └── src/
│           ├── main.tsx              # React entry point
│           ├── App.tsx               # Root component, onboarding gate
│           ├── components/
│           │   ├── layout/           # AppLayout, Sidebar, Titlebar, MainArea
│           │   ├── features/         # Dashboard, GitHubPanel, ExecutionPanel,
│           │   │                       TaskManager, SettingsView, WelcomeScreen
│           │   └── ui/               # Button, Card, Dialog, Input, Select, Toast, etc.
│           ├── stores/               # Zustand state stores
│           │   ├── appStore.ts       # Navigation, notifications, onboarding
│           │   ├── executionStore.ts # Task queue, progress, logs
│           │   ├── githubStore.ts    # Repos, issues, PRs
│           │   └── settingsStore.ts  # Persisted user preferences
│           ├── hooks/                # useIPC, useKeyboard
│           ├── lib/                  # constants, utility functions
│           ├── styles/               # globals.css (Tailwind + custom)
│           └── types/                # Shared TypeScript definitions
├── plugins/                          # Plugin extension directory
├── resources/                        # App icons, assets
├── scripts/                          # Build & automation scripts
├── docs/                             # Documentation
├── samples/                          # Example workflows & configs
├── electron.vite.config.ts           # Vite + Electron build config
├── electron-builder.yml              # Packaging configuration
├── tailwind.config.js                # Tailwind CSS theme config
├── tsconfig.json                     # TypeScript root config
├── tsconfig.node.json                # TypeScript config for main/preload
├── tsconfig.web.json                 # TypeScript config for renderer
├── eslint.config.js                  # ESLint flat config
└── package.json                      # Dependencies & scripts
```

---

## Architecture Layers

### Main Process (Electron)

The main process (`src/main/index.ts`) is the application backbone. It:

1. **Creates the BrowserWindow** — Frameless, dark-themed (`frame: false`), with a custom titlebar and traffic-light controls on macOS.
2. **Initialises subsystems in order** — Database first (no dependencies), then Providers, GitHub, Sandbox, Execution engine, and finally IPC handlers.
3. **Manages the app lifecycle** — Window state persistence (position, size, maximised), auto-updater (via `electron-updater`, graceful fallback), and platform-specific behaviour (macOS dock, Windows Squirrel installer events).
4. **Registers all IPC handlers** — Delegates to domain-specific modules (GitHub, Git, Execution, Providers, Database, Shell, App, Workspace).

```typescript
// Subsystem initialisation order (src/main/index.ts)
async function initSubsystems(): Promise<void> {
  await database.init()               // 1. Database (no deps)
  providers.initialize(configs)       // 2. Providers (reads DB on init)
  github.authenticate(token, type)    // 3. GitHub (no deps)
  // sandbox — lazy init              // 4. Sandbox (no deps)
  // execution — lazy init            // 5. Execution (deps: providers, sandbox)
  registerHandlers(mainWindow)        // 6. IPC (deps: window)
}
```

### Preload / Context Bridge

The preload script (`src/preload/index.ts`) uses Electron's `contextBridge.exposeInMainWorld` to expose a typed `window.api` object. This provides the renderer with:

- **GitHub API** — `listRepos`, `getRepo`, `listIssues`, `createPR`, `listPRs`, `authenticate`
- **Git API** — `clone`, `status`, `branch`, `commit`, `push`, `pull`, `diff`, `log`
- **Execution API** — `run`, `cancel`, `getStatus`, `getHistory`, `onProgress`, `onLog`, `onComplete`
- **Provider API** — `list`, `setActive`, `test`
- **Workspace API** — `select`, `getState`, `getProjects`
- **App API** — `getVersion`, `getPlatform`, `openExternal`
- **Shell API** — `exec`
- **Settings API** — `get`, `set`, `getAll`
- **Database API** — `query`
- **Events API** — `on` (generic IPC listener with unsubscribe)

**IPC pattern**: All main→renderer streaming events use `webContents.send()` (push from main), while renderer→main calls use `ipcRenderer.invoke()` (request/response) or `ipcRenderer.on()` (subscription).

### Renderer Process (React)

The renderer is a React 19 SPA loaded by Electron. It is built with Vite (via `@vitejs/plugin-react`). Key architectural decisions:

- **Component hierarchy**: `App → [WelcomeScreen | AppLayout]` — The `AnimatePresence` wrapper toggles between onboarding and the main application based on `hasCompletedOnboarding`.
- **Layout structure**: `AppLayout → Titlebar + Sidebar + MainArea` — Each view (Dashboard, Repositories, Issues, Tasks, History, Settings) renders within `MainArea` based on `activeView`.
- **UI primitives**: Built entirely on Radix UI (Dialog, DropdownMenu, Select, Switch, Tabs, Toast, Tooltip, ScrollArea, Progress, Slider) for full accessibility.
- **Data fetching**: Custom `useIPC` hook wraps `window.api` calls with loading/error state management.
- **Animations**: Framer Motion for page transitions, loading states, and UI micro-interactions.

---

## Module Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MAIN PROCESS                                 │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Database │  │ GitHub   │  │Providers │  │ Sandbox            │  │
│  │ (sql.js) │──│ (Octokit)│  │ (fetch)  │  │ (child_process/    │  │
│  │          │  │          │  │          │  │  Docker)           │  │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘  └────────┬───────────┘  │
│        │            │              │                  │             │
│        └────────────┴──────┬───────┴──────────────────┘             │
│                            │                                        │
│                     ┌──────▼───────┐                                │
│                     │  Execution   │  (Worker threads per stage)    │
│                     │  Engine      │◄── analyze, plan, implement,   │
│                     │              │     test, review, commit, pr   │
│                     └──────┬───────┘                                │
│                            │                                        │
│                     ┌──────▼───────┐                                │
│                     │ IPC Handlers │  ipcMain.handle() + send()     │
│                     │ (handlers.ts)│                                │
│                     └──────┬───────┘                                │
│                            │ ipcMain / webContents                  │
├────────────────────────────┼────────────────────────────────────────┤
│                    PRELOAD │ contextBridge                          │
│                            │                                        │
│                     ┌──────▼───────┐                                │
│                     │  window.api  │  Typed IPC bridge              │
│                     └──────┬───────┘                                │
├────────────────────────────┼────────────────────────────────────────┤
│                    RENDERER                                         │
│                            │                                        │
│  ┌─────────────────────────▼──────────────────────────────────┐     │
│  │                     App (React 19)                          │     │
│  │                                                             │     │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌────────┐  │     │
│  │  │ appStore   │  │settingsStore│  │execStore │  │gitStore│  │     │
│  │  │ (nav,      │  │(persisted   │  │(queue,   │  │(repos, │  │     │
│  │  │  notify)   │  │ prefs)      │  │ progress)│  │ issues)│  │     │
│  │  └────────────┘  └────────────┘  └──────────┘  └────────┘  │     │
│  │                                                             │     │
│  │  ┌──────────────────────────────────────────────────────┐   │     │
│  │  │  Components (layout / features / ui)                 │   │     │
│  │  └──────────────────────────────────────────────────────┘   │     │
│  │                                                             │     │
│  │  ┌──────────────────────────────────────────────────────┐   │     │
│  │  │  Hooks (useIPC, useKeyboard)                         │   │     │
│  │  └──────────────────────────────────────────────────────┘   │     │
│  └─────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: IPC Between Main and Renderer

### Request/Response Pattern (Renderer → Main)

```
Renderer                          Preload                         Main
   │                                │                               │
   │  window.api.github.listRepos() │                               │
   ├──────────────────────────────► │                               │
   │                                │ ipcRenderer.invoke(           │
   │                                │   'github:list-repos')        │
   │                                ├─────────────────────────────► │
   │                                │                               │ ipcMain.handle(
   │                                │                               │   'github:list-repos')
   │                                │                               │    → github.listRepos()
   │                                │                    ◄───────── │ returns { success, data }
   │                    ◄──────────┤ ipcRenderer resolves           │
   │  Promise<GitHubRepo[]>        │                               │
   │◄──────────────────────────────│                               │
```

### Push/Streaming Pattern (Main → Renderer)

```
Renderer                          Preload                         Main
   │                                │                               │
   │  window.api.execution.         │                               │  execution engine
   │    onProgress(callback)        │                               │  emits event
   │  window.api.execution.         │                               │
   │    onLog(callback)             │                               │
   │  window.api.execution.         │                               │
   │    onComplete(callback)        │                               │
   │                                │                               │
   │                                │  ipcRenderer.on(              │  mainWindow.webContents
   │                                │    'execution:progress')      │    .send('execution:event', {
   │                                │    'execution:log')            │      taskId, type, ... })
   │                                │    'execution:complete')      │
   │                    ◄───────────┤                               │
   │  callback(data) ◄─────────────┤                               │
```

### IPC Channel Reference

| Channel Pattern | Direction | Purpose |
|---|---|---|
| `github:*` | Renderer → Main (invoke) | GitHub API operations |
| `git:*` | Renderer → Main (invoke) | Local git operations |
| `execution:*` | Both | Task management and progress events |
| `provider:*` | Both | AI provider configuration and streaming |
| `db:*` | Renderer → Main (invoke) | Database queries and settings |
| `shell:*` | Renderer → Main (invoke) | Shell command execution |
| `app:*` | Renderer → Main (invoke) | App-level queries |
| `workspace:*` | Renderer → Main (invoke) | Workspace/project management |
| `settings:*` | Renderer → Main (invoke) | User settings CRUD |
| `update:*` | Both | Auto-updater events |
| `execution:event` | Main → Renderer (push) | Real-time execution progress |
| `provider:token` | Main → Renderer (push) | Streaming LLM tokens |

---

## State Management (Zustand Stores)

### appStore
- **Purpose**: Global application navigation, notifications, and onboarding state.
- **State**: `activeView`, `sidebarOpen`, `theme`, `currentProject`, `currentTask`, `notifications`, `hasCompletedOnboarding`, `isFirstLaunch`.
- **Persistence**: Onboarding flag via `localStorage`.
- **Key actions**: `setView`, `toggleSidebar`, `completeOnboarding`, `addNotification`.

### settingsStore
- **Purpose**: All user-configurable preferences persisted to localStorage.
- **State**: `theme`, `workspaceDir`, `fontSize`, `animationsEnabled`, `sidebarCollapsed`, `concurrency`, `sandboxEnabled`, `executionTimeout`, `notificationsEnabled`, `gitUser`, `gitEmail`, `providers[]`, `github`.
- **Persistence**: Zustand `persist` middleware → `localStorage` key `openjuliet:settings`.
- **Key actions**: `setTheme`, `addProvider`, `removeProvider`, `setGitHubAuth`, `resetSettings`.

### executionStore
- **Purpose**: Task queue, active task tracking, execution progress, and logs.
- **State**: `queue[]`, `activeTask`, `progress`, `history[]`, `isRunning`, `logs[]`.
- **Key actions**: `enqueue`, `cancel`, `pause`, `resume`, `addLog`, `reorderQueue`.

### githubStore
- **Purpose**: GitHub data — repositories, issues, and pull requests.
- **State**: `repos[]`, `issues[]`, `prs[]`, loading/error flags, `selectedRepo`, `selectedIssue`, `searchQuery`.
- **Key actions**: `fetchRepos`, `fetchIssues`, `fetchPRs`, `reset`.

---

## Plugin System Design

The `plugins/` directory serves as the extension point for:

- **Provider plugins** — Add new AI provider types beyond the built-in set.
- **Execution plugins** — Custom pipeline stages or hooks.
- **Workflow templates** — Predefined workflow configurations.
- **Custom prompts** — Override system prompts per workflow stage.

**Plugin loading strategy** (future implementation):
- Plugins are loaded from `plugins/` at startup.
- Each plugin exports a manifest (`plugin.json`) with hooks, commands, and dependencies.
- The system uses a hook-based architecture where plugins can register callbacks at specific lifecycle points:
  - `before:analyze`, `after:plan`, `before:implement`, etc. (execution stages)
  - `on:provider:init`, `on:provider:error` (provider lifecycle)
  - `on:repository:select`, `on:issue:select` (navigation events)

The plugin system is currently a framework-ready directory; plugin loading logic is not yet implemented.

---

## Provider System Architecture

The provider system (`src/main/providers/index.ts`) manages AI/LLM providers with a unified interface:

```typescript
interface ProviderConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  models: string[]
  type: 'openai' | 'anthropic' | 'google' | 'openrouter' |
        'ollama' | 'lm-studio' | 'vllm' | 'custom'
  isActive: boolean
}
```

**Built-in providers:**

| Provider | Base URL | Default Models |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| Anthropic | `https://api.anthropic.com/v1` | claude-3-5-sonnet, claude-3-opus, claude-3-haiku |
| Google | `https://generativelanguage.googleapis.com/v1beta` | gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash |
| OpenRouter | `https://openrouter.ai/api/v1` | Various routed models |
| Ollama | `http://localhost:11434/v1` | llama3.3, codellama, mistral, mixtral |
| LM Studio | `http://localhost:1234/v1` | local-model |
| vLLM | `http://localhost:8000/v1` | default |

**Provider API:**

- `initialize(configs?)` — Load saved or default provider configs.
- `listProviders()` — Return all configured providers.
- `setActiveProvider(id)` — Set the active provider.
- `testProvider(id)` — Health check via `/models` endpoint, measures latency.
- `chat(id, messages, options?)` — Non-streaming chat completion via `fetch()`.
- `streamChat(id, messages, options?)` — Streaming completion via SSE, emits `provider:token` events to renderer.
- `abortStream(id)` — Cancel an in-flight streaming request via `AbortController`.

**Streaming implementation:**
The `streamChat` function reads a Server-Sent Events (SSE) stream using the Fetch API's `ReadableStream`. It decodes the `data:` lines, parses JSON chunks, and emits individual tokens to the renderer via IPC. Provider-specific response shapes are normalised into a uniform event format.

---

## Workflow Engine Design

The execution engine (`src/main/execution/index.ts`) implements a pipeline architecture:

### Pipeline Stages

```
analyze → plan → implement → test → review → commit → pr
```

Each stage runs in an isolated **worker thread** (`Worker` from `worker_threads`), providing process-level isolation for stage execution. Workers communicate progress back to the main thread via `worker.postMessage()`.

### Task Lifecycle

```
enqueue → queued → running (stage loop) → completed | failed | cancelled
```

1. **Enqueue**: Creates an `ExecutionTask`, inserts into a priority-sorted queue.
2. **Process Queue**: Dequeues the highest-priority item; creates worker threads per stage.
3. **Stage Execution**: Each stage runs in its own worker. Workers send progress updates (0-100%) back to the main thread.
4. **Completion**: When all stages succeed, the task is marked `completed`. On stage failure, the task is marked `failed`.
5. **Cancellation**: Supports single-task cancel (`cancel(taskId)`) and global cancel (`cancelAll()`).
6. **Pause/Resume**: Pausing stops queue processing after the current task; the running task continues but the queue won't advance.

### Worker Thread Architecture

```typescript
// Main thread spawns a worker per stage
const worker = new Worker(workerPath, {
  workerData: { taskId, projectId, projectPath, description, metadata }
})

// Worker sends progress messages
worker.postMessage({ type: 'progress', progress: 45, step: 'Analyzing imports' })

// Main thread receives and forwards to renderer via IPC
worker.on('message', (msg) => {
  if (msg.type === 'progress') {
    emitEvent({ taskId, type: 'progress', stage, progress: msg.progress })
  }
})
```

### Queue Management

- Priority-based queue (higher priority values are dequeued first).
- Concurrent task execution is managed via the `concurrency` setting.
- Queue state is observable from the renderer via `execution:queue` IPC call.

---

## Database Layer

OpenJuliet uses **sql.js** (SQLite compiled to WebAssembly) for local persistence.

### Schema

| Table | Purpose |
|---|---|
| `projects` | Workspace projects |
| `tasks` | Task records with status, priority, PR URL |
| `execution_logs` | Command execution history with stdout/stderr |
| `settings` | Key-value settings store |
| `github_auth` | Encrypted GitHub tokens |
| `provider_configs` | AI provider configurations |
| `conversations` | Chat conversation history |
| `cache` | General-purpose key-value cache with TTL |

### Key Features

- **WAL mode** for better concurrent read performance.
- **Foreign keys** enabled for referential integrity (cascading deletes).
- **Automatic persistence** — The database is saved to disk on every write operation and on close.
- **File location** — Stored in Electron's `userData` directory (`openjuliet.db`).

### API

The database module exposes a `query()` function that accepts raw SQL with parameterised queries, plus typed convenience functions for each entity type (`createProject`, `listTasks`, `getSetting`, etc.).

---

## Security Model

### Context Isolation
`contextIsolation: true` — The renderer process has no direct access to Node.js or Electron APIs. All communication goes through the typed `contextBridge` API.

### Node Integration
`nodeIntegration: false` — The renderer cannot require Node modules or access `process`, `require`, etc.

### Web Security
- `webSecurity: !is.dev` — Strict CORS and same-origin policies in production; relaxed in development for hot-reload.
- External links are routed through `shell.openExternal` (system browser), never loaded inside Electron.
- Window creation is denied for all URLs via `setWindowOpenHandler`.

### Sandbox (Execution)
The sandbox module provides optional Docker-based isolation for command execution:

```typescript
const result = await sandbox.executeCommand('npm test', cwd, onOutput, {
  useDocker: true,
  dockerImage: 'node:22'
})
```

When Docker is enabled, commands run in ephemeral containers with the project directory mounted as `/workspace`. The sandbox falls back to direct execution if Docker is unavailable.

### Credential Storage
- API keys and GitHub tokens are stored in the local SQLite database (plaintext — encryption can be added via Electron's `safeStorage` API).
- Users are responsible for securing their `userData` directory.

---

## Extension Points

| Extension Point | Location | Mechanism |
|---|---|---|
| **AI Providers** | `src/main/providers/index.ts` | Add new provider type + config to `DEFAULT_PROVIDERS` array |
| **Pipeline Stages** | `src/main/execution/index.ts` | Add stage to `PIPELINE_STAGES` + create `workers/<stage>.js` |
| **IPC Handlers** | `src/main/ipc/handlers.ts` | Add new `ipcMain.handle()` in the appropriate register function |
| **Preload API** | `src/preload/index.ts` | Add method to the `window.api` object in `contextBridge` |
| **UI Views** | `src/renderer/src/components/features/` | Add component + register in navigation constants |
| **Zustand Stores** | `src/renderer/src/stores/` | Create new store or extend existing ones |
| **Database Tables** | `src/main/database/index.ts` | Add CREATE TABLE to `SCHEMA_SQL` + CRUD functions |
| **Plugins** | `plugins/` directory | Create plugin directory with `plugin.json` manifest |
| **UI Components** | `src/renderer/src/components/ui/` | Add new Radix-based primitives |
| **Keyboard Shortcuts** | `src/renderer/src/hooks/useKeyboard.ts` | Add entries to the `shortcuts` map |

---

## Build & Distribution Pipeline

### Development

```
npm run dev
  → electron-vite dev
    → Vite dev server for renderer (HMR)
    → tsc watch for main/preload
    → Electron launches with dev server URL
```

### Production Build

```
npm run build
  → electron-vite build
    → Vite builds renderer (React → static assets)
    → tsc compiles main/preload
    → Output: out/main, out/preload, out/renderer
```

### Packaging

```
npm run package (via electron-builder)
  → Windows: NSIS installer (x64, arm64)
  → macOS: DMG (x64, arm64)
  → Linux: AppImage (x64, arm64) + DEB (x64)
```

---

## Key Design Decisions

1. **Worker threads for stages**: Each pipeline stage runs in its own `Worker` thread for isolation. Prevents one failing stage from crashing the main process.
2. **sql.js over better-sqlite3**: WASM-based SQLite avoids native module compilation issues and works seamlessly with electron-vite's bundling.
3. **Frameless window with custom titlebar**: Provides full control over the titlebar appearance (dark theme, custom traffic lights, drag regions).
4. **Zustand over Redux**: Minimal boilerplate, no action/reducer ceremony, excellent TypeScript inference, and built-in `persist` middleware.
5. **Feature-based component organisation**: Components are categorised as layout (structural), features (business logic), or ui (reusable primitives) for clarity.
