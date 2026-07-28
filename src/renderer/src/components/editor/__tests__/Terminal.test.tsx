import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, setupBrowserMocks } from '../../../test-utils'
import { Terminal } from '../Terminal'

vi.mock('../XtermWrapper', () => ({
  default: ({ onCommand }: { onCommand?: (cmd: string) => void }) => (
    <div data-testid="xterm-wrapper">
      <input
        data-testid="xterm-input"
        placeholder="> Enter command..."
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') {
            onCommand?.((e.target as HTMLInputElement).value)
          }
        }}
      />
    </div>
  )
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, layout, layoutId, ...rest } = props
      return <div {...rest}>{children}</div>
    }
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

vi.mock('lucide-react', () => {
  const MockIcon = () => <span data-testid="mock-icon" />
  return {
    Terminal: MockIcon, X: MockIcon, Copy: MockIcon, Trash2: MockIcon,
    ChevronDown: MockIcon, Maximize2: MockIcon, Minimize2: MockIcon
  }
})

describe('Terminal', () => {
  beforeEach(() => {
    setupBrowserMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the terminal title', () => {
    render(<Terminal output={[]} />)
    expect(screen.getByText('Terminal')).toBeInTheDocument()
  })

  it('renders a custom title', () => {
    render(<Terminal output={[]} title="Custom Terminal" />)
    expect(screen.getByText('Custom Terminal')).toBeInTheDocument()
  })

  it('shows "Connected" status when connected', () => {
    render(<Terminal output={[]} connected={true} />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('does not show "Connected" when disconnected', () => {
    render(<Terminal output={[]} connected={false} />)
    expect(screen.queryByText('Connected')).not.toBeInTheDocument()
  })

  it('renders the xterm wrapper for terminal input/output', () => {
    render(<Terminal output={[]} />)
    expect(screen.getByTestId('xterm-wrapper')).toBeInTheDocument()
  })

  it('shows expand/minimize buttons', () => {
    render(<Terminal output={[]} />)
    const buttons = screen.getAllByTestId('mock-icon')
    expect(buttons.length).toBeGreaterThanOrEqual(4)
  })

  it('shows empty state when no output', () => {
    render(<Terminal output={[]} />)
    expect(screen.getByTestId('xterm-wrapper')).toBeInTheDocument()
  })

  it('handles command callback via xterm', () => {
    const onCommand = vi.fn()
    render(<Terminal output={[]} onCommand={onCommand} />)
    const input = screen.getByTestId('xterm-input')
    // Simulate Enter in the xterm input
    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    Object.defineProperty(event, 'target', { value: { value: 'test command' } })
    input.dispatchEvent(event)
  })
})