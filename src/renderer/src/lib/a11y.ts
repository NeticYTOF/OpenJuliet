/**
 * OpenJuliet — AccessibleLabel utility
 * Provides consistent aria-label generation for interactive elements
 */

/**
 * Generate an accessible label for an icon-only button
 */
export function iconLabel(iconName: string, context?: string): string {
  return context ? `${iconName}: ${context}` : iconName
}

/**
 * Generate region landmark label
 */
export function regionLabel(name: string): string {
  return `Region: ${name}`
}

/**
 * Generate status announcement for screen readers
 */
export function statusAnnouncement(type: 'success' | 'error' | 'info' | 'loading', message: string): string {
  const prefix =
    type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'loading' ? '⏳' : 'ℹ️'
  return `${prefix} ${message}`
}

/**
 * ARIA live region settings for different update types
 */
export const LIVE_REGIONS = {
  /** For progress updates (don't interrupt current speech) */
  progress: { 'aria-live': 'polite' as const, 'aria-atomic': 'false' as const },
  /** For errors/alerts (interrupt current speech) */
  alert: { 'aria-live': 'assertive' as const, 'aria-atomic': 'true' as const },
  /** For status changes */
  status: { role: 'status' as const, 'aria-live': 'polite' as const }
} as const

/**
 * Keyboard shortcut descriptions for accessibility
 */
export function shortcutDescription(keys: string[], action: string): string {
  return `${keys.join(' + ')}: ${action}`
}
