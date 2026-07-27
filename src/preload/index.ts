import { contextBridge, ipcRenderer } from 'electron'
import type {
  GitHubRepo,
  GitHubIssue,
  GitHubPR,
  ExecutionTask,
  ExecutionStatus,
  Provider,
  ProviderConfig,
  Project,
  Settings,
  GitStatus,
  GitLogEntry,
  Workspace,
  ShellOutput
} from './types'

// ---------------------------------------------------------------------------
// Helper — register a one-shot or persistent IPC listener that returns an
// unsubscribe function.  Used by streaming event emitters in the API below.
// ---------------------------------------------------------------------------
function onIpcEvent<T>(channel: string, callback: (data: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, data: T): void => {
    callback(data)
  }
  ipcRenderer.on(channel, handler)
  return () => {
    ipcRenderer.removeListener(channel, handler)
  }
}

// ---------------------------------------------------------------------------
// Expose a typed 'api' object on window so the renderer can call main-process
// functions without importing Node / Electron modules.
// ---------------------------------------------------------------------------
contextBridge.exposeInMainWorld('api', {
  // ── GitHub ─────────────────────────────────────────────────────────────
  github: {
    listRepos(): Promise<GitHubRepo[]> {
      return ipcRenderer.invoke('github:list-repos')
    },

    getRepo(owner: string, repo: string): Promise<GitHubRepo> {
      return ipcRenderer.invoke('github:get-repo', owner, repo)
    },

    listIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
      return ipcRenderer.invoke('github:list-issues', owner, repo)
    },

    createPR(params: {
      owner: string
      repo: string
      title: string
      head: string
      base: string
      body?: string
      draft?: boolean
    }): Promise<GitHubPR> {
      return ipcRenderer.invoke('github:create-pr', params)
    },

    listPRs(owner: string, repo: string): Promise<GitHubPR[]> {
      return ipcRenderer.invoke('github:list-prs', owner, repo)
    },

    authenticate(token: string): Promise<{ success: boolean; login?: string }> {
      return ipcRenderer.invoke('github:authenticate', token)
    }
  },

  // ── Git ────────────────────────────────────────────────────────────────
  git: {
    clone(url: string, path: string, options?: { depth?: number; branch?: string }): Promise<{ success: boolean; path: string }> {
      return ipcRenderer.invoke('git:clone', url, path, options)
    },

    status(repoPath: string): Promise<GitStatus> {
      return ipcRenderer.invoke('git:status', repoPath)
    },

    branch(repoPath: string): Promise<{ current: string; branches: string[]; all: string[] }> {
      return ipcRenderer.invoke('git:branch', repoPath)
    },

    commit(repoPath: string, message: string, options?: { all?: boolean; amend?: boolean }): Promise<{ success: boolean; hash: string }> {
      return ipcRenderer.invoke('git:commit', repoPath, message, options)
    },

    push(
      repoPath: string,
      options?: { remote?: string; branch?: string; force?: boolean }
    ): Promise<{ success: boolean; message: string }> {
      return ipcRenderer.invoke('git:push', repoPath, options)
    },

    pull(
      repoPath: string,
      options?: { remote?: string; branch?: string; rebase?: boolean }
    ): Promise<{ success: boolean; message: string }> {
      return ipcRenderer.invoke('git:pull', repoPath, options)
    },

    diff(repoPath: string, options?: { staged?: boolean; path?: string }): Promise<string> {
      return ipcRenderer.invoke('git:diff', repoPath, options)
    },

    log(
      repoPath: string,
      options?: { maxCount?: number; path?: string }
    ): Promise<GitLogEntry[]> {
      return ipcRenderer.invoke('git:log', repoPath, options)
    }
  },

  // ── Execution ──────────────────────────────────────────────────────────
  execution: {
    run(task: {
      command: string
      cwd?: string
      env?: Record<string, string>
      timeout?: number
      projectId?: string
    }): Promise<ExecutionTask> {
      return ipcRenderer.invoke('execution:run', task)
    },

    cancel(taskId: string): Promise<{ success: boolean }> {
      return ipcRenderer.invoke('execution:cancel', taskId)
    },

    getStatus(taskId: string): Promise<ExecutionStatus> {
      return ipcRenderer.invoke('execution:status', taskId)
    },

    getHistory(projectId?: string): Promise<ExecutionTask[]> {
      return ipcRenderer.invoke('execution:history', projectId)
    },

    onProgress(callback: (data: { taskId: string; progress: number; message?: string }) => void): () => void {
      return onIpcEvent('execution:progress', callback)
    },

    onLog(callback: (data: { taskId: string; line: string; stream: 'stdout' | 'stderr' }) => void): () => void {
      return onIpcEvent('execution:log', callback)
    },

    onComplete(callback: (data: { taskId: string; exitCode: number | null; duration: number }) => void): () => void {
      return onIpcEvent('execution:complete', callback)
    }
  },

  // ── Provider ───────────────────────────────────────────────────────────
  provider: {
    list(): Promise<Provider[]> {
      return ipcRenderer.invoke('provider:list')
    },

    setActive(id: string): Promise<{ success: boolean }> {
      return ipcRenderer.invoke('provider:set-active', id)
    },

    test(id: string): Promise<{ success: boolean; latency?: number; error?: string }> {
      return ipcRenderer.invoke('provider:test', id)
    }
  },

  // ── Workspace ──────────────────────────────────────────────────────────
  workspace: {
    select(path: string): Promise<Workspace> {
      return ipcRenderer.invoke('workspace:select', path)
    },

    getState(): Promise<Workspace | null> {
      return ipcRenderer.invoke('workspace:get-state')
    },

    getProjects(): Promise<Project[]> {
      return ipcRenderer.invoke('workspace:list-projects')
    }
  },

  // ── App ────────────────────────────────────────────────────────────────
  app: {
    getVersion(): Promise<string> {
      return ipcRenderer.invoke('app:get-version')
    },

    getPlatform(): Promise<NodeJS.Platform> {
      return ipcRenderer.invoke('app:get-platform')
    },

    openExternal(url: string): Promise<void> {
      return ipcRenderer.invoke('app:open-external', url)
    }
  },

  // ── Update (auto-updater) ─────────────────────────────────────────────
  update: {
    check(): Promise<{ success: boolean; data?: unknown; error?: string }> {
      return ipcRenderer.invoke('update:check')
    },

    download(): Promise<{ success: boolean }> {
      return ipcRenderer.invoke('update:download')
    },

    install(): Promise<{ success: boolean }> {
      return ipcRenderer.invoke('update:install')
    }
  },

  // ── Shell ──────────────────────────────────────────────────────────────
  shell: {
    exec(command: string, options?: { cwd?: string; timeout?: number }): Promise<ShellOutput> {
      return ipcRenderer.invoke('shell:exec', command, options)
    }
  },

  // ── Settings ───────────────────────────────────────────────────────────
  settings: {
    get<T = unknown>(key: string): Promise<T | undefined> {
      return ipcRenderer.invoke('settings:get', key)
    },

    set(key: string, value: unknown): Promise<{ success: boolean }> {
      return ipcRenderer.invoke('settings:set', key, value)
    },

    getAll(): Promise<Settings> {
      return ipcRenderer.invoke('settings:get-all')
    }
  },

  // ── Database ───────────────────────────────────────────────────────────
  db: {
    query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
      return ipcRenderer.invoke('db:query', sql, params)
    }
  },

  // ── Events ─────────────────────────────────────────────────────────────
  events: {
    on(channel: string, callback: (data: unknown) => void): () => void {
      return onIpcEvent(channel, callback)
    }
  }
})