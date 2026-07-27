// ---------------------------------------------------------------------------
// Shared type declarations for the OpenJuliet Electron preload script.
// Re-exported through index.d.ts for renderer consumption.
// ---------------------------------------------------------------------------

/* ── GitHub ─────────────────────────────────────────────────────────── */

export interface GitHubRepo {
  id: number
  nodeId: string
  name: string
  fullName: string
  owner: { login: string; avatarUrl: string; htmlUrl: string }
  private: boolean
  htmlUrl: string
  description: string | null
  fork: boolean
  url: string
  defaultBranch: string
  language: string | null
  topics: string[]
  visibility: string
  archived: boolean
  starred: boolean
  openIssuesCount: number
  forksCount: number
  watchersCount: number
  createdAt: string
  updatedAt: string
  pushedAt: string
  size: number
  cloneUrl: string
  sshUrl: string
  gitUrl: string
  permissions?: {
    admin: boolean
    push: boolean
    pull: boolean
  }
}

export interface GitHubIssue {
  id: number
  nodeId: string
  number: number
  title: string
  state: 'open' | 'closed'
  locked: boolean
  body: string | null
  user: { login: string; avatarUrl: string; htmlUrl: string } | null
  labels: Array<{ name: string; color: string; description: string | null }>
  assignees: Array<{ login: string; avatarUrl: string }>
  milestone: { title: string; number: number } | null
  commentsCount: number
  createdAt: string
  updatedAt: string
  closedAt: string | null
  htmlUrl: string
  pullRequest?: { url: string; mergedAt: string | null }
  repo: { owner: string; repo: string }
}

export interface GitHubPR {
  id: number
  nodeId: string
  number: number
  title: string
  state: 'open' | 'closed' | 'merged'
  body: string | null
  user: { login: string; avatarUrl: string; htmlUrl: string } | null
  draft: boolean
  merged: boolean
  mergeable: boolean | null
  mergeCommitSha: string | null
  base: {
    label: string
    ref: string
    sha: string
    repo: { fullName: string; cloneUrl: string }
  }
  head: {
    label: string
    ref: string
    sha: string
    repo: { fullName: string; cloneUrl: string } | null
  }
  commitsCount: number
  changedFiles: number
  additions: number
  deletions: number
  commentsCount: number
  reviewCommentsCount: number
  createdAt: string
  updatedAt: string
  mergedAt: string | null
  closedAt: string | null
  htmlUrl: string
  repo: { owner: string; repo: string }
}

/* ── Execution ───────────────────────────────────────────────────────── */

export interface ExecutionTask {
  id: string
  projectId?: string
  command: string
  cwd: string
  status: ExecutionStatus
  exitCode: number | null
  pid: number | null
  startedAt: string | null
  finishedAt: string | null
  duration: number | null
  progress: number
  message?: string
  env?: Record<string, string>
  timeout?: number
}

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timed-out'

/* ── Provider ────────────────────────────────────────────────────────── */

export interface Provider {
  id: string
  name: string
  type: string
  apiEndpoint: string
  models: string[]
  active: boolean
  config: ProviderConfig
  createdAt: string
  updatedAt: string
}

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  organizationId?: string
  projectId?: string
  deploymentName?: string
  maxRetries?: number
  timeout?: number
  temperature?: number
  maxTokens?: number
  [key: string]: unknown
}

/* ── Workspace & Projects ────────────────────────────────────────────── */

export interface Workspace {
  path: string
  name: string
  projects: Project[]
  lastOpened: string
  settings?: Record<string, unknown>
}

export interface Project {
  id: string
  name: string
  path: string
  language?: string
  framework?: string
  lastOpened: string
  createdAt: string
  updatedAt: string
  workspacePath: string
  metadata?: Record<string, unknown>
}

/* ── Settings ─────────────────────────────────────────────────────────── */

export interface Settings {
  theme?: 'light' | 'dark' | 'system'
  fontSize?: number
  fontFamily?: string
  shell?: string
  editor?: string
  gitUser?: { name: string; email: string }
  autoSave?: boolean
  telemetry?: boolean
  proxy?: { host: string; port: number; auth?: { username: string; password: string } }
  [key: string]: unknown
}

/* ── Git ─────────────────────────────────────────────────────────────── */

export interface GitStatus {
  current: string
  behind: number
  ahead: number
  clean: boolean
  staged: GitChange[]
  unstaged: GitChange[]
  untracked: string[]
  conflicted: string[]
  remote?: string
}

