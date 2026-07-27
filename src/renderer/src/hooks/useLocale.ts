/**
 * OpenJuliet — useLocale Hook
 *
 * React hook for accessing translations with reactive locale switching.
 * Integrates with the core locale.ts singleton via its subscribe mechanism
 * so all components re-render when `setLocale()` is called.
 *
 * @module hooks/useLocale
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  t,
  setLocale,
  getLocale,
  getSupportedLocales,
  subscribeToLocale,
  hasKey,
  type TParams
} from '../lib/locale'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseLocaleReturn {
  /** Translate a key with optional interpolation/pluralization. */
  t: (key: string, params?: TParams) => string
  /** The current language tag (e.g. 'en-US', 'es', 'fr'). */
  locale: string
  /** Set the active locale. */
  setLocale: (lang: string) => void
  /** List of all supported language tags. */
  supportedLocales: string[]
  /** Check if a translation key exists in the active or fallback locale. */
  hasKey: (key: string) => boolean
  /** Localised language name for display in a language picker. */
  getLocaleLabel: (lang: string) => string
}

// ---------------------------------------------------------------------------
// Locale Display Names
// ---------------------------------------------------------------------------

const LOCALE_LABELS: Record<string, string> = {
  'en-US': 'English (US)',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文'
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook for internationalization.
 *
 * Provides a reactive `t()` function that updates when the locale changes,
 * along with locale management utilities.
 *
 * @returns Translations and locale control functions
 *
 * @example
 * function MyComponent() {
 *   const { t, locale, setLocale, supportedLocales } = useLocale()
 *
 *   return (
 *     <div>
 *       <h1>{t('dashboard.title')}</h1>
 *       <p>{t('dashboard.welcome', { name: 'Alice' })}</p>
 *       <p>{t('dashboard.totalTasks', { count: 5 })}</p>
 *       <select value={locale} onChange={e => setLocale(e.target.value)}>
 *         {supportedLocales.map(l => (
 *           <option key={l} value={l}>{getLocaleLabel(l)}</option>
 *         ))}
 *       </select>
 *     </div>
 *   )
 * }
 */
export function useLocale(): UseLocaleReturn {
  // Track locale changes via subscription — triggers re-render on change
  const [locale, setLocaleState] = useState<string>(getLocale)

  useEffect(() => {
    // Subscribe to locale changes from the core module
    const unsubscribe = subscribeToLocale(() => {
      setLocaleState(getLocale())
    })
    return unsubscribe
  }, [])

  /**
   * Set the active locale and update component state.
   */
  const changeLocale = useCallback((lang: string): void => {
    setLocale(lang)
    setLocaleState(getLocale())
  }, [])

  /**
   * Get the human-readable label for a locale code.
   */
  const getLocaleLabel = useCallback((lang: string): string => {
    return LOCALE_LABELS[lang] ?? lang
  }, [])

  // Memoize the supported list (doesn't change at runtime)
  const supportedLocales = useMemo<string[]>(() => getSupportedLocales(), [])

  return {
    t,
    locale,
    setLocale: changeLocale,
    supportedLocales,
    hasKey,
    getLocaleLabel
  }
}

