import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '../../../test-utils'
import { Button } from '../Button'

// framer-motion uses browser APIs that aren't available in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      whileHover: _wH,
      whileTap: _wT,
      ...props
    }: {
      children?: React.ReactNode
      whileHover?: unknown
      whileTap?: unknown
      [key: string]: unknown
    }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))

describe('Button', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('applies the default variant (primary)', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-[var(--color-accent)]')
    expect(btn.className).toContain('text-white')
  })

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-[var(--color-surface)]')
  })

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('hover:bg-[var(--color-bg-tertiary)]')
  })

  it('applies danger variant', () => {
    render(<Button variant="danger">Danger</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-[var(--color-error)]')
  })

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('border')
  })

  it('applies sm size classes', () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('px-3 py-1.5')
  })

  it('applies lg size classes', () => {
    render(<Button size="lg">Large</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('px-6 py-2.5')
  })

  it('shows loading spinner and disables when loading', () => {
    render(<Button loading>Loading</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.querySelector('.animate-spin')).toBeTruthy()
  })

  it('disables the button when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Full</Button>)
    expect(screen.getByRole('button').className).toContain('w-full')
  })

  it('fires onClick handler', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders an icon when provided', () => {
    render(<Button icon={<span data-testid="test-icon">🔍</span>}>Search</Button>)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByRole('button').className).toContain('custom-class')
  })

  it('forwards ref', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
