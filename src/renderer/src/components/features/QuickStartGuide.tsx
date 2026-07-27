import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Github,
  Cpu,
  FolderOpen,
  Search,
  Rocket,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  BookOpen,
  Sparkles
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { ProgressBar } from '../ui/ProgressBar'

/* ──── Types ──── */

export interface QuickStartGuideProps {
  /** Whether the panel is open */
  open: boolean
  /** Callback to close the panel */
  onClose: () => void
  /** If true, show as a standalone page (instead of slide-out) */
  standalone?: boolean
}

/* ──── Step Definitions ──── */

interface StepDef {
  id: string
  title: string
  description: string
  /** Emoji placeholder — represents a screenshot in-prod */
  emoji: string
  icon: typeof Sparkles
  /** Label on the screenshot placeholder */
  screenshotLabel: string
}

const STEPS: StepDef[] = [
  {
    id: 'github',
    title: 'Connect GitHub',
    description:
      'Link your GitHub account via OAuth or a Personal Access Token to browse repositories, manage issues, and create pull requests — all from within OpenJuliet.',
    emoji: '🔑',
    icon: Github,
    screenshotLabel: 'GitHub Connection'
  },
  {
    id: 'provider',
    title: 'Configure AI Provider',
    description:
      'Choose an AI provider — OpenAI, Anthropic, Google, OpenRouter, or a custom endpoint — and set your API key. This powers all autonomous coding tasks.',
    emoji: '🤖',
    icon: Cpu,
    screenshotLabel: 'AI Provider Setup'
  },
  {
    id: 'repository',
    title: 'Clone or Open a Repository',
    description:
      'Clone a remote GitHub repository or open an existing local project. OpenJuliet indexes the codebase so it understands your project structure.',
    emoji: '📂',
    icon: FolderOpen,
    screenshotLabel: 'Repository Manager'
  },
  {
    id: 'issues',
    title: 'Browse Issues',
    description:
      'Browse, filter, and select issues from your connected repositories. Each issue can be turned into an autonomous task for OpenJuliet to solve.',
    emoji: '🔍',
    icon: Search,
    screenshotLabel: 'Issue Browser'
  },
  {
    id: 'first-task',
    title: 'Run Your First Task',
    description:
      'Select an issue or describe a feature, and let OpenJuliet autonomously plan, code, test, and iterate — just like a senior engineer would.',
    emoji: '🚀',
    icon: Rocket,
    screenshotLabel: 'Task Execution'
  }
]

/* ──── Animation Variants ──── */

const panelVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: [0.65, 0, 0.35, 1] }
  }
}

const stepContentVariants = {
  enter: { opacity: 0, x: 40 },
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  }
}

/* ──── Sub-Components ──── */

/**
 * Screenshot placeholder — emoji + label, represents where a real screenshot goes.
 */
function ScreenshotPlaceholder({
  emoji,
  label
}: {
  emoji: string
  label: string
}): JSX.Element {
  return (
    <motion.div
      variants={staggerItem}
      className="relative flex flex-col items-center justify-center h-36 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-tertiary)] overflow-hidden group"
    >
      {/* Subtle background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-subtle)] via-transparent to-transparent opacity-40" />

      {/* Emoji */}
      <motion.span
        className="text-4xl mb-2 relative z-10"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {emoji}
      </motion.span>

      {/* Label */}
      <span className="text-xs font-medium text-[var(--color-text-muted)] relative z-10">
        {label}
      </span>

      {/* Badge */}
      <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
        screenshot
      </span>
    </motion.div>
  )
}

/**
 * Step progress dots.
 */
