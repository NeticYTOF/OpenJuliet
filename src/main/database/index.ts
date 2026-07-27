/**
 * SQLite Database Module
 *
 * Provides a persistent SQLite database for OpenJuliet using sql.js.
 * Stores all app data — projects, tasks, execution logs, settings,
 * GitHub auth, provider configs, conversations, and cache.
 *
 * The database file is kept in the Electron userData directory.
 *
 * @module database
 */

import { app } from 'electron'
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import { promises as fs } from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Project {
  id: string
  name: string
  path: string
  description: string | null
  repoUrl: string | null
  defaultBranch: string | null
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string | null
  status: 'pending' | 'analyzing' | 'planning' | 'implementing' | 'testing' | 'reviewing' | 'committing' | 'done' | 'failed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  stage: string | null
  prUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ExecutionLog {
  id: string
  taskId: string
  command: string
  cwd: string
  exitCode: number | null
  stdout: string
  stderr: string
  duration: number
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  finishedAt: string | null
}

export interface ProviderConfigRecord {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  models: string
  type: string
  isActive: number
}

export interface GitHubAuthRecord {
  id: number
  token: string
  type: string
  username: string | null
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  providerId: string
  model: string
  messages: string
  createdAt: string
  updatedAt: string
}

export interface CacheEntry {
  key: string
  value: string
  expiresAt: number | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Schema definition
// ---------------------------------------------------------------------------

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  default_branch TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  stage TEXT,
  pr_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS execution_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  command TEXT NOT NULL,
  cwd TEXT NOT NULL,
  exit_code INTEGER,
  stdout TEXT NOT NULL DEFAULT '',
  stderr TEXT NOT NULL DEFAULT '',
  duration REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS github_auth (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'pat',
  username TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS provider_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL DEFAULT '',
  models TEXT NOT NULL DEFAULT '[]',
  type TEXT NOT NULL DEFAULT 'custom',
  is_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  provider_id TEXT NOT NULL,
  model TEXT NOT NULL,
  messages TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_execution_logs_task ON execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
`

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let db: SqlJsDatabase | null = null
let dbPath: string = ''

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Initialise the database: create the file if it doesn't exist, load it,
 * and run all migrations.
 *
 * @param customPath - Optional custom path for the database file. Defaults to
 *                     app.getPath('userData') + '/openjuliet.db'.
 */
export async function init(customPath?: string): Promise<void> {
  const userDataPath = customPath ?? path.join(app.getPath('userData'), 'openjuliet.db')
  dbPath = userDataPath

  const SQL = await initSqlJs()

  // Ensure directory exists
  await fs.mkdir(path.dirname(dbPath), { recursive: true })

  try {
    // Try to load existing database
    const buffer = await fs.readFile(dbPath)
    db = new SQL.Database(buffer)
  } catch {
    // File doesn't exist — create a new database
    db = new SQL.Database()
  }

  // Run migrations
  await migrate()
}

/**
 * Run database migrations (idempotent — uses IF NOT EXISTS).
 */
export async function migrate(): Promise<void> {
  if (!db) throw new Error('Database not initialised. Call init() first.')
  db.run(SCHEMA_SQL)
  db.run('PRAGMA journal_mode=WAL;')
  db.run('PRAGMA foreign_keys=ON;')
  save()
}

/**
 * Persist the in-memory database to disk.
 */
export function save(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFile(dbPath, buffer).catch((err) => {
    console.error('[database] Failed to write database file:', err)
  })
}

/**
 * Close the database connection.
 */
export function close(): void {
  if (db) {
    save()
    db.close()
    db = null
  }
}

// ---------------------------------------------------------------------------
// Raw query
// ---------------------------------------------------------------------------

/**
 * Execute a raw SQL query with optional parameters.
 * For SELECT queries, returns an array of row objects.
 * For other queries, returns the number of rows affected.
 *
 * @param sql    - The SQL statement.
 * @param params - Optional positional parameters ($1, $2...) or named (:name).
 */
export function query(
  sql: string,
  params?: Record<string, unknown> | unknown[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] | number {
  if (!db) throw new Error('Database not initialised. Call init() first.')

  const isSelect = sql.trim().toUpperCase().startsWith('SELECT')
  const stmt = db.prepare(sql)

  try {
    // Bind parameters
    if (params) {
      if (Array.isArray(params)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stmt.bind(params as any[])
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stmt.bind(params as any)
      }
    }

    if (isSelect) {
      const rows: Record<string, unknown>[] = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject())
      }
      return rows
    }

    // For non-SELECT queries, execute and return affected count
    stmt.step()
    const changes = db.getRowsModified()
    save()
    return changes
  } finally {
    stmt.free()
  }
}

// ---------------------------------------------------------------------------
// Settings CRUD
// ---------------------------------------------------------------------------

/**
 * Get a setting value by key.
 *
 * @param key - The setting key.
 * @returns The value as a string, or null if not found.
 */
export function getSetting(key: string): string | null {
  const rows = query('SELECT value FROM settings WHERE key = $key', {
    $key: key
  }) as { value: string }[]
  return rows.length > 0 ? rows[0].value : null
}

/**
 * Set a setting value.
 *
 * @param key   - The setting key.
 * @param value - The value to store.
 */
export function setSetting(key: string, value: string): void {
  query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ($key, $value, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = $value, updated_at = datetime('now')`,
    { $key: key, $value: value }
  )
}

/**
 * Delete a setting.
 */
export function deleteSetting(key: string): void {
  query('DELETE FROM settings WHERE key = $key', { $key: key })
}

/**
 * Get all settings as a flat object.
 */
export function getAllSettings(): Record<string, string> {
  const rows = query('SELECT key, value FROM settings') as {
    key: string
    value: string
  }[]
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

// ---------------------------------------------------------------------------
// Projects CRUD
// ---------------------------------------------------------------------------

export function listProjects(): Project[] {
  const rows = query(
    `SELECT id, name, path, description, repo_url, default_branch,
            created_at, updated_at
     FROM projects ORDER BY updated_at DESC`
  ) as Record<string, unknown>[]
  return rows.map(mapProject)
}

export function getProject(id: string): Project | null {
  const rows = query(
    `SELECT id, name, path, description, repo_url, default_branch,
            created_at, updated_at
     FROM projects WHERE id = $id`,
    { $id: id }
  ) as Record<string, unknown>[]
  return rows.length > 0 ? mapProject(rows[0]) : null
}

export function createProject(
  project: Omit<Project, 'createdAt' | 'updatedAt'>
): void {
  query(
    `INSERT INTO projects (id, name, path, description, repo_url, default_branch)
     VALUES ($id, $name, $path, $description, $repoUrl, $defaultBranch)`,
    {
      $id: project.id,
      $name: project.name,
      $path: project.path,
      $description: project.description ?? null,
      $repoUrl: project.repoUrl ?? null,
      $defaultBranch: project.defaultBranch ?? null
    }
  )
}

export function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>
): void {
  const fields: string[] = []
  const params: Record<string, unknown> = { $id: id }

  if (updates.name !== undefined) {
    fields.push('name = $name')
    params.$name = updates.name
  }
  if (updates.path !== undefined) {
    fields.push('path = $path')
    params.$path = updates.path
  }
  if (updates.description !== undefined) {
    fields.push('description = $description')
    params.$description = updates.description
  }
  if (updates.repoUrl !== undefined) {
    fields.push('repo_url = $repoUrl')
    params.$repoUrl = updates.repoUrl
  }
  if (updates.defaultBranch !== undefined) {
    fields.push('default_branch = $defaultBranch')
    params.$defaultBranch = updates.defaultBranch
  }

  if (fields.length === 0) return

  fields.push("updated_at = datetime('now')")
  query(
    `UPDATE projects SET ${fields.join(', ')} WHERE id = $id`,
    params
  )
}

export function deleteProject(id: string): void {
  query('DELETE FROM projects WHERE id = $id', { $id: id })
}

// ---------------------------------------------------------------------------
// Tasks CRUD
// ---------------------------------------------------------------------------

export function listTasks(projectId?: string): Task[] {
  let sql = `SELECT id, project_id, title, description, status, priority, stage,
                    pr_url, created_at, updated_at
             FROM tasks`
  const params: Record<string, unknown> = {}

  if (projectId) {
    sql += ' WHERE project_id = $projectId'
    params.$projectId = projectId
  }

  sql += ' ORDER BY created_at DESC'
  const rows = query(sql, params) as Record<string, unknown>[]
  return rows.map(mapTask)
}

export function getTask(id: string): Task | null {
  const rows = query(
    `SELECT id, project_id, title, description, status, priority, stage,
            pr_url, created_at, updated_at
     FROM tasks WHERE id = $id`,
    { $id: id }
  ) as Record<string, unknown>[]
  return rows.length > 0 ? mapTask(rows[0]) : null
}

export function createTask(
  task: Omit<Task, 'createdAt' | 'updatedAt'>
): void {
  query(
    `INSERT INTO tasks (id, project_id, title, description, status, priority, stage)
     VALUES ($id, $projectId, $title, $description, $status, $priority, $stage)`,
    {
      $id: task.id,
      $projectId: task.projectId,
      $title: task.title,
      $description: task.description ?? null,
      $status: task.status,
      $priority: task.priority,
      $stage: task.stage ?? null
    }
  )
}

export function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>
): void {
  const fields: string[] = []
  const params: Record<string, unknown> = { $id: id }

  const fieldMap: Record<string, string> = {
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    stage: 'stage',
    prUrl: 'pr_url'
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if ((updates as Record<string, unknown>)[key] !== undefined) {
      fields.push(`${col} = $${key}`)
      params[`$${key}`] = (updates as Record<string, unknown>)[key]
    }
  }

  if (fields.length === 0) return

  fields.push("updated_at = datetime('now')")
  query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = $id`, params)
}

export function deleteTask(id: string): void {
  query('DELETE FROM tasks WHERE id = $id', { $id: id })
}

// ---------------------------------------------------------------------------
// Execution Logs CRUD
// ---------------------------------------------------------------------------

export function listExecutionLogs(taskId?: string): ExecutionLog[] {
  let sql = `SELECT id, task_id, command, cwd, exit_code, stdout, stderr,
                    duration, status, started_at, finished_at
             FROM execution_logs`
  const params: Record<string, unknown> = {}

  if (taskId) {
    sql += ' WHERE task_id = $taskId'
    params.$taskId = taskId
  }

  sql += ' ORDER BY started_at DESC'
  const rows = query(sql, params) as Record<string, unknown>[]
  return rows.map(mapExecutionLog)
}

export function createExecutionLog(
  log: Omit<ExecutionLog, 'startedAt' | 'finishedAt'>
): void {
  query(
    `INSERT INTO execution_logs (id, task_id, command, cwd, exit_code, stdout, stderr, duration, status, started_at)
     VALUES ($id, $taskId, $command, $cwd, $exitCode, $stdout, $stderr, $duration, $status, datetime('now'))`,
    {
      $id: log.id,
      $taskId: log.taskId,
      $command: log.command,
      $cwd: log.cwd,
      $exitCode: log.exitCode ?? null,
      $stdout: log.stdout,
      $stderr: log.stderr,
      $duration: log.duration ?? 0,
      $status: log.status
    }
  )
}

export function updateExecutionLog(
  id: string,
  updates: Partial<Omit<ExecutionLog, 'id' | 'startedAt' | 'finishedAt'>>
): void {
  const fields: string[] = []
  const params: Record<string, unknown> = { $id: id }

  const fieldMap: Record<string, string> = {
    exitCode: 'exit_code',
    stdout: 'stdout',
    stderr: 'stderr',
    duration: 'duration',
    status: 'status'
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if ((updates as Record<string, unknown>)[key] !== undefined) {
      fields.push(`${col} = $${key}`)
      params[`$${key}`] = (updates as Record<string, unknown>)[key]
    }
  }

  if (updates.status === 'completed' || updates.status === 'failed' || updates.status === 'cancelled') {
    fields.push("finished_at = datetime('now')")
  }

  if (fields.length === 0) return
  query(`UPDATE execution_logs SET ${fields.join(', ')} WHERE id = $id`, params)
}

// ---------------------------------------------------------------------------
// Provider Configs CRUD
// ---------------------------------------------------------------------------

export function listProviderConfigs(): ProviderConfigRecord[] {
  const rows = query(
    'SELECT id, name, base_url, api_key, models, type, is_active FROM provider_configs'
  ) as Record<string, unknown>[]
  return rows.map(mapProviderConfig)
}

export function upsertProviderConfig(
  config: Omit<ProviderConfigRecord, 'isActive'> & { isActive: boolean }
): void {
  query(
    `INSERT INTO provider_configs (id, name, base_url, api_key, models, type, is_active)
     VALUES ($id, $name, $baseUrl, $apiKey, $models, $type, $isActive)
     ON CONFLICT(id) DO UPDATE SET
       name = $name, base_url = $baseUrl, api_key = $apiKey,
       models = $models, type = $type, is_active = $isActive`,
    {
      $id: config.id,
      $name: config.name,
      $baseUrl: config.baseUrl,
      $apiKey: config.apiKey,
      $models: config.models,
      $type: config.type,
      $isActive: config.isActive ? 1 : 0
    }
  )
}

export function deleteProviderConfig(id: string): void {
  query('DELETE FROM provider_configs WHERE id = $id', { $id: id })
}

// ---------------------------------------------------------------------------
// GitHub Auth CRUD
// ---------------------------------------------------------------------------

export function getGitHubAuth(): GitHubAuthRecord | null {
  const rows = query(
    'SELECT id, token, type, username, created_at FROM github_auth ORDER BY id DESC LIMIT 1'
  ) as Record<string, unknown>[]
  return rows.length > 0 ? mapGitHubAuth(rows[0]) : null
}

export function saveGitHubAuth(
  token: string,
  type: string,
  username?: string
): void {
  query('DELETE FROM github_auth') // Keep only one auth record
  query(
    `INSERT INTO github_auth (token, type, username)
     VALUES ($token, $type, $username)`,
    { $token: token, $type: type, $username: username ?? null }
  )
}

export function clearGitHubAuth(): void {
  query('DELETE FROM github_auth')
}

// ---------------------------------------------------------------------------
// Conversations CRUD
// ---------------------------------------------------------------------------

export function listConversations(): Conversation[] {
  const rows = query(
    `SELECT id, title, provider_id, model, messages, created_at, updated_at
     FROM conversations ORDER BY updated_at DESC`
  ) as Record<string, unknown>[]
  return rows.map(mapConversation)
}

export function getConversation(id: string): Conversation | null {
  const rows = query(
    `SELECT id, title, provider_id, model, messages, created_at, updated_at
     FROM conversations WHERE id = $id`,
    { $id: id }
  ) as Record<string, unknown>[]
  return rows.length > 0 ? mapConversation(rows[0]) : null
}

export function createConversation(
  conv: Omit<Conversation, 'createdAt' | 'updatedAt'>
): void {
  query(
    `INSERT INTO conversations (id, title, provider_id, model, messages)
     VALUES ($id, $title, $providerId, $model, $messages)`,
    {
      $id: conv.id,
      $title: conv.title,
      $providerId: conv.providerId,
      $model: conv.model,
      $messages: conv.messages
    }
  )
}

export function updateConversation(
  id: string,
  updates: Partial<Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>>
): void {
  const fields: string[] = []
  const params: Record<string, unknown> = { $id: id }

  const fieldMap: Record<string, string> = {
    title: 'title',
    providerId: 'provider_id',
    model: 'model',
    messages: 'messages'
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if ((updates as Record<string, unknown>)[key] !== undefined) {
      fields.push(`${col} = $${key}`)
      params[`$${key}`] = (updates as Record<string, unknown>)[key]
    }
  }

  if (fields.length === 0) return
  fields.push("updated_at = datetime('now')")
  query(`UPDATE conversations SET ${fields.join(', ')} WHERE id = $id`, params)
}

export function deleteConversation(id: string): void {
  query('DELETE FROM conversations WHERE id = $id', { $id: id })
}

// ---------------------------------------------------------------------------
// Cache CRUD
// ---------------------------------------------------------------------------

export function getCached(key: string): string | null {
  const rows = query(
    `SELECT value FROM cache
     WHERE key = $key AND (expires_at IS NULL OR expires_at > strftime('%s','now'))`,
    { $key: key }
  ) as { value: string }[]
  return rows.length > 0 ? rows[0].value : null
}

export function setCache(
  key: string,
  value: string,
  ttlSeconds?: number
): void {
  const expiresAt = ttlSeconds
    ? Math.floor(Date.now() / 1000) + ttlSeconds
    : null
  query(
    `INSERT INTO cache (key, value, expires_at)
     VALUES ($key, $value, $expiresAt)
     ON CONFLICT(key) DO UPDATE SET
       value = $value, expires_at = $expiresAt, created_at = datetime('now')`,
    { $key: key, $value: value, $expiresAt: expiresAt }
  )
}

export function clearExpiredCache(): void {
  query("DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at <= strftime('%s','now')")
}

export function clearAllCache(): void {
  query('DELETE FROM cache')
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    path: row.path as string,
    description: row.description as string | null,
    repoUrl: row.repo_url as string | null,
    defaultBranch: row.default_branch as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    title: row.title as string,
    description: row.description as string | null,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    stage: row.stage as string | null,
    prUrl: row.pr_url as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

function mapExecutionLog(row: Record<string, unknown>): ExecutionLog {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    command: row.command as string,
    cwd: row.cwd as string,
    exitCode: row.exit_code as number | null,
    stdout: row.stdout as string,
    stderr: row.stderr as string,
    duration: row.duration as number,
    status: row.status as ExecutionLog['status'],
    startedAt: row.started_at as string,
    finishedAt: row.finished_at as string | null
  }
}

function mapProviderConfig(row: Record<string, unknown>): ProviderConfigRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    baseUrl: row.base_url as string,
    apiKey: row.api_key as string,
    models: row.models as string,
    type: row.type as string,
    isActive: row.is_active as number
  }
}

function mapGitHubAuth(row: Record<string, unknown>): GitHubAuthRecord {
  return {
    id: row.id as number,
    token: row.token as string,
    type: row.type as string,
    username: row.username as string | null,
    createdAt: row.created_at as string
  }
}

function mapConversation(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    title: row.title as string,
    providerId: row.provider_id as string,
    model: row.model as string,
    messages: row.messages as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}