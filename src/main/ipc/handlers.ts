/**
 * IPC Handlers Module
 *
 * Registers all ipcMain.handle() handlers for the Electron main process.
 * Each handler delegates to the appropriate sub-module and returns
 * serialisable results or throws structured errors.
 *
 * Handlers are organised by domain:
 * - github:*   — GitHub API operations
 * - git:*      — Local git operations (via simple-git)
 * - execution:* — Task execution pipeline
 * - provider:*  — AI provider operations
 * - db:*       — Database queries and migrations
 * - shell:*    — Shell command execution with streaming
 * - app:*      — Application-level queries
 * - workspace:* — Workspace/project management
 *
 * @module ipc/handlers
 */

import { ipcMain, shell, app, type BrowserWindow, type WebContents } from 'electron'
import { spawn, type ChildProcess } from 'child_process'
import { randomUUID } from 'crypto'
import * as github from '../github/index'
import * as providers from '../providers/index'
import * as database from '../database/index'
import * as execution from '../execution/index'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HandledShellProcess {
  process: ChildProcess
  webContents: WebContents
}

// ---------------------------------------------------------------------------
// State (shell processes)
// ---------------------------------------------------------------------------

const shellProcesses: Map<string, HandledShellProcess> = new Map()

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register all IPC handlers on the given BrowserWindow.
 * Must be called after the window is created and the database is initialised.
 *
 * @param mainWindow - The main BrowserWindow for sending streaming events.
 */
export function registerHandlers(mainWindow: BrowserWindow): void {
  const webContents = mainWindow.webContents

  registerGitHubHandlers()
  registerGitHandlers()
  registerExecutionHandlers()
  registerProviderHandlers()
  registerDatabaseHandlers()
  registerShellHandlers(webContents)
  registerAppHandlers()
  registerWorkspaceHandlers()
}

// ---------------------------------------------------------------------------
// GitHub handlers
// ---------------------------------------------------------------------------

