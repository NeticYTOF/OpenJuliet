// @vitest-environment node
/**
 * Tests for the main process git module.
 * Mocks `child_process.execFile` using vi.mock.
 * Uses callback-based mock implementation to work with util.promisify.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import type * as GitModule from '../git/index'

// ──── Mock child_process before importing the module ────
// execFile needs to accept a callback (last arg) to work with promisify
const mockExecFile = vi.fn()
vi.mock('child_process', () => ({
  execFile: mockExecFile
}))

// ──── Module reference (lazy-loaded) ────
let git: typeof GitModule

beforeAll(async () => {
  git = await import('../git/index')
})

/**
 * Make the mock execFile succeed.
 * The mock calls its callback (last argument) with (null, result).
 * This matches how util.promisify wraps callback-based functions.
 */
function makeExecFileSuccess(stdout: string, stderr = ''): void {
  mockExecFile.mockImplementation((...args: unknown[]) => {
    // Find the callback function (the last argument if it's a function)
    const cb = args.length > 0 && typeof args[args.length - 1] === 'function'
      ? args[args.length - 1] as (err: Error | null, result: { stdout: string; stderr: string }) => void
      : null
    if (cb) {
      cb(null, { stdout, stderr })
    }
    return undefined
  })
}

function makeExecFileError(stderr: string, message?: string): void {
  mockExecFile.mockImplementation((...args: unknown[]) => {
    const cb = args.length > 0 && typeof args[args.length - 1] === 'function'
      ? args[args.length - 1] as (err: Error, result?: { stdout: string; stderr: string }) => void
      : null
    if (cb) {
      const err = new Error(message || 'Git error') as Error & { stderr: string; stdout: string }
      err.stderr = stderr
      err.stdout = ''
      cb(err)
    }
    return undefined
  })
}