export interface GitChange {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied'
  oldPath?: string
  staged: boolean
}

export interface GitLogEntry {
  hash: string
  abbreviatedHash: string
  author: { name: string; email: string; when: string }
  committer: { name: string; email: string; when: string }
  subject: string
  body: string
  refs: string[]
  parents: string[]
}

/* ── Shell ────────────────────────────────────────────────────────────── */

export interface ShellOutput {
  stdout: string
  stderr: string
  exitCode: number
  duration: number
  command: string
}

/* ── Renderer API interface ──────────────────────────────────────────── */

export interface GithubAPI {
  listRepos(): Promise<GitHubRepo[]>
  getRepo(owner: string, repo: string): Promise<GitHubRepo>
  listIssues(owner: string, repo: string): Promise<GitHubIssue[]>
  createPR(params: {
    owner: string
    repo: string
    title: string
    head: string
    base: string
    body?: string
    draft?: boolean
  }): Promise<GitHubPR>
  listPRs(owner: string, repo: string): Promise<GitHubPR[]>
  authenticate(token: string): Promise<{ success: boolean; login?: string }>
}

export interface GitAPI {
  clone(url: string, path: string, options?: { depth?: number; branch?: string }): Promise<{ success: boolean; path: string }>
  status(repoPath: string): Promise<GitStatus>
  branch(repoPath: string): Promise<{ current: string; branches: string[]; all: string[] }>
  commit(repoPath: string, message: string, options?: { all?: boolean; amend?: boolean }): Promise<{ success: boolean; hash: string }>
  push(repoPath: string, options?: { remote?: string; branch?: string; force?: boolean }): Promise<{ success: boolean; message: string }>
  pull(repoPath: string, options?: { remote?: string; branch?: string; rebase?: boolean }): Promise<{ success: boolean; message: string }>
  diff(repoPath: string, options?: { staged?: boolean; path?: string }): Promise<string>
  log(repoPath: string, options?: { maxCount?: number; path?: string }): Promise<GitLogEntry[]>
}

export interface ExecutionAPI {
  run(task: {
    command: string
    cwd?: string
    env?: Record<string, string>
    timeout?: number
    projectId?: string
  }): Promise<ExecutionTask>
  cancel(taskId: string): Promise<{ success: boolean }>
  getStatus(taskId: string): Promise<ExecutionStatus>
  getHistory(projectId?: string): Promise<ExecutionTask[]>
  onProgress(callback: (data: { taskId: string; progress: number; message?: string }) => void): () => void
  onLog(callback: (data: { taskId: string; line: string; stream: 'stdout' | 'stderr' }) => void): () => void
  onComplete(callback: (data: { taskId: string; exitCode: number | null; duration: number }) => void): () => void
}

export interface ProviderAPI {
  list(): Promise<Provider[]>
  setActive(id: string): Promise<{ success: boolean }>
  test(id: string): Promise<{ success: boolean; latency?: number; error?: string }>
}

export interface WorkspaceAPI {
  select(path: string): Promise<Workspace>
  getState(): Promise<Workspace | null>
  getProjects(): Promise<Project[]>
}

export interface AppAPI {
  getVersion(): Promise<string>
  getPlatform(): Promise<NodeJS.Platform>
  openExternal(url: string): Promise<void>
}

export interface UpdateAPI {
  check(): Promise<{ success: boolean; data?: unknown; error?: string }>
  download(): Promise<{ success: boolean }>
  install(): Promise<{ success: boolean }>
}

export interface ShellAPI {
  exec(command: string, options?: { cwd?: string; timeout?: number }): Promise<ShellOutput>
}

export interface SettingsAPI {
  get<T = unknown>(key: string): Promise<T | undefined>
  set(key: string, value: unknown): Promise<{ success: boolean }>
  getAll(): Promise<Settings>
}

export interface DbAPI {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>
}

export interface EventsAPI {
  on(channel: string, callback: (data: unknown) => void): () => void
}

export interface ElectronAPI {
  github: GithubAPI
  git: GitAPI
  execution: ExecutionAPI
  provider: ProviderAPI
  workspace: WorkspaceAPI
  app: AppAPI
  shell: ShellAPI
  settings: SettingsAPI
  db: DbAPI
  events: EventsAPI
  update: UpdateAPI
}

// Augment the global Window interface so the renderer can access
// window.api without additional type assertions.
declare global {
  interface Window {
    api: ElectronAPI
  }
}