import { type ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '../../lib/utils'

/**
 * Tooltip component props.
 */
export interface TooltipProps {
  /** Trigger element */
  children: ReactNode
  /** Tooltip content */
  content: ReactNode
  /** Side to show tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Delay before showing (ms) */
  delayDuration?: number
  /** Additional className for the content */
  className?: string
  /** Disable tooltip */
  disabled?: boolean
}

/**
 * Tooltip — Radix tooltip wrapper with dark styling.
 *
 * @example
 * <Tooltip content="Click to start" side="top">
 *   <Button>Start</Button>
 * </Tooltip>
 */
export function Tooltip({
  children,
  content,
  side = 'top',
  delayDuration = 400,
  className,
  disabled = false
}: TooltipProps): JSX.Element {
  if (disabled) return <>{children}</>

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={cn(
              'z-50 px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg',
              'animate-fadeIn',
              className
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-[var(--color-surface)]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export default Tooltip