describe('git module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('clone', () => {
    it('clones a repository with URL and target path', async () => {
      makeExecFileSuccess('Cloning into...')

      const result = await git.clone('https://github.com/user/repo.git', '/tmp/repo')

      expect(result.stdout).toBe('Cloning into...')
      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['clone', 'https://github.com/user/repo.git', '/tmp/repo'],
        expect.objectContaining({ maxBuffer: 10 * 1024 * 1024 }),
        expect.any(Function)
      )
    })

    it('clones with depth option', async () => {
      makeExecFileSuccess('')

      await git.clone('https://github.com/user/repo.git', '/tmp/repo', { depth: 1 })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['clone', '--depth', '1', 'https://github.com/user/repo.git', '/tmp/repo'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('clones with branch option', async () => {
      makeExecFileSuccess('')

      await git.clone('https://github.com/user/repo.git', '/tmp/repo', { branch: 'main' })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['clone', '--branch', 'main', 'https://github.com/user/repo.git', '/tmp/repo'],
        expect.any(Object),
        expect.any(Function)
      )
    })
  })

  describe('isGitRepo', () => {
    it('returns false for non-existent directory', () => {
      const result = git.isGitRepo('/nonexistent/path')
      expect(result).toBe(false)
    })
  })

  describe('branch', () => {
    it('parses branch output correctly', async () => {
      makeExecFileSuccess('* main\n  feature/new-feature\n  remotes/origin/main')

      const result = await git.branch('/fake/repo')

      expect(result.current).toBe('main')
      expect(result.branches).toContain('main')
      expect(result.branches).toContain('feature/new-feature')
    })

    it('handles detached HEAD state', async () => {
      makeExecFileSuccess('* (HEAD detached at abc1234)\n  main')

      const result = await git.branch('/fake/repo')

      expect(result.current).toBe('(HEAD detached at abc1234)')
      expect(result.branches).toContain('main')
    })
  })

  describe('checkout', () => {
    it('checks out an existing branch', async () => {
      makeExecFileSuccess('Switched to branch main')

      const result = await git.checkout('/fake/repo', 'main')

      expect(result.stdout).toBe('Switched to branch main')
      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['checkout', 'main'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('creates and checks out a new branch with -b flag', async () => {
      makeExecFileSuccess('Switched to a new branch feature')

      await git.checkout('/fake/repo', 'feature', true)

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['checkout', '-b', 'feature'],
        expect.any(Object),
        expect.any(Function)
      )
    })
  })

  describe('add', () => {
    it('stages all files with -A when no files specified', async () => {
      makeExecFileSuccess('')

      const result = await git.add('/fake/repo')

      expect(result.stdout).toBe('')
      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['add', '-A'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('stages specific files when provided', async () => {
      makeExecFileSuccess('')

      await git.add('/fake/repo', ['src/index.ts', 'src/utils.ts'])

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['add', 'src/index.ts', 'src/utils.ts'],
        expect.any(Object),
        expect.any(Function)
      )
    })
  })

  describe('commit', () => {
    it('creates a commit with message', async () => {
      makeExecFileSuccess('[main abc1234] Fix bug')

      const result = await git.commit('/fake/repo', 'Fix bug')

      expect(result.success).toBe(true)
      expect(result.hash).toBe('abc1234')
      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['commit', '-m', 'Fix bug'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('uses -a flag when all option is true', async () => {
      makeExecFileSuccess('[main def5678] Refactor')

      await git.commit('/fake/repo', 'Refactor', { all: true })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['commit', '-a', '-m', 'Refactor'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('uses --amend flag when amend option is true', async () => {
      makeExecFileSuccess('[main def5678] Amend')

      await git.commit('/fake/repo', 'Amend', { amend: true })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['commit', '--amend', '-m', 'Amend'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('returns error on failure', async () => {
      makeExecFileError('nothing to commit')

      const result = await git.commit('/fake/repo', 'Message')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Git error')
    })
  })

  describe('push', () => {
    it('pushes to default remote', async () => {
      makeExecFileSuccess('Everything up-to-date')

      const result = await git.push('/fake/repo')

      expect(result.success).toBe(true)
      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['push'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('pushes with force and branch', async () => {
      makeExecFileSuccess('Force push succeeded')

      await git.push('/fake/repo', { force: true, remote: 'origin', branch: 'main' })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['push', '--force', 'origin', 'main'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('returns error on failure', async () => {
      makeExecFileError('failed to push')

      const result = await git.push('/fake/repo')

      expect(result.success).toBe(false)
    })
  })

  describe('pull', () => {
    it('pulls with rebase', async () => {
      makeExecFileSuccess('Updating...')

      await git.pull('/fake/repo', { rebase: true })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['pull', '--rebase'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('pulls with remote and branch', async () => {
      makeExecFileSuccess('Already up to date')

      await git.pull('/fake/repo', { remote: 'origin', branch: 'main' })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['pull', 'origin', 'main'],
        expect.any(Object),
        expect.any(Function)
      )
    })
  })

  describe('diff', () => {
    it('returns diff output', async () => {
      makeExecFileSuccess('--- a/file\n+++ b/file\n@@ -1 +1 @@\n-old\n+new')

      const result = await git.diff('/fake/repo')

      expect(result).toContain('--- a/file')
    })

    it('uses --cached for staged diff', async () => {
      makeExecFileSuccess('')

      await git.diff('/fake/repo', { staged: true })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['diff', '--cached'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('limits diff to a specific path', async () => {
      makeExecFileSuccess('')

      await git.diff('/fake/repo', { path: 'src/index.ts' })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['diff', '--', 'src/index.ts'],
        expect.any(Object),
        expect.any(Function)
      )
    })
  })

  describe('log', () => {
    it('returns parsed log entries', async () => {
      makeExecFileSuccess(
        'abc123|John Doe|john@test.com|2024-01-15T10:00:00Z|Initial commit| (HEAD -> main)'
      )

      const result = await git.log('/fake/repo', { maxCount: 10 })

      expect(result).toHaveLength(1)
      expect(result[0].hash).toBe('abc123')
      expect(result[0].author).toBe('John Doe')
      expect(result[0].email).toBe('john@test.com')
      expect(result[0].date).toBe('2024-01-15T10:00:00Z')
      expect(result[0].message).toBe('Initial commit')
      expect(result[0].refs).toBe(' (HEAD -> main)')
    })

    it('returns empty array when no output', async () => {
      makeExecFileSuccess('')

      const result = await git.log('/fake/repo')

      expect(result).toEqual([])
    })

    it('passes maxCount option', async () => {
      makeExecFileSuccess('')

      await git.log('/fake/repo', { maxCount: 5 })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['log', '--format=%H|%an|%ae|%aI|%s|%d', '--max-count=5'],
        expect.any(Object),
        expect.any(Function)
      )
    })
  })

  describe('fetch', () => {
    it('fetches from remote', async () => {
      makeExecFileSuccess('Fetching origin')

      const result = await git.fetch('/fake/repo')

      expect(result.stdout).toBe('Fetching origin')
      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['fetch'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('fetches with prune option', async () => {
      makeExecFileSuccess('')

      await git.fetch('/fake/repo', { prune: true })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['fetch', '--prune'],
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('fetches with specific remote', async () => {
      makeExecFileSuccess('')

      await git.fetch('/fake/repo', { remote: 'origin' })

      expect(mockExecFile).toHaveBeenCalledWith(
        'git',
        ['fetch', 'origin'],
        expect.any(Object),
        expect.any(Function)
      )
    })
  })

  describe('commit hash extraction', () => {
    it('extracts hash from simple branch names', async () => {
      makeExecFileSuccess('[main abc1234] Add new feature')

      const result = await git.commit('/fake/repo', 'Add new feature')

      expect(result.success).toBe(true)
      expect(result.hash).toBe('abc1234')
    })

    it('returns undefined hash for branch names with hyphens (regex limitation)', async () => {
      // The regex /\[[\w/]+ ([a-f0-9]+)\]/ doesn't match hyphens in branch names
      makeExecFileSuccess('[feature/my-feature abc1234] Add new feature')

      const result = await git.commit('/fake/repo', 'Add new feature')

      expect(result.success).toBe(true)
      expect(result.hash).toBeUndefined()
    })
  })
})
