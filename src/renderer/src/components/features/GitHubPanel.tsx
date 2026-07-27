import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { motion } from 'framer-motion'
import {
  Github,
  GitBranch,
  Bug,
  GitPullRequest,
  Search,
  Key,
  LogIn,
  RefreshCw,
  Star,
  Shield
} from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useGitHubStore } from '../../stores/githubStore'
import { useAppStore } from '../../stores/appStore'
import { formatRelativeTime } from '../../lib/utils'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton, CardSkeleton } from '../ui/Skeleton'
import { AnimatedContainer, AnimatedItem } from '../ui/AnimatedContainer'
import { cn } from '../../lib/utils'
import type { Repository, Issue, PullRequest } from '../../types'

/**
 * GitHubPanel — GitHub integration panel with login, repository browser, issue browser, and PR browser.
 */
export default function GitHubPanel(): JSX.Element {
  const { activeView } = useAppStore()
  const { github, setGitHubAuth } = useSettingsStore()
  const {
    repos, reposLoading, reposError,
    issues, issuesLoading, issuesError,
    prs, prsLoading, prsError,
    searchQuery, setSearchQuery,
    issueFilter, setIssueFilter
  } = useGitHubStore()

  return (
    <AnimatedContainer animation="slideUp">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {activeView === 'repositories' ? 'Repositories' : activeView === 'issues' ? 'Issues' : 'Pull Requests'}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {github.isConnected ? `Connected as @${github.username || 'user'}` : 'Connect your GitHub account'}
          </p>
        </div>
      </div>

      {!github.isConnected ? (
        <GitHubLogin onConnect={(token) => setGitHubAuth({ token, isConnected: true, method: 'pat', username: 'user' })} />
      ) : (
        <Tabs.Root defaultValue={activeView === 'issues' ? 'issues' : activeView === 'repositories' ? 'repos' : 'prs'}>
          <Tabs.List className="flex gap-1 mb-6 p-1 bg-[var(--color-bg-tertiary)] rounded-lg w-fit">
            <Tabs.Trigger value="repos" className={tabTriggerStyles}>
              <GitBranch size={14} />
              Repositories
            </Tabs.Trigger>
            <Tabs.Trigger value="issues" className={tabTriggerStyles}>
              <Bug size={14} />
              Issues
            </Tabs.Trigger>
            <Tabs.Trigger value="prs" className={tabTriggerStyles}>
              <GitPullRequest size={14} />
              Pull Requests
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="repos">
            <GitHubRepos repos={repos} loading={reposLoading} error={reposError} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          </Tabs.Content>
          <Tabs.Content value="issues">
            <GitHubIssues issues={issues} loading={issuesLoading} error={issuesError} filter={issueFilter} onFilterChange={setIssueFilter} />
          </Tabs.Content>
          <Tabs.Content value="prs">
            <GitHubPRs prs={prs} loading={prsLoading} error={prsError} />
          </Tabs.Content>
        </Tabs.Root>
      )}
    </AnimatedContainer>
  )
}

const tabTriggerStyles = cn(
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
  'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]',
  'data-[state=active]:bg-[var(--color-surface)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-sm'
)

// ─── Login View ───

