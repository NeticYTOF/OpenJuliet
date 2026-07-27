import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, setupBrowserMocks } from '../../../test-utils'
import { Terminal } from '../Terminal'

// ──── Mock framer-motion ────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, variants, ...safeProps } = props
      return <div {...safeProps}>{children}</div>
    }
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))

// ──── Mock lucide-react icons ────
vi.mock('lucide-react', () => {
  const MockIcon = () => <span data-testid="mock-icon" />
  return {
    Terminal: MockIcon,
    X: MockIcon,
    Copy: MockIcon,
    Trash2: MockIcon,
    ChevronDown: MockIcon,
    Maximize2: MockIcon,
    Minimize2: MockIcon
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

  it('shows the prompt symbol', () => {
    render(<Terminal output={[]} prompt="# " />)
    expect(screen.getByText('#')).toBeInTheDocument()
  })

  it('shows default prompt when not specified', () => {
    render(<Terminal output={[]} />)
    expect(screen.getByText('$')).toBeInTheDocument()
  })

  it('shows placeholder text in the input', () => {
    render(<Terminal output={[]} placeholder="Type something..." />)
    const input = screen.getByPlaceholderText('Type something...')
    expect(input).toBeInTheDocument()
  })

  it('disables input when not connected', () => {
    render(<Terminal output={[]} connected={false} />)
    const input = screen.getByPlaceholderText('Type a command...')
    expect(input).toBeDisabled()
  })

  it('renders output lines', () => {
    const output = [
      { id: '1', text: 'Hello', type: 'output' as const },
      { id: '2', text: 'World', type: 'output' as const }
    ]
    render(<Terminal output={output} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('World')).toBeInTheDocument()
  })

  it('renders error lines with error styling', () => {
    const output = [
      { id: '1', text: 'Error: something went wrong', type: 'error' as const }
    ]
    render(<Terminal output={output} />)
    expect(screen.getByText('Error: something went wrong')).toBeInTheDocument()
  })

  it('renders info lines', () => {
    const output = [
      { id: '1', text: 'System ready', type: 'info' as const }
    ]
    render(<Terminal output={output} />)
    expect(screen.getByText('System ready')).toBeInTheDocument()
  })

  it('renders system lines', () => {
    const output = [
      { id: '1', text: 'SYSTEM: initialized', type: 'system' as const }
    ]
    render(<Terminal output={output} />)
    expect(screen.getByText('SYSTEM: initialized')).toBeInTheDocument()
  })

  it('renders input lines with accent color styling', () => {
    const output = [
      { id: '1', text: 'npm run test', type: 'input' as const }
    ]
    render(<Terminal output={output} />)
    expect(screen.getByText('npm run test')).toBeInTheDocument()
  })

  it('submits a command when Enter is pressed', () => {
    const onCommand = vi.fn()
    render(<Terminal output={[]} onCommand={onCommand} />)

    const input = screen.getByPlaceholderText('Type a command...')
    fireEvent.change(input, { target: { value: 'ls -la' } })

    // Find and submit the form directly (Enter in input triggers form submit)
    const form = input.closest('form') as HTMLFormElement
    fireEvent.submit(form)

    expect(onCommand).toHaveBeenCalledWith('ls -la')
  })

  it('does not submit empty or whitespace-only commands', () => {
    const onCommand = vi.fn()
    render(<Terminal output={[]} onCommand={onCommand} />)

    const input = screen.getByPlaceholderText('Type a command...')
    fireEvent.change(input, { target: { value: '   ' } })

    const form = input.closest('form') as HTMLFormElement
    fireEvent.submit(form)

    expect(onCommand).not.toHaveBeenCalled()
  })

  it('clears input after submitting a command', () => {
    const onCommand = vi.fn()
    render(<Terminal output={[]} onCommand={onCommand} />)

    const input = screen.getByPlaceholderText('Type a command...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'git status' } })

    const form = input.closest('form') as HTMLFormElement
    fireEvent.submit(form)

    expect(input.value).toBe('')
  })

  it('navigates command history with ArrowUp and ArrowDown', () => {
    render(<Terminal output={[]} onCommand={vi.fn()} />)
    const input = screen.getByPlaceholderText('Type a command...') as HTMLInputElement
    const form = input.closest('form') as HTMLFormElement

    // Submit two commands
    fireEvent.change(input, { target: { value: 'first' } })
    fireEvent.submit(form)

    fireEvent.change(input, { target: { value: 'second' } })
    fireEvent.submit(form)

    // ArrowUp should show the most recent command
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.value).toBe('second')

    // ArrowUp again should go further back
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.value).toBe('first')

    // ArrowDown should go forward
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.value).toBe('second')

    // ArrowDown again should clear the input
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.value).toBe('')
  })

  it('shows empty state message when no output', () => {
    render(<Terminal output={[]} />)
    expect(screen.getByText(/Terminal ready/i)).toBeInTheDocument()
  })

  it('shows expand/minimize buttons', () => {
    render(<Terminal output={[]} />)
    expect(screen.getByTitle('Expand')).toBeInTheDocument()
    expect(screen.getByTitle('Hide terminal')).toBeInTheDocument()
  })

  it('toggles expanded state when expand button is clicked', () => {
    render(<Terminal output={[]} />)
    const expandBtn = screen.getByTitle('Expand')
    fireEvent.click(expandBtn)

    // After click, should show collapse button
    expect(screen.getByTitle('Collapse')).toBeInTheDocument()
  })

  it('triggers clipboard copy when copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    })

    const output = [
      { id: '1', text: 'output line 1', type: 'output' as const },
      { id: '2', text: 'output line 2', type: 'output' as const }
    ]
    render(<Terminal output={output} />)

    const copyBtn = screen.getByTitle('Copy output')
    copyBtn.click()

    expect(writeText).toHaveBeenCalledWith('output line 1\noutput line 2')
  })
})
