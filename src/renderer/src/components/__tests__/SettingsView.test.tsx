import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, setupBrowserMocks } from '../../test-utils'
import { useSettingsStore } from '../../stores/settingsStore'
import SettingsView from '../features/SettingsView'

// ──── Mock framer-motion ────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, exit, transition, variants, layout, layoutId, whileHover, whileTap, whileInView, ...safeProps } = props
      return <div {...safeProps}>{children}</div>
    },
    span: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, exit, transition, variants, ...safeProps } = props
      return <span {...safeProps}>{children}</span>
    }
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))

// ──── Mock lucide-react icons used in SettingsView ────
vi.mock('lucide-react', () => {
  const MockIcon = () => <span data-testid="mock-icon" />
  return {
    Settings: MockIcon,
    Palette: MockIcon,
    Cpu: MockIcon,
    Github: MockIcon,
    Play: MockIcon,
    Info: MockIcon,
    Key: MockIcon,
    Plus: MockIcon,
    Trash2: MockIcon,
    RefreshCw: MockIcon,
    User: MockIcon,
    Mail: MockIcon,
    FolderOpen: MockIcon,
    Clock: MockIcon,
    Shield: MockIcon
  }
})

describe('SettingsView', () => {
  beforeEach(() => {
    setupBrowserMocks()
    localStorage.clear()
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
      gitUser: 'testuser',
      gitEmail: 'test@example.com',
      providers: [],
      github: { isConnected: false, method: 'none' },
      accentColor: '#6c5ce7',
      bgDensity: 50,
      animationSpeed: 'normal' as const
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the settings title', () => {
    render(<SettingsView />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders all tab triggers', () => {
    render(<SettingsView />)
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Providers')).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Execution')).toBeInTheDocument()
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('displays General settings content by default', () => {
    render(<SettingsView />)
    expect(screen.getByText('Workspace Directory')).toBeInTheDocument()
    expect(screen.getByText('Git Configuration')).toBeInTheDocument()
    expect(screen.getByText('Danger Zone')).toBeInTheDocument()
  })

  it('displays git user from store in General tab', () => {
    render(<SettingsView />)
    const gitUserInput = screen.getByDisplayValue('testuser')
    expect(gitUserInput).toBeInTheDocument()
  })

  it('displays git email from store in General tab', () => {
    render(<SettingsView />)
    const gitEmailInput = screen.getByDisplayValue('test@example.com')
    expect(gitEmailInput).toBeInTheDocument()
  })

  it('switches to Providers tab when clicked', () => {
    render(<SettingsView />)
    const providersTab = screen.getByText('Providers')
    providersTab.click()

    // The Providers tab content should now be visible
    expect(screen.getByText('AI Providers')).toBeInTheDocument()
  })

  it('switches to GitHub tab when clicked', () => {
    render(<SettingsView />)
    const githubTab = screen.getByText('GitHub')
    githubTab.click()

    expect(screen.getByText('GitHub Authentication')).toBeInTheDocument()
  })

  it('switches to Execution tab when clicked', () => {
    render(<SettingsView />)
    const execTab = screen.getByText('Execution')
    execTab.click()

    expect(screen.getByText('Execution Settings')).toBeInTheDocument()
    expect(screen.getByText('Sandbox mode')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('switches to Appearance tab when clicked', () => {
    render(<SettingsView />)
    const appearanceTab = screen.getByText('Appearance')
    appearanceTab.click()

    expect(screen.getAllByText('Theme')[0]).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Font Size')).toBeInTheDocument()
  })

  it('switches to About tab when clicked', () => {
    render(<SettingsView />)
    const aboutTab = screen.getByText('About')
    aboutTab.click()

    expect(screen.getByText('OpenJuliet')).toBeInTheDocument()
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })

  it('shows provider presets in Providers tab', () => {
    render(<SettingsView />)
    screen.getByText('Providers').click()

    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
    expect(screen.getByText('Google AI')).toBeInTheDocument()
    expect(screen.getByText('OpenRouter')).toBeInTheDocument()
  })

  it('shows empty provider message when no providers configured', () => {
    render(<SettingsView />)
    screen.getByText('Providers').click()

    expect(screen.getByText('No providers configured yet. Add one above.')).toBeInTheDocument()
  })

  it('shows connected state in GitHub tab when connected', () => {
    useSettingsStore.setState({
      github: { isConnected: true, method: 'pat', username: 'octocat', token: 'ghp_test' }
    })

    render(<SettingsView />)
    screen.getByText('GitHub').click()

    expect(screen.getByText(/Connected as/)).toBeInTheDocument()
    expect(screen.getByText('Method: PAT')).toBeInTheDocument()
  })
})
