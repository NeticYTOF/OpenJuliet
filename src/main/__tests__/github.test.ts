// @vitest-environment node
/**
 * Tests for the main process GitHub module.
 * Mocks the `octokit` module using vi.mock.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

// ──── Mock Octokit ────
const mockListForAuthenticatedUser = vi.fn()
const mockGetRepo = vi.fn()
const mockListForRepo = vi.fn()
const mockGetIssue = vi.fn()
const mockCreate = vi.fn()
const mockCreatePR = vi.fn()
const mockListPRs = vi.fn()
const mockGetPR = vi.fn()
const mockCreateComment = vi.fn()
const mockListBranches = vi.fn()
const mockGetContent = vi.fn()

const mockOctokitInstance = {
  rest: {
    repos: {
      listForAuthenticatedUser: mockListForAuthenticatedUser,
      get: mockGetRepo,
      listBranches: mockListBranches,
      getContent: mockGetContent
    },
    issues: {
      listForRepo: mockListForRepo,
      get: mockGetIssue,
      create: mockCreate,
      createComment: mockCreateComment
    },
    pulls: {
      create: mockCreatePR,
      list: mockListPRs,
      get: mockGetPR
    }
  }
}

vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => mockOctokitInstance)
}))

// ──── Module reference (lazy-loaded) ────
type GitHubModule = typeof import('../github/index')
let github: GitHubModule

beforeAll(async () => {
  github = await import('../github/index')
})

describe('github module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module state by clearing auth
    if (github) github.clearAuth()
  })

  describe('authenticate', () => {
    it('creates an Octokit instance with a token', () => {
      const { Octokit } = require('octokit')
      github.authenticate('ghp_test_token', 'pat', 'testuser')

      expect(Octokit).toHaveBeenCalledWith({ auth: 'ghp_test_token' })
    })

    it('stores auth state', () => {
      github.authenticate('ghp_token', 'pat', 'octocat')

      const state = github.getAuthState()
      expect(state).toEqual({
        token: 'ghp_token',
        type: 'pat',
        username: 'octocat'
      })
    })
  })

  describe('getAuthState', () => {
    it('returns null when not authenticated', () => {
      expect(github.getAuthState()).toBeNull()
    })

    it('returns auth state after authentication', () => {
      github.authenticate('test-token')
      expect(github.getAuthState()).not.toBeNull()
      expect(github.getAuthState()?.token).toBe('test-token')
    })
  })

  describe('clearAuth', () => {
    it('clears the auth state', () => {
      github.authenticate('test-token')
      expect(github.getAuthState()).not.toBeNull()

      github.clearAuth()
      expect(github.getAuthState()).toBeNull()
    })
  })

  describe('listRepos', () => {
    it('throws if not authenticated', async () => {
      await expect(github.listRepos()).rejects.toThrow('not authenticated')
    })

    it('returns mapped repositories', async () => {
      github.authenticate('test-token')
      mockListForAuthenticatedUser.mockResolvedValue({
        data: [
          {
            id: 1,
            name: 'repo1',
            full_name: 'user/repo1',
            description: 'Test repo',
            html_url: 'https://github.com/user/repo1',
            private: false,
            fork: false,
            default_branch: 'main',
            language: 'TypeScript',
            stargazers_count: 10,
            forks_count: 2,
            open_issues_count: 1,
            updated_at: '2024-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z'
          }
        ]
      })

      const repos = await github.listRepos()

      expect(repos).toHaveLength(1)
      expect(repos[0].name).toBe('repo1')
      expect(repos[0].fullName).toBe('user/repo1')
      expect(repos[0].stars).toBe(10)
      expect(repos[0].forks).toBe(2)
      expect(mockListForAuthenticatedUser).toHaveBeenCalledWith({
        type: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 100
      })
    })

    it('passes options correctly', async () => {
      github.authenticate('test-token')
      mockListForAuthenticatedUser.mockResolvedValue({ data: [] })

      await github.listRepos({ type: 'public', sort: 'created', perPage: 50 })

      expect(mockListForAuthenticatedUser).toHaveBeenCalledWith({
        type: 'public',
        sort: 'created',
        direction: 'desc',
        per_page: 50
      })
    })
  })

  describe('getRepo', () => {
    it('returns a single repository', async () => {
      github.authenticate('test-token')
      mockGetRepo.mockResolvedValue({
        data: {
          id: 123,
          name: 'my-repo',
          full_name: 'user/my-repo',
          description: 'A great repo',
          html_url: 'https://github.com/user/my-repo',
          private: false,
          fork: false,
          default_branch: 'main',
          language: 'Rust',
          stargazers_count: 42,
          forks_count: 7,
          open_issues_count: 3,
          updated_at: '2024-06-01T00:00:00Z',
          created_at: '2022-01-01T00:00:00Z'
        }
      })

      const repo = await github.getRepo('user', 'my-repo')

      expect(repo.name).toBe('my-repo')
      expect(repo.language).toBe('Rust')
      expect(repo.stars).toBe(42)
      expect(mockGetRepo).toHaveBeenCalledWith({ owner: 'user', repo: 'my-repo' })
    })
  })

  describe('listIssues', () => {
    it('returns mapped issues', async () => {
      github.authenticate('test-token')
      mockListForRepo.mockResolvedValue({
        data: [
          {
            id: 100,
            number: 5,
            title: 'Fix bug',
            body: 'Description here',
            state: 'open',
            user: { login: 'octocat' },
            labels: [{ name: 'bug' }],
            assignees: [{ login: 'contributor1' }],
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-10T00:00:00Z',
            html_url: 'https://github.com/user/repo/issues/5'
          }
        ]
      })

      const issues = await github.listIssues('user', 'repo', 'open')

      expect(issues).toHaveLength(1)
      expect(issues[0].title).toBe('Fix bug')
      expect(issues[0].labels).toEqual(['bug'])
      expect(issues[0].assignees).toEqual(['contributor1'])
      expect(issues[0].author).toBe('octocat')
      expect(mockListForRepo).toHaveBeenCalledWith({
        owner: 'user',
        repo: 'repo',
        state: 'open',
        per_page: 100
      })
    })
  })

  describe('getIssue', () => {
    it('returns a single issue', async () => {
      github.authenticate('test-token')
      mockGetIssue.mockResolvedValue({
        data: {
          id: 200,
          number: 42,
          title: 'Important issue',
          body: 'Details',
          state: 'open',
          user: { login: 'user1' },
          labels: [{ name: 'enhancement' }],
          assignees: [],
          created_at: '2024-03-01T00:00:00Z',
          updated_at: '2024-03-05T00:00:00Z',
          html_url: 'https://github.com/user/repo/issues/42'
        }
      })

      const issue = await github.getIssue('user', 'repo', 42)

      expect(issue.title).toBe('Important issue')
      expect(issue.number).toBe(42)
      expect(mockGetIssue).toHaveBeenCalledWith({
        owner: 'user',
        repo: 'repo',
        issue_number: 42
      })
    })
  })

  describe('createIssue', () => {
    it('creates an issue with options', async () => {
      github.authenticate('test-token')
      mockCreate.mockResolvedValue({
        data: {
          id: 300,
          number: 100,
          title: 'New Issue',
          body: 'Issue body',
          state: 'open',
          user: { login: 'creator' },
          labels: [{ name: 'bug' }],
          assignees: [{ login: 'assignee1' }],
          created_at: '2024-04-01T00:00:00Z',
          updated_at: '2024-04-01T00:00:00Z',
          html_url: 'https://github.com/user/repo/issues/100'
        }
      })

      const issue = await github.createIssue({
        owner: 'user',
        repo: 'repo',
        title: 'New Issue',
        body: 'Issue body',
        labels: ['bug'],
        assignees: ['assignee1']
      })

      expect(issue.title).toBe('New Issue')
      expect(issue.number).toBe(100)
      expect(mockCreate).toHaveBeenCalledWith({
        owner: 'user',
        repo: 'repo',
        title: 'New Issue',
        body: 'Issue body',
        labels: ['bug'],
        assignees: ['assignee1']
      })
    })
  })

  describe('createPR', () => {
    it('creates a pull request', async () => {
      github.authenticate('test-token')
      mockCreatePR.mockResolvedValue({
        data: {
          id: 400,
          number: 10,
          title: 'New PR',
          body: 'PR description',
          state: 'open',
          user: { login: 'author1' },
          base: { ref: 'main' },
          head: { ref: 'feature' },
          mergeable: true,
          draft: false,
          created_at: '2024-05-01T00:00:00Z',
          updated_at: '2024-05-01T00:00:00Z',
          html_url: 'https://github.com/user/repo/pull/10',
          merged_at: null
        }
      })

      const pr = await github.createPR({
        owner: 'user',
        repo: 'repo',
        title: 'New PR',
        head: 'feature',
        base: 'main',
        body: 'PR description',
        draft: true
      })

      expect(pr.title).toBe('New PR')
      expect(pr.number).toBe(10)
      expect(pr.draft).toBe(true)
      expect(mockCreatePR).toHaveBeenCalledWith({
        owner: 'user',
        repo: 'repo',
        title: 'New PR',
        head: 'feature',
        base: 'main',
        body: 'PR description',
        draft: true
      })
    })

    it('maps merged PR state correctly', async () => {
      github.authenticate('test-token')
      mockCreatePR.mockResolvedValue({
        data: {
          id: 401,
          number: 11,
          title: 'Merged PR',
          body: null,
          state: 'closed',
          user: { login: 'author2' },
          base: { ref: 'main' },
          head: { ref: 'fix' },
          mergeable: null,
          draft: false,
          created_at: '2024-05-01T00:00:00Z',
          updated_at: '2024-05-02T00:00:00Z',
          html_url: 'https://github.com/user/repo/pull/11',
          merged_at: '2024-05-02T00:00:00Z'
        }
      })

      const pr = await github.createPR({
        owner: 'user',
        repo: 'repo',
        title: 'Merged PR',
        head: 'fix',
        base: 'main'
      })

      expect(pr.state).toBe('merged')
    })
  })

  describe('listPRs', () => {
    it('lists pull requests', async () => {
      github.authenticate('test-token')
      mockListPRs.mockResolvedValue({
        data: [
          {
            id: 500,
            number: 20,
            title: 'PR 1',
            body: 'Desc',
            state: 'open',
            user: { login: 'author' },
            base: { ref: 'main' },
            head: { ref: 'branch1' },
            mergeable: true,
            draft: false,
            created_at: '2024-06-01T00:00:00Z',
            updated_at: '2024-06-01T00:00:00Z',
            html_url: 'https://github.com/user/repo/pull/20',
            merged_at: null
          }
        ]
      })

      const prs = await github.listPRs('user', 'repo', 'open')

      expect(prs).toHaveLength(1)
      expect(prs[0].title).toBe('PR 1')
      expect(mockListPRs).toHaveBeenCalledWith({
        owner: 'user',
        repo: 'repo',
        state: 'open',
        per_page: 100
      })
    })
  })

  describe('getPR', () => {
    it('returns a single PR', async () => {
      github.authenticate('test-token')
      mockGetPR.mockResolvedValue({
        data: {
          id: 600,
          number: 30,
          title: 'Feature PR',
          body: 'Details',
          state: 'open',
          user: { login: 'dev' },
          base: { ref: 'main' },
          head: { ref: 'feature-x' },
          mergeable: true,
          draft: false,
          created_at: '2024-07-01T00:00:00Z',
          updated_at: '2024-07-02T00:00:00Z',
          html_url: 'https://github.com/user/repo/pull/30',
          merged_at: null
        }
      })

      const pr = await github.getPR('user', 'repo', 30)

      expect(pr.title).toBe('Feature PR')
      expect(pr.baseBranch).toBe('main')
      expect(pr.headBranch).toBe('feature-x')
      expect(mockGetPR).toHaveBeenCalledWith({
        owner: 'user',
        repo: 'repo',
        pull_number: 30
      })
    })
  })

  describe('addComment', () => {
    it('adds a comment to an issue', async () => {
      github.authenticate('test-token')
      mockCreateComment.mockResolvedValue({ data: {} })

      await github.addComment('user', 'repo', 42, 'Nice work!')

      expect(mockCreateComment).toHaveBeenCalledWith({
        owner: 'user',
        repo: 'repo',
        issue_number: 42,
        body: 'Nice work!'
      })
    })
  })

  describe('listBranches', () => {
    it('lists and maps branches', async () => {
      github.authenticate('test-token')
      mockListBranches.mockResolvedValue({
        data: [
          { name: 'main', commit: { sha: 'abc123' }, protected: true },
          { name: 'dev', commit: { sha: 'def456' }, protected: false }
        ]
      })

      const branches = await github.listBranches('user', 'repo')

      expect(branches).toHaveLength(2)
      expect(branches[0].name).toBe('main')
      expect(branches[0].commitSha).toBe('abc123')
      expect(branches[0].protected).toBe(true)
      expect(mockListBranches).toHaveBeenCalledWith({
        owner: 'user',
        repo: 'repo',
        per_page: 100
      })
    })
  })

  describe('getContents', () => {
    it('returns file content', async () => {
      github.authenticate('test-token')
      mockGetContent.mockResolvedValue({
        data: {
          path: 'README.md',
          content: 'base64content',
          encoding: 'base64',
          size: 123,
          type: 'file'
        }
      })

      const content = await github.getContents('user', 'repo', 'README.md')

      if (!Array.isArray(content)) {
        expect(content.path).toBe('README.md')
        expect(content.type).toBe('file')
        expect(content.size).toBe(123)
      }
      expect(mockGetContent).toHaveBeenCalledWith({
        owner: 'user',
        repo: 'repo',
        path: 'README.md',
        ref: undefined
      })
    })

    it('returns directory listing as array', async () => {
      github.authenticate('test-token')
      mockGetContent.mockResolvedValue({
        data: [
          { path: 'src/', content: null, encoding: 'utf-8', size: 0, type: 'dir' },
          { path: 'README.md', content: 'base64', encoding: 'base64', size: 100, type: 'file' }
        ]
      })

      const contents = await github.getContents('user', 'repo', '/')

      expect(Array.isArray(contents)).toBe(true)
      if (Array.isArray(contents)) {
        expect(contents).toHaveLength(2)
        expect(contents[0].type).toBe('dir')
      }
    })
  })
})
