import { type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Dialog component props.
 */
export interface DialogProps {
  /** Open state */
  open: boolean
  /** Called when open state changes */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title?: string
  /** Dialog description */
  description?: string
  /** Dialog content */
  children: ReactNode
  /** Optional footer content */
  footer?: ReactNode
  /** Dialog size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Additional className */
  className?: string
  /** Show close button */
  showClose?: boolean
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[90vw] max-h-[85vh]'
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const contentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 }
  }
}

/**
 * Dialog — Radix dialog/modal wrapper with framer-motion animation.
 *
 * @example
 * <Dialog open={isOpen} onOpenChange={setIsOpen} title="Confirm" size="sm">
 *   <p>Are you sure?</p>
 * </Dialog>
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  showClose = true
}: DialogProps): JSX.Element {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className={cn(
                  'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full',
                  sizeStyles[size],
                  'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl',
                  'max-h-[85vh] flex flex-col',
                  className
                )}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Header */}
                {(title || showClose) && (
                  <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--color-border)]">
                    <div>
                      {title && (
                        <DialogPrimitive.Title className="text-base font-semibold text-[var(--color-text-primary)]">
                          {title}
                        </DialogPrimitive.Title>
                      )}
                      {description && (
                        <DialogPrimitive.Description className="text-sm text-[var(--color-text-secondary)] mt-1">
                          {description}
                        </DialogPrimitive.Description>
                      )}
                    </div>
                    {showClose && (
                      <DialogPrimitive.Close className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg p-1.5 transition-colors">
                        <X size={16} />
                      </DialogPrimitive.Close>
                    )}
                  </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

                {/* Footer */}
                {footer && (
                  <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)] bg-opacity-50">
                    {footer}
                  </div>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

export default Dialog