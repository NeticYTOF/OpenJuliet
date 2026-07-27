import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Github,
  ExternalLink,
  Bug,
  FileText,
  Heart,
  ScrollText,
  Cpu
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Kbd } from '../ui/Kbd'
import { cn } from '../../lib/utils'
import {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  REPO_URL,
  DOCS_URL,
  ISSUES_URL
} from '../../lib/constants'

/**
 * AboutModal component props.
 */
export interface AboutModalProps {
  /** Open state */
  open: boolean
  /** Called when the modal should close */
  onClose: () => void
  /** Optional additional className */
  className?: string
}

/**
 * A link item rendered in the About dialog.
 */
interface AboutLink {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  href: string
}

const links: AboutLink[] = [
  { icon: Github, label: 'GitHub Repository', href: REPO_URL },
  { icon: FileText, label: 'Documentation', href: DOCS_URL },
  { icon: Bug, label: 'Report an Issue', href: ISSUES_URL }
]

/** Inline SVG logo for OpenJuliet */
function AppLogo(): JSX.Element {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="56" height="56" rx="14" fill="var(--color-accent)" fillOpacity="0.15" />
      <path
        d="M18 38V22l10 8-10 8Z"
        fill="var(--color-accent)"
        fillOpacity="0.6"
      />
      <path
        d="M28 38V22l10 8-10 8Z"
        fill="var(--color-accent)"
        fillOpacity="0.9"
      />
      <rect x="18" y="18" width="20" height="4" rx="2" fill="var(--color-accent)" fillOpacity="0.3" />
    </svg>
  )
}

/** Key-value pair row */
function DetailRow({ label, value }: { label: string; value: ReactNode }): JSX.Element {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-xs font-medium text-[var(--color-text-primary)] font-mono">
        {value}
      </span>
    </div>
  )
}

/**
 * AboutModal — Application about dialog with logo, version, build info, and links.
 *
 * @example
 * <AboutModal open={isOpen} onClose={() => setIsOpen(false)} />
 */
export function AboutModal({ open, onClose, className }: AboutModalProps): JSX.Element {
  /* ──── Build info ──── */
  const buildDate = new Date().toISOString().split('T')[0]
  const buildVersion = APP_VERSION

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      className={cn('p-0 overflow-hidden', className)}
    >
      <div className="flex flex-col items-center text-center pt-8 pb-6 px-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <AppLogo />
        </motion.div>

        {/* App name & version */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.25 }}
          className="mt-4"
        >
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {APP_NAME}
          </h2>
          <p className="text-xs text-[var(--color-accent)] font-mono mt-0.5">
            v{buildVersion}
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.14, duration: 0.25 }}
          className="text-xs text-[var(--color-text-secondary)] mt-3 leading-relaxed max-w-xs"
        >
          {APP_DESCRIPTION}
        </motion.p>

        {/* Divider */}
        <div className="w-full border-t border-[var(--color-border)] my-4" />

        {/* Build details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.25 }}
          className="w-full"
        >
          <DetailRow label="Build Date" value={buildDate} />
          <DetailRow label="Version" value={`v${buildVersion}`} />
          <DetailRow label="Platform" value={navigator.platform || 'Unknown'} />
          <DetailRow label="Runtime" value="Electron" />
        </motion.div>

        {/* Divider */}
        <div className="w-full border-t border-[var(--color-border)] my-4" />

        {/* Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.25 }}
          className="w-full space-y-1.5"
        >
          {links.map((link) => {
            const Icon = link.icon
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-all duration-150 group"
              >
                <Icon size={15} className="shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                <span className="flex-1 text-left">{link.label}</span>
                <ExternalLink size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )
          })}
        </motion.div>

        {/* Divider */}
        <div className="w-full border-t border-[var(--color-border)] my-4" />

        {/* Credits */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.26, duration: 0.25 }}
          className="text-[10px] text-[var(--color-text-muted)] leading-relaxed"
        >
          Made with <Heart size={10} className="inline text-[var(--color-error)] align-text-top mx-0.5" /> by the OpenJuliet team.
          <br />
          Licensed under the MIT License.
        </motion.p>

        {/* Keyboard shortcut hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.25 }}
          className="mt-4"
        >
          <Kbd keys={['Esc']} size="sm" variant="ghost" />
        </motion.div>
      </div>
    </Modal>
  )
}


