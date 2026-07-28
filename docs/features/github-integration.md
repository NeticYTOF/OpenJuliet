# GitHub Integration

> OpenJuliet integrates deeply with GitHub for repository browsing, issue tracking, pull request management, and automated PR generation.

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Repository Browser](#repository-browser)
- [Issue Browser](#issue-browser)
- [Pull Request Browser](#pull-request-browser)
- [Auto-Generated PR Descriptions](#auto-generated-pr-descriptions)
- [Suggested Reviewers](#suggested-reviewers)
- [Issue Linking and Draft PRs](#issue-linking-and-draft-prs)
- [Branch Management](#branch-management)
- [Commit History Viewer](#commit-history-viewer)
- [Diff Viewer](#diff-viewer)
- [GitHub Panel UI](#github-panel-ui)
- [Git Configuration](#git-configuration)
- [Preload Bridge API](#preload-bridge-api)

---

## Overview

OpenJuliet's GitHub integration provides a complete development workflow within the app:

- Browse, search, and manage repositories
- Track and filter issues
- Create, review, and manage pull requests
- Generate AI-powered PR descriptions
- Manage branches and view commit history
- View file diffs for commits and PRs

The integration is powered by **Octokit** (the official GitHub REST API client) and exposed to the renderer process via a secure preload bridge using **contextBridge**.

---

## Authentication

OpenJuliet supports two authentication methods for GitHub.

### Personal Access Token (PAT) — Currently Available

PATs provide secure, scoped access to GitHub without browser-based OAuth flows.

#### Creating a PAT

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select the required scopes:

| Scope | Required For |
|-------|-------------|
| `repo` | Full access to private and public repositories |
| `repo:status` | Read/write commit statuses |
| `user` | Read user profile (username, avatar) |
| `read:org` | Read organization membership and repositories |

4. Click **Generate token**
5. Copy the token (it starts with `ghp_`)

#### Configuring in OpenJuliet

1. Open **Settings** (`⌘,`)
2. Navigate to the **GitHub** tab
3. Under **Personal Access Token**, paste your token
4. Click **Connect**

#### Successful Connection

Once authenticated:
- The UI shows **"Connected as @username"**
- Your GitHub avatar appears in the sidebar
- Repository, issue, and PR data becomes available

#### Disconnecting

Click **Disconnect** in Settings → GitHub to clear the stored token.

### OAuth Flow — Coming Soon

Browser-based OAuth authentication is planned for a future release. This will provide:
- One-click sign-in with GitHub
- No manual token management
- Scoped permission requests
- Automatic token refresh

### Authentication State

```typescript
interface GitHubAuth {
  token?: string
  username?: string
  avatarUrl?: string
  isConnected: boolean
  method: 'oauth' | 'pat' | 'none'
}
```

The authentication state is stored in `localStorage` as part of the application settings.

---

## Repository Browser

The repository browser is accessible via the **Repositories** view (`⌘2`).

### Features

- **List all repositories** accessible by the authenticated user
- **Search** by repository name with real-time filtering
- **Filter** by:
  - Owner (user vs organization repos)
  - Visibility (public, private)
  - Language
  - Last updated
- **Sort** by name, last updated, or stars
- **Select** a repository to view details, issues, and PRs

### Repository Data Model

```typescript
interface Repository {
  id: string
  name: string           // e.g., "OpenJuliet"
  fullName: string       // e.g., "NeticYTOF/OpenJuliet"
  description?: string
  url: string
  owner: string
  private: boolean
  defaultBranch: string  // e.g., "main"
  updatedAt: number
  language?: string      // e.g., "TypeScript"
  stars: number
}
```

### Using the Repository Browser

1. Press `⌘2` to open the Repositories view
2. Browse the repository list
3. Use the **search bar** to filter by name
4. Click a repository to:
   - View its details
   - Browse its issues
   - View its pull requests
   - Clone it to your workspace

### Cloning a Repository

1. From the repository list, click the **Clone** button (or use `⌘⇧C`)
2. Choose a target directory in your workspace
3. The repository is cloned and added to your recent projects

---

## Issue Browser

The issue browser lets you view, filter, and manage GitHub issues.

### Features

- **List issues** for the selected repository
- **Status filters:** All, Open, Closed
- **Label filtering:** Filter by GitHub labels
- **Milestone view:** Group issues by milestone
- **Assignee filtering:** Filter by assigned user
- **Author filtering:** Filter by issue author
- **Sort** by created date, updated date, or comments

### Issue Data Model

```typescript
interface Issue {
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
```

### Issue View

1. Navigate to **Issues** view (`⌘3`)
2. Select a repository (if not already selected)
3. Use the **filter bar** to narrow results:
   - **State:** All / Open / Closed
   - **Labels:** Click to toggle label filters
   - **Assignee:** Filter by GitHub username
4. Click an issue to view full details including:
   - Issue body (rendered as markdown)
   - Comments timeline
   - Labels and milestones
   - Assignees
   - Linked PRs

---

## Pull Request Browser

The PR browser provides comprehensive pull request management.

### Features

- **List PRs** for the selected repository
- **Filter by state:** Open, Closed, Merged, Draft
- **View CI status:** Check run results per PR
- **View reviews:** Approval, change requests, comments
- **Sort** by created date, updated date, or comment count

### PR Data Model

```typescript
interface PullRequest {
  id: string
  number: number
  title: string
  body?: string
  state: 'open' | 'closed' | 'merged'
  author: string
  createdAt: number
  updatedAt: number
  repo: string
  sourceBranch: string    // e.g., "feature/new-ui"
  targetBranch: string    // e.g., "main"
  additions: number
  deletions: number
}
```

### PR View

1. From the GitHub panel, select the **Pull Requests** tab
2. Browse the PR list with state indicators:
   - 🟢 **Open** — PR is open for review
   - 🟣 **Merged** — PR has been merged
   - 🔴 **Closed** — PR was closed without merging
   - ⚪ **Draft** — PR is in draft mode
3. Click a PR to view:
   - Full PR description (rendered markdown)
   - File changes (additions/deletions per file)
   - Review comments
   - CI check status
   - Commits in the PR

---

## Auto-Generated PR Descriptions

OpenJuliet can automatically generate pull request descriptions using AI. This is part of the Stage 7 (Commit & PR) phase of the autonomous workflow.

### How It Works

1. After implementing changes and running tests, the system analyzes:
   - Files modified
   - Nature of changes (additions, modifications, deletions)
   - Test results
   - Code review findings
2. An AI-generated PR description is created in markdown format
3. The description includes:
   - **Summary** of the changes
   - **List of modified files** with descriptions
   - **Test results** and quality metrics
   - **Related issues** (if any)

### Example Auto-Generated PR

```markdown
## Description

This PR fixes a missing vitest import in `math.test.ts` that causes
a `ReferenceError` when running the test suite. The test file uses
`describe`, `it`, and `expect` without importing them from vitest.

## Changes

- **src/math.test.ts**: Added `import { describe, it, expect } from 'vitest'`
- **vitest.config.ts**: Created vitest configuration file

## Test Results

- ✅ All 10 tests pass
- ✅ TypeScript compilation succeeds
- ✅ Code quality checks: 7/7 passed

## Related Issue

Fixes the broken test suite — no issue number assigned.
```

### Configuration

PR generation uses the currently enabled AI provider. For high-quality PR descriptions, use a capable model (Claude Sonnet 4, GPT-4o, or Gemini 2.5 Pro).

---

## Suggested Reviewers

OpenJuliet can suggest code reviewers based on git blame analysis.

### How It Works

1. Before creating a PR, the system runs `git blame` on modified files
2. It identifies top contributors to the changed lines
3. Contributors are ranked by:
   - **Ownership percentage** — How much of the changed code they authored
   - **Recency** — How recently they contributed to these files
   - **Expertise** — Cross-file contribution patterns
4. The top 2–3 contributors are suggested as reviewers

### Reviewer Suggestion Output

```
Suggested Reviewers:
  1. @jane_doe — 67% ownership of changed files
  2. @bob_smith — Recent contributor to src/math.test.ts
```

### Manual Reviewer Selection

You can also manually add reviewers when creating a PR by typing GitHub usernames.

---

## Issue Linking and Draft PRs

### Issue Linking

OpenJuliet supports linking PRs to issues in PR descriptions:

- **Auto-detection:** If a task references an issue number (e.g., `#42`), it's automatically included in the PR body
- **Manual linking:** Reference issues in PR descriptions using `Fixes #NN` or `Closes #NN`
- **Status tracking:** Linked issues are tracked in the issue view for quick reference

### Draft PR Support

PRs can be created as **draft pull requests**:

- **Draft mode:** Creates the PR without requesting review
- **Ready for review:** Convert draft PRs to regular PRs when changes are final
- **CI runs:** Draft PRs still trigger CI checks
- **Use case:** Share work-in-progress changes without formal review

---

## Branch Management

OpenJuliet provides branch management capabilities through the Git integration.

### Features

- **View branches** — List local and remote branches
- **Create branch** — Create a new branch from the current HEAD
- **Switch branches** — Checkout different branches
- **Merge branches** — Merge one branch into another
- **Delete branches** — Clean up stale branches (local and remote)

### Branch API

```typescript
// Exposed via preload bridge
interface GitAPI {
  branch: (repoPath: string) => Promise<{
    current: string       // Currently checked-out branch name
    branches: string[]    // Local branch list
    all: string[]         // All branches (local + remote)
  }>
  // ...
}
```

### Typical Workflow

1. Create a feature branch from `main`
2. Implement changes
3. Commit to the feature branch
4. Push the branch to GitHub
5. Create a PR from the branch
6. After merge, delete the feature branch

### Branch Naming Convention

OpenJuliet follows conventional branch naming:

```
fix/<description>       — Bug fixes
feature/<description>   — New features
chore/<description>     — Maintenance tasks
refactor/<description>  — Code refactoring
```

---

## Commit History Viewer

View commit history for any repository with detailed information per commit.

### Features

- **Commit list** — Chronological view of all commits
- **Author information** — Author name, avatar, and timestamp
- **Commit message** — Full commit message rendered with markdown
- **Commit hash** — Clickable hash to view full diff
- **Branch context** — Which branch the commit belongs to
- **File list** — Files changed in each commit

### Commit Data

```typescript
// Retrieved via GitAPI.log
interface Commit {
  hash: string        // Full SHA
  author: string
  message: string     // Full commit message
  date: number
  files?: string[]    // Files changed in this commit
  additions: number
  deletions: number
}
```

### Viewing Commits

1. Open a repository in the GitHub panel
2. Select **Commits** from the repository view
3. Browse the commit history
4. Click a commit to see full details and diff

---

## Diff Viewer

OpenJuliet includes a built-in diff viewer for commits and pull requests.

### Features

- **Side-by-side diff** — View changes in left (original) / right (modified) panes
- **Unified diff** — Classic unified format
- **Syntax highlighting** — Language-aware diff rendering
- **File-by-file navigation** — Step through changed files
- **Inline comments** — (Future) Comment on specific lines

### Diff API

```typescript
interface GitAPI {
  diff: (repoPath: string, options?: {
    from?: string    // Source commit or branch
    to?: string      // Target commit or branch
    file?: string    // Specific file path
  }) => Promise<string>
  // ...
}
```

### Viewing Diffs

- **In PR view:** Diffs are automatically shown when viewing a PR
- **In commit view:** Click a commit to see its diff
- **In editor:** The editor view can show diff between the working tree and HEAD

---

## GitHub Panel UI

The GitHub panel (`GitHubPanel.tsx`) is organized into tabs for a unified experience.

### Layout

```
┌─────────────────────────────────────────────┐
│  GitHub Panel                                │
│  Connected as @username                      │
├─────────────────────────────────────────────┤
│ [Repos] [Issues] [PRs]                      │
├─────────────────────────────────────────────┤
│                                             │
│  Tab content (varies by active tab)         │
│  - Repos: Search + grid/list of repos       │
│  - Issues: Filter bar + issue list          │
│  - PRs: State badges + PR list              │
│                                             │
└─────────────────────────────────────────────┘
```

### Connection Status

When not connected, a **GitHubLogin** prompt is shown with:

- GitHub icon with sign-in message
- Token input field
- Connect button
- "OAuth coming soon" note

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘⇧G` | Open GitHub panel |
| `⌘⇧I` | Open Issues view |
| `⌘⇧R` | Create pull request |
| `⌘⇧C` | Clone repository |

---

## Git Configuration

### Setting Up Git

For OpenJuliet to commit and push, configure your Git identity:

1. Go to **Settings** (`⌘,`) → **General** tab
2. Under **Git Configuration**, set:
   - **Git Username** (matching your GitHub account)
   - **Git Email** (matching your GitHub account's primary email)

### Git API (Preload Bridge)

```typescript
interface GitAPI {
  clone: (url: string, path: string, options?: Record<string, unknown>) => Promise<unknown>
  status: (repoPath: string) => Promise<unknown>
  branch: (repoPath: string) => Promise<{
    current: string
    branches: string[]
    all: string[]
  }>
  commit: (repoPath: string, message: string, options?: Record<string, unknown>) => Promise<unknown>
  push: (repoPath: string, options?: Record<string, unknown>) => Promise<unknown>
  pull: (repoPath: string, options?: Record<string, unknown>) => Promise<unknown>
  diff: (repoPath: string, options?: Record<string, unknown>) => Promise<string>
  log: (repoPath: string, options?: Record<string, unknown>) => Promise<unknown[]>
}
```

---

## Preload Bridge API

The GitHub integration is securely exposed to the renderer process via the preload bridge.

### GitHub API (Renderer Access)

```typescript
interface GithubAPI {
  listRepos: () => Promise<unknown[]>
  getRepo: (owner: string, repo: string) => Promise<unknown>
  listIssues: (owner: string, repo: string) => Promise<unknown[]>
  createPR: (params: Record<string, unknown>) => Promise<unknown>
  listPRs: (owner: string, repo: string) => Promise<unknown[]>
  authenticate: (token: string) => Promise<{ success: boolean; login?: string }>
}
```

### Usage in the Renderer

```typescript
// Access via window.api
const api = window.api

// List repositories
const repos = await api.github.listRepos()

// Authenticate
const result = await api.github.authenticate('ghp_...')
if (result.success) {
  console.log(`Connected as @${result.login}`)
}

// Create a PR
await api.github.createPR({
  owner: 'NeticYTOF',
  repo: 'OpenJuliet',
  title: 'fix: resolve import issue',
  head: 'fix/import-issue',
  base: 'main',
  body: '## Description\n...'
})
```

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Authentication failed` | Invalid or expired PAT | Generate a new token |
| `Not Found` | Repository doesn't exist or no access | Check repo name and permissions |
| `Rate limit exceeded` | Too many API requests | Wait or authenticate for higher limits |
| `Conflict` | Branch conflicts or merge issues | Resolve conflicts manually |
| `Push failed` | Permission denied or branch protection | Check branch permissions |

### API Error Resilience

The GitHub store handles errors gracefully:

- **Loading state** — Skeleton UI shown during API calls
- **Error state** — Error messages displayed in the UI with retry option
- **Network detection** — OfflineBanner shown when network is unavailable
- **Retry mechanism** — Failed operations can be retried

---

## Data Store

The GitHub integration state is managed by the `useGitHubStore` (Zustand).

```typescript
interface GitHubState {
  // Repos
  repos: Repository[]
  reposLoading: boolean
  reposError: string | null
  selectedRepo: Repository | null

  // Issues
  issues: Issue[]
  issuesLoading: boolean
  issuesError: string | null
  selectedIssue: Issue | null
  issueFilter: 'all' | 'open' | 'closed'

  // PRs
  prs: PullRequest[]
  prsLoading: boolean
  prsError: string | null

  // Search
  searchQuery: string

  // Actions
  fetchRepos: () => Promise<void>
  fetchIssues: (repo: string) => Promise<void>
  fetchPRs: (repo: string) => Promise<void>
  setSearchQuery: (query: string) => void
  setIssueFilter: (filter: 'all' | 'open' | 'closed') => void
  reset: () => void
}
```

---

## Security Considerations

- **API keys are stored** in `localStorage` (encrypted in transit, stored as plaintext)
- **No OAuth tokens are stored** (OAuth flow coming in future release)
- **PATs have scoped permissions** — use the minimal required scopes
- **All GitHub API calls** go through the main process (not the renderer directly)
- **Preload bridge** ensures secure context isolation
- **HTTPS only** — all API calls use TLS
