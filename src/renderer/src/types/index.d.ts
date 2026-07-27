/* ========================================================================
   OpenJuliet — Shared TypeScript Types
   ======================================================================== */

/** Application view identifiers for routing */
export type ActiveView =
  | 'dashboard'
  | 'repositories'
  | 'issues'
  | 'tasks'
  | 'history'
  | 'settings'
  | 'editor'

/** Theme mode */
export type ThemeMode = 'dark' | 'light'

/** Animation speed preference */
export type AnimationSpeed = 'normal' | 'reduced' | 'none'

/** Notification severity level */
export type NotificationType = 'success' | 'warning' | 'error' | 'info'

/** Notification panel kind — richer type for the notification center */
export type PanelNotificationKind = 'execution_complete' | 'pr_created' | 'error' | 'update_available' | 'info'

/** Panel notification — richer notification type for the NotificationCenter dropdown */
export interface PanelNotification {
  id: string
  kind: PanelNotificationKind
  title: string
  message?: string
  timestamp: number
  read: boolean
  /** Optional action URL / route */
  action?: string
  /** Whether the notification is persistent */
  persistent?: boolean
}

/** Task status */
export type TaskStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

/** Task priority */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

/** AI provider kind */
export type ProviderKind = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'custom'

/* ──── Data Models ──── */

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  timestamp: number
  duration?: number // ms, 0 = persistent
}

export interface Project {
  id: string
  name: string
  path: string
  lastOpened: number
  provider?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
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

export interface ExecutionProgress {
  taskId: string
  currentFile?: string
  currentTool?: string
  currentCommand?: string
  progress: number // 0–100
  elapsedMs: number
  tokenCount: number
  filesEdited: number
  logs: LogEntry[]
}

export interface LogEntry {
  id: string
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'debug' | 'system'
  message: string
  source?: string
}

export interface Repository {
  id: string
  name: string
  fullName: string
  description?: string
  url: string
  owner: string
  private: boolean
  defaultBranch: string
  updatedAt: number
  language?: string
  stars: number
}

export interface Issue {
  id: string
  number: number
  title: string
  body?: string
  state: 'open' | 'closed'
  author: string
  labels: string[]
  createdAt: number
  updatedAt: number
  repo: string
  assignees: string[]
}

export interface PullRequest {
  id: string
  number: number
  title: string
  body?: string
  state: 'open' | 'closed' | 'merged'
  author: string
  createdAt: number
  updatedAt: number
  repo: string
  sourceBranch: string
  targetBranch: string
  additions: number
  deletions: number
}

export interface AIProvider {
  id: string
  name: string
  kind: ProviderKind
  apiKey?: string
  baseUrl?: string
  models: AIModel[]
  enabled: boolean
}

export interface AIModel {
  id: string
  name: string
  maxTokens: number
  supportsVision: boolean
  supportsFunctions: boolean
}

export interface GitHubAuth {
  token?: string
  username?: string
  avatarUrl?: string
  isConnected: boolean
  method: 'oauth' | 'pat' | 'none'
}

export interface AppSettings {
  theme: ThemeMode
  workspaceDir: string
  fontSize: number
  animationsEnabled: boolean
  sidebarCollapsed: boolean
  concurrency: number
  sandboxEnabled: boolean
  executionTimeout: number
  notificationsEnabled: boolean
  gitUser: string
  gitEmail: string
  providers: AIProvider[]
  github: GitHubAuth
  /* ─── Theme customization ─── */
  accentColor: string
  bgDensity: number
  animationSpeed: AnimationSpeed
}

export interface ActivityItem {
  id: string
  type: 'task' | 'git' | 'system' | 'github' | 'provider'
  title: string
  description?: string
  timestamp: number
  icon?: string
}

export interface SystemStatus {
  providers: { id: string; name: string; connected: boolean }[]
  workspace: { path: string; exists: boolean; size: string }
  git: { configured: boolean; user?: string }
  memoryUsage: string
  uptime: number
}

/* ──── Electron IPC API Types ──── */

/**
 * GitHub API exposed through the preload bridge.
 */
export interface GithubAPI {
  listRepos: () => Promise<unknown[]>
  getRepo: (owner: string, repo: string) => Promise<unknown>
  listIssues: (owner: string, repo: string) => Promise<unknown[]>
  createPR: (params: Record<string, unknown>) => Promise<unknown>
  listPRs: (owner: string, repo: string) => Promise<unknown[]>
  authenticate: (token: string) => Promise<{ success: boolean; login?: string }>
}

/**
 * Git API exposed through the preload bridge.
 */
export interface GitAPI {
  clone: (url: string, path: string, options?: Record<string, unknown>) => Promise<unknown>
  status: (repoPath: string) => Promise<unknown>
  branch: (repoPath: string) => Promise<{ current: string; branches: string[]; all: string[] }>
  commit: (repoPath: string, message: string, options?: Record<string, unknown>) => Promise<unknown>
  push: (repoPath: string, options?: Record<string, unknown>) => Promise<unknown>
  pull: (repoPath: string, options?: Record<string, unknown>) => Promise<unknown>
  diff: (repoPath: string, options?: Record<string, unknown>) => Promise<string>
  log: (repoPath: string, options?: Record<string, unknown>) => Promise<unknown[]>
}

/**
 * App-level API exposed through the preload bridge.
 */
export interface AppAPI {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<string>
  openExternal: (url: string) => Promise<void>
}

/**
 * Updates (auto-updater) API exposed through the preload bridge.
 */
export interface UpdateAPI {
  check: () => Promise<{ success: boolean; data?: unknown; error?: string }>
  download: () => Promise<{ success: boolean }>
  install: () => Promise<{ success: boolean }>
}

/**
 * Events API — listen to main-process events.
 */
export interface EventsAPI {
  on: (channel: string, callback: (data: unknown) => void) => () => void
}

/**
 * The full preload bridge exposed as window.api.
 */
export interface ElectronAPI {
  github: GithubAPI
  git: GitAPI
  execution: Record<string, unknown>
  provider: Record<string, unknown>
  workspace: Record<string, unknown>
  app: AppAPI
  update: UpdateAPI
  shell: Record<string, unknown>
  settings: Record<string, unknown>
  db: Record<string, unknown>
  events: EventsAPI
}

declare global {
  interface Window {
    api: ElectronAPI
  }

  /* React 19 removed the global JSX namespace — declare it here to avoid TS2503 */
  namespace JSX {
    type Element = React.ReactElement
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode
    }
    interface ElementAttributesProperty {
      props: Record<string, unknown>
    }
    interface IntrinsicElements {
      [elemName: string]: unknown
    }
  }
}

export {}