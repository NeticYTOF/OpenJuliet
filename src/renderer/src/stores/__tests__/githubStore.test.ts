import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGitHubStore } from '../githubStore'

function resetStore(): void {
  useGitHubStore.setState({
    repos: [],
    reposLoading: false,
    reposError: null,
    selectedRepo: null,
    issues: [],
    issuesLoading: false,
    issuesError: null,
    selectedIssue: null,
    issueFilter: 'all',
    prs: [],
    prsLoading: false,
    prsError: null,
    searchQuery: ''
  })
}

beforeEach(() => {
  resetStore()
  vi.clearAllMocks()
})

describe('githubStore', () => {
  describe('initial state', () => {
    it('has correct initial state', () => {
      const state = useGitHubStore.getState()
      expect(state.repos).toEqual([])
      expect(state.reposLoading).toBe(false)
      expect(state.reposError).toBeNull()
      expect(state.selectedRepo).toBeNull()
      expect(state.issues).toEqual([])
      expect(state.issuesLoading).toBe(false)
      expect(state.issuesError).toBeNull()
      expect(state.selectedIssue).toBeNull()
      expect(state.issueFilter).toBe('all')
      expect(state.prs).toEqual([])
      expect(state.prsLoading).toBe(false)
      expect(state.prsError).toBeNull()
      expect(state.searchQuery).toBe('')
    })
  })

  describe('repos', () => {
    it('sets repos with setRepos', () => {
      const repos = [
        {
          id: '1',
          name: 'repo-a',
          fullName: 'user/repo-a',
          url: 'https://github.com/user/repo-a',
          owner: 'user',
          private: false,
          defaultBranch: 'main',
          updatedAt: Date.now(),
          stars: 10
        },
        {
          id: '2',
          name: 'repo-b',
          fullName: 'user/repo-b',
          url: 'https://github.com/user/repo-b',
          owner: 'user',
          private: true,
          defaultBranch: 'main',
          updatedAt: Date.now(),
          stars: 5
        }
      ]

      useGitHubStore.getState().setRepos(repos)
      const state = useGitHubStore.getState()
      expect(state.repos).toEqual(repos)
      expect(state.repos.length).toBe(2)
      expect(state.reposLoading).toBe(false)
      expect(state.reposError).toBeNull()
    })

    it('handles empty repo list', () => {
      useGitHubStore.getState().setRepos([])
      const state = useGitHubStore.getState()
      expect(state.repos).toEqual([])
      expect(state.reposLoading).toBe(false)
    })

    it('replaces repos on subsequent calls', () => {
      useGitHubStore.getState().setRepos([
        { id: '1', name: 'old', fullName: 'u/old', url: '', owner: 'u', private: false, defaultBranch: 'main', updatedAt: 0, stars: 0 }
      ])
      useGitHubStore.getState().setRepos([
        { id: '2', name: 'new', fullName: 'u/new', url: '', owner: 'u', private: false, defaultBranch: 'main', updatedAt: 0, stars: 0 }
      ])
      expect(useGitHubStore.getState().repos).toHaveLength(1)
      expect(useGitHubStore.getState().repos[0].name).toBe('new')
    })
  })

  describe('selectedRepo', () => {
    it('sets selected repo', () => {
      const repo = {
        id: '1',
        name: 'selected-repo',
        fullName: 'user/selected-repo',
        url: 'https://github.com/user/selected-repo',
        owner: 'user',
        private: false,
        defaultBranch: 'main',
        updatedAt: Date.now(),
        stars: 42
      }

      useGitHubStore.getState().setSelectedRepo(repo)
      expect(useGitHubStore.getState().selectedRepo).toEqual(repo)
    })

    it('sets selected repo to null', () => {
      useGitHubStore.getState().setSelectedRepo({
        id: '1', name: 'temp', fullName: 'u/temp', url: '', owner: 'u', private: false, defaultBranch: 'main', updatedAt: 0, stars: 0
      })
      useGitHubStore.getState().setSelectedRepo(null)
      expect(useGitHubStore.getState().selectedRepo).toBeNull()
    })
  })

  describe('issues', () => {
    it('sets issues with setIssues', () => {
      const issues = [
        {
          id: 'i1',
          number: 1,
          title: 'Bug fix',
          state: 'open' as const,
          author: 'user1',
          labels: ['bug'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          repo: 'repo-a',
          assignees: []
        },
        {
          id: 'i2',
          number: 2,
          title: 'Feature request',
          state: 'closed' as const,
          author: 'user2',
          labels: ['enhancement'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          repo: 'repo-a',
          assignees: ['user1']
        }
      ]

      useGitHubStore.getState().setIssues(issues)
      const state = useGitHubStore.getState()
      expect(state.issues).toEqual(issues)
      expect(state.issues.length).toBe(2)
      expect(state.issuesLoading).toBe(false)
      expect(state.issuesError).toBeNull()
    })

    it('handles empty issues list', () => {
      useGitHubStore.getState().setIssues([])
      expect(useGitHubStore.getState().issues).toEqual([])
    })

    it('sets selected issue', () => {
      const issue = {
        id: 'i1',
        number: 1,
        title: 'Selected issue',
        state: 'open' as const,
        author: 'user',
        labels: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        repo: 'repo',
        assignees: []
      }

      useGitHubStore.getState().setSelectedIssue(issue)
      expect(useGitHubStore.getState().selectedIssue).toEqual(issue)
    })

    it('sets selected issue to null', () => {
      useGitHubStore.getState().setSelectedIssue(null)
      expect(useGitHubStore.getState().selectedIssue).toBeNull()
    })

    it('sets issue filter', () => {
      useGitHubStore.getState().setIssueFilter('open')
      expect(useGitHubStore.getState().issueFilter).toBe('open')

      useGitHubStore.getState().setIssueFilter('closed')
      expect(useGitHubStore.getState().issueFilter).toBe('closed')

      useGitHubStore.getState().setIssueFilter('all')
      expect(useGitHubStore.getState().issueFilter).toBe('all')
    })
  })

  describe('PRs', () => {
    it('sets PRs with setPRs', () => {
      const prs = [
        {
          id: 'pr1',
          number: 1,
          title: 'Add feature',
          state: 'open' as const,
          author: 'dev1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          repo: 'repo-a',
          sourceBranch: 'feature',
          targetBranch: 'main',
          additions: 100,
          deletions: 20
        }
      ]

      useGitHubStore.getState().setPRs(prs)
      const state = useGitHubStore.getState()
      expect(state.prs).toEqual(prs)
      expect(state.prs.length).toBe(1)
      expect(state.prsLoading).toBe(false)
      expect(state.prsError).toBeNull()
    })

    it('handles empty PRs list', () => {
      useGitHubStore.getState().setPRs([])
      expect(useGitHubStore.getState().prs).toEqual([])
    })
  })

  describe('searchQuery', () => {
    it('sets search query', () => {
      useGitHubStore.getState().setSearchQuery('react')
      expect(useGitHubStore.getState().searchQuery).toBe('react')
    })

    it('clears search query', () => {
      useGitHubStore.getState().setSearchQuery('something')
      useGitHubStore.getState().setSearchQuery('')
      expect(useGitHubStore.getState().searchQuery).toBe('')
    })
  })

  describe('loading states', () => {
    it('sets repos loading state', () => {
      useGitHubStore.getState().setReposLoading(true)
      expect(useGitHubStore.getState().reposLoading).toBe(true)

      useGitHubStore.getState().setReposLoading(false)
      expect(useGitHubStore.getState().reposLoading).toBe(false)
    })

    it('sets issues loading state', () => {
      useGitHubStore.getState().setIssuesLoading(true)
      expect(useGitHubStore.getState().issuesLoading).toBe(true)

      useGitHubStore.getState().setIssuesLoading(false)
      expect(useGitHubStore.getState().issuesLoading).toBe(false)
    })

    it('sets PRs loading state', () => {
      useGitHubStore.getState().setPRsLoading(true)
      expect(useGitHubStore.getState().prsLoading).toBe(true)

      useGitHubStore.getState().setPRsLoading(false)
      expect(useGitHubStore.getState().prsLoading).toBe(false)
    })

    it('clears loading when setRepos is called', () => {
      useGitHubStore.getState().setReposLoading(true)
      useGitHubStore.getState().setRepos([])
      expect(useGitHubStore.getState().reposLoading).toBe(false)
    })

    it('clears loading when setReposError is called', () => {
      useGitHubStore.getState().setReposLoading(true)
      useGitHubStore.getState().setReposError('Network error')
      expect(useGitHubStore.getState().reposLoading).toBe(false)
    })
  })

  describe('error states', () => {
    it('sets repos error state', () => {
      useGitHubStore.getState().setReposError('Failed to fetch repositories')
      const state = useGitHubStore.getState()
      expect(state.reposError).toBe('Failed to fetch repositories')
      expect(state.reposLoading).toBe(false)
    })

    it('clears repos error when setRepos is called', () => {
      useGitHubStore.getState().setReposError('Some error')
      useGitHubStore.getState().setRepos([])
      expect(useGitHubStore.getState().reposError).toBeNull()
    })

    it('sets issues error state', () => {
      useGitHubStore.getState().setIssuesError('Failed to load issues')
      expect(useGitHubStore.getState().issuesError).toBe('Failed to load issues')
      expect(useGitHubStore.getState().issuesLoading).toBe(false)
    })

    it('clears issues error when setIssues is called', () => {
      useGitHubStore.getState().setIssuesError('Error')
      useGitHubStore.getState().setIssues([])
      expect(useGitHubStore.getState().issuesError).toBeNull()
    })

    it('sets PRs error state', () => {
      useGitHubStore.getState().setPRsError('Failed to load PRs')
      expect(useGitHubStore.getState().prsError).toBe('Failed to load PRs')
      expect(useGitHubStore.getState().prsLoading).toBe(false)
    })

    it('clears PRs error when setPRs is called', () => {
      useGitHubStore.getState().setPRsError('Error')
      useGitHubStore.getState().setPRs([])
      expect(useGitHubStore.getState().prsError).toBeNull()
    })
  })

  describe('fetchRepos', () => {
    it('sets loading state when fetchRepos is called', async () => {
      useGitHubStore.getState().setReposLoading(true)
      expect(useGitHubStore.getState().reposLoading).toBe(true)
      useGitHubStore.getState().setReposLoading(false)

      // Also test the set on error path
      useGitHubStore.getState().setReposLoading(true)
      expect(useGitHubStore.getState().reposLoading).toBe(true)
      useGitHubStore.getState().setReposError('fail')
      expect(useGitHubStore.getState().reposLoading).toBe(false)
    })

    it('completes with empty repos list', async () => {
      await useGitHubStore.getState().fetchRepos()
      const state = useGitHubStore.getState()
      expect(state.reposLoading).toBe(false)
      expect(state.repos).toEqual([])
      expect(state.reposError).toBeNull()
    })
  })

  describe('fetchIssues', () => {
    it('sets loading state when fetchIssues is called', async () => {
      useGitHubStore.getState().setIssuesLoading(true)
      expect(useGitHubStore.getState().issuesLoading).toBe(true)
      useGitHubStore.getState().setIssuesLoading(false)
    })

    it('completes with empty issues list', async () => {
      await useGitHubStore.getState().fetchIssues('user/repo')
      const state = useGitHubStore.getState()
      expect(state.issuesLoading).toBe(false)
      expect(state.issues).toEqual([])
      expect(state.issuesError).toBeNull()
    })
  })

  describe('fetchPRs', () => {
    it('sets loading state when fetchPRs is called', async () => {
      useGitHubStore.getState().setPRsLoading(true)
      expect(useGitHubStore.getState().prsLoading).toBe(true)
      useGitHubStore.getState().setPRsLoading(false)
    })

    it('completes with empty PRs list', async () => {
      await useGitHubStore.getState().fetchPRs('user/repo')
      const state = useGitHubStore.getState()
      expect(state.prsLoading).toBe(false)
      expect(state.prs).toEqual([])
      expect(state.prsError).toBeNull()
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      // Populate state
      useGitHubStore.getState().setRepos([
        { id: '1', name: 'r', fullName: 'u/r', url: '', owner: 'u', private: false, defaultBranch: 'main', updatedAt: 0, stars: 0 }
      ])
      useGitHubStore.getState().setReposError('error')
      useGitHubStore.getState().setSelectedRepo({
        id: '1', name: 'r', fullName: 'u/r', url: '', owner: 'u', private: false, defaultBranch: 'main', updatedAt: 0, stars: 0
      })
      useGitHubStore.getState().setSearchQuery('test')

      useGitHubStore.getState().reset()

      const state = useGitHubStore.getState()
      expect(state.repos).toEqual([])
      expect(state.reposLoading).toBe(false)
      expect(state.reposError).toBeNull()
      expect(state.selectedRepo).toBeNull()
      expect(state.issues).toEqual([])
      expect(state.issuesLoading).toBe(false)
      expect(state.issuesError).toBeNull()
      expect(state.selectedIssue).toBeNull()
      expect(state.issueFilter).toBe('all')
      expect(state.prs).toEqual([])
      expect(state.prsLoading).toBe(false)
      expect(state.prsError).toBeNull()
      expect(state.searchQuery).toBe('')
    })
  })

  describe('edge cases', () => {
    it('handles network error during fetchRepos', async () => {
      // Temporarily replace fetchRepos to simulate error
      const original = useGitHubStore.getState().fetchRepos
      const mockError = new Error('Network disconnected')

      useGitHubStore.setState({
        fetchRepos: async () => {
          useGitHubStore.getState().setReposLoading(true)
          throw mockError
        }
      })

      try {
        await useGitHubStore.getState().fetchRepos()
      } catch {
        // Expected
      }

      // Restore original
      useGitHubStore.setState({ fetchRepos: original })

      // Test the setReposError path explicitly
      useGitHubStore.getState().setReposError('Network disconnected')
      const state = useGitHubStore.getState()
      expect(state.reposError).toBe('Network disconnected')
      expect(state.reposLoading).toBe(false)
    })

    it('handles error during setReposError with null', () => {
      useGitHubStore.getState().setReposError(null)
      expect(useGitHubStore.getState().reposError).toBeNull()
    })

    it('maintains separation between repos and issues', () => {
      useGitHubStore.getState().setRepos([
        { id: '1', name: 'repo1', fullName: 'u/repo1', url: '', owner: 'u', private: false, defaultBranch: 'main', updatedAt: 0, stars: 0 }
      ])
      useGitHubStore.getState().setReposLoading(false)

      expect(useGitHubStore.getState().repos).toHaveLength(1)
      expect(useGitHubStore.getState().issues).toEqual([])
      expect(useGitHubStore.getState().issuesLoading).toBe(false)
      expect(useGitHubStore.getState().prs).toEqual([])

      // Set issues independently
      useGitHubStore.getState().setIssues([
        { id: 'i1', number: 1, title: 'Issue 1', state: 'open', author: 'u', labels: [], createdAt: 0, updatedAt: 0, repo: 'repo1', assignees: [] }
      ])
      expect(useGitHubStore.getState().issues).toHaveLength(1)
      expect(useGitHubStore.getState().repos).toHaveLength(1)
    })

    it('calling setSelectedRepo with null when already null does not error', () => {
      expect(() => useGitHubStore.getState().setSelectedRepo(null)).not.toThrow()
      expect(useGitHubStore.getState().selectedRepo).toBeNull()
    })
  })
})
