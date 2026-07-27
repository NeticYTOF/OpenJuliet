import { type ReactElement, type PropsWithChildren } from 'react'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { vi } from 'vitest'

// ──── Mock IPC (window.api) ────

/**
 * Sets up mock implementations for `window.api` (Electron IPC bridge).
 * Call this at the top of test files or in describe blocks that interact
 * with the preload API.
 */
export function mockIpc(): void {
  Object.defineProperty(window, 'api', {
    value: {
      minimize: vi.fn(),
      maximize: vi.fn(),
      close: vi.fn(),
      isMaximized: vi.fn().mockResolvedValue(false),
      openFile: vi.fn().mockResolvedValue(null),
      openDirectory: vi.fn().mockResolvedValue(null),
      getAppVersion: vi.fn().mockResolvedValue('1.0.0'),
      setTitle: vi.fn(),
      onMenuAction: vi.fn(),
      removeMenuActionListener: vi.fn(),
      platform: 'win32'
    },
    configurable: true,
    writable: true
  })
}

// ──── Mock ResizeObserver ────

/**
 * Vitest in jsdom does not include ResizeObserver.
 * Provide a no-op stub so components (e.g. framer-motion) do not crash.
 */
export function mockResizeObserver(): void {
  window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })) as unknown as typeof ResizeObserver
}

// ──── Mock IntersectionObserver ────

export function mockIntersectionObserver(): void {
  window.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn().mockReturnValue([]),
    root: null,
    rootMargin: '',
    thresholds: []
  })) as unknown as typeof IntersectionObserver
}

// ──── Mock matchMedia ────

export function mockMatchMedia(): void {
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    })),
    configurable: true,
    writable: true
  })
}

// ──── Set up all browser mocks ────

/**
 * Call once per test file / describe block to register all required
 * browser polyfills and stubs.
 */
export function setupBrowserMocks(): void {
  mockResizeObserver()
  mockIntersectionObserver()
  mockMatchMedia()
}

// ──── Custom Render ────

/**
 * Wrapper component that provides any necessary providers/context.
 * Extend this as the app grows (e.g. add Router, QueryClientProvider, etc.)
 */
function AllProviders({ children }: PropsWithChildren): JSX.Element {
  return <>{children}</>
}

/**
 * Custom render function that wraps the UI with AllProviders.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'

// Override render with our custom one
export { customRender as render }
