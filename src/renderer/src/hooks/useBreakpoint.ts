import { useMemo } from 'react'
import { useWindowSize } from './useWindowSize'

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const BREAKPOINTS: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': Infinity
}

const BREAKPOINT_LIST: [Breakpoint, number][] = [
  ['sm', 640],
  ['md', 768],
  ['lg', 1024],
  ['xl', 1280],
  ['2xl', Infinity]
]

/**
 * Resolve the current breakpoint name from width.
 * sm: <640, md: <768, lg: <1024, xl: <1280, 2xl: >=1280
 */
function resolveBreakpoint(width: number): Breakpoint {
  for (const [name, threshold] of BREAKPOINT_LIST) {
    if (width < threshold) {
      return name
    }
  }
  return '2xl'
}

/**
 * useBreakpoint — Returns the current breakpoint name ('sm', 'md', 'lg', 'xl', '2xl')
 * based on window width. Updates reactively via useWindowSize.
 */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowSize()
  return useMemo(() => resolveBreakpoint(width), [width])
}

export function useBreakpointValue<T>(values: Record<Breakpoint, T>): T {
  const breakpoint = useBreakpoint()
  return useMemo(() => values[breakpoint], [breakpoint, values])
}

export default useBreakpoint
