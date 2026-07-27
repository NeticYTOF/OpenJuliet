/**
 * GitHub PR Auto-Generation Module
 *
 * Extends the base GitHub integration with PR-specific features:
 *  - AI-powered PR description generation from commits and diffs
 *  - Reviewer suggestion via git blame
 *  - Issue linking (closes/fixes references in PR body)
 *  - PR type detection (fix, feature, chore, docs, refactor, test)
 *
 * @module github/pr
 */

import { randomUUID } from 'crypto'
import * as github from './index'
import * as git from '../git/index'
import * as providers from '../providers/index'
import type { BrowserWindow } from 'electron'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PRType = 'fix' | 'feature' | 'chore' | 'docs' | 'refactor' | 'test' | 'other'

export interface PRCreationParams {
  owner: string
  repo: string
  title: string
  body: string
  head: string
  base: string
  draft?: boolean
  issueNumbers?: number[]
  reviewers?: string[]
}

export interface PRDescriptionResult {
  title: string
  body: string
  type: PRType
  changelog: string
}

export interface ReviewerSuggestion {
  login: string
  avatarUrl?: string
  contributions: number
  files: string[]
  relevance: number // 0–1
}

export interface PROutline {
  title: string
  body: string
  type: PRType
  linkedIssues: number[]
  warnings: string[]
}

export interface PRCreationProgress {
  step: string
  progress: number // 0–100
  stage: 'analyzing' | 'generating' | 'linking' | 'reviewing' | 'creating'
}

export type ProgressCallback = (progress: PRCreationProgress) => void

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let mainWindowRef: BrowserWindow | null = null

// ---------------------------------------------------------------------------
// IPC event emission
// ---------------------------------------------------------------------------

