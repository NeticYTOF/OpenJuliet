/**
 * OpenJuliet — Internationalization (i18n) Utility
 *
 * A lightweight, dictionary-based localization system with:
 * - Nested key access via dot notation: t('common.save')
 * - Format interpolation: t('welcome', { name: 'User' })
 * - ICU-style pluralization: t('tasks.count', { count: 5 })
 * - Automatic language detection from navigator.language
 * - Fallback to en-US for missing keys
 *
 * @module lib/locale
 */

import enUS from './locales/en-US.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import de from './locales/de.json'
import ja from './locales/ja.json'
import zh from './locales/zh.json'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A flat or nested dictionary of translation strings. */
export interface LocaleDict {
  [key: string]: string | LocaleDict
}

/** Parameters passed to `t()` for interpolation and pluralization. */
export interface TParams {
  [key: string]: string | number | boolean | undefined | null
}

/** Plural category based on CLDR rules. */
type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

/** Plural rule function — given a count, returns the category. */
type PluralRule = (n: number) => PluralCategory

/** Locale descriptor containing translations and plural rule. */
export interface LocaleDescriptor {
  /** Language tag (e.g. 'en-US', 'es', 'fr'). */
  lang: string
  /** Translation dictionary. */
  dict: LocaleDict
  /** CLDR plural rule function. */
  plural: PluralRule
}

// ---------------------------------------------------------------------------
// Locale Registry
// ---------------------------------------------------------------------------

const LOCALE_MAP: Record<string, number> = {}
const LOCALES: LocaleDescriptor[] = [
  {
    lang: 'en-US',
    dict: enUS as LocaleDict,
    plural: enPluralRule
  },
  {
    lang: 'es',
    dict: es as LocaleDict,
    plural: esPluralRule
  },
  {
    lang: 'fr',
    dict: fr as LocaleDict,
    plural: frPluralRule
  },
  {
    lang: 'de',
    dict: de as LocaleDict,
    plural: dePluralRule
  },
  {
    lang: 'ja',
    dict: ja as LocaleDict,
    plural: jaPluralRule
  },
  {
    lang: 'zh',
    dict: zh as LocaleDict,
    plural: zhPluralRule
  }
]

// Build reverse lookup map
LOCALES.forEach((loc, idx) => {
  LOCALE_MAP[loc.lang] = idx
})

// ---------------------------------------------------------------------------
// Plural Rules (CLDR-compliant)
// ---------------------------------------------------------------------------

function enPluralRule(n: number): PluralCategory {
  return n === 1 ? 'one' : 'other'
}

function esPluralRule(n: number): PluralCategory {
  return n === 1 ? 'one' : 'other'
}

function frPluralRule(n: number): PluralCategory {
  return n === 1 ? 'one' : 'other'
}

function dePluralRule(n: number): PluralCategory {
  return n === 1 ? 'one' : 'other'
}

/** Japanese — no grammatical number distinction. */
function jaPluralRule(_n: number): PluralCategory {
  return 'other'
}

/** Chinese — no grammatical number distinction. */
function zhPluralRule(_n: number): PluralCategory {
  return 'other'
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentLocale: LocaleDescriptor = LOCALES[0] // default: en-US

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely resolve a dot-delimited key path in a nested dictionary.
 *
 * @example
 * resolveKey({ a: { b: 'hello' } }, 'a.b') // => 'hello'
 * resolveKey({}, 'missing.key')             // => undefined
 */
function resolveKey(dict: LocaleDict, key: string): string | LocaleDict | undefined {
  const parts = key.split('.')
  let current: LocaleDict | string | undefined = dict

  for (const part of parts) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      return undefined
    }
    current = (current as LocaleDict)[part]
  }

  return typeof current === 'string' ? current : current
}

/**
 * Replace {placeholder} tokens with values from `params`.
 */
function interpolate(template: string, params?: TParams): string {
  if (!params) return template

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key]
    if (value === undefined || value === null) return `{${key}}`
    return String(value)
  })
}

/**
 * Parse an ICU-style plural string and select the appropriate form.
 *
 * Supported formats:
 *   - "one | other"                    (2 forms)
 *   - "zero | one | few | many | other" (up to 5 forms)
 *
 * The forms are separated by ` | ` (space-piped-space).
 * When the string has no pipe, it is returned as-is (no pluralization).
 *
 * @param str   - The pluralised template string
 * @param count - The numeric count determining which form to use
 * @returns The selected form, with {count} placeholder still present
 */
