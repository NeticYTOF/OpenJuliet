/**
 * OpenJuliet — Git Integration Module
 *
 * Provides low-level git operations by spawning the `git` CLI.
 * All operations stream output back to the renderer via IPC events.
 *
 * @module main/git
 */

import { execFile, type ExecFileOptions } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'

const execFileAsync = promisify(execFile)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GitStatus {
  branch: string
  behind: number
  ahead: number
  staged: string[]
  unstaged: string[]
  untracked: string[]
  conflicts: string[]
}

export interface GitLogEntry {
  hash: string
  author: string
  email: string
  date: string
  message: string
  refs: string
}

export interface GitBranchInfo {
  current: string
  branches: string[]
  all: string[]
}

export interface GitCommitResult {
  success: boolean
  hash?: string
  error?: string
}

export interface GitCloneOptions {
  depth?: number
  branch?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRepo(repoPath: string): boolean {
  return existsSync(`${repoPath}/.git`) || existsSync(`${repoPath}/.git`)
}

async function runGit(
  args: string[],
  cwd?: string,
  options?: ExecFileOptions
): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('git', args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024, // 10 MB
      ...options
    })
    return {
      stdout: (stdout as string).trim(),
      stderr: (stderr as string).trim()
    }
  } catch (err: any) {
    throw new Error(`Git error: ${err.stderr?.trim() || err.message}`)
  }
}

// ---------------------------------------------------------------------------
// Git Operations
// ---------------------------------------------------------------------------

/**
 * Clone a repository.
 */
export async function clone(
  url: string,
  targetPath: string,
  options?: GitCloneOptions
): Promise<{ stdout: string }> {
  const args = ['clone']
  if (options?.depth) args.push('--depth', String(options.depth))
  if (options?.branch) args.push('--branch', options.branch)
  args.push(url, targetPath)

  const result = await runGit(args)
  return { stdout: result.stdout }
}

/**
 * Get working tree status.
 */
export async function status(repoPath: string): Promise<GitStatus> {
  if (!isRepo(repoPath)) throw new Error('Not a git repository')

  const [branchResult, statusResult, untrackedResult] = await Promise.all([
    runGit(['rev-parse', '--abbrev-ref', 'HEAD'], repoPath),
    runGit(['status', '--porcelain', '--ignore-submodules'], repoPath),
    runGit(['ls-files', '--others', '--exclude-standard'], repoPath)
  ])

  const branch = branchResult.stdout || 'HEAD'

  // Parse status lines
  const staged: string[] = []
  const unstaged: string[] = []
  const conflicts: string[] = []

  for (const line of statusResult.stdout.split('\n')) {
    if (!line.trim()) continue
    const xy = line.substring(0, 2)
    const file = line.substring(3)

    // XY format: X=staging area, Y=working tree
    if (xy[0] === 'U' || xy[1] === 'U' || xy === 'DD' || xy === 'AA') {
      conflicts.push(file)
    } else {
      if (xy[0] !== ' ' && xy[0] !== '?') staged.push(file)
      if (xy[1] !== ' ' && xy[1] !== '?') unstaged.push(file)
    }
  }

  const untracked = untrackedResult.stdout
    ? untrackedResult.stdout.split('\n').filter(Boolean)
    : []

  // Count ahead/behind
  let behind = 0
  let ahead = 0
  try {
    const upstream = await runGit(
      ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'],
      repoPath
    )
    if (upstream.stdout) {
      const countResult = await runGit(
        ['rev-list', '--left-right', '--count', 'HEAD...' + upstream.stdout],
        repoPath
      )
      const match = countResult.stdout.match(/(\d+)\s+(\d+)/)
      if (match) {
        behind = parseInt(match[1], 10)
        ahead = parseInt(match[2], 10)
      }
    }
  } catch {
    // No upstream
  }

  return { branch, behind, ahead, staged, unstaged, untracked, conflicts }
}

/**
 * List and switch branches.
 */
