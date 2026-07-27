import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * EmptyState component props.
 */
export interface EmptyStateProps {
  /** Icon component or element */
  icon?: ReactNode
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Optional action button or element */
  action?: ReactNode
  /** Additional className */
  className?: string
}

/**
 * EmptyState — Beautiful empty state placeholder with icon, title, description, and optional action.
 *
 * @example
 * <EmptyState
 *   icon={<Inbox size={40} />}
 *   title="No issues yet"
 *   description="Issues will appear here once you connect a repository."
 *   action={<Button variant="primary">Connect GitHub</Button>}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-[var(--color-text-muted)] opacity-50">
          {icon}
        </div>
      )}

      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </motion.div>
  )
}

export default EmptyState