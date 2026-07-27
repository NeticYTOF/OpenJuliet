import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, setupBrowserMocks } from '../../../test-utils'
import { useAppStore } from '../../../stores/appStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import Dashboard from '../Dashboard'

// ──── Mock framer-motion ────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, variants, whileHover, whileTap, whileInView, ...safeProps } = props
      return <div {...safeProps}>{children}</div>
    },
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { whileHover, whileTap, initial, animate, exit, transition, variants, layout, layoutId, ...safeProps } = props
      return <button {...safeProps}>{children}</button>
    },
    span: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, variants, ...safeProps } = props
      return <span {...safeProps}>{children}</span>
    }
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))

// ──── Mock lucide-react icons ────
vi.mock('lucide-react', () => {
  const MockIcon = () => <span data-testid="mock-icon" />
  return {
    Sparkles: MockIcon,
    GitBranch: MockIcon,
    ListChecks: MockIcon,
    Clock: MockIcon,
    Activity: MockIcon,
    Github: MockIcon,
    Database: MockIcon,
    Cpu: MockIcon,
    FolderOpen: MockIcon,
    Plus: MockIcon,
    Settings: MockIcon,
    Play: MockIcon
  }
})

describe('Dashboard', () => {
  beforeEach(() => {
    setupBrowserMocks()
    localStorage.clear()
    useAppStore.setState({
      activeView: 'dashboard',
      sidebarOpen: true,
      theme: 'dark',
      currentProject: null,
      currentTask: null,
      notifications: [],
      hasCompletedOnboarding: false,
      isFirstLaunch: true
    })
    useSettingsStore.setState({
      theme: 'dark' as const,
      workspaceDir: '',
      fontSize: 14,
      animationsEnabled: true,
      sidebarCollapsed: false,
      concurrency: 2,
      sandboxEnabled: true,
      executionTimeout: 300_000,
      notificationsEnabled: true,
      gitUser: '',
      gitEmail: '',
      providers: [],
      github: { isConnected: false, method: 'none' }
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the welcome heading', () => {
    render(<Dashboard />)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('renders stat cards', () => {
    render(<Dashboard />)
    expect(screen.getByText('Repositories')).toBeInTheDocument()
    expect(screen.getByText('Tasks Completed')).toBeInTheDocument()
    expect(screen.getByText('Uptime')).toBeInTheDocument()
    expect(screen.getByText('Active Tasks')).toBeInTheDocument()
  })

  it('renders quick action buttons', () => {
    render(<Dashboard />)
    expect(screen.getByText('Clone Repository')).toBeInTheDocument()
    expect(screen.getByText('New Task')).toBeInTheDocument()
    expect(screen.getByText('Open Settings')).toBeInTheDocument()
  })

  it('renders GitHub connection status as disconnected by default', () => {
    render(<Dashboard />)
    expect(screen.getByText('GitHub Disconnected')).toBeInTheDocument()
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('renders recent activity items', () => {
    render(<Dashboard />)
    expect(screen.getByText('Code review completed')).toBeInTheDocument()
    expect(screen.getByText('Task paused')).toBeInTheDocument()
    expect(screen.getByText('Repository cloned')).toBeInTheDocument()
  })

  it('renders system status section', () => {
    render(<Dashboard />)
    expect(screen.getByText('System Status')).toBeInTheDocument()
    expect(screen.getByText('0 active')).toBeInTheDocument()
    expect(screen.getByText('Not set')).toBeInTheDocument()
    expect(screen.getByText('~256 MB')).toBeInTheDocument()
  })

  it('calls setView when clone repository button is clicked', () => {
    render(<Dashboard />)
    const buttons = screen.getAllByRole('button')
    const cloneBtn = buttons.find((b) => b.textContent === 'Clone Repository')
    expect(cloneBtn).toBeTruthy()
    cloneBtn!.click()
    expect(useAppStore.getState().activeView).toBe('repositories')
  })

  it('calls setView when new task button is clicked', () => {
    render(<Dashboard />)
    const buttons = screen.getAllByRole('button')
    const taskBtn = buttons.find((b) => b.textContent === 'New Task')
    expect(taskBtn).toBeTruthy()
    taskBtn!.click()
    expect(useAppStore.getState().activeView).toBe('tasks')
  })

  it('calls setView when open settings button is clicked', () => {
    render(<Dashboard />)
    const buttons = screen.getAllByRole('button')
    const settingsBtn = buttons.find((b) => b.textContent === 'Open Settings')
    expect(settingsBtn).toBeTruthy()
    settingsBtn!.click()
    expect(useAppStore.getState().activeView).toBe('settings')
  })

  it('shows GitHub connected state when connected', () => {
    useSettingsStore.setState({
      github: { isConnected: true, method: 'oauth', username: 'octocat' }
    })

    render(<Dashboard />)
    expect(screen.getByText('GitHub Connected')).toBeInTheDocument()
    expect(screen.getByText('@octocat')).toBeInTheDocument()
    expect(screen.getByText('Live')).toBeInTheDocument()
  })
})
