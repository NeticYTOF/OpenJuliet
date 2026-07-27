/**
 * Execution Sandbox Module
 *
 * Provides a sandboxed environment for executing shell commands safely.
 * Supports optional Docker-based sandboxing for enhanced isolation.
 *
 * Each sandbox instance manages a working directory and tracks spawned
 * child processes for cancellation and lifecycle management.
 *
 * @module sandbox
 */

import { spawn, type ChildProcess } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SandboxOptions {
  /** Working directory for the sandbox */
  dir: string
  /** Whether to enable Docker-based sandboxing (optional) */
  useDocker?: boolean
  /** Docker image to use (default: 'ubuntu:22.04') */
  dockerImage?: string
  /** Timeout in milliseconds for each command (default: 300_000 / 5 min) */
  timeout?: number
  /** Environment variables to set */
  env?: Record<string, string>
}

export interface ExecutionResult {
  id: string
  exitCode: number | null
  stdout: string
  stderr: string
  duration: number
  cancelled: boolean
  timedOut: boolean
}

export type OutputCallback = (data: { type: 'stdout' | 'stderr'; text: string }) => void

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface RunningProcess {
  id: string
  process: ChildProcess
  startTime: number
  cancelled: boolean
}

const runningProcesses: Map<string, RunningProcess> = new Map()
const sandboxDirs: Set<string> = new Set()

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Check if Docker is available on this system.
 */
async function isDockerAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('docker', ['info'], {
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: 5000
    })
    proc.on('exit', (code) => resolve(code === 0))
    proc.on('error', () => resolve(false))
  })
}

/**
 * Execute a command in a Docker container.
 */
async function executeInDocker(
  cmd: string,
  cwd: string,
  options: SandboxOptions,
  onOutput?: OutputCallback
): Promise<ExecutionResult> {
  const id = randomUUID()
  const image = options.dockerImage ?? 'ubuntu:22.04'
  const timeout = options.timeout ?? 300_000
  const startTime = Date.now()

  return new Promise((resolve) => {
    const containerName = `openjuliet-sandbox-${id.slice(0, 8)}`

    // Mount the working directory into the container
    const proc = spawn('docker', [
      'run',
      '--rm',
      '--name', containerName,
      '-v', `${cwd}:/workspace`,
      '-w', '/workspace',
      image,
      'sh', '-c', cmd
    ], {
      timeout,
      env: { ...process.env, ...options.env }
    })

    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      stdout += text
      onOutput?.({ type: 'stdout', text })
    })

    proc.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      stderr += text
      onOutput?.({ type: 'stderr', text })
    })

    const running: RunningProcess = {
      id,
      process: proc,
      startTime,
      cancelled: false
    }
    runningProcesses.set(id, running)

    proc.on('close', (code) => {
      runningProcesses.delete(id)
      const duration = Date.now() - startTime
      resolve({
        id,
        exitCode: code,
        stdout,
        stderr,
        duration,
        cancelled: running.cancelled,
        timedOut: code === null
      })
    })

    proc.on('error', (err) => {
      runningProcesses.delete(id)
      stderr += `[sandbox] Process error: ${err.message}\n`
      const duration = Date.now() - startTime
      resolve({
        id,
        exitCode: -1,
        stdout,
        stderr,
        duration,
        cancelled: running.cancelled,
        timedOut: false
      })
    })
  })
}

/**
 * Execute a command directly on the host.
 */
