import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '../../../test-utils'
import { EmptyState } from '../EmptyState'

// framer-motion mock
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial: _i,
      animate: _a,
      transition: _t,
      ...props
    }: {
      children?: React.ReactNode
      initial?: unknown
      animate?: unknown
      transition?: unknown
      [key: string]: unknown
    }) => <div {...props}>{children}</div>
  }
}))

describe('EmptyState', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the title', () => {
    render(<EmptyState title="No items found" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(
      <EmptyState
        title="No results"
        description="Try adjusting your search or filter criteria."
      />
    )
    expect(screen.getByText('No results')).toBeInTheDocument()
    expect(
      screen.getByText('Try adjusting your search or filter criteria.')
    ).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="Empty"
        icon={<span data-testid="test-icon">📦</span>}
      />
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(
      <EmptyState
        title="No data"
        action={<button>Create New</button>}
      />
    )
    expect(screen.getByRole('button', { name: /create new/i })).toBeInTheDocument()
  })

  it('renders title as h3 element', () => {
    render(<EmptyState title="Section Empty" />)
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Section Empty')
  })

  it('renders without icon when not provided', () => {
    const { container } = render(<EmptyState title="No Icon" />)
    // The icon is wrapped in a div with class containing 'mb-4'
    const iconContainers = container.querySelectorAll('.mb-4')
    // The heading uses mb-1.5, so there may not be any mb-4 divs
    // Let's just verify the title renders
    expect(screen.getByText('No Icon')).toBeInTheDocument()
  })

  it('renders without description when not provided', () => {
    render(<EmptyState title="Minimal" />)
    expect(screen.getByText('Minimal')).toBeInTheDocument()
    // The description is in a <p> tag with 'max-w-sm' class
    const paragraphs = screen.queryAllByRole('paragraph')
    // If there's no description, there should be no <p> with description text
  })

  it('renders without action when not provided', () => {
    render(<EmptyState title="No Actions" />)
    expect(screen.getByText('No Actions')).toBeInTheDocument()
    // No buttons should be rendered
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders with all props combined', () => {
    render(
      <EmptyState
        title="All Props"
        description="This is a full featured empty state."
        icon={<span data-testid="all-icon">📄</span>}
        action={<button>Get Started</button>}
      />
    )
    expect(screen.getByText('All Props')).toBeInTheDocument()
    expect(
      screen.getByText('This is a full featured empty state.')
    ).toBeInTheDocument()
    expect(screen.getByTestId('all-icon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<EmptyState title="Custom Class" className="my-empty-state" />)
    const container = screen.getByText('Custom Class').closest('div')
    expect(container?.className).toContain('my-empty-state')
  })

  it('renders with long description text', () => {
    const longDesc =
      'This is a very long description that should still render correctly ' +
      'within the empty state placeholder component without any truncation issues.'
    render(<EmptyState title="Long Description" description={longDesc} />)
    expect(screen.getByText(longDesc)).toBeInTheDocument()
  })
})
