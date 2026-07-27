import { describe, it, expect, vi, afterEach } from 'vitest'
import React from 'react'
import { render, screen, cleanup } from '../../../test-utils'
import { Dialog } from '../Dialog'

// framer-motion mock
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      variants: _v,
      initial: _i,
      animate: _a,
      exit: _e,
      ...props
    }: {
      children?: React.ReactNode
      variants?: unknown
      initial?: unknown
      animate?: unknown
      exit?: unknown
      [key: string]: unknown
    }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))

// Mock Radix UI Dialog primitives with proper asChild handling
vi.mock('@radix-ui/react-dialog', () => {
  const ReactMod = require('react')

  // Context to pass onOpenChange to Close button
  const DialogContext = ReactMod.createContext<{ onOpenChange?: (open: boolean) => void }>({})

  const Root = ({
    children,
    open,
    onOpenChange
  }: {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => {
    if (!open) return null
    return (
      <div data-testid="dialog-root" data-open={String(open)}>
        <DialogContext.Provider value={{ onOpenChange }}>{children}</DialogContext.Provider>
      </div>
    )
  }

  const Portal = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="dialog-portal">{children}</div>
  )

  const Overlay = ({ children, asChild, ...props }: { children?: React.ReactNode; asChild?: boolean; [key: string]: unknown }) => {
    // Handle asChild: render child with our props merged
    if (asChild && children) {
      const child = ReactMod.Children.only(children)
      return ReactMod.cloneElement(child, { 'data-testid': 'dialog-overlay', ...props })
    }
    return <div data-testid="dialog-overlay" {...props}>{children}</div>
  }

  const Content = ({ children, asChild, ...props }: { children?: React.ReactNode; asChild?: boolean; [key: string]: unknown }) => {
    // Handle asChild: render the child with our data-testid and merged props
    if (asChild && children) {
      const child = ReactMod.Children.only(children)
      return ReactMod.cloneElement(child, { 'data-testid': 'dialog-content', ...props })
    }
    return <div data-testid="dialog-content" {...props}>{children}</div>
  }

  const Title = (props: { children?: React.ReactNode; [key: string]: unknown }) => (
    <h2 data-testid="dialog-title" {...props} />
  )

  const Description = (props: { children?: React.ReactNode; [key: string]: unknown }) => (
    <p data-testid="dialog-desc" {...props} />
  )

  const Close = (props: { children?: React.ReactNode; [key: string]: unknown }) => {
    const { onOpenChange } = ReactMod.useContext(DialogContext)
    return (
      <button
        data-testid="dialog-close"
        onClick={() => onOpenChange?.(false)}
        {...props}
      />
    )
  }

  return {
    Root,
    Portal,
    Overlay,
    Content,
    Title,
    Description,
    Close
  }
})

describe('Dialog', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders children when open', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <p>Dialog content</p>
      </Dialog>
    )
    expect(screen.getByText('Dialog content')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <Dialog open={false} onOpenChange={() => {}}>
        <p>Should not be visible</p>
      </Dialog>
    )
    expect(screen.queryByText('Should not be visible')).not.toBeInTheDocument()
  })

  it('renders the title when provided', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} title="Test Dialog">
        <p>Content</p>
      </Dialog>
    )
    expect(screen.getByText('Test Dialog')).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} description="This is a description">
        <p>Content</p>
      </Dialog>
    )
    expect(screen.getByText('This is a description')).toBeInTheDocument()
  })

  it('renders footer when provided', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} footer={<button>Confirm</button>}>
        <p>Content</p>
      </Dialog>
    )
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
  })

  it('shows close button by default', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} title="With Close">
        <p>Content</p>
      </Dialog>
    )
    expect(screen.getByTestId('dialog-close')).toBeInTheDocument()
  })

  it('hides close button when showClose is false', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} title="No Close" showClose={false}>
        <p>Content</p>
      </Dialog>
    )
    expect(screen.queryByTestId('dialog-close')).not.toBeInTheDocument()
  })

  it('calls onOpenChange when close button is clicked', () => {
    const onOpenChange = vi.fn()
    render(
      <Dialog open={true} onOpenChange={onOpenChange} title="Clickable">
        <p>Content</p>
      </Dialog>
    )
    const closeBtn = screen.getByTestId('dialog-close')
    closeBtn.click()
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders with different sizes - sm', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} size="sm" title="Sm">
        <p>Small dialog</p>
      </Dialog>
    )
    const content = screen.getByTestId('dialog-content')
    expect(content.className).toContain('max-w-sm')
  })

  it('renders with different sizes - lg', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} size="lg" title="Lg">
        <p>Large dialog</p>
      </Dialog>
    )
    const content = screen.getByTestId('dialog-content')
    expect(content.className).toContain('max-w-lg')
  })

  it('renders with different sizes - xl', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} size="xl" title="Xl">
        <p>XL dialog</p>
      </Dialog>
    )
    const content = screen.getByTestId('dialog-content')
    expect(content.className).toContain('max-w-xl')
  })

  it('renders with full size', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} size="full" title="Full">
        <p>Full dialog</p>
      </Dialog>
    )
    const content = screen.getByTestId('dialog-content')
    expect(content.className).toContain('max-w-[90vw]')
    expect(content.className).toContain('max-h-[85vh]')
  })

  it('applies custom className', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} className="custom-class" title="Custom">
        <p>Custom styled</p>
      </Dialog>
    )
    const content = screen.getByTestId('dialog-content')
    expect(content.className).toContain('custom-class')
  })

  it('renders overlay when open', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <p>Content</p>
      </Dialog>
    )
    expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument()
  })

  it('toggles from closed to open state', () => {
    const { rerender } = render(
      <Dialog open={false} onOpenChange={() => {}} title="Toggle">
        <p>Hidden</p>
      </Dialog>
    )
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()

    rerender(
      <Dialog open={true} onOpenChange={() => {}} title="Toggle">
        <p>Visible</p>
      </Dialog>
    )
    expect(screen.getByText('Visible')).toBeInTheDocument()
  })

  it('renders title even when showClose is false', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} title="Just Title" showClose={false}>
        <p>Content</p>
      </Dialog>
    )
    expect(screen.getByText('Just Title')).toBeInTheDocument()
  })
})
