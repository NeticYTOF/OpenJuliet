import { useState, useEffect, useCallback, useRef } from 'react'

export interface WindowSize {
  width: number
  height: number
  isSmall: boolean
  isMedium: boolean
  isLarge: boolean
}

const SMALL_BREAKPOINT = 768
const MEDIUM_BREAKPOINT = 1024
const DEBOUNCE_MS = 100

function getWindowSize(): WindowSize {
  const width = window.innerWidth
  const height = window.innerHeight
  return {
    width,
    height,
    isSmall: width < SMALL_BREAKPOINT,
    isMedium: width >= SMALL_BREAKPOINT && width < MEDIUM_BREAKPOINT,
    isLarge: width >= MEDIUM_BREAKPOINT
  }
}

/**
 * useWindowSize — Returns debounced window dimensions and size categories.
 * Updates 100ms after the last resize event. Initializes on mount.
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(getWindowSize)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleResize = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setSize(getWindowSize())
    }, DEBOUNCE_MS)
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [handleResize])

  return size
}

export default useWindowSize
