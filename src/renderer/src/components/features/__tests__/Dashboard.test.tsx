import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, setupBrowserMocks } from '../../test-utils'
import Dashboard from '../Dashboard'

// ──── Mock framer-motion ────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <button {...props}>{children}</button>
    ),
    span: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    )
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))

// ──── Mock lucide-react icons ────
vi.mock('lucide-react', () => {
  const MockIcon = ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <span data-testid={testId || 'mock-icon'} />
  )
  return {
    GitBranch: MockIcon,
    ListChecks: MockIcon,
    Clock: MockIcon,
    Activity: MockIcon,
    Github: MockIcon,
    Database: MockIcon,
    Cpu: MockIcon,
    FolderOpen: MockIcon,
    Plus: MockIcon,
    Settings: MockIcon
  }
})

// ──── Mock stores ────
const mockSetView = vi.fn()
const mockAppStore = {
  setView: mockSetView,
  activeView: 'dashboard'
}
const mockSettingsStore = {
  github: { isConnected: false, method: 'none' },
  providers: [],
  workspaceDir: ''
}

vi.mock('../../stores/appStore', () => ({
  useAppStore: vi.fn((selector?: (state: typeof mockAppStore) => unknown) =>
    selector ? selector(mockAppStore) : mockAppStore
  )
}))

vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn((selector?: (state: typeof mockSettingsStore) => unknown) =>
    selector ? selector(mockSettingsStore) : mockSettingsStore
  )
}))

describe('Dashboard', () => {
  beforeEach(() => {
    setupBrowserMocks()
    vi.clearAllMocks()
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
    expect(screen.getByText('0 active')).toBeInTheDocument() // providers.length
    expect(screen.getByText('Not set')).toBeInTheDocument() // workspaceDir
    expect(screen.getByText('~256 MB')).toBeInTheDocument()
  })

  it('calls setView when clone repository button is clicked', () => {
    render(<Dashboard />)
    const cloneBtn = screen.getByText('Clone Repository')
    cloneBtn.click()
    expect(mockSetView).toHaveBeenCalledWith('repositories')
  })

  it('calls setView when new task button is clicked', () => {
    render(<Dashboard />)
    screen.getByText('New Task').click()
    expect(mockSetView).toHaveBeenCalledWith('tasks')
  })

  it('calls setView when open settings button is clicked', () => {
    render(<Dashboard />)
    screen.getByText('Open Settings').click()
    expect(mockSetView).toHaveBeenCalledWith('settings')
  })

  it('shows GitHub connected state when connected', () => {
    // Override the mock settings store for this test
    const connectedSettings = {
      github: { isConnected: true, method: 'oauth', username: 'octocat' },
      providers: [],
      workspaceDir: ''
    }
    vi.mocked(useSettingsStore).mockImplementation(
      (selector?: (state: typeof connectedSettings) => unknown) =>
        selector ? selector(connectedSettings) : connectedSettings
    )

    render(<Dashboard />)
    expect(screen.getByText('GitHub Connected')).toBeInTheDocument()
    expect(screen.getByText('@octocat')).toBeInTheDocument()
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  // Clean up mock override after tests
  afterEach(() => {
    vi.restoreAllMocks()
  })
})