function StepDots({
  total,
  current,
  onSelect
}: {
  total: number
  current: number
  onSelect: (index: number) => void
}): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={cn(
            'relative rounded-full transition-all duration-300',
            i === current
              ? 'w-8 h-2 bg-[var(--color-accent)]'
              : i < current
                ? 'w-2 h-2 bg-[var(--color-accent-subtle)] cursor-pointer hover:bg-[var(--color-accent)]'
                : 'w-2 h-2 bg-[var(--color-bg-tertiary)] cursor-pointer hover:bg-[var(--color-text-muted)]'
          )}
          aria-label={`Go to step ${i + 1}`}
        >
          {/* Pulse ring on active */}
          {i === current && (
            <motion.span
              className="absolute inset-0 rounded-full border border-[var(--color-accent)]"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              aria-hidden="true"
            />
          )}
        </button>
      ))}
    </div>
  )
}

/* ──── Main Component ──── */

/**
 * QuickStartGuide — Animated slide-out panel for in-app onboarding.
 *
 * Walks new users through 5 key steps:
 *   1. Connect GitHub
 *   2. Configure AI Provider
 *   3. Clone/Open a Repository
 *   4. Browse Issues
 *   5. Run Your First Task
 *
 * Features:
 * - Spring-animated panel from the right with glassmorphism
 * - Animated step transitions with stagger children
 * - Emoji screenshot placeholders (swap for real images)
 * - Progress bar + step dots
 * - "Got it" completion and "Skip tutorial" dismissal
 * - Option to render as standalone page (for WelcomeScreen integration)
 */
export default function QuickStartGuide({
  open,
  onClose,
  standalone = false
}: QuickStartGuideProps): JSX.Element | null {
  const { completeOnboarding, isFirstLaunch } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)

  const totalSteps = STEPS.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  // Auto-show when first launch is detected
  useEffect(() => {
    if (isFirstLaunch && open) {
      setCurrentStep(0)
    }
  }, [isFirstLaunch, open])

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setDirection(1)
      setCurrentStep((s) => s + 1)
    }
  }, [currentStep, totalSteps])

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  const goToStep = useCallback(
    (index: number) => {
      setDirection(index > currentStep ? 1 : -1)
      setCurrentStep(index)
    },
    [currentStep]
  )

  const handleGotIt = useCallback(() => {
    completeOnboarding()
    onClose()
  }, [completeOnboarding, onClose])

  const handleSkip = useCallback(() => {
    completeOnboarding()
    onClose()
  }, [completeOnboarding, onClose])

  const step = STEPS[currentStep]
  const StepIcon = step.icon
  const isFirst = currentStep === 0
  const isLast = currentStep === totalSteps - 1

  // Standalone mode — render as a regular page
  if (standalone) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          key={currentStep}
          variants={stepContentVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="w-full max-w-lg mx-auto"
        >
          <StepCard
            step={step}
            StepIcon={StepIcon}
            progress={progress}
            totalSteps={totalSteps}
            currentStep={currentStep}
            isFirst={isFirst}
            isLast={isLast}
            onPrev={goPrev}
            onNext={goNext}
            onGotIt={handleGotIt}
            onSkip={handleSkip}
            onGoToStep={goToStep}
          />
        </motion.div>
      </div>
    )
  }

  // Slide-out panel
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed top-0 right-0 z-50 h-full w-full max-w-md',
              'flex flex-col',
              // Glassmorphism
              'bg-[rgba(30,30,46,0.85)] backdrop-blur-2xl',
              'border-l border-[rgba(42,42,62,0.6)]',
              'shadow-[-8px_0_32px_rgba(0,0,0,0.4)]'
            )}
            role="dialog"
            aria-label="Quick start guide"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[var(--color-accent)]" />
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Quick Start
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                aria-label="Close quick start guide"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-5 pt-4 pb-2 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <span className="text-xs font-medium text-[var(--color-accent)]">
                  {Math.round(progress)}%
                </span>
              </div>
              <ProgressBar
                value={progress}
                size="sm"
                variant="accent"
              />
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={stepContentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <div className="space-y-4">
                    {/* Step Icon + Title */}
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-3"
                    >
                      <motion.div
                        variants={staggerItem}
                        className="inline-flex p-3 rounded-xl bg-[var(--color-accent-subtle)]"
                      >
                        <StepIcon
                          size={24}
                          className="text-[var(--color-accent)]"
                        />
                      </motion.div>

                      <motion.h3
                        variants={staggerItem}
                        className="text-lg font-semibold text-[var(--color-text-primary)]"
                      >
                        {step.title}
                      </motion.h3>

                      <motion.p
                        variants={staggerItem}
                        className="text-sm text-[var(--color-text-secondary)] leading-relaxed"
                      >
                        {step.description}
                      </motion.p>
                    </motion.div>

                    {/* Screenshot Placeholder */}
                    <ScreenshotPlaceholder
                      emoji={step.emoji}
                      label={step.screenshotLabel}
                    />

                    {/* Tips / callout */}
                    <motion.div
                      variants={staggerItem}
                      className="p-3 rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-border)]"
                    >
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        💡 <strong className="text-[var(--color-text-primary)]">Tip:</strong>{' '}
                        {currentStep === 0 &&
                          'You can also connect GitHub later from Settings → GitHub.'}
                        {currentStep === 1 &&
                          'Your API key is stored locally and never leaves your machine.'}
                        {currentStep === 2 &&
                          'OpenJuliet supports monorepos and polyglot projects out of the box.'}
                        {currentStep === 3 &&
                          'Use labels and filters to narrow down issues by area or priority.'}
                        {currentStep === 4 &&
                          'Watch the autonomous workflow in the Execution Panel — you can pause or cancel anytime.'}
                        {currentStep > 4 && ''}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer — Navigation + Actions */}
            <div className="px-5 py-4 border-t border-[var(--color-border)] shrink-0 space-y-3">
              {/* Step Dots */}
              <StepDots
                total={totalSteps}
                current={currentStep}
                onSelect={goToStep}
              />

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                {!isFirst ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ChevronLeft size={16} />}
                    onClick={goPrev}
                  >
                    Back
                  </Button>
                ) : (
                  <div /> /* Spacer */
                )}

                <div className="flex-1" />

                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip tutorial
                </Button>

                {isLast ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Check size={16} />}
                    onClick={handleGotIt}
                  >
                    Got it
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ChevronRight size={16} />}
                    onClick={goNext}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/* ──── Standalone Step Card (extracted for reuse) ──── */

