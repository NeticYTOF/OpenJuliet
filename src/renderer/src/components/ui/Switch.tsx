import { type ReactNode } from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '../../lib/utils'

/**
 * Switch component props.
 */
export interface SwitchProps {
  /** Whether the switch is on */
  checked: boolean
  /** Called when checked state changes */
  onCheckedChange: (checked: boolean) => void
  /** Label text */
  label?: string
  /** Description text */
  description?: string
  /** Disabled state */
  disabled?: boolean
  /** Additional className */
  className?: string
  /** Switch size */
  size?: 'sm' | 'md'
}

const switchSizes = {
  sm: { root: 'w-8 h-4', thumb: 'w-3 h-3 data-[state=checked]:translate-x-4' },
  md: { root: 'w-10 h-5', thumb: 'w-4 h-4 data-[state=checked]:translate-x-5' }
}

/**
 * Switch — Radix switch/toggle wrapper with label support.
 *
 * @example
 * <Switch
 *   checked={notificationsEnabled}
 *   onCheckedChange={setNotificationsEnabled}
 *   label="Enable notifications"
 *   description="Receive alerts when tasks complete"
 * />
 */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
  size = 'md'
}: SwitchProps): JSX.Element {
  const sizes = switchSizes[size]

  return (
    <label
      className={cn(
        'flex items-center gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          sizes.root,
          'relative rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] transition-colors duration-200',
          'data-[state=checked]:bg-[var(--color-accent)] data-[state=checked]:border-[var(--color-accent)]',
          'focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]'
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            sizes.thumb,
            'block rounded-full bg-white shadow-sm transition-transform duration-200 translate-x-0.5',
            'data-[state=checked]:translate-x-[calc(100%+2px)]'
          )}
        />
      </SwitchPrimitive.Root>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[var(--color-text-secondary)]">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  )
}

export default Switch