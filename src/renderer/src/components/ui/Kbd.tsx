import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

/**
 * Kbd size options.
 */
export type KbdSize = 'sm' | 'md' | 'lg'

/**
 * Kbd component props.
 */
export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** Array of keys to display. Modifier symbols are automatically mapped. */
  keys: string[]
  /** Size preset */
  size?: KbdSize
  /** Visual variant */
  variant?: 'default' | 'ghost' | 'outline'
}

/* ──── Modifier symbol mapping ──── */

const MODIFIER_MAP: Record<string, string> = {
  cmd: '⌘',
  command: '⌘',
  meta: '⌘',
  option: '⌥',
  alt: '⌥',
  opt: '⌥',
  shift: '⇧',
  ctrl: '⌃',
  control: '⌃',
  caps: '⇪',
  capslock: '⇪',
  enter: '↵',
  return: '↵',
  escape: '⎋',
  esc: '⎋',
  tab: '⇥',
  backspace: '⌫',
  delete: '⌦',
  space: '␣',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  home: '↖',
  end: '↘',
  pageup: '⇞',
  pagedown: '⇟'
}

/* ──── Size presets ──── */

const sizeStyles: Record<KbdSize, { kbd: string; key: string; gap: string }> = {
  sm: {
    kbd: 'px-1.5 py-0.5 gap-0.5',
    key: 'min-w-[16px] h-[16px] text-[10px] leading-none px-1',
    gap: 'gap-0.5'
  },
  md: {
    kbd: 'px-2 py-1 gap-1',
    key: 'min-w-[20px] h-[20px] text-[11px] leading-none px-1.5',
    gap: 'gap-1'
  },
  lg: {
    kbd: 'px-2.5 py-1.5 gap-1',
    key: 'min-w-[24px] h-[24px] text-xs leading-none px-2',
    gap: 'gap-1'
  }
}

/**
 * Normalize a key string: converts to lowercase, strips whitespace, applies modifier symbol map.
 */
function normalizeKey(raw: string): string {
  const trimmed = raw.trim().toLowerCase()
  return MODIFIER_MAP[trimmed] ?? raw
}

/**
 * Kbd — Styled keyboard shortcut badge with modifier symbol support.
 *
 * @example
 * <Kbd keys={['⌘', 'K']} />
 * <Kbd keys={['Ctrl', 'Shift', 'P']} size="lg" variant="outline" />
 * <Kbd keys={['⌘', 'S']} size="sm" />
 */
export function Kbd({
  keys,
  size = 'md',
  variant = 'default',
  className,
  ...props
}: KbdProps): JSX.Element {
  const sizes = sizeStyles[size]

  const variantStyles = {
    default:
      'bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]',
    ghost:
      'bg-transparent border border-transparent text-[var(--color-text-muted)]',
    outline:
      'bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)]'
  }

  return (
    <kbd
      className={cn(
        'inline-flex items-center',
        sizes.kbd,
        sizes.gap,
        'rounded-lg font-mono',
        variantStyles[variant],
        className
      )}
      aria-label={`Keyboard shortcut: ${keys.join(' + ')}`}
      {...props}
    >
      {keys.map((key, i) => {
        const normalized = normalizeKey(key)
        const isModifier = Object.values(MODIFIER_MAP).includes(normalized)

        return (
          <span
            key={`${key}-${i}`}
            className={cn(
              'inline-flex items-center justify-center rounded font-medium',
              sizes.key,
              isModifier && 'bg-[var(--color-surface)] bg-opacity-60',
              !isModifier && 'bg-[rgba(30,30,46,0.4)]',
              'border border-[var(--color-border)] shadow-sm'
            )}
          >
            {normalized}
          </span>
        )
      })}
    </kbd>
  )
}

Kbd.displayName = 'Kbd'

export default Kbd
