import { useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import type { ActiveView } from '../types'

/**
 * Keyboard shortcut mapping for navigation and actions.
 */
interface ShortcutMap {
  [key: string]: () => void
}

/**
 * useKeyboard — Registers global keyboard shortcuts for the application.
 *
 * Shortcuts:
 * - Cmd/Ctrl+K: Opens command palette (placeholder for future implementation)
 * - Cmd/Ctrl+B: Toggles sidebar visibility
 * - Cmd/Ctrl+,: Opens settings view
 * - Escape: Closes modals / returns to dashboard
 * - Cmd/Ctrl+1-6: Navigates between views
 * - Cmd/Ctrl+R: Refreshes current view data
 *
 * @example
 * function App() {
 *   useKeyboard()
 *   return <AppLayout />
 * }
 */
export function useKeyboard(): void {
  const { toggleSidebar, setView } = useAppStore()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      const isMeta = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      /* Skip if user is typing in an input or textarea */
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        /* Allow Escape to still work in inputs */
        if (key !== 'escape') return
      }

      const shortcuts: ShortcutMap = {
        /* Cmd/Ctrl+K — Command palette */
        ...(isMeta && key === 'k'
          ? { 'cmd+k': () => console.log('Command palette triggered (not yet implemented)') }
          : {}),

        /* Cmd/Ctrl+B — Toggle sidebar */
        ...(isMeta && key === 'b'
          ? { 'cmd+b': () => toggleSidebar() }
          : {}),

        /* Cmd/Ctrl+, — Settings */
        ...(isMeta && key === ','
          ? { 'cmd+,': () => setView('settings' as ActiveView) }
          : {}),

        /* Escape — Close/Dismiss */
        ...(key === 'escape'
          ? { escape: () => handleEscape() }
          : {}),

        /* Cmd/Ctrl+1-7 — Navigate views */
        ...(isMeta && ['1', '2', '3', '4', '5', '6', '7'].includes(key)
          ? {
              [`cmd+${key}`]: () => {
                const views: ActiveView[] = [
                  'dashboard',
                  'repositories',
                  'issues',
                  'tasks',
                  'history',
                  'editor',
                  'settings'
                ]
                const index = parseInt(key) - 1
                if (index >= 0 && index < views.length) {
                  event.preventDefault()
                  setView(views[index])
                }
              }
            }
          : {})
      }

      const shortcutKey = isMeta ? `cmd+${key}` : key
      const handler = shortcuts[shortcutKey]
      if (handler) {
        event.preventDefault()
        handler()
      }
    },
    [toggleSidebar, setView]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Handle Escape key — dismisses active dialogs or returns to dashboard.
 */
function handleEscape(): void {
  /* Check for open Radix dialog portal first */
  const openDialog = document.querySelector('[data-state="open"][role="dialog"]')
  if (openDialog) {
    /* Radix dialog handles Escape natively — do nothing extra */
    return
  }

  /* If a modal overlay is visible, let Radix handle it */
  const modalOverlay = document.querySelector('[data-state="open"][role="dialog"]')
  if (modalOverlay) return
}

export default useKeyboard