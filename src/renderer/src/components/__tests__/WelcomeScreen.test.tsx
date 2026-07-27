import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, setupBrowserMocks } from '../../test-utils'
import { useAppStore } from '../../stores/appStore'
import { useSettingsStore } from '../../stores/settingsStore'
import WelcomeScreen from '../features/WelcomeScreen'

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
    },
    p: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, exit, transition, variants, ...safeProps } = props
      return <p {...safeProps}>{children}</p>
    },
    button: ({ children, ...props }: Record<string, unknown>) => {
      const { whileHover, whileTap, initial, animate, exit, transition, variants, layout, layoutId, ...safeProps } = props
      return <button {...safeProps}>{children}</button>
    }
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))

// ──── Mock lucide-react icons ────
vi.mock('lucide-react', () => {
  const MockIcon = () => <span data-testid="mock-icon" />
  return {
    Sparkles: MockIcon,
    Github: MockIcon,
    Key: MockIcon,
    FolderOpen: MockIcon,
    ArrowRight: MockIcon,
    Cpu: MockIcon,
    ChevronRight: MockIcon,
    Check: MockIcon,
    Loader2: MockIcon
  }
})

// ──── Mock GlowText ────
vi.mock('../../ui/GlowText', () => ({
  GlowText: ({ children, ..._props }: { children?: React.ReactNode; [key: string]: unknown }) => <span>{children}</span>
}))

describe('WelcomeScreen', () => {
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
      isFirstLaunch: true,
      commandPaletteOpen: false,
      commandPaletteRecent: []
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
      github: { isConnected: false, method: 'none' },
      accentColor: '#6c5ce7',
      bgDensity: 50,
      animationSpeed: 'normal' as const
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the welcome title', () => {
    render(<WelcomeScreen />)
    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument()
    expect(screen.getByText('OpenJuliet')).toBeInTheDocument()
  })

  it('renders the app description', () => {
    render(<WelcomeScreen />)
    expect(
      screen.getByText(/A beautiful, open-source, local-first autonomous coding agent/i)
    ).toBeInTheDocument()
  })

  it('renders Get Started and Skip buttons on first step', () => {
    render(<WelcomeScreen />)
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.getByText("Skip setup — I'll configure later")).toBeInTheDocument()
  })

  it('navigates to github step when Get Started is clicked', () => {
    render(<WelcomeScreen />)
    const getStarted = screen.getByText('Get Started')
    getStarted.click()
    expect(screen.getByText('Connect GitHub')).toBeInTheDocument()
  })

  it('completes onboarding when Skip is clicked', () => {
    render(<WelcomeScreen />)
    const skipButton = screen.getByText("Skip setup — I'll configure later")
    skipButton.click()
    expect(useAppStore.getState().hasCompletedOnboarding).toBe(true)
  })

  it('shows StepIndicator after navigating to github step', () => {
    render(<WelcomeScreen />)
    const getStarted = screen.getByText('Get Started')
    getStarted.click()
    // Step indicator should be visible
    expect(screen.getByLabelText('Setup progress')).toBeInTheDocument()
  })

  it('can navigate back from github to welcome step', () => {
    render(<WelcomeScreen />)
    // Go to github step
    screen.getByText('Get Started').click()
    expect(screen.getByText('Connect GitHub')).toBeInTheDocument()

    // Go back
    const backButton = screen.getByText('Back')
    backButton.click()
    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument()
  })

  it('shows workspace step after continuing from github', () => {
    render(<WelcomeScreen />)
    screen.getByText('Get Started').click()
    // Click Continue/Skip on github step
    const skipBtn = screen.getByText('Skip')
    skipBtn.click()
    expect(screen.getByText('Select Workspace')).toBeInTheDocument()
  })

  it('shows provider step after continuing from workspace', () => {
    render(<WelcomeScreen />)
    screen.getByText('Get Started').click()
    screen.getByText('Skip').click()
    screen.getByText('Continue').click()
    expect(screen.getByText('Choose AI Provider')).toBeInTheDocument()
  })

  it('can navigate back through all steps correctly', () => {
    render(<WelcomeScreen />)
    // Go to provider step
    screen.getByText('Get Started').click()
    screen.getByText('Skip').click()
    screen.getByText('Continue').click()
    expect(screen.getByText('Choose AI Provider')).toBeInTheDocument()

    // Back to workspace
    const backButtons = screen.getAllByText('Back')
    backButtons[backButtons.length - 1].click()
    expect(screen.getByText('Select Workspace')).toBeInTheDocument()
  })

  it('renders AI provider presets on the provider step', () => {
    render(<WelcomeScreen />)
    screen.getByText('Get Started').click()
    screen.getByText('Skip').click()
    screen.getByText('Continue').click()
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
    expect(screen.getByText('Google AI')).toBeInTheDocument()
    expect(screen.getByText('OpenRouter')).toBeInTheDocument()
  })
})