function registerGitHubHandlers(): void {
  ipcMain.handle('github:list-repos', async () => {
    try {
      return { success: true, data: await github.listRepos() }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'github:get-repo',
    async (_event, owner: string, repo: string) => {
      try {
        return { success: true, data: await github.getRepo(owner, repo) }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'github:list-issues',
    async (_event, owner: string, repo: string, state?: 'open' | 'closed' | 'all') => {
      try {
        return { success: true, data: await github.listIssues(owner, repo, state) }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'github:get-issue',
    async (_event, owner: string, repo: string, issueNumber: number) => {
      try {
        return { success: true, data: await github.getIssue(owner, repo, issueNumber) }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'github:create-pr',
    async (
      _event,
      options: {
        owner: string
        repo: string
        title: string
        head: string
        base: string
        body?: string
        draft?: boolean
      }
    ) => {
      try {
        return { success: true, data: await github.createPR(options) }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'github:list-prs',
    async (_event, owner: string, repo: string, state?: 'open' | 'closed' | 'all') => {
      try {
        return { success: true, data: await github.listPRs(owner, repo, state) }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('github:authenticate', async (_event, token: string, type?: 'pat' | 'oauth') => {
    try {
      github.authenticate(token, type ?? 'pat')
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('github:auth-state', async () => {
    return { success: true, data: github.getAuthState() }
  })

  ipcMain.handle('github:clear-auth', async () => {
    github.clearAuth()
    return { success: true }
  })

  ipcMain.handle(
    'github:add-comment',
    async (_event, owner: string, repo: string, issueNumber: number, body: string) => {
      try {
        await github.addComment(owner, repo, issueNumber, body)
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'github:list-branches',
    async (_event, owner: string, repo: string) => {
      try {
        return { success: true, data: await github.listBranches(owner, repo) }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'github:get-contents',
    async (_event, owner: string, repo: string, path: string, ref?: string) => {
      try {
        return { success: true, data: await github.getContents(owner, repo, path, ref) }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )
}

// ---------------------------------------------------------------------------
// Git handlers (simple-git wrapper via shell)
// ---------------------------------------------------------------------------

function registerGitHandlers(): void {
  ipcMain.handle(
    'git:clone',
    async (_event, url: string, dir: string, options?: { branch?: string; depth?: number }) => {
      try {
        const args = ['clone']
        if (options?.branch) args.push('--branch', options.branch)
        if (options?.depth) args.push('--depth', String(options.depth))
        args.push(url, dir)
        const result = await runGitCommand(args)
        return { success: true, data: result }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('git:status', async (_event, repoPath: string) => {
    try {
      const result = await runGitCommand(['status', '--porcelain'], repoPath)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('git:branch', async (_event, repoPath: string) => {
    try {
      const result = await runGitCommand(['branch', '-a'], repoPath)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'git:commit',
    async (_event, repoPath: string, message: string, options?: { all?: boolean }) => {
      try {
        if (options?.all) {
          await runGitCommand(['add', '-A'], repoPath)
        }
        const result = await runGitCommand(['commit', '-m', message], repoPath)
        return { success: true, data: result }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('git:push', async (_event, repoPath: string, remote?: string, branch?: string) => {
    try {
      const args = ['push', remote ?? 'origin', branch ?? 'HEAD']
      const result = await runGitCommand(args, repoPath)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('git:pull', async (_event, repoPath: string, remote?: string, branch?: string) => {
    try {
      const args = ['pull', remote ?? 'origin', branch ?? 'HEAD']
      const result = await runGitCommand(args, repoPath)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('git:diff', async (_event, repoPath: string, args?: string[]) => {
    try {
      const result = await runGitCommand(['diff', ...(args ?? [])], repoPath)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('git:log', async (_event, repoPath: string, maxCount?: number) => {
    try {
      const args = ['log', '--oneline', '--graph', `--max-count=${maxCount ?? 20}`]
      const result = await runGitCommand(args, repoPath)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}

/**
 * Run a git subcommand and return its stdout.
 */
function runGitCommand(args: string[], cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })

    proc.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim())
      } else {
        reject(new Error(stderr.trim() || `git exited with code ${code}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn git: ${err.message}`))
    })
  })
}

// ---------------------------------------------------------------------------
// Execution handlers
// ---------------------------------------------------------------------------

function registerExecutionHandlers(): void {
  ipcMain.handle(
    'execution:run',
    async (
      _event,
      projectId: string,
      projectPath: string,
      title: string,
      description: string,
      startStage?: string,
      priority?: number
    ) => {
      try {
        const taskId = execution.enqueue(
          projectId,
          projectPath,
          title,
          description,
          (startStage as execution.Stage) ?? 'analyze',
          priority ?? 0
        )
        return { success: true, data: { taskId } }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('execution:cancel', async (_event, taskId: string) => {
    try {
      execution.cancel(taskId)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('execution:status', async (_event, taskId: string) => {
    try {
      const status = execution.getStatus(taskId)
      return { success: true, data: status }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('execution:history', async (_event, projectId?: string) => {
    try {
      const history = execution.getHistory(projectId)
      return { success: true, data: history }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('execution:queue', async () => {
    return { success: true, data: execution.getQueueState() }
  })

  ipcMain.handle('execution:pause', async () => {
    execution.pause()
    return { success: true }
  })

  ipcMain.handle('execution:resume', async () => {
    execution.resume()
    return { success: true }
  })

  ipcMain.handle('execution:cancel-all', async () => {
    execution.cancelAll()
    return { success: true }
  })
}

// ---------------------------------------------------------------------------
// Provider handlers
// ---------------------------------------------------------------------------

function registerProviderHandlers(): void {
  ipcMain.handle('provider:list', async () => {
    return { success: true, data: providers.listProviders() }
  })

  ipcMain.handle('provider:set-active', async (_event, id: string) => {
    try {
      providers.setActiveProvider(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('provider:test', async (_event, id: string) => {
    try {
      const result = await providers.testProvider(id)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'provider:chat',
    async (
      _event,
      providerId: string,
      messages: providers.ChatMessage[],
      options?: providers.ChatOptions
    ) => {
      try {
        const content = await providers.chat(providerId, messages, options)
        return { success: true, data: { content } }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'provider:stream',
    async (
      _event,
      providerId: string,
      messages: providers.ChatMessage[],
      options?: providers.ChatOptions
    ) => {
      try {
        await providers.streamChat(providerId, messages, options)
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('provider:abort', async (_event, providerId: string) => {
    providers.abortStream(providerId)
    return { success: true }
  })
}

// ---------------------------------------------------------------------------
// Database handlers
// ---------------------------------------------------------------------------

function registerDatabaseHandlers(): void {
  ipcMain.handle('db:query', async (_event, sql: string, params?: Record<string, unknown> | unknown[]) => {
    try {
      const result = database.query(sql, params)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('db:migrate', async () => {
    try {
      await database.migrate()
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Settings shortcut handlers
  ipcMain.handle('db:get-setting', async (_event, key: string) => {
    try {
      const value = database.getSetting(key)
      return { success: true, data: value }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('db:set-setting', async (_event, key: string, value: string) => {
    try {
      database.setSetting(key, value)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}

// ---------------------------------------------------------------------------
// Shell handlers
// ---------------------------------------------------------------------------

function registerShellHandlers(webContents: WebContents): void {
  ipcMain.handle(
    'shell:exec',
    async (_event, command: string, options?: { cwd?: string; timeout?: number }) => {
      const id = randomUUID()
      const cwd = options?.cwd ?? app.getPath('home')
      const timeout = options?.timeout ?? 60_000

      return new Promise((resolve) => {
        const proc = spawn('sh', ['-c', command], {
          cwd,
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout
        })

        let stdout = ''
        let stderr = ''
        let timedOut = false

        const handle = { process: proc, webContents }
        shellProcesses.set(id, handle)

        // Stream output to renderer in real time
        proc.stdout?.on('data', (chunk: Buffer) => {
          const text = chunk.toString()
          stdout += text
          if (!webContents.isDestroyed()) {
            webContents.send('shell:output', {
              id,
              type: 'stdout',
              text
            })
          }
        })

        proc.stderr?.on('data', (chunk: Buffer) => {
          const text = chunk.toString()
          stderr += text
          if (!webContents.isDestroyed()) {
            webContents.send('shell:output', {
              id,
              type: 'stderr',
              text
            })
          }
        })

        const timer = setTimeout(() => {
          timedOut = true
          proc.kill('SIGTERM')
        }, timeout)

        proc.on('close', (code) => {
          clearTimeout(timer)
          shellProcesses.delete(id)

          if (!webContents.isDestroyed()) {
            webContents.send('shell:complete', {
              id,
              exitCode: code,
              timedOut
            })
          }

          resolve({
            success: code === 0,
            exitCode: code,
            stdout,
            stderr,
            timedOut
          })
        })

        proc.on('error', (err) => {
          clearTimeout(timer)
          shellProcesses.delete(id)

          if (!webContents.isDestroyed()) {
            webContents.send('shell:error', {
              id,
              error: err.message
            })
          }

          resolve({ success: false, exitCode: -1, stdout, stderr, error: err.message })
        })
      })
    }
  )

  ipcMain.handle('shell:cancel', async (_event, id: string) => {
    const handle = shellProcesses.get(id)
    if (!handle) return { success: false, error: `No running shell process: ${id}` }

    try {
      handle.process.kill('SIGTERM')
      // Force kill after 2s
      setTimeout(() => {
        try {
          handle.process.kill('SIGKILL')
        } catch {
          // Already dead
        }
      }, 2000)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}

// ---------------------------------------------------------------------------
// App handlers
// ---------------------------------------------------------------------------

function registerAppHandlers(): void {
  ipcMain.handle('app:get-version', async () => {
    return { success: true, data: app.getVersion() }
  })

  ipcMain.handle('app:get-platform', async () => {
    return { success: true, data: process.platform }
  })

  ipcMain.handle('app:open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('app:get-paths', async () => {
    return {
      success: true,
      data: {
        userData: app.getPath('userData'),
        home: app.getPath('home'),
        documents: app.getPath('documents'),
        downloads: app.getPath('downloads'),
        desktop: app.getPath('desktop'),
        temp: app.getPath('temp'),
        exe: app.getPath('exe'),
        appData: app.getPath('appData')
      }
    }
  })

  ipcMain.handle('app:get-config', async () => {
    return {
      success: true,
      data: {
        name: app.getName(),
        version: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome
      }
    }
  })
}

// ---------------------------------------------------------------------------
// Workspace handlers
// ---------------------------------------------------------------------------

function registerWorkspaceHandlers(): void {
  ipcMain.handle('workspace:select', async (_event, projectId: string) => {
    try {
      const project = database.getProject(projectId)
      if (!project) {
        return { success: false, error: `Project not found: ${projectId}` }
      }
      return { success: true, data: project }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('workspace:get-state', async () => {
    try {
      const projects = database.listProjects()
      const settings = database.getAllSettings()
      return {
        success: true,
        data: {
          projects,
          settings,
          activeProvider: providers.getActiveProviderId(),
          queueState: execution.getQueueState()
        }
      }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('workspace:list-projects', async () => {
    try {
      const projects = database.listProjects()
      return { success: true, data: projects }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'workspace:create-project',
    async (
      _event,
      project: {
        id: string
        name: string
        path: string
        description?: string
        repoUrl?: string
        defaultBranch?: string
      }
    ) => {
      try {
        database.createProject({
          id: project.id,
          name: project.name,
          path: project.path,
          description: project.description ?? null,
          repoUrl: project.repoUrl ?? null,
          defaultBranch: project.defaultBranch ?? null
        })
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('workspace:delete-project', async (_event, id: string) => {
    try {
      database.deleteProject(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}