import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from './stores/appStore'
import { useKeyboard } from './hooks/useKeyboard'
import AppLayout from './components/layout/AppLayout'
import WelcomeScreen from './components/features/WelcomeScreen'

/**
 * Root application component.
 * Manages global layout, first-launch welcome screen, and keyboard shortcuts.
 */
function App(): JSX.Element {
  const { hasCompletedOnboarding } = useAppStore()

  useKeyboard()

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
    <AnimatePresence mode="wait">
      {!hasCompletedOnboarding ? <WelcomeScreen key="welcome" /> : <AppLayout key="app" />}
    </AnimatePresence>
  )
}

export default App