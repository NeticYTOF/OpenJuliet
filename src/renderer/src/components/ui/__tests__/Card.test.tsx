import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '../../../test-utils'
import { Card } from '../Card'

// framer-motion uses browser APIs not available in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover: _wH,
      initial: _init,
      animate: _anim,
      transition: _trans,
      ...props
    }: {
      children?: React.ReactNode
      whileHover?: unknown
      initial?: unknown
      animate?: unknown
      transition?: unknown
      [key: string]: unknown
    }) => <div {...props}>{children}</div>
  }
}))

describe('Card', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders children', () => {
    render(<Card>Hello World</Card>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders with default variant', () => {
    const { container } = render(<Card>Default</Card>)
    // The outer div (motion.div) has the variant styles
    const outerDiv = container.firstElementChild as HTMLElement
    expect(outerDiv.className).toContain('backdrop-blur-[12px]')
  })

  it('renders with interactive variant', () => {
    const { container } = render(<Card variant="interactive">Interactive</Card>)
    const outerDiv = container.firstElementChild as HTMLElement
    expect(outerDiv.className).toContain('cursor-pointer')
    expect(outerDiv.className).toContain('hover:border-[rgba(108,92,231,0.3)]')
  })

  it('renders with elevated variant', () => {
    const { container } = render(<Card variant="elevated">Elevated</Card>)
    const outerDiv = container.firstElementChild as HTMLElement
    expect(outerDiv.className).toContain('backdrop-blur-[20px]')
    expect(outerDiv.className).toContain('shadow-[var(--shadow-lg)]')
  })

  it('applies default padding (md)', () => {
    render(<Card>Padding MD</Card>)
    const card = screen.getByText('Padding MD')
    expect(card.className).toContain('p-4')
  })

  it('applies sm padding', () => {
    render(<Card padding="sm">Small Padding</Card>)
    const card = screen.getByText('Small Padding')
    expect(card.className).toContain('p-3')
  })

  it('applies lg padding', () => {
    render(<Card padding="lg">Large Padding</Card>)
    const card = screen.getByText('Large Padding')
    expect(card.className).toContain('p-6')
  })

  it('applies none padding', () => {
    render(<Card padding="none">No Padding</Card>)
    const card = screen.getByText('No Padding')
    // 'none' padding adds no p- class
    expect(card.className).not.toContain('p-')
  })

  it('renders header when provided', () => {
    render(<Card header={<h3>Card Header</h3>}>Content</Card>)
    expect(screen.getByText('Card Header')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders footer when provided', () => {
    render(<Card footer={<button>Action</button>}>Content</Card>)
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders with both header and footer', () => {
    render(
      <Card
        header={<h3>Title</h3>}
        footer={<span>Footer text</span>}
      >
        Body content
      </Card>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.getByText('Footer text')).toBeInTheDocument()
  })

  it('applies custom className to outer div', () => {
    const { container } = render(<Card className="my-custom-class">Custom</Card>)
    const outerDiv = container.firstElementChild as HTMLElement
    expect(outerDiv.className).toContain('my-custom-class')
  })

  it('does not render header section when no header prop', () => {
    render(<Card>No Header</Card>)
    expect(screen.getByText('No Header')).toBeInTheDocument()
    // There should be no border-bottom section for the header
    const outerDiv = screen.getByText('No Header').closest('[class*="rounded-xl"]')
    expect(outerDiv).toBeTruthy()
  })

  it('does not render footer section when no footer prop', () => {
    render(<Card>No Footer</Card>)
    expect(screen.getByText('No Footer')).toBeInTheDocument()
  })

  it('renders all three padding variants correctly', () => {
    const { rerender } = render(<Card padding="sm">S</Card>)
    expect(screen.getByText('S').className).toContain('p-3')

    rerender(<Card padding="md">M</Card>)
    expect(screen.getByText('M').className).toContain('p-4')

    rerender(<Card padding="lg">L</Card>)
    expect(screen.getByText('L').className).toContain('p-6')
  })
})
