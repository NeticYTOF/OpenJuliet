import { useEffect, useCallback, type ReactNode, type MouseEvent } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Modal size options.
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'fullscreen'

/**
 * Modal component props.
 */
export interface ModalProps {
  /** Open state */
  open: boolean
  /** Called when the modal should close (backdrop click, Escape, close button) */
  onClose: () => void
  /** Modal title */
  title?: string
  /** Modal description / subtitle */
  description?: string
  /** Modal content */
  children: ReactNode
  /** Size preset */
  size?: ModalSize
  /** Additional className on the content wrapper */
  className?: string
  /** Show/hide close button (default: true) */
  showClose?: boolean
  /** Close on backdrop click (default: true) */
  closeOnBackdrop?: boolean
  /** Close on Escape (default: true) */
  closeOnEscape?: boolean
}

/* ──── Size presets ──── */

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  fullscreen: 'max-w-[95vw] max-h-[95vh] w-full h-full'
}

/* ──── Animation variants ──── */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease: 'easeIn' }
  }
}

const fullscreenVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.15, ease: 'easeIn' }
  }
}

/**
 * Modal — Reusable animated modal with backdrop blur, sizes, close on Escape, and accessibility.
 *
 * @example
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm" size="sm">
 *   <p>Are you sure?</p>
 * </Modal>
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
  showClose = true,
  closeOnBackdrop = true,
  closeOnEscape = true
}: ModalProps): JSX.Element {
  /* ──── Keyboard handler ──── */

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose()
      }
    },
    [closeOnEscape, onClose]
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    /* Prevent body scroll while modal is open */
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, handleKeyDown])

  /* ──── Backdrop click ──── */

  const handleBackdrop = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdrop && e.target === e.currentTarget) {
        onClose()
      }
    },
    [closeOnBackdrop, onClose]
  )

  /* ──── Trap focus within modal — lightweight ──── */

  useEffect(() => {
    if (!open) return
    const activeEl = document.activeElement as HTMLElement | null
    const modalEl = document.getElementById('modal-content')
    modalEl?.focus()
    return () => {
      activeEl?.focus()
    }
  }, [open])

  /* Determine which variant set to use */
  const contentVariants: Variants = size === 'fullscreen' ? fullscreenVariants : modalVariants

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={title ?? 'Modal'}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdrop}
          />

          {/* Content */}
          <motion.div
            id="modal-content"
            tabIndex={-1}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'relative z-10 w-full',
              sizeStyles[size],
              'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl',
              'flex flex-col max-h-[85vh] outline-none',
              className
            )}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3 border-b border-[var(--color-border)]">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg p-1.5 transition-colors"
                    aria-label="Close modal"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Modal
