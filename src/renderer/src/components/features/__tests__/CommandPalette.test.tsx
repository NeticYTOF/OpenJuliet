import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, setupBrowserMocks } from '../../../test-utils'
import { useAppStore } from '../../../stores/appStore'
import CommandPalette from '../../features/CommandPalette'

// ──── Mock framer-motion ────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, variants, ...safeProps } = props
      return <div {...safeProps}>{children}</div>
    },
    button: ({ children, onMouseEnter, ...props }: { children?: React.ReactNode; onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>; [key: string]: unknown }) => {
      const { whileHover, whileTap, initial, animate, exit, transition, variants, layout, layoutId, ...safeProps } = props
      return <button {...safeProps} onMouseEnter={onMouseEnter}>{children}</button>
    }
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))

// ──── Mock lucide-react icons ────
vi.mock('lucide-react', () => {
  const MockIcon = () => <span data-testid="mock-icon" />
  return {
    LayoutDashboard: MockIcon,
    GitBranch: MockIcon,
    Bug: MockIcon,
    ListChecks: MockIcon,
    Code: MockIcon,
    Settings: MockIcon,
    Plus: MockIcon,
    Download: MockIcon,
    Rocket: MockIcon,
    Terminal: MockIcon,
    History: MockIcon,
    Search: MockIcon,
    Command: MockIcon
  }
})

describe('CommandPalette', () => {
  beforeEach(() => {
    setupBrowserMocks()
    localStorage.clear()
    // Mock scrollIntoView for jsdom
    Element.prototype.scrollIntoView = vi.fn()
    useAppStore.setState({
      activeView: 'dashboard',
      sidebarOpen: true,
      theme: 'dark',
      currentProject: null,
      currentTask: null,
      notifications: [],
      hasCompletedOnboarding: true,
      isFirstLaunch: false,
      commandPaletteOpen: true,
      commandPaletteRecent: [],
      keyboardShortcutsOpen: false
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders when commandPaletteOpen is true', () => {
    render(<CommandPalette />)
    expect(screen.getByPlaceholderText(/Search commands/i)).toBeInTheDocument()
  })

  it('does not render when commandPaletteOpen is false', () => {
    useAppStore.setState({ commandPaletteOpen: false })
    render(<CommandPalette />)
    expect(screen.queryByPlaceholderText(/Search commands/i)).not.toBeInTheDocument()
  })

  it('renders navigation section items', () => {
    render(<CommandPalette />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Repositories')).toBeInTheDocument()
    expect(screen.getByText('Issues')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Editor')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders action section items', () => {
    render(<CommandPalette />)
    expect(screen.getByText('New Task')).toBeInTheDocument()
    expect(screen.getByText('Clone Repo')).toBeInTheDocument()
    expect(screen.getByText('Run Tests')).toBeInTheDocument()
    expect(screen.getByText('Open Terminal')).toBeInTheDocument()
  })

  it('renders section headers', () => {
    render(<CommandPalette />)
    const navigateHeaders = screen.getAllByText('Navigate')
    expect(navigateHeaders.length).toBeGreaterThan(0)
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  it('filters items when typing a query', () => {
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText(/Search commands/i)

    // Type 'dashboard' - should filter to just Dashboard
    fireEvent.change(input, { target: { value: 'dashboard' } })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Repositories')).not.toBeInTheDocument()
  })

  it('shows no results message for unmatched queries', () => {
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText(/Search commands/i)

    fireEvent.change(input, { target: { value: 'zzzznotfound' } })
    expect(screen.getByText(/No results/i)).toBeInTheDocument()
  })

  it('performs fuzzy search', () => {
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText(/Search commands/i)

    // 'dsh' should fuzzy-match 'Dashboard'
    fireEvent.change(input, { target: { value: 'dsh' } })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('navigates selection with ArrowDown', () => {
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText(/Search commands/i)

    // First item should be selected initially (selectedIndex=0)
    const items = screen.getAllByRole('button')
    expect(items[0].getAttribute('data-selected')).toBe('true')

    // Press ArrowDown to move selection to item 1
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    // After pressing ArrowDown, item 0 should no longer be selected
    // and item 1 should be selected
    const cmdItems = document.querySelectorAll('[data-cmd-item]')
    expect(cmdItems[0].getAttribute('data-selected')).toBe('false')
    expect(cmdItems[1].getAttribute('data-selected')).toBe('true')
  })

  it('executes item action on Enter', () => {
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText(/Search commands/i)

    // Press Enter on the first item (Dashboard)
    fireEvent.keyDown(input, { key: 'Enter' })

    // Should have navigated to dashboard and closed palette
    expect(useAppStore.getState().activeView).toBe('dashboard')
    expect(useAppStore.getState().commandPaletteOpen).toBe(false)
  })

  it('closes on Escape', () => {
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText(/Search commands/i)

    fireEvent.keyDown(input, { key: 'Escape' })

    expect(useAppStore.getState().commandPaletteOpen).toBe(false)
  })

  it('closes when backdrop is clicked', () => {
    render(<CommandPalette />)
    // The backdrop is the element with backdrop-blur-sm class
    const backdrop = document.querySelector('[class*="backdrop-blur-sm"]')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(useAppStore.getState().commandPaletteOpen).toBe(false)
    }
  })

  it('resets query when query is cleared', () => {
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText(/Search commands/i) as HTMLInputElement

    // Type a query then clear it
    fireEvent.change(input, { target: { value: 'dashboard' } })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '' } })
    // All items should be visible again
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Repositories')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('adds items to recent list when executed', () => {
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText(/Search commands/i)

    // Type to filter and execute a specific item
    fireEvent.change(input, { target: { value: 'settings' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    // Should have added to recent
    expect(useAppStore.getState().commandPaletteRecent).toContain('nav:settings')
  })

  it('shows recent items section when there are recent items', () => {
    // Pre-populate some recent items
    useAppStore.setState({
      commandPaletteRecent: ['nav:dashboard', 'nav:settings']
    })

    render(<CommandPalette />)
    // Recent section should be visible (multiple elements match because item badges also show 'Recent')
    const recentElements = screen.getAllByText('Recent')
    expect(recentElements.length).toBeGreaterThan(0)
  })

  it('renders shortcut badges on navigation items', () => {
    render(<CommandPalette />)
    // Dashboard should show ⌘1
    expect(screen.getByText('⌘1')).toBeInTheDocument()
    expect(screen.getByText('⌘2')).toBeInTheDocument()
    expect(screen.getByText('⌘6')).toBeInTheDocument()
  })
})
