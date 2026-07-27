import { forwardRef, type ReactNode } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Select option definition.
 */
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

/**
 * Select component props.
 */
export interface SelectProps {
  /** Label text displayed above the select */
  label?: string
  /** Current value */
  value: string
  /** Called when value changes */
  onValueChange: (value: string) => void
  /** Available options */
  options: SelectOption[]
  /** Placeholder text when no value selected */
  placeholder?: string
  /** Error message */
  error?: string
  /** Disabled state */
  disabled?: boolean
  /** Optional icon */
  icon?: ReactNode
  /** Additional className */
  className?: string
}

/**
 * Select — Styled dropdown select using Radix Select primitives.
 *
 * @example
 * <Select
 *   label="Model"
 *   value={selectedModel}
 *   onValueChange={setSelectedModel}
 *   options={[{ value: 'gpt-4', label: 'GPT-4' }]}
 * />
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ label, value, onValueChange, options, placeholder = 'Select...', error, disabled, icon, className }, ref): JSX.Element => {
    const selectId = `select-${label?.toLowerCase().replace(/\s+/g, '-')}`

    return (
      <div ref={ref} className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}

        <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectPrimitive.Trigger
            className={cn(
              'inline-flex items-center justify-between w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] transition-all duration-200',
              'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
              'data-[placeholder]:text-[var(--color-text-muted)]',
              error && 'border-[var(--color-error)]',
              disabled && 'opacity-50 cursor-not-allowed',
              icon && 'pl-10',
              className
            )}
            aria-label={label}
          >
            {icon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
                {icon}
              </div>
            )}
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon className="ml-auto text-[var(--color-text-muted)]">
              <ChevronDown size={16} />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className="z-50 min-w-[8rem] overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg animate-fadeIn"
              position="popper"
              sideOffset={4}
            >
              <SelectPrimitive.Viewport className="p-1">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      'relative flex items-center px-8 py-2 text-sm text-[var(--color-text-primary)] rounded-md cursor-pointer select-none',
                      'data-[highlighted]:bg-[var(--color-accent-subtle)] data-[highlighted]:text-[var(--color-accent)]',
                      'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
                      'focus-visible:outline-none'
                    )}
                  >
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex items-center">
                      <Check size={14} className="text-[var(--color-accent)]" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>

        {error && (
          <p className="text-xs text-[var(--color-error)]" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select