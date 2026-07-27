import { create } from 'zustand'
import type { Repository, Issue, PullRequest } from '../types'

/**
 * GitHub integration store — manages repositories, issues, and pull requests.
 */
interface GitHubState {
  /* ──── Repos ──── */
  repos: Repository[]
  reposLoading: boolean
  reposError: string | null
  selectedRepo: Repository | null

  /* ──── Issues ──── */
  issues: Issue[]
  issuesLoading: boolean
  issuesError: string | null
  selectedIssue: Issue | null
  issueFilter: 'all' | 'open' | 'closed'

  /* ──── PRs ──── */
  prs: PullRequest[]
  prsLoading: boolean
  prsError: string | null

  /* ──── Search ──── */
  searchQuery: string

  /* ──── Actions ──── */
  setRepos: (repos: Repository[]) => void
  setReposLoading: (loading: boolean) => void
  setReposError: (error: string | null) => void
  setSelectedRepo: (repo: Repository | null) => void
  setIssues: (issues: Issue[]) => void
  setIssuesLoading: (loading: boolean) => void
  setIssuesError: (error: string | null) => void
  setSelectedIssue: (issue: Issue | null) => void
  setIssueFilter: (filter: 'all' | 'open' | 'closed') => void
  setPRs: (prs: PullRequest[]) => void
  setPRsLoading: (loading: boolean) => void
  setPRsError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  fetchRepos: () => Promise<void>
  fetchIssues: (repo: string) => Promise<void>
  fetchPRs: (repo: string) => Promise<void>
  reset: () => void
}

const initialState = {
  repos: [],
  reposLoading: false,
  reposError: null,
  selectedRepo: null,
  issues: [],
  issuesLoading: false,
  issuesError: null,
  selectedIssue: null,
  issueFilter: 'all' as const,
  prs: [],
  prsLoading: false,
  prsError: null,
  searchQuery: ''
}

export const useGitHubStore = create<GitHubState>((set) => ({
  ...initialState,

  setRepos: (repos) => set({ repos, reposLoading: false, reposError: null }),
  setReposLoading: (loading) => set({ reposLoading: loading }),
  setReposError: (error) => set({ reposError: error, reposLoading: false }),
  setSelectedRepo: (repo) => set({ selectedRepo: repo }),
  setIssues: (issues) => set({ issues, issuesLoading: false, issuesError: null }),
  setIssuesLoading: (loading) => set({ issuesLoading: loading }),
  setIssuesError: (error) => set({ issuesError: error, issuesLoading: false }),
  setSelectedIssue: (issue) => set({ selectedIssue: issue }),
  setIssueFilter: (filter) => set({ issueFilter: filter }),
  setPRs: (prs) => set({ prs, prsLoading: false, prsError: null }),
  setPRsLoading: (loading) => set({ prsLoading: loading }),
  setPRsError: (error) => set({ prsError: error, prsLoading: false }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchRepos: async () => {
    set({ reposLoading: true, reposError: null })
    try {
      // TODO: Implement actual GitHub API call via IPC
      // For now, simulate with empty result
      set({ repos: [], reposLoading: false })
    } catch (err) {
      set({
        reposError: err instanceof Error ? err.message : 'Failed to fetch repositories',
        reposLoading: false
      })
    }
  },

  fetchIssues: async (_repo: string) => {
    set({ issuesLoading: true, issuesError: null })
    try {
      // TODO: Implement actual GitHub API call via IPC
      set({ issues: [], issuesLoading: false })
    } catch (err) {
      set({
        issuesError: err instanceof Error ? err.message : 'Failed to fetch issues',
        issuesLoading: false
      })
    }
  },

  fetchPRs: async (_repo: string) => {
    set({ prsLoading: true, prsError: null })
    try {
      // TODO: Implement actual GitHub API call via IPC
      set({ prs: [], prsLoading: false })
    } catch (err) {
      set({
        prsError: err instanceof Error ? err.message : 'Failed to fetch pull requests',
        prsLoading: false
      })
    }
  },

  reset: () => set(initialState)
}))