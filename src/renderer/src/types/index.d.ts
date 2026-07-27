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

export interface ElectronAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  openFile: () => Promise<string | null>
  openDirectory: () => Promise<string | null>
  getAppVersion: () => Promise<string>
  setTitle: (title: string) => void
  onMenuAction: (callback: (action: string) => void) => void
  removeMenuActionListener: () => void
  platform: string
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