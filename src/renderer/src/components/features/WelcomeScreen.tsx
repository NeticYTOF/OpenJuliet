import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Github,
  Key,
  FolderOpen,
  ArrowRight,
  Cpu,
  ChevronRight,
  Check
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Divider } from '../ui/Divider'
import { GlowText } from '../ui/GlowText'
import { APP_NAME, APP_DESCRIPTION, PRESET_PROVIDERS } from '../../lib/constants'

/** Ordered step keys for progress tracking */
const STEPS = ['welcome', 'github', 'workspace', 'provider'] as const
type Step = (typeof STEPS)[number]

/* ─── Animation Variants ─────────────────────────────────────────── */

const springConfig = { type: 'spring' as const, stiffness: 200, damping: 15 }

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }
  }
}

const pageTransition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 24,
  mass: 0.8
}

/* ─── Particle / Star Background ─────────────────────────────────── */

function StarField(): JSX.Element {
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-[var(--color-accent)]"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}

/* ─── Step Indicator ─────────────────────────────────────────────── */

interface StepIndicatorProps {
  current: Step
}

const stepMeta: Record<Step, { label: string; icon: typeof Sparkles }> = {
  welcome: { label: 'Welcome', icon: Sparkles },
  github: { label: 'GitHub', icon: Github },
  workspace: { label: 'Workspace', icon: FolderOpen },
  provider: { label: 'Provider', icon: Cpu }
}

function StepIndicator({ current }: StepIndicatorProps): JSX.Element {
  const currentIndex = STEPS.indexOf(current)

  return (
    <nav className="flex items-center justify-center gap-1 mb-8" aria-label="Setup progress">
      {STEPS.map((stepKey, index) => {
        const isCompleted = index < currentIndex
        const isActive = index === currentIndex
        const isFuture = index > currentIndex
        const MetaIcon = stepMeta[stepKey].icon

        return (
          <div key={stepKey} className="flex items-center">
            {/* Step dot */}
            <motion.div
              className={cn(
                'relative flex items-center justify-center rounded-full transition-colors',
                'w-8 h-8',
                isCompleted && 'bg-[var(--color-accent)] text-white',
                isActive &&
                  'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] ring-2 ring-[var(--color-accent)]',
                isFuture && 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
              )}
              initial={false}
              animate={{
                scale: isActive ? 1.1 : 1,
                transition: { type: 'spring', stiffness: 300, damping: 15 }
              }}
            >
              {isCompleted ? (
                <motion.span
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <Check size={16} strokeWidth={3} />
                </motion.span>
              ) : (
                <MetaIcon size={16} />
              )}

              {/* Pulse ring on active */}
              {isActive && (
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]"
                  animate={{
                    scale: [1, 1.4],
                    opacity: [0.6, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut'
                  }}
                  aria-hidden="true"
                />
              )}
            </motion.div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div className="relative mx-1 w-8 h-0.5 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                <motion.div
                  className="absolute inset-0 bg-[var(--color-accent)]"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

/* ─── WelcomeScreen Component ────────────────────────────────────── */

/**
 * WelcomeScreen — First-launch onboarding wizard with animated logo entrance,
 * stagger-children step transitions, particle background, polished step indicators,
 * and smooth progress between steps.
 */
export default function WelcomeScreen(): JSX.Element {
  const { completeOnboarding } = useAppStore()
  const { setWorkspaceDir, addProvider, setGitHubAuth } = useSettingsStore()
  const [step, setStep] = useState<Step>('welcome')
  const [patToken, setPatToken] = useState('')

  const handleSelectWorkspace = async (): Promise<void> => {
    const dir = await window.api?.openDirectory()
    if (dir) setWorkspaceDir(dir)
  }

  const handleSkipToApp = (): void => {
    completeOnboarding()
  }

  const navigateTo = (target: Step): void => {
    setStep(target)
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      {/* Particle background */}
      <StarField />

      {/* Content */}
      <div className="relative z-10">
        <AnimatePresence mode="popLayout">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              layout
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -20 }}
              transition={pageTransition}
              className="text-center max-w-md px-6"
            >
              <motion.div layout="position">
                {/* Logo with spring entrance */}
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, ...springConfig }}
                  className="inline-flex p-4 rounded-2xl bg-[var(--color-accent-subtle)] mb-6 relative"
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(108,92,231,0)',
                        '0 0 30px rgba(108,92,231,0.4)',
                        '0 0 0px rgba(108,92,231,0)'
                      ]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-2xl"
                  />
                  <Sparkles size={48} className="text-[var(--color-accent)] relative z-10" />
                </motion.div>

                {/* Title */}
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  <motion.div variants={staggerItem}>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                      Welcome to{' '}
                      <GlowText as="span" direction="right" intensity="normal">
                        {APP_NAME}
                      </GlowText>
                    </h1>
                  </motion.div>

                  <motion.p
                    variants={staggerItem}
                    className="text-sm text-[var(--color-text-secondary)] mb-8 leading-relaxed max-w-sm mx-auto"
                  >
                    {APP_DESCRIPTION}
                  </motion.p>

                  <motion.div variants={staggerItem} className="space-y-3">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      icon={<ArrowRight size={18} />}
                      onClick={() => navigateTo('github')}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      onClick={handleSkipToApp}
                    >
                      Skip setup — I&apos;ll configure later
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {step === 'github' && (
            <motion.div
              key="github"
              layout
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={pageTransition}
              className="w-full max-w-md px-6"
            >
              <Card variant="default" padding="lg">
                <StepIndicator current={step} />

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.div variants={staggerItem} className="text-center mb-6">
                    <div className="inline-flex p-3 rounded-xl bg-[var(--color-accent-subtle)] mb-3">
                      <Github size={24} className="text-[var(--color-accent)]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      Connect GitHub
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Link your GitHub account to browse repositories and manage issues.
                    </p>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Button variant="secondary" size="md" icon={<Github size={16} />} fullWidth disabled>
                      Sign in with GitHub OAuth{' '}
                      <Badge variant="default" size="sm" className="ml-2">
                        Soon
                      </Badge>
                    </Button>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Divider variant="subtle" label="or use PAT" />
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Input
                      label="Personal Access Token"
                      type="password"
                      icon={<Key size={16} />}
                      value={patToken}
                      onChange={(e) => setPatToken(e.target.value)}
                      placeholder="ghp_..."
                    />
                  </motion.div>

                  <motion.div variants={staggerItem} className="flex gap-2 pt-2">
                    <Button variant="ghost" size="md" fullWidth onClick={() => navigateTo('welcome')}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onClick={() => {
                        if (patToken.trim()) {
                          setGitHubAuth({
                            token: patToken.trim(),
                            isConnected: true,
                            method: 'pat',
                            username: 'user'
                          })
                        }
                        navigateTo('workspace')
                      }}
                    >
                      {patToken.trim() ? 'Connect & Continue' : 'Skip'}
                    </Button>
                  </motion.div>
                </motion.div>
              </Card>
            </motion.div>
          )}

          {step === 'workspace' && (
            <motion.div
              key="workspace"
              layout
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={pageTransition}
              className="w-full max-w-md px-6"
            >
              <Card variant="default" padding="lg">
                <StepIndicator current={step} />

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.div variants={staggerItem} className="text-center mb-6">
                    <div className="inline-flex p-3 rounded-xl bg-[var(--color-accent-subtle)] mb-3">
                      <FolderOpen size={24} className="text-[var(--color-accent)]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      Select Workspace
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Choose a directory where OpenJuliet will manage your projects.
                    </p>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Button
                      variant="secondary"
                      size="lg"
                      fullWidth
                      icon={<FolderOpen size={18} />}
                      onClick={handleSelectWorkspace}
                    >
                      Browse for Directory
                    </Button>
                  </motion.div>

                  <motion.div variants={staggerItem} className="flex gap-2 pt-2">
                    <Button variant="ghost" size="md" fullWidth onClick={() => navigateTo('github')}>
                      Back
                    </Button>
                    <Button variant="primary" size="md" fullWidth onClick={() => navigateTo('provider')}>
                      Continue
                    </Button>
                  </motion.div>
                </motion.div>
              </Card>
            </motion.div>
          )}

          {step === 'provider' && (
            <motion.div
              key="provider"
              layout
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={pageTransition}
              className="w-full max-w-md px-6"
            >
              <Card variant="default" padding="lg">
                <StepIndicator current={step} />

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.div variants={staggerItem} className="text-center mb-6">
                    <div className="inline-flex p-3 rounded-xl bg-[var(--color-accent-subtle)] mb-3">
                      <Cpu size={24} className="text-[var(--color-accent)]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      Choose AI Provider
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Select an AI provider to power your coding tasks.
                    </p>
                  </motion.div>

                  <motion.div variants={staggerItem} className="space-y-3 mb-6">
                    {PRESET_PROVIDERS.map((preset) => (
                      <motion.div
                        key={preset.id}
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] cursor-pointer transition-colors group"
                        onClick={() => {
                          addProvider({ ...preset, apiKey: '', enabled: true })
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Cpu size={18} className="text-[var(--color-accent)]" />
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            {preset.name}
                          </span>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors"
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div variants={staggerItem} className="space-y-3">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={handleSkipToApp}
                    >
                      Continue to App
                    </Button>
                    <Button variant="ghost" size="sm" fullWidth onClick={() => navigateTo('workspace')}>
                      Back
                    </Button>
                  </motion.div>
                </motion.div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