function emitEvent(event: { type: string; data: Record<string, unknown> }): void {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('pr:event', event)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register the main window reference for sending PR events.
 */
export function setMainWindow(win: BrowserWindow): void {
  mainWindowRef = win
}

/**
 * Create a pull request with auto-generated description and optional
 * issue linking and reviewer suggestions.
 *
 * Emits progress events during generation.
 *
 * @param params         - The core PR parameters (owner, repo, head, base).
 * @param repoPath       - Local repo path (needed for diff/commit analysis).
 * @param onProgress     - Optional callback for progress updates.
 * @returns The created PR, the generated outline, and the suggested reviewers.
 */
export async function createPullRequest(
  params: PRCreationParams,
  repoPath?: string,
  onProgress?: ProgressCallback
): Promise<{
  pr: github.GitHubPR
  outline: PROutline
  reviewers: ReviewerSuggestion[]
}> {
  const emitProgress = (step: string, progress: number, stage: PRCreationProgress['stage']): void => {
    const event: PRCreationProgress = { step, progress, stage }
    onProgress?.(event)
    emitEvent({ type: 'pr:progress', data: event as unknown as Record<string, unknown> })
  }

  // Step 1: Commit messages & diff analysis
  emitProgress('Analyzing commits and changes...', 10, 'analyzing')

  let commitMessages: string[] = []
  let diffContent = ''
  let repoOwner = params.owner
  let repoName = params.repo

  if (repoPath) {
    try {
      // Parse origin remote for owner/repo
      const remotes = await git.fetch(repoPath)
      const originUrl = remotes.stdout
      const parsed = parseRemoteUrl(originUrl)
      if (parsed) {
        repoOwner = parsed.owner
        repoName = parsed.repo
      }

      // Get commit log since branching from base
      const logResult = await git.log(repoPath, { maxCount: 30 })
      commitMessages = logResult.map((entry) => entry.message)

      // Get diff from base branch
      try {
        diffContent = await git.diff(repoPath, { staged: true })
        if (!diffContent) {
          diffContent = await git.diff(repoPath)
        }
      } catch {
        diffContent = ''
      }
    } catch {
      // Non-fatal — proceed without local analysis
    }
  }

  // Step 2: Auto-detect PR type
  emitProgress('Detecting PR type from commits...', 25, 'analyzing')
  const prType = detectPRType(commitMessages)

  // Step 3: Generate title and description via AI
  emitProgress('Generating PR description with AI...', 40, 'generating')
  const { title, body } = await generatePRDescription(
    repoPath ?? '',
    commitMessages,
    diffContent,
    params.title,
    params.body
  )

  // Step 4: Build the outline
  emitProgress('Building PR outline...', 60, 'reviewing')
  const outline: PROutline = {
    title,
    body,
    type: prType,
    linkedIssues: params.issueNumbers ?? [],
    warnings: []
  }

  // Step 5: Add linked issues to body
  if (params.issueNumbers && params.issueNumbers.length > 0) {
    emitProgress('Linking issues...', 70, 'linking')
    outline.body = addLinkedIssues(outline.body, params.issueNumbers)
    outline.linkedIssues = params.issueNumbers
  }

  // Step 6: Get reviewer suggestions
  emitProgress('Suggesting reviewers...', 80, 'linking')
  const reviewers: ReviewerSuggestion[] = repoPath
    ? await suggestReviewers(repoOwner, repoName, repoPath)
    : []

  // Validate
  if (!outline.title.trim()) {
    outline.warnings.push('PR title is empty — a title is required to create the PR.')
  }
  if (!outline.body.trim()) {
    outline.warnings.push('PR body is empty — consider adding a description.')
  }

  // Step 7: Create the PR on GitHub
  emitProgress('Creating pull request on GitHub...', 90, 'creating')
  const finalTitle = outline.title || params.title || 'Automated changes'
  const finalBody = outline.body || params.body || ''

  const pr = await github.createPR({
    owner: repoOwner,
    repo: repoName,
    title: finalTitle,
    head: params.head,
    base: params.base,
    body: finalBody,
    draft: params.draft ?? false
  })

  emitProgress('Pull request created successfully!', 100, 'creating')

  return { pr, outline, reviewers }
}

/**
 * Generate a PR title and description using the active AI provider.
 *
 * Analyzes commit messages and the unified diff to produce a coherent,
 * human-readable description of the changes.
 *
 * @param repoPath       - Local path to the repository (for context).
 * @param commitMessages - Array of recent commit message strings.
 * @param diffContent    - Unified diff output.
 * @param existingTitle  - Optional pre-existing title to refine.
 * @param existingBody   - Optional pre-existing body to refine.
 * @returns An object with the generated title and body.
 */
export async function generatePRDescription(
  repoPath: string,
  commitMessages: string[],
  diffContent: string,
  existingTitle?: string,
  existingBody?: string
): Promise<{ title: string; body: string }> {
  // If we have an existing title and body, use them as-is — the user knows best
  if (existingTitle && existingBody) {
    return { title: existingTitle, body: existingBody }
  }

  const activeProviderId = providers.getActiveProviderId()
  if (!activeProviderId) {
    // Fallback: generate a basic description from commits
    return generateBasicDescription(commitMessages, diffContent, existingTitle, existingBody)
  }

  try {
    const systemPrompt = `You are a senior software engineer writing a pull request description.

Generate a clear, concise PR title and description based on the commit messages and code diff provided.

The title should be short (<72 chars), prefixed with a conventional commit type if applicable:
- \`fix:\` for bug fixes
- \`feat:\` for new features
- \`chore:\` for maintenance/tooling
- \`docs:\` for documentation
- \`refactor:\` for code restructuring
- \`test:\` for test additions/changes

The body should follow this structure:
## Summary
Brief explanation of what this PR does and why.

## Changes
- Bullet list of specific changes

## Testing
How the changes were verified.

Return your response as a JSON object with "title" and "body" fields. Do NOT wrap in markdown fences.`

    const userContent = [
      `## Commit Messages\n\`\`\`\n${commitMessages.slice(0, 20).join('\n')}\n\`\`\``,
      diffContent
        ? `## Diff (truncated to 8000 chars)\n\`\`\`diff\n${diffContent.slice(0, 8000)}\n\`\`\``
        : '## Diff\n(No diff available — likely an empty PR or initial commit.)',
      repoPath ? `## Repository Path: ${repoPath}` : ''
    ]
      .filter(Boolean)
      .join('\n\n')

    const result = await providers.chat(activeProviderId, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ], { temperature: 0.3, maxTokens: 2000 })

    // Try parsing JSON from the response
    try {
      const cleaned = result
        .replace(/```json\s*/gi, '')
        .replace(/```\s*$/g, '')
        .trim()
      const parsed = JSON.parse(cleaned)
      return {
        title: (parsed.title as string)?.trim() || existingTitle || 'Automated changes',
        body: (parsed.body as string)?.trim() || existingBody || ''
      }
    } catch {
      // If JSON parsing fails, use the raw response as body
      return {
        title: existingTitle || generateTitleFromCommits(commitMessages),
        body: result.trim() || existingBody || ''
      }
    }
  } catch {
    // Provider call failed — fallback
    return generateBasicDescription(commitMessages, diffContent, existingTitle, existingBody)
  }
}