function GitHubLogin({ onConnect }: { onConnect: (token: string) => void }): JSX.Element {
  const [patToken, setPatToken] = useState('')

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card variant="default" padding="lg">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-xl bg-[var(--color-accent-subtle)] mb-4">
            <Github size={28} className="text-[var(--color-accent)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Connect GitHub
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Link your GitHub account to browse repositories, issues, and pull requests.
          </p>
        </div>

        <div className="space-y-4">
          <Button variant="primary" size="md" icon={<LogIn size={16} />} fullWidth disabled>
            Sign in with GitHub OAuth
            <Badge variant="default" size="sm" className="ml-2">Coming Soon</Badge>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[var(--color-surface)] text-[var(--color-text-muted)]">or use Personal Access Token</span>
            </div>
          </div>

          <Input
            label="Personal Access Token"
            type="password"
            icon={<Key size={16} />}
            placeholder="ghp_..."
            value={patToken}
            onChange={(e) => setPatToken(e.target.value)}
            hint="Create a token with repo scope at GitHub Settings → Developer Settings"
          />

          <Button
            variant="primary"
            size="md"
            icon={<Shield size={16} />}
            fullWidth
            disabled={!patToken.trim()}
            onClick={() => onConnect(patToken.trim())}
          >
            Connect with PAT
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Repos Browser ───

function GitHubRepos({ repos, loading, error, searchQuery, onSearchChange }: {
  repos: Repository[]
  loading: boolean
  error: string | null
  searchQuery: string
  onSearchChange: (q: string) => void
}): JSX.Element {
  const filtered = repos.filter((r) =>
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {loading && <CardSkeleton count={3} />}
      {error && <div className="text-sm text-[var(--color-error)] p-4 bg-[var(--color-error-bg)] rounded-lg">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={<GitBranch size={40} />}
          title="No repositories found"
          description={searchQuery ? 'Try a different search query.' : 'Clone or connect a repository to get started.'}
          action={<Button variant="primary" size="sm">Clone Repository</Button>}
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((repo) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-[rgba(30,30,46,0.6)] border border-[rgba(42,42,62,0.5)] hover:border-[rgba(108,92,231,0.3)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <GitBranch size={14} className="text-[var(--color-text-muted)]" />
                <span className="font-medium text-sm text-[var(--color-text-primary)]">{repo.fullName}</span>
                {repo.private && <Badge variant="default" size="sm">Private</Badge>}
              </div>
              {repo.description && <p className="text-xs text-[var(--color-text-secondary)] mb-2 line-clamp-2">{repo.description}</p>}
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                {repo.language && <span>{repo.language}</span>}
                <span className="flex items-center gap-1"><Star size={12} />{repo.stars}</span>
                <span>Updated {formatRelativeTime(repo.updatedAt)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Issues Browser ───

function GitHubIssues({ issues, loading, error, filter, onFilterChange }: {
  issues: Issue[]
  loading: boolean
  error: string | null
  filter: string
  onFilterChange: (f: 'all' | 'open' | 'closed') => void
}): JSX.Element {
  const filtered = filter === 'all' ? issues : issues.filter((i) => i.state === filter)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'open', 'closed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              filter === f
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && <CardSkeleton count={4} />}
      {error && <div className="text-sm text-[var(--color-error)] p-4 bg-[var(--color-error-bg)] rounded-lg">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={<Bug size={40} />}
          title="No issues found"
          description="There are no issues matching your current filter."
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((issue) => (
            <div key={issue.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer">
              <div className={cn('w-3 h-3 rounded-full mt-1 shrink-0', issue.state === 'open' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{issue.title}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">#{issue.number} · {issue.repo}</p>
              </div>
              <div className="flex gap-1">
                {issue.labels.map((label) => (
                  <Badge key={label} variant="default" size="sm">{label}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PRs Browser ───

function GitHubPRs({ prs, loading, error }: {
  prs: PullRequest[]
  loading: boolean
  error: string | null
}): JSX.Element {
  return (
    <div>
      {loading && <CardSkeleton count={3} />}
      {error && <div className="text-sm text-[var(--color-error)] p-4 bg-[var(--color-error-bg)] rounded-lg">{error}</div>}
      {!loading && !error && prs.length === 0 && (
        <EmptyState
          icon={<GitPullRequest size={40} />}
          title="No pull requests"
          description="Pull requests from your repositories will appear here."
        />
      )}
      {!loading && !error && prs.length > 0 && (
        <div className="space-y-2">
          {prs.map((pr) => (
            <div key={pr.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer">
              <GitPullRequest size={16} className={cn(
                'mt-0.5',
                pr.state === 'open' ? 'text-[var(--color-success)]' : pr.state === 'merged' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{pr.title}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">#{pr.number} · {pr.repo} · {pr.sourceBranch} → {pr.targetBranch}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span className="text-[var(--color-success)]">+{pr.additions}</span>
                <span className="text-[var(--color-error)]">-{pr.deletions}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { GitHubLogin, GitHubRepos, GitHubIssues, GitHubPRs }