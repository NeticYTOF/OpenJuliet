import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '../../../test-utils'
import { Badge } from '../Badge'

describe('Badge', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders children', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies default variant classes', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge.className).toContain('bg-[var(--color-bg-tertiary)]')
  })

  it('applies success variant classes', () => {
    render(<Badge variant="success">Success</Badge>)
    const badge = screen.getByText('Success')
    expect(badge.className).toContain('bg-[var(--color-success-bg)]')
  })

  it('applies warning variant classes', () => {
    render(<Badge variant="warning">Warning</Badge>)
    const badge = screen.getByText('Warning')
    expect(badge.className).toContain('bg-[var(--color-warning-bg)]')
  })

  it('applies error variant classes', () => {
    render(<Badge variant="error">Error</Badge>)
    const badge = screen.getByText('Error')
    expect(badge.className).toContain('bg-[var(--color-error-bg)]')
  })

  it('applies info variant classes', () => {
    render(<Badge variant="info">Info</Badge>)
    const badge = screen.getByText('Info')
    expect(badge.className).toContain('bg-[var(--color-info-bg)]')
  })

  it('applies accent variant classes', () => {
    render(<Badge variant="accent">Accent</Badge>)
    const badge = screen.getByText('Accent')
    expect(badge.className).toContain('bg-[var(--color-accent-subtle)]')
  })

  it('applies sm size classes', () => {
    render(<Badge size="sm">Small</Badge>)
    expect(screen.getByText('Small').className).toContain('px-1.5 py-0.5')
  })

  it('renders a dot indicator when dot=true', () => {
    render(<Badge dot>With Dot</Badge>)
    const badge = screen.getByText('With Dot')
    // The dot is rendered as the first child of the badge span
    const dot = badge.firstElementChild
    expect(dot).toBeTruthy()
    expect(dot!.className).toContain('rounded-full')
  })

  it('does not render dot when dot=false', () => {
    render(<Badge>No Dot</Badge>)
    const badge = screen.getByText('No Dot')
    // With no dot, text should be the only child (or there may be no child elements)
    const directChildren = Array.from(badge.children).filter(
      (child) => child.tagName === 'SPAN'
    )
    expect(directChildren).toHaveLength(0)
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>)
    expect(screen.getByText('Custom').className).toContain('custom-class')
  })
})