/**
 * Suggest reviewers for a PR based on git blame analysis.
 *
 * Examines the files changed in the working tree and uses git blame
 * to identify the top contributors to those files. Results are sorted
 * by contribution count (most relevant first).
 *
 * @param owner    - Repository owner (GitHub).
 * @param repo     - Repository name (GitHub).
 * @param repoPath - Local path to the repository.
 * @returns An array of reviewer suggestions sorted by relevance.
 */
export async function suggestReviewers(
  owner: string,
  repo: string,
  repoPath: string
): Promise<ReviewerSuggestion[]> {
  try {
    // Get list of changed files
    const status = await git.status(repoPath)
    const changedFiles = [
      ...status.staged,
      ...status.unstaged,
      ...status.untracked
    ]

    if (changedFiles.length === 0) {
      return []
    }

    // For each changed file, get git blame to find top contributors
    const blamePromises = changedFiles.slice(0, 20).map(async (file) => {
      try {
        const result = await execGitCommand(
          ['blame', '--porcelain', '--', file],
          repoPath
        )
        return { file, authors: parseBlameAuthors(result) }
      } catch {
        return { file, authors: [] }
      }
    })

    const blameResults = await Promise.all(blamePromises)

    // Aggregate authors across files
    const authorMap = new Map<string, { count: number; files: Set<string> }>()
    for (const { file, authors } of blameResults) {
      for (const author of authors) {
        const existing = authorMap.get(author) ?? { count: 0, files: new Set() }
        existing.count++
        existing.files.add(file)
        authorMap.set(author, existing)
      }
    }

    // Convert to sorted array
    const maxCount = Math.max(1, ...Array.from(authorMap.values()).map((a) => a.count))
    const suggestions: ReviewerSuggestion[] = Array.from(authorMap.entries())
      .map(([login, data]) => ({
        login,
        contributions: data.count,
        files: Array.from(data.files),
        relevance: Math.round((data.count / maxCount) * 100) / 100
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10)

    return suggestions
  } catch {
    // Non-fatal — reviewers are a nice-to-have
    return []
  }
}

/**
 * Add linked issue references to a PR body.
 *
 * Formats issue numbers using GitHub's closing keyword syntax
 * (e.g., "Closes #123, #456") and prepends them to the PR body
 * if they aren't already referenced.
 *
 * @param body         - The PR body text.
 * @param issueNumbers - Array of issue numbers to link.
 * @returns The body with issue links appended.
 */
export function addLinkedIssues(body: string, issueNumbers: number[]): string {
  if (!issueNumbers || issueNumbers.length === 0) return body

  const alreadyReferenced = (num: number): boolean => {
    const refPatterns = [
      new RegExp(`#${num}\\b`),
      new RegExp(`close[s]?\\s+#${num}\\b`, 'i'),
      new RegExp(`fix(e[sd])?\\s+#${num}\\b`, 'i'),
      new RegExp(`resolve[sd]?\\s+#${num}\\b`, 'i')
    ]
    return refPatterns.some((r) => r.test(body))
  }

  const unlinked = issueNumbers.filter((n) => !alreadyReferenced(n))
  if (unlinked.length === 0) return body

  const closingLine = `Closes ${unlinked.map((n) => `#${n}`).join(', ')}`
  return body ? `${body}\n\n---\n\n${closingLine}` : closingLine
}

/**
 * Auto-detect the PR type based on conventional commit prefixes
 * found in the commit messages.
 *
 * Checks each commit message for conventional commit prefixes and
 * returns the most common type. Falls back to 'other' if no
 * conventional prefix is detected.
 *
 * @param commitMessages - Array of commit message strings.
 * @returns The detected PR type.
 */
export function detectPRType(commitMessages: string[]): PRType {
  const patterns: Record<PRType, RegExp> = {
    fix: /^(fix|bugfix|hotfix)[:(]?/i,
    feature: /^(feat|feature)[:(]?/i,
    chore: /^(chore|build|ci|deps)[:(]?/i,
    docs: /^docs?(\(.+\))?[:]?\s/i,
    refactor: /^(refactor|refactoring|rework)[:(]?/i,
    test: /^test(s)?[:(]?/i,
    other: /.*/
  }

  const counts: Record<string, number> = {}
  for (const msg of commitMessages) {
    for (const [type, pattern] of Object.entries(patterns)) {
      if (type === 'other') continue
      if (pattern.test(msg.trim())) {
        counts[type] = (counts[type] ?? 0) + 1
        break
      }
    }
  }

  // Return the type with the most matches
  let bestType: PRType = 'other'
  let bestCount = 0
  for (const [type, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count
      bestType = type as PRType
    }
  }

  return bestType
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generate a basic PR description without AI.
 */
function generateBasicDescription(
  commitMessages: string[],
  diffContent: string,
  existingTitle?: string,
  existingBody?: string
): { title: string; body: string } {
  const title = existingTitle || generateTitleFromCommits(commitMessages)
  const type = detectPRType(commitMessages)
  const typeEmoji: Record<PRType, string> = {
    fix: '🐛',
    feature: '✨',
    chore: '🔧',
    docs: '📝',
    refactor: '♻️',
    test: '✅',
    other: '📦'
  }

  const body = existingBody || [
    `## Summary\n\n${typeEmoji[type]} ${title}`,
    '',
    '## Changes',
    ...commitMessages.slice(0, 15).map((m) => `- ${m}`),
    '',
    diffContent
      ? `## Files Changed\n\n\`\`\`\n${diffContent
          .split('\n')
          .filter((l) => l.startsWith('diff --git'))
          .map((l) => l.replace('diff --git a/', '').replace(' b/', ' → '))
          .join('\n')}\n\`\`\``
      : '',
    '',
    '## Testing\n> How were these changes tested?'
  ]
    .filter(Boolean)
    .join('\n')

  return { title, body }
}

/**
 * Generate a conventional commit-style title from commit messages.
 */
function generateTitleFromCommits(commitMessages: string[]): string {
  if (commitMessages.length === 0) {
    return 'Automated changes'
  }

  // Use the last commit message as the title
  const lastMsg = commitMessages[commitMessages.length - 1].trim()

  // Clean up common prefixes we don't want doubled
  const cleaned = lastMsg.replace(/^(fix|feat|chore|docs|refactor|test)(\(.+\))?[!]?:\s*/i, '')

  const type = detectPRType(commitMessages)
  if (type !== 'other') {
    return `${type === 'feature' ? 'feat' : type}: ${cleaned}`
  }

  // Truncate to 72 chars
  return cleaned.length > 72 ? `${cleaned.slice(0, 69)}...` : cleaned
}

/**
 * Parse a git remote URL to extract owner and repo name.
 */
function parseRemoteUrl(url: string): { owner: string; repo: string } | null {
  if (!url) return null

  // HTTPS: https://github.com/owner/repo.git
  const httpsMatch = url.match(/github\.com[:/]([^/]+)\/([^/\s]+?)(?:\.git)?$/)
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2].replace('.git', '') }
  }

  // SSH: git@github.com:owner/repo.git
  const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/\s]+?)(?:\.git)?$/)
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2].replace('.git', '') }
  }

  return null
}

/**
 * Parse git blame --porcelain output to extract author logins.
 */
function parseBlameAuthors(output: string): string[] {
  const authors: string[] = []
  const seen = new Set<string>()

  for (const line of output.split('\n')) {
    // In porcelain mode, lines starting with "author " contain the author name
    if (line.startsWith('author ')) {
      const author = line.slice(7).trim()
      if (author && !seen.has(author) && author !== 'Unknown' && !author.includes('(not committed)')) {
        seen.add(author)
        authors.push(author)
      }
    }
  }

  return authors
}

/**
 * Execute a git command and return stdout.
 */
async function execGitCommand(args: string[], cwd: string): Promise<string> {
  const { execFile } = await import('child_process')
  const { promisify } = await import('util')
  const execFileAsync = promisify(execFile)

  const { stdout } = await execFileAsync('git', args, {
    cwd,
    maxBuffer: 5 * 1024 * 1024
  })

  return stdout.toString().trim()
}