function pluralize(str: string, count: number, rule: PluralRule): string {
  if (!str.includes(' | ')) return str

  const forms = str.split(' | ').map((f) => f.trim())
  const category = rule(count)

  // Map category to index
  const CATEGORY_ORDER: PluralCategory[] = ['zero', 'one', 'two', 'few', 'many', 'other']
  const index = CATEGORY_ORDER.indexOf(category)

  // If an explicit form exists at that index, use it; otherwise fall back to 'other'
  if (index >= 0 && index < forms.length) {
    return forms[index]
  }

  // Fallback: use the last form (conventionally 'other')
  return forms[forms.length - 1] ?? forms[0] ?? str
}

/**
 * Detect the user's preferred language from the browser/environment.
 * Falls back to 'en-US' when detection fails.
 */
function detectSystemLanguage(): string {
  try {
    const lang = navigator.language
    // Try exact match first (e.g. 'en-US')
    if (LOCALE_MAP[lang] !== undefined) return lang

    // Try language-only match (e.g. 'en' -> find first locale starting with 'en')
    const langPrefix = lang.split('-')[0]
    for (const locale of LOCALES) {
      if (locale.lang.startsWith(langPrefix)) return locale.lang
    }
  } catch {
    // navigator may not be available (SSR/Node)
  }

  return 'en-US'
}

// ---------------------------------------------------------------------------
// Subscriber System for React Integration
// ---------------------------------------------------------------------------

type Subscriber = () => void
const subscribers = new Set<Subscriber>()

function notifySubscribers(): void {
  Array.from(subscribers).forEach((fn) => {
    try {
      fn()
    } catch {
      // Silently ignore subscriber errors
    }
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Set the active locale by language tag.
 * Falls back to 'en-US' if the requested locale is not registered.
 *
 * @param lang - Language tag (e.g. 'es', 'fr', 'de', 'ja', 'zh', 'en-US')
 */
export function setLocale(lang: string): void {
  const idx = LOCALE_MAP[lang]
  if (idx !== undefined) {
    currentLocale = LOCALES[idx]
  } else {
    // Try language-only fallback: 'en' -> 'en-US'
    const prefix = lang.split('-')[0]
    const fallback = LOCALES.find((l) => l.lang.startsWith(prefix))
    currentLocale = fallback ?? LOCALES[0]
  }
  notifySubscribers()
}

/**
 * Get the currently active language tag (e.g. 'en-US', 'es', 'fr').
 */
export function getLocale(): string {
  return currentLocale.lang
}

/**
 * Get the list of all supported language tags.
 */
export function getSupportedLocales(): string[] {
  return LOCALES.map((l) => l.lang)
}

/**
 * Translate a key to the localized string.
 *
 * @param key    - Dot-notation key into the dictionary (e.g. 'common.save')
 * @param params - Optional interpolation parameters.
 *                 When `params.count` is a number, pluralization is applied.
 *
 * @returns The translated string, or the key itself if not found.
 *
 * @example
 * t('common.save')                          // => "Save"
 * t('welcome', { name: 'Alice' })             // => "Welcome back, Alice!"
 * t('dashboard.totalTasks', { count: 1 })     // => "1 task"
 * t('dashboard.totalTasks', { count: 5 })     // => "5 tasks"
 */
export function t(key: string, params?: TParams): string {
  const resolved = resolveKey(currentLocale.dict, key)

  if (resolved === undefined || typeof resolved !== 'string') {
    // Try fallback to en-US
    const fallback = resolveKey(LOCALES[0].dict, key)
    if (typeof fallback === 'string') {
      return applyFormatting(fallback, params, LOCALES[0].plural)
    }
    return key
  }

  return applyFormatting(resolved, params, currentLocale.plural)
}

/**
 * Apply interpolation and pluralization to a raw template string.
 */
function applyFormatting(template: string, params?: TParams, pluralRule?: PluralRule): string {
  let result = template

  // Pluralization: if params contains a 'count' number, resolve plural forms
  if (params?.count !== undefined && typeof params.count === 'number') {
    result = pluralize(result, params.count, pluralRule ?? enPluralRule)
  }

  // Interpolation: replace {key} placeholders
  result = interpolate(result, params)

  return result
}

/**
 * Subscribe to locale changes. Returns an unsubscribe function.
 *
 * Used by React hooks to trigger re-renders when the locale changes.
 *
 * @internal
 */
export function subscribeToLocale(callback: Subscriber): () => void {
  subscribers.add(callback)
  return () => {
    subscribers.delete(callback)
  }
}

/**
 * Check if a translation key exists in the current locale (or en-US fallback).
 *
 * @param key - Dot-notation key path
 * @returns True if the key exists in either the current or fallback locale
 */
export function hasKey(key: string): boolean {
  return (
    resolveKey(currentLocale.dict, key) !== undefined ||
    resolveKey(LOCALES[0].dict, key) !== undefined
  )
}

// ---------------------------------------------------------------------------
// Auto-detect locale on module load
// ---------------------------------------------------------------------------

setLocale(detectSystemLanguage())
