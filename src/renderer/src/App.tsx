import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from './stores/appStore'
import { useKeyboard } from './hooks/useKeyboard'
import { MotionConfig } from './components/ui/MotionConfig'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import AppLayout from './components/layout/AppLayout'
import WelcomeScreen from './components/features/WelcomeScreen'
import SplashScreen from './components/features/SplashScreen'

/**
 * Root application component.
 * Manages splash → welcome → app flow, keyboard shortcuts,
 * and catches rendering errors with ErrorBoundary.
 */
function App(): JSX.Element {
  const { hasCompletedOnboarding } = useAppStore()
  const [showSplash, setShowSplash] = useState(true)
  const [splashDone, setSplashDone] = useState(false)

  useKeyboard()

  // If onboarding is already complete, skip splash entirely
  useEffect(() => {
    if (hasCompletedOnboarding) {
      setShowSplash(false)
      setSplashDone(true)
    }
  }, [hasCompletedOnboarding])

  // Once splash is done, hide it (allowing AppLayout or WelcomeScreen to render)
  const handleSplashComplete = (): void => {
    setSplashDone(true)
    // Brief delay before hiding splash for smooth transition
    setTimeout(() => setShowSplash(false), 400)
  }

  /* Prevent right-click context menu in production feel */
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (e.target instanceof HTMLElement && e.target.closest('[data-contextmenu-enabled]')) {
        return
      }
    }
    document.addEventListener('contextmenu', handler)
    return () => document.removeEventListener('contextmenu', handler)
  }, [])

  return (
    <ErrorBoundary>
      <MotionConfig>
        {showSplash ? (
          <SplashScreen
            key="splash"
            onComplete={handleSplashComplete}
            minDuration={3000}
          />
        ) : (
          <AnimatePresence mode="wait">
            {!hasCompletedOnboarding ? (
              <WelcomeScreen key="welcome" />
            ) : (
              <AppLayout key="app" />
            )}
          </AnimatePresence>
        )}
      </MotionConfig>
    </ErrorBoundary>
  )
}

export default App