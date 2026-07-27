import { type ReactNode } from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * Dropdown menu item definition.
 */
export interface DropdownItem {
  /** Item identifier */
  id: string
  /** Display label */
  label: string
  /** Optional icon */
  icon?: ReactNode
  /** Optional keyboard shortcut */
  shortcut?: string
  /** Disabled state */
  disabled?: boolean
  /** Danger/destructive variant */
  danger?: boolean
  /** Called when item is selected */
  onSelect?: () => void
}

/**
 * Dropdown menu separator.
 */
export interface DropdownSeparator {
  kind: 'separator'
}

/**
 * Dropdown component props.
 */
export interface DropdownProps {
  /** Trigger element */
  trigger: ReactNode
  /** Menu items (items + optional separators) */
  items: (DropdownItem | DropdownSeparator)[]
  /** Side to show menu */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Alignment */
  align?: 'start' | 'center' | 'end'
  /** Additional className for content */
  className?: string
  /** Open state */
  open?: boolean
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void
}

/**
 * Dropdown — Radix dropdown menu wrapper with dark styling.
 *
 * @example
 * <Dropdown
 *   trigger={<Button>Actions</Button>}
 *   items={[
 *     { id: 'edit', label: 'Edit', icon: <Edit size={14} />, onSelect: () => {} },
 *     { kind: 'separator' },
 *     { id: 'delete', label: 'Delete', icon: <Trash size={14} />, danger: true }
 *   ]}
 * />
 */
export function Dropdown({
  trigger,
  items,
  side = 'bottom',
  align = 'start',
  className,
  open,
  onOpenChange
}: DropdownProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger}
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          asChild
          side={side}
          align={align}
          sideOffset={4}
          alignOffset={0}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'z-50 min-w-[12rem] overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl py-1',
              className
            )}
          >
            {items.map((item, index) => {
              if ('kind' in item && item.kind === 'separator') {
                return (
                  <DropdownMenuPrimitive.Separator
                    key={`sep-${index}`}
                    className="h-px bg-[var(--color-border)] my-1 mx-2"
                  />
                )
              }

              const menuItem = item as DropdownItem
              return (
                <DropdownMenuPrimitive.Item
                  key={menuItem.id}
                  disabled={menuItem.disabled}
                  onSelect={menuItem.onSelect}
                  className={cn(
                    'relative flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none outline-none',
                    'data-[highlighted]:bg-[var(--color-accent-subtle)]',
                    'data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed',
                    menuItem.danger
                      ? 'text-[var(--color-error)] data-[highlighted]:bg-[var(--color-error-bg)]'
                      : 'text-[var(--color-text-primary)]'
                  )}
                >
                  {menuItem.icon && (
                    <span className="w-4 h-4 flex items-center justify-center shrink-0">
                      {menuItem.icon}
                    </span>
                  )}
                  <span className="flex-1">{menuItem.label}</span>
                  {menuItem.shortcut && (
                    <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
                      {menuItem.shortcut}
                    </span>
                  )}
                </DropdownMenuPrimitive.Item>
              )
            })}
          </motion.div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}

export default Dropdown