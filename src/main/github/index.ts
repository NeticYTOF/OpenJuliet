/**
 * GitHub Integration Module
 *
 * Provides a unified interface for GitHub API operations using Octokit.
 * Supports both Personal Access Token (PAT) and OAuth token authentication.
 *
 * @module github
 */

import { Octokit } from 'octokit'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GitHubAuthState {
  token: string
  type: 'pat' | 'oauth'
  username?: string
}

export interface GitHubRepo {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  private: boolean
  fork: boolean
  defaultBranch: string
  language: string | null
  stars: number
  forks: number
  openIssues: number
  updatedAt: string
  createdAt: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  author: string | null
  labels: string[]
  assignees: string[]
  createdAt: string
  updatedAt: string
  url: string
}

export interface GitHubPR {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed' | 'merged'
  author: string | null
  baseBranch: string
  headBranch: string
  mergeable: boolean | null
  draft: boolean
  createdAt: string
  updatedAt: string
  url: string
}

export interface GitHubBranch {
  name: string
  commitSha: string
  protected: boolean
}

export interface GitHubContent {
  path: string
  content: string | null
  encoding: string
  size: number
  type: 'file' | 'dir' | 'symlink' | 'submodule'
}

export interface CreatePROptions {
  owner: string
  repo: string
  title: string
  head: string
  base: string
  body?: string
  draft?: boolean
}

