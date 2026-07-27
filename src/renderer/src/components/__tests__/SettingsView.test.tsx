import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, setupBrowserMocks } from '../../test-utils'
import { useSettingsStore } from '../../stores/settingsStore'
import SettingsView from '../features/SettingsView'

// ──── Mock framer-motion ────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, variants, layout, layoutId, whileHover, whileTap, whileInView, ...safeProps } = props
      return <div {...safeProps}>{children}</div>
    },
    span: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, variants, ...safeProps } = props
      return <span {...safeProps}>{children}</span>
    },
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { whileHover, whileTap, initial, animate, exit, transition, variants, layout, layoutId, ...safeProps } = props
      return <button {...safeProps}>{children}</button>
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
    Shield: MockIcon,
    Loader2: MockIcon,
    BookOpen: MockIcon
  }
})

// ──── Mock @radix-ui/react-tabs ────
// Radix Tabs doesn't work well in jsdom with React 19's event delegation.
// We provide a lightweight mock that supports controlled tab switching.
vi.mock('@radix-ui/react-tabs', () => {
  const ReactMock = require('react')
  const { createContext, useContext, useState, useCallback } = ReactMock

  const TabsContext = createContext<{
    value: string
    onValueChange: (v: string) => void
  }>({ value: '', onValueChange: () => {} })

  const Root = ({ children, value, onValueChange, ...props }: Record<string, unknown>) => {
    return (
      <TabsContext.Provider value={{ value: value as string, onValueChange: onValueChange as (v: string) => void }}>
        <div data-orientation={props.orientation} {...props}>{children}</div>
      </TabsContext.Provider>
    )
  }

  const List = ({ children, ...props }: Record<string, unknown>) => {
    return <div role="tablist" {...props}>{children}</div>
  }

  const Trigger = ({ children, value, ...props }: Record<string, unknown>) => {
    const ctx = useContext(TabsContext)
    const isActive = ctx.value === value
    return (
      <button
        role="tab"
        data-state={isActive ? 'active' : 'inactive'}
        aria-selected={isActive}
        onClick={() => ctx.onValueChange(value as string)}
        {...props}
      >
        {children}
      </button>
    )
  }

  const Content = ({ children, value: tabValue, ...props }: Record<string, unknown>) => {
    const ctx = useContext(TabsContext)
    if (ctx.value !== tabValue) return null
    return <div role="tabpanel" {...props}>{children}</div>
  }

  return { Root, List, Trigger, Content }
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
    fireEvent.click(providersTab)

    // The Providers tab content should now be visible
    expect(screen.getByText('AI Providers')).toBeInTheDocument()
  })

  it('switches to GitHub tab when clicked', () => {
    render(<SettingsView />)
    const githubTab = screen.getByText('GitHub')
    fireEvent.click(githubTab)

    expect(screen.getByText('GitHub Authentication')).toBeInTheDocument()
  })

  it('switches to Execution tab when clicked', () => {
    render(<SettingsView />)
    const execTab = screen.getByText('Execution')
    fireEvent.click(execTab)

    expect(screen.getByText('Execution Settings')).toBeInTheDocument()
    expect(screen.getByText('Sandbox mode')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('switches to Appearance tab when clicked', () => {
    render(<SettingsView />)
    const appearanceTab = screen.getByText('Appearance')
    fireEvent.click(appearanceTab)

    expect(screen.getAllByText('Theme')[0]).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Font Size')).toBeInTheDocument()
  })

  it('switches to About tab when clicked', () => {
    render(<SettingsView />)
    const aboutTab = screen.getByText('About')
    fireEvent.click(aboutTab)

    expect(screen.getByText('OpenJuliet')).toBeInTheDocument()
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })

  it('shows provider presets in Providers tab', () => {
    render(<SettingsView />)
    fireEvent.click(screen.getByText('Providers'))

    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
    expect(screen.getByText('Google AI')).toBeInTheDocument()
    expect(screen.getByText('OpenRouter')).toBeInTheDocument()
  })

  it('shows empty provider message when no providers configured', () => {
    render(<SettingsView />)
    fireEvent.click(screen.getByText('Providers'))

    expect(screen.getByText('No providers configured yet. Add one above.')).toBeInTheDocument()
  })

  it('shows connected state in GitHub tab when connected', () => {
    useSettingsStore.setState({
      github: { isConnected: true, method: 'pat', username: 'octocat', token: 'ghp_test' }
    })

    render(<SettingsView />)
    fireEvent.click(screen.getByText('GitHub'))

    expect(screen.getByText(/Connected as/)).toBeInTheDocument()
    expect(screen.getByText('Method: PAT')).toBeInTheDocument()
  })
})
