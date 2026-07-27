import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { Dropdown } from '../ui/Dropdown'
import { cn } from '../../lib/utils'

/* ──── Types ──── */

/**
 * Extended theme preference including system-follow.
 * 'system' resolves to 'dark' or 'light' based on OS preference.
 */
export type DisplayTheme = 'dark' | 'light' | 'system'

/* ──── Constants ──── */

const STORAGE_KEY = 'openjuliet:theme-preference'

/** Maps display themes to actual applied themes */
function resolveTheme(display: DisplayTheme): 'dark' | 'light' {
  if (display === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return display
}

/** Load persisted preference */
function loadPreference(): DisplayTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored
    }
  } catch {
    // localStorage unavailable
  }
  return 'system'
}

/** Save preference */
function savePreference(pref: DisplayTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    // localStorage unavailable
  }
}

/* ──── Theme Options ──── */

interface ThemeOption {
  id: DisplayTheme
  label: string
  icon: typeof Sun
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor }
]

/* ──── Icon Transition ──── */

const iconVariants = {
  initial: { opacity: 0, scale: 0.5, rotate: -90 },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 300, damping: 15 }
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    rotate: 90,
    transition: { duration: 0.15 }
  }
}

/* ──── Component ──── */

/**
 * ThemeToggle — Small dropdown toggle for switching between light/dark/system theme.
 *
 * Designed to sit in the Titlebar. Features:
 * - Sun (Light) / Moon (Dark) / Monitor (System) icons
 * - Animated icon transitions on switch
 * - Dropdown with 3 options using the app's Dropdown component
 * - Persists preference to localStorage + applies to settings store
 * - Listens to OS preference changes when in 'system' mode
 */
export default function ThemeToggle(): JSX.Element {
  const { setTheme } = useSettingsStore()
  const [preference, setPreferenceState] = useState<DisplayTheme>(
    loadPreference
  )
  const [open, setOpen] = useState(false)

  // Apply theme whenever preference changes
  const applyTheme = useCallback(
    (pref: DisplayTheme) => {
      const resolved = resolveTheme(pref)
      setTheme(resolved)
      document.documentElement.setAttribute('data-theme', resolved)
    },
    [setTheme]
  )

  // On mount, apply persisted preference
  useEffect(() => {
    applyTheme(preference)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen to OS preference changes when in system mode
  useEffect(() => {
    if (preference !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (): void => {
      const resolved = resolveTheme('system')
      setTheme(resolved)
      document.documentElement.setAttribute('data-theme', resolved)
    }

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preference, setTheme])

  const handleSelect = useCallback(
    (pref: DisplayTheme) => {
      setPreferenceState(pref)
      savePreference(pref)
      applyTheme(pref)
      setOpen(false)
    },
    [applyTheme]
  )

  // Current option for icon display
  const currentOption = useMemo(
    () => THEME_OPTIONS.find((o) => o.id === preference) ?? THEME_OPTIONS[1],
    [preference]
  )
  const CurrentIcon = currentOption.icon

  // Dropdown items
  const dropdownItems = useMemo(
    () =>
      THEME_OPTIONS.map((opt) => {
        const Icon = opt.icon
        return {
          id: opt.id,
          label: opt.label,
          icon: (
            <Icon
              size={14}
              className={
                preference === opt.id
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)]'
              }
            />
          ),
          onSelect: () => handleSelect(opt.id)
        }
      }),
    [preference, handleSelect]
  )

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      align="end"
      side="bottom"
      trigger={
        <button
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-md',
            'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            'hover:bg-[var(--color-bg-tertiary)] transition-colors',
            'relative'
          )}
          aria-label={`Current theme: ${currentOption.label}. Click to change.`}
          title={`Theme: ${currentOption.label}`}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={preference}
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center"
            >
              <CurrentIcon size={14} />
            </motion.span>
          </AnimatePresence>
        </button>
      }
      items={dropdownItems}
      className="min-w-[10rem]"
    />
  )
}