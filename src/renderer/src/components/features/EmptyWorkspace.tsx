import { motion } from 'framer-motion'
import {
  FolderOpen,
  Github,
  Play,
  Sparkles,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Code2,
  GitBranch,
  Terminal
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { AnimatedContainer, AnimatedItem } from '../ui/AnimatedContainer'
import { cn } from '../../lib/utils'

/**
 * Quick action handler type.
 */
type QuickAction = () => void | Promise<void>

/**
 * EmptyWorkspace component props.
 */
export interface EmptyWorkspaceProps {
  /** Called when user clicks "Clone Repository" */
  onCloneRepo?: QuickAction
  /** Called when user clicks "Open Local Folder" */
  onOpenLocalFolder?: QuickAction
  /** Called when user clicks "Run Demo" */
  onRunDemo?: QuickAction
  /** Additional className */
  className?: string
}

/**
 * Stagger animation variants for the emoji illustration.
 */
const floatAnimation = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut' as const
    }
  }
}

const floatAnimation2 = {
  animate: {
    y: [0, 6, 0],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
      delay: 0.5
    }
  }
}

const floatAnimation3 = {
  animate: {
    y: [0, -5, 0],
    transition: {
      duration: 3.5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
      delay: 1
    }
  }
}

const rotateAnimation = {
  animate: {
    rotate: [0, 10, 0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut' as const
    }
  }
}

const pulseGlow = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut' as const
    }
  }
}

/**
 * Tip data for first-time users.
 */
interface Tip {
  icon: typeof Lightbulb
  title: string
  description: string
}

const FIRST_TIME_TIPS: Tip[] = [
  {
    icon: Github,
    title: 'Connect GitHub',
    description: 'Link your GitHub account to browse repos, issues, and PRs.'
  },
  {
    icon: Terminal,
    title: 'Run a Demo',
    description: 'Try a pre-built demo to see OpenJuliet in action.'
  },
  {
    icon: BookOpen,
    title: 'Quick Start Guide',
    description: 'Open the quick start guide for a full walkthrough.'
  },
  {
    icon: Code2,
    title: 'Open a Project',
    description: 'Clone a repo or open a local folder to start coding.'
  }
]

/**
 * EmptyWorkspace — Animated welcome screen shown when no repository is open.
 * Features a big emoji-based illustration, quick action buttons,
 * and tips for first-time users.
 *
 * @example
 * <EmptyWorkspace
 *   onCloneRepo={() => handleClone()}
 *   onOpenLocalFolder={() => handleOpen()}
 *   onRunDemo={() => handleDemo()}
 * />
 */
export function EmptyWorkspace({
  onCloneRepo,
  onOpenLocalFolder,
  onRunDemo,
  className
}: EmptyWorkspaceProps): JSX.Element {
  return (
    <AnimatedContainer animation="slideUp" className={cn('h-full', className)}>
      <div className="flex flex-col items-center justify-center min-h-[500px] py-12 px-6">
        {/* ── Animated Emoji Illustration ── */}
        <div className="relative mb-8 select-none" aria-hidden="true">
          {/* Glow behind the main emoji */}
          <motion.div
            variants={pulseGlow}
            animate="animate"
            className="absolute -inset-8 rounded-full bg-[var(--color-accent)]/10 blur-2xl"
          />

          {/* Main emoji */}
          <motion.div
            variants={floatAnimation}
            animate="animate"
            className="relative text-7xl leading-none mb-2"
          >
            🚀
          </motion.div>

          {/* Orbiting emojis */}
          <motion.div
            variants={floatAnimation2}
            animate="animate"
            className="absolute -top-2 -right-8 text-2xl"
          >
            ⚡
          </motion.div>
          <motion.div
            variants={floatAnimation3}
            animate="animate"
            className="absolute -bottom-1 -left-7 text-2xl"
          >
            ✨
          </motion.div>
          <motion.div
            variants={rotateAnimation}
            animate="animate"
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl"
          >
            💻
          </motion.div>
        </div>

        {/* ── Welcome Text ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Welcome to OpenJuliet
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
            Open a repository to get started, or run a demo to see what OpenJuliet can do.
          </p>
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {onCloneRepo && (
            <Button
              variant="primary"
              size="md"
              icon={<Github size={16} />}
              onClick={onCloneRepo}
            >
              Clone Repository
            </Button>
          )}
          {onOpenLocalFolder && (
            <Button
              variant="secondary"
              size="md"
              icon={<FolderOpen size={16} />}
              onClick={onOpenLocalFolder}
            >
              Open Local Folder
            </Button>
          )}
          {onRunDemo && (
            <Button
              variant="outline"
              size="md"
              icon={<Play size={16} />}
              onClick={onRunDemo}
            >
              Run Demo
            </Button>
          )}
        </motion.div>

        {/* ── Tips for First-Time Users ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={14} className="text-[var(--color-accent)]" />
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Tips for Getting Started
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIRST_TIME_TIPS.map((tip, index) => {
              const TipIcon = tip.icon
              return (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.6 + index * 0.08,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg',
                    'bg-[var(--color-bg-tertiary)]/40 border border-[var(--color-border)]/50',
                    'hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border)] transition-colors'
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    <TipIcon size={14} className="text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">
                      {tip.title}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </AnimatedContainer>
  )
}

export default EmptyWorkspace