export interface CreateIssueOptions {
  owner: string
  repo: string
  title: string
  body?: string
  labels?: string[]
  assignees?: string[]
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let octokit: Octokit | null = null
let authState: GitHubAuthState | null = null

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Ensures the client is authenticated before proceeding.
 * @throws {Error} If no token has been provided via authenticate().
 */
function ensureClient(): Octokit {
  if (!octokit) {
    throw new Error(
      'GitHub client is not authenticated. Call authenticate(token) first.'
    )
  }
  return octokit
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Authenticate with GitHub using a PAT or OAuth token.
 *
 * @param token    - GitHub personal access token or OAuth token.
 * @param type     - 'pat' (default) or 'oauth'.
 * @param username - Optional username to associate with this auth state.
 */
export function authenticate(
  token: string,
  type: 'pat' | 'oauth' = 'pat',
  username?: string
): void {
  octokit = new Octokit({ auth: token })
  authState = { token, type, username }
}

/**
 * Returns the current authentication state, or null if not authenticated.
 */
export function getAuthState(): GitHubAuthState | null {
  return authState
}

/**
 * Clear the current authentication state.
 */
export function clearAuth(): void {
  octokit = null
  authState = null
}

/**
 * Fetch the authenticated user's repositories.
 *
 * @param options - Optional filters (type, sort, direction, perPage).
 * @returns A list of repositories.
 */
export async function listRepos(options?: {
  type?: 'all' | 'owner' | 'public' | 'private' | 'member'
  sort?: 'created' | 'updated' | 'pushed' | 'full_name'
  direction?: 'asc' | 'desc'
  perPage?: number
}): Promise<GitHubRepo[]> {
  const client = ensureClient()
  const { data } = await client.rest.repos.listForAuthenticatedUser({
    type: options?.type ?? 'all',
    sort: options?.sort ?? 'updated',
    direction: options?.direction ?? 'desc',
    per_page: options?.perPage ?? 100
  })
  return mapRepos(data)
}

/**
 * Get a single repository by owner and name.
 */
export async function getRepo(
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const client = ensureClient()
  const { data } = await client.rest.repos.get({ owner, repo })
  return mapRepo(data)
}

/**
 * List issues for a repository.
 *
 * @param owner - Repository owner.
 * @param repo  - Repository name.
 * @param state - 'open', 'closed', or 'all' (default: 'open').
 */
export async function listIssues(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubIssue[]> {
  const client = ensureClient()
  const { data } = await client.rest.issues.listForRepo({
    owner,
    repo,
    state,
    per_page: 100
  })
  return data.map(mapIssue)
}

/**
 * Get a single issue by number.
 */
export async function getIssue(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GitHubIssue> {
  const client = ensureClient()
  const { data } = await client.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber
  })
  return mapIssue(data)
}

/**
 * Create a new issue in a repository.
 */
export async function createIssue(
  options: CreateIssueOptions
): Promise<GitHubIssue> {
  const client = ensureClient()
  const { data } = await client.rest.issues.create({
    owner: options.owner,
    repo: options.repo,
    title: options.title,
    body: options.body,
    labels: options.labels,
    assignees: options.assignees
  })
  return mapIssue(data)
}

/**
 * Create a pull request.
 */
export async function createPR(options: CreatePROptions): Promise<GitHubPR> {
  const client = ensureClient()
  const { data } = await client.rest.pulls.create({
    owner: options.owner,
    repo: options.repo,
    title: options.title,
    head: options.head,
    base: options.base,
    body: options.body,
    draft: options.draft ?? false
  })
  return mapPR(data)
}

/**
 * List pull requests for a repository.
 *
 * @param owner - Repository owner.
 * @param repo  - Repository name.
 * @param state - 'open', 'closed', or 'all' (default: 'open').
 */
export async function listPRs(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubPR[]> {
  const client = ensureClient()
  const { data } = await client.rest.pulls.list({
    owner,
    repo,
    state,
    per_page: 100
  })
  return data.map(mapPR)
}

/**
 * Get a single pull request by number.
 */
export async function getPR(
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPR> {
  const client = ensureClient()
  const { data } = await client.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  })
  return mapPR(data)
}

/**
 * Add a comment to an issue or pull request.
 */
export async function addComment(
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<void> {
  const client = ensureClient()
  await client.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  })
}

/**
 * List branches in a repository.
 */
export async function listBranches(
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  const client = ensureClient()
  const { data } = await client.rest.repos.listBranches({
    owner,
    repo,
    per_page: 100
  })
  return data.map((b: { name: string; commit: { sha: string }; protected: boolean }) => ({
    name: b.name,
    commitSha: b.commit.sha,
    protected: b.protected
  }))
}

/**
 * Get the contents of a file or directory from a repository.
 *
 * @param owner - Repository owner.
 * @param repo  - Repository name.
 * @param path  - Path to the file/directory.
 * @param ref   - Optional branch, tag, or commit SHA.
 */
export async function getContents(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<GitHubContent | GitHubContent[]> {
  const client = ensureClient()
  const { data } = await client.rest.repos.getContent({
    owner,
    repo,
    path,
    ref
  })

  // Octokit returns an array when the path is a directory
  if (Array.isArray(data)) {
    return data.map(mapContent)
  }

  return mapContent(data as Record<string, unknown>)
}

// ---------------------------------------------------------------------------
// Mappers (normalise Octokit response shapes to our types)
// ---------------------------------------------------------------------------

function mapRepo(r: Record<string, unknown>): GitHubRepo {
  return {
    id: r.id as number,
    name: r.name as string,
    fullName: r.full_name as string,
    description: (r.description as string) ?? null,
    url: r.html_url as string,
    private: r.private as boolean,
    fork: r.fork as boolean,
    defaultBranch: r.default_branch as string,
    language: (r.language as string) ?? null,
    stars: (r.stargazers_count as number) ?? 0,
    forks: (r.forks_count as number) ?? 0,
    openIssues: (r.open_issues_count as number) ?? 0,
    updatedAt: r.updated_at as string,
    createdAt: r.created_at as string
  }
}

function mapRepos(data: Record<string, unknown>[]): GitHubRepo[] {
  return data.map(mapRepo)
}

function mapIssue(i: Record<string, unknown>): GitHubIssue {
  return {
    id: i.id as number,
    number: i.number as number,
    title: i.title as string,
    body: (i.body as string) ?? null,
    state: i.state as 'open' | 'closed',
    author: (i.user as Record<string, unknown> | null)?.login as string ?? null,
    labels: ((i.labels as Record<string, unknown>[]) ?? []).map(
      (l: Record<string, unknown>) => l.name as string
    ),
    assignees: ((i.assignees as Record<string, unknown>[]) ?? []).map(
      (a: Record<string, unknown>) => a.login as string
    ),
    createdAt: i.created_at as string,
    updatedAt: i.updated_at as string,
    url: i.html_url as string
  }
}

function mapPR(pr: Record<string, unknown>): GitHubPR {
  return {
    id: pr.id as number,
    number: pr.number as number,
    title: pr.title as string,
    body: (pr.body as string) ?? null,
    state: pr.merged_at
      ? 'merged'
      : (pr.state as 'open' | 'closed'),
    author: (pr.user as Record<string, unknown> | null)?.login as string ?? null,
    baseBranch: (pr.base as Record<string, unknown>).ref as string,
    headBranch: (pr.head as Record<string, unknown>).ref as string,
    mergeable: (pr.mergeable as boolean | null) ?? null,
    draft: (pr.draft as boolean) ?? false,
    createdAt: pr.created_at as string,
    updatedAt: pr.updated_at as string,
    url: pr.html_url as string
  }
}

function mapContent(
  c: Record<string, unknown>
): GitHubContent {
  return {
    path: c.path as string,
    content: (c.content as string) ?? null,
    encoding: c.encoding as string,
    size: c.size as number,
    type: c.type as 'file' | 'dir' | 'symlink' | 'submodule'
  }
}