export async function branch(
  repoPath: string
): Promise<GitBranchInfo> {
  const result = await runGit(['branch', '--all'], repoPath)
  const lines = result.stdout.split('\n').filter(Boolean)
  const branches: string[] = []
  let current = ''

  for (const line of lines) {
    const name = line.replace('* ', '').trim()
    if (line.startsWith('* ')) current = name
    // Remove remote prefix for the clean list
    const clean = name.replace('remotes/origin/', '')
    if (!branches.includes(clean)) branches.push(clean)
  }

  return { current, branches, all: lines.map((l) => l.trim()) }
}

/**
 * Checkout a branch.
 */
export async function checkout(
  repoPath: string,
  branchName: string,
  create = false
): Promise<{ stdout: string }> {
  const args = ['checkout']
  if (create) args.push('-b')
  args.push(branchName)
  const result = await runGit(args, repoPath)
  return { stdout: result.stdout }
}

/**
 * Stage all changes or specific files.
 */
export async function add(
  repoPath: string,
  files?: string[]
): Promise<{ stdout: string }> {
  const args = ['add']
  if (files && files.length > 0) {
    args.push(...files)
  } else {
    args.push('-A')
  }
  const result = await runGit(args, repoPath)
  return { stdout: result.stdout }
}

/**
 * Create a commit.
 */
export async function commit(
  repoPath: string,
  message: string,
  options?: { all?: boolean; amend?: boolean }
): Promise<GitCommitResult> {
  const args = ['commit']
  if (options?.all) args.push('-a')
  if (options?.amend) args.push('--amend')
  args.push('-m', message)

  try {
    const result = await runGit(args, repoPath)
    // Extract hash from output like "[main abc1234] Message"
    const hashMatch = result.stdout.match(/\[[\w/]+ ([a-f0-9]+)\]/)
    return {
      success: true,
      hash: hashMatch ? hashMatch[1] : undefined
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Push to remote.
 */
export async function push(
  repoPath: string,
  options?: {
    remote?: string
    branch?: string
    force?: boolean
  }
): Promise<{ success: boolean; message: string }> {
  const args = ['push']
  if (options?.force) args.push('--force')
  if (options?.remote) args.push(options.remote)
  if (options?.branch) args.push(options.branch)

  try {
    const result = await runGit(args, repoPath)
    return { success: true, message: result.stdout }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

/**
 * Pull from remote.
 */
export async function pull(
  repoPath: string,
  options?: {
    remote?: string
    branch?: string
    rebase?: boolean
  }
): Promise<{ success: boolean; message: string }> {
  const args = ['pull']
  if (options?.rebase) args.push('--rebase')
  if (options?.remote) args.push(options.remote)
  if (options?.branch) args.push(options.branch)

  try {
    const result = await runGit(args, repoPath)
    return { success: true, message: result.stdout }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

/**
 * Get diff.
 */
export async function diff(
  repoPath: string,
  options?: { staged?: boolean; path?: string }
): Promise<string> {
  const args = ['diff']
  if (options?.staged) args.push('--cached')
  if (options?.path) args.push('--', options.path)

  const result = await runGit(args, repoPath)
  return result.stdout
}

/**
 * Get commit log.
 */
export async function log(
  repoPath: string,
  options?: { maxCount?: number; path?: string }
): Promise<GitLogEntry[]> {
  const format = '--format=%H|%an|%ae|%aI|%s|%d'
  const args = ['log', format, `--max-count=${options?.maxCount ?? 30}`]
  if (options?.path) args.push('--', options.path)

  const result = await runGit(args, repoPath)
  if (!result.stdout) return []

  return result.stdout.split('\n').filter(Boolean).map((line) => {
    const parts = line.split('|')
    return {
      hash: parts[0] || '',
      author: parts[1] || '',
      email: parts[2] || '',
      date: parts[3] || '',
      message: parts[4] || '',
      refs: parts[5] || ''
    }
  })
}

/**
 * Fetch from remote.
 */
export async function fetch(
  repoPath: string,
  options?: { remote?: string; prune?: boolean }
): Promise<{ stdout: string }> {
  const args = ['fetch']
  if (options?.prune) args.push('--prune')
  if (options?.remote) args.push(options.remote)

  const result = await runGit(args, repoPath)
  return { stdout: result.stdout }
}

/**
 * Check if a directory has a git repo.
 */
export function isGitRepo(repoPath: string): boolean {
  return isRepo(repoPath)
}