interface StepCardProps {
  step: StepDef
  StepIcon: typeof Sparkles
  progress: number
  totalSteps: number
  currentStep: number
  isFirst: boolean
  isLast: boolean
  onPrev: () => void
  onNext: () => void
  onGotIt: () => void
  onSkip: () => void
  onGoToStep: (index: number) => void
}

function StepCard({
  step,
  StepIcon,
  progress,
  totalSteps,
  currentStep,
  isFirst,
  isLast,
  onPrev,
  onNext,
  onGotIt,
  onSkip,
  onGoToStep
}: StepCardProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-xs font-medium text-[var(--color-accent)]">
          {Math.round(progress)}%
        </span>
      </div>
      <ProgressBar value={progress} size="sm" variant="accent" />

      {/* Content */}
      <div className="space-y-3">
        <div className="inline-flex p-3 rounded-xl bg-[var(--color-accent-subtle)]">
          <StepIcon size={24} className="text-[var(--color-accent)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {step.title}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {step.description}
        </p>
      </div>

      {/* Screenshot */}
      <ScreenshotPlaceholder emoji={step.emoji} label={step.screenshotLabel} />

      {/* Step Dots */}
      <StepDots total={totalSteps} current={currentStep} onSelect={onGoToStep} />

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        {!isFirst ? (
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} onClick={onPrev}>
            Back
          </Button>
        ) : (
          <div />
        )}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip
        </Button>
        {isLast ? (
          <Button variant="primary" size="sm" icon={<Check size={16} />} onClick={onGotIt}>
            Got it
          </Button>
        ) : (
          <Button variant="primary" size="sm" icon={<ChevronRight size={16} />} onClick={onNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  )
}