function executeDirect(
  cmd: string,
  cwd: string,
  options: SandboxOptions,
  onOutput?: OutputCallback
): Promise<ExecutionResult> {
  const id = randomUUID()
  const timeout = options.timeout ?? 300_000
  const startTime = Date.now()

  return new Promise((resolve) => {
    const proc = spawn('sh', ['-c', cmd], {
      cwd,
      timeout,
      env: { ...process.env, ...options.env },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      stdout += text
      onOutput?.({ type: 'stdout', text })
    })

    proc.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      stderr += text
      onOutput?.({ type: 'stderr', text })
    })

    const running: RunningProcess = {
      id,
      process: proc,
      startTime,
      cancelled: false
    }
    runningProcesses.set(id, running)

    proc.on('close', (code) => {
      runningProcesses.delete(id)
      const duration = Date.now() - startTime
      resolve({
        id,
        exitCode: code,
        stdout,
        stderr,
        duration,
        cancelled: running.cancelled,
        timedOut: code === null && (Date.now() - startTime) >= timeout
      })
    })

    proc.on('error', (err) => {
      runningProcesses.delete(id)
      stderr += `[sandbox] Process error: ${err.message}\n`
      const duration = Date.now() - startTime
      resolve({
        id,
        exitCode: -1,
        stdout,
        stderr,
        duration,
        cancelled: running.cancelled,
        timedOut: false
      })
    })
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new sandbox in the specified directory.
 * Ensures the directory exists and is ready for command execution.
 *
 * @param dir     - The directory for the sandbox.
 * @param options - Optional sandbox configuration.
 * @returns The resolved directory path.
 */
export async function createSandbox(
  dir: string,
  options?: Partial<SandboxOptions>
): Promise<string> {
  const sandboxPath = path.resolve(dir)
  await fs.mkdir(sandboxPath, { recursive: true })
  sandboxDirs.add(sandboxPath)
  return sandboxPath
}

/**
 * Execute a shell command inside the sandbox.
 *
 * If the sandbox was configured with `useDocker: true`, the command runs
 * inside a disposable Docker container. Otherwise it runs directly on the
 * host with the sandbox directory as the working directory.
 *
 * @param cmd      - The shell command to execute.
 * @param cwd      - Working directory (defaults to sandbox dir).
 * @param onOutput - Optional callback for real-time output streaming.
 * @param options  - Override sandbox options for this execution.
 * @returns The execution result.
 */
export async function executeCommand(
  cmd: string,
  cwd: string,
  onOutput?: OutputCallback,
  options?: Partial<SandboxOptions>
): Promise<ExecutionResult> {
  const resolvedCwd = path.resolve(cwd)

  // Ensure directory exists
  await fs.mkdir(resolvedCwd, { recursive: true })

  const opts: SandboxOptions = {
    dir: resolvedCwd,
    timeout: options?.timeout ?? 300_000,
    env: options?.env,
    useDocker: options?.useDocker ?? false,
    dockerImage: options?.dockerImage
  }

  if (opts.useDocker) {
    const dockerAvailable = await isDockerAvailable()
    if (!dockerAvailable) {
      // Fall back to direct execution with a warning
      console.warn('[sandbox] Docker not available, falling back to direct execution')
      return executeDirect(cmd, resolvedCwd, opts, onOutput)
    }
    return executeInDocker(cmd, resolvedCwd, opts, onOutput)
  }

  return executeDirect(cmd, resolvedCwd, opts, onOutput)
}

/**
 * Cancel a running execution by its ID.
 *
 * Sends SIGTERM first, then SIGKILL after a grace period.
 *
 * @param id - The execution ID returned by executeCommand.
 */
export async function cancelExecution(id: string): Promise<void> {
  const running = runningProcesses.get(id)
  if (!running) {
    throw new Error(`No running execution with ID: ${id}`)
  }

  running.cancelled = true

  // Sends SIGTERM on POSIX, or terminates on Windows
  running.process.kill('SIGTERM')

  // Force kill after 3 seconds if still alive
  setTimeout(() => {
    try {
      running.process.kill('SIGKILL')
    } catch {
      // Process already exited
    }
  }, 3000)
}

/**
 * Check if an execution is still running.
 */
export function isRunning(id: string): boolean {
  return runningProcesses.has(id)
}

/**
 * Get the status of a running execution, or null if not found.
 */
export function getExecutionStatus(
  id: string
): { running: boolean; elapsed: number } | null {
  const running = runningProcesses.get(id)
  if (!running) return null
  return {
    running: true,
    elapsed: Date.now() - running.startTime
  }
}

/**
 * List all currently running execution IDs.
 */
export function listRunningExecutions(): string[] {
  return Array.from(runningProcesses.keys())
}

/**
 * Cancel all running executions.
 */
export async function cancelAll(): Promise<void> {
  const ids = Array.from(runningProcesses.keys())
  await Promise.all(ids.map(cancelExecution))
}

/**
 * Destroy the sandbox by cleaning up all running processes.
 * Optionally removes the sandbox directory.
 *
 * @param dir       - The sandbox directory.
 * @param removeDir - Whether to delete the directory (default: false).
 */
export async function destroySandbox(
  dir: string,
  removeDir = false
): Promise<void> {
  const sandboxPath = path.resolve(dir)
  sandboxDirs.delete(sandboxPath)

  // Cancel any processes running in this directory
  Array.from(runningProcesses.entries()).forEach(([id, running]) => {
    if (running.process.spawnargs?.includes(sandboxPath)) {
      cancelExecution(id)
    }
  })

  if (removeDir) {
    await fs.rm(sandboxPath, { recursive: true, force: true })
  }
}