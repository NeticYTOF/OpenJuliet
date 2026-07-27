import { type ReactNode, type CSSProperties } from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '../../lib/utils'

/**
 * ScrollArea component props.
 */
export interface ScrollAreaProps {
  /** Scrollable content */
  children: ReactNode
  /** Orientation of scrollbar */
  orientation?: 'vertical' | 'horizontal' | 'both'
  /** Additional className */
  className?: string
  /** Content className */
  contentClassName?: string
  /** Viewport style overrides */
  style?: CSSProperties
  /** Pass through to viewport */
  viewportRef?: React.Ref<HTMLDivElement>
}

/**
 * ScrollArea — Radix scroll area wrapper with custom dark-themed scrollbar styling.
 *
 * @example
 * <ScrollArea className="h-64 w-full">
 *   <div>Long content here...</div>
 * </ScrollArea>
 */
export function ScrollArea({
  children,
  orientation = 'vertical',
  className,
  contentClassName,
  style,
  viewportRef
}: ScrollAreaProps): JSX.Element {
  return (
    <ScrollAreaPrimitive.Root
      className={cn('overflow-hidden', className)}
      style={style}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className={cn('w-full h-full rounded-[inherit]', contentClassName)}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>

      {(orientation === 'vertical' || orientation === 'both') && (
        <ScrollAreaPrimitive.Scrollbar
          orientation="vertical"
          className="flex select-none touch-none p-0.5 transition-colors duration-200 w-2 hover:w-2.5"
        >
          <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-[var(--color-border)] hover:bg-[var(--color-text-muted)] transition-colors" />
        </ScrollAreaPrimitive.Scrollbar>
      )}

      {(orientation === 'horizontal' || orientation === 'both') && (
        <ScrollAreaPrimitive.Scrollbar
          orientation="horizontal"
          className="flex select-none touch-none p-0.5 transition-colors duration-200 h-2 hover:h-2.5"
        >
          <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-[var(--color-border)] hover:bg-[var(--color-text-muted)] transition-colors" />
        </ScrollAreaPrimitive.Scrollbar>
      )}

      <ScrollAreaPrimitive.Corner className="bg-[var(--color-bg-tertiary)]" />
    </ScrollAreaPrimitive.Root>
  )
}

export default ScrollArea