import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Github,
  Key,
  FolderOpen,
  ArrowRight,
  Cpu,
  ChevronRight
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { APP_NAME, APP_DESCRIPTION, PRESET_PROVIDERS } from '../../lib/constants'

/**
 * WelcomeScreen — First-launch onboarding wizard with logo animation, quick setup wizard,
 * GitHub connection, workspace selection, and AI provider configuration.
 */
export default function WelcomeScreen(): JSX.Element {
  const { completeOnboarding } = useAppStore()
  const { setWorkspaceDir, addProvider, setGitHubAuth } = useSettingsStore()
  const [step, setStep] = useState<'welcome' | 'github' | 'workspace' | 'provider'>('welcome')
  const [patToken, setPatToken] = useState('')

  const handleSelectWorkspace = async (): Promise<void> => {
    const dir = await window.api?.openDirectory()
    if (dir) setWorkspaceDir(dir)
  }

  const handleSkipToApp = (): void => {
    completeOnboarding()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-primary)]">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-md px-6"
          >
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex p-4 rounded-2xl bg-[var(--color-accent-subtle)] mb-6"
            >
              <Sparkles size={48} className="text-[var(--color-accent)]" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-[var(--color-text-primary)] mb-2"
            >
              Welcome to{' '}
              <span className="text-gradient">{APP_NAME}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-[var(--color-text-secondary)] mb-8 leading-relaxed"
            >
              {APP_DESCRIPTION}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={<ArrowRight size={18} />}
                onClick={() => setStep('github')}
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
        )}

        {step === 'github' && (
          <motion.div
            key="github"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md px-6"
          >
            <Card variant="default" padding="lg">
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <StepDot active />
                <StepLine />
                <StepDot />
                <StepLine />
                <StepDot />
              </div>

              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-xl bg-[var(--color-accent-subtle)] mb-3">
                  <Github size={24} className="text-[var(--color-accent)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Connect GitHub
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Link your GitHub account to browse repositories and manage issues.
                </p>
              </div>

              <div className="space-y-4">
                <Button variant="secondary" size="md" icon={<Github size={16} />} fullWidth disabled>
                  Sign in with GitHub OAuth <Badge variant="default" size="sm" className="ml-2">Soon</Badge>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[var(--color-border)]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[var(--color-surface)] text-[var(--color-text-muted)]">or use PAT</span>
                  </div>
                </div>

                <Input
                  label="Personal Access Token"
                  type="password"
                  icon={<Key size={16} />}
                  value={patToken}
                  onChange={(e) => setPatToken(e.target.value)}
                  placeholder="ghp_..."
                />

                <div className="flex gap-2">
                  <Button variant="ghost" size="md" fullWidth onClick={() => setStep('welcome')}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      if (patToken.trim()) {
                        setGitHubAuth({ token: patToken.trim(), isConnected: true, method: 'pat', username: 'user' })
                      }
                      setStep('workspace')
                    }}
                  >
                    {patToken.trim() ? 'Connect & Continue' : 'Skip'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 'workspace' && (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md px-6"
          >
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-center gap-2 mb-6">
                <StepDot checked />
                <StepLine />
                <StepDot active />
                <StepLine />
                <StepDot />
              </div>

              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-xl bg-[var(--color-accent-subtle)] mb-3">
                  <FolderOpen size={24} className="text-[var(--color-accent)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Select Workspace
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Choose a directory where OpenJuliet will manage your projects.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  icon={<FolderOpen size={18} />}
                  onClick={handleSelectWorkspace}
                >
                  Browse for Directory
                </Button>

                <div className="flex gap-2">
                  <Button variant="ghost" size="md" fullWidth onClick={() => setStep('github')}>
                    Back
                  </Button>
                  <Button variant="primary" size="md" fullWidth onClick={() => setStep('provider')}>
                    Continue
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 'provider' && (
          <motion.div
            key="provider"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md px-6"
          >
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-center gap-2 mb-6">
                <StepDot checked />
                <StepLine />
                <StepDot checked />
                <StepLine />
                <StepDot active />
              </div>

              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-xl bg-[var(--color-accent-subtle)] mb-3">
                  <Cpu size={24} className="text-[var(--color-accent)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Choose AI Provider
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Select an AI provider to power your coding tasks.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {PRESET_PROVIDERS.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] cursor-pointer transition-colors group"
                    onClick={() => {
                      addProvider({ ...preset, apiKey: '', enabled: true })
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Cpu size={18} className="text-[var(--color-accent)]" />
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{preset.name}</span>
                    </div>
                    <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleSkipToApp}
                >
                  Continue to App
                </Button>
                <Button variant="ghost" size="sm" fullWidth onClick={() => setStep('workspace')}>
                  Back
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Step indicator dot component.
 */
function StepDot({ active, checked }: { active?: boolean; checked?: boolean }): JSX.Element {
  return (
    <div
      className={cn(
        'w-3 h-3 rounded-full transition-colors duration-300',
        checked && 'bg-[var(--color-accent)]',
        active && !checked && 'bg-[var(--color-accent)] ring-2 ring-[var(--color-accent-subtle)]',
        !active && !checked && 'bg-[var(--color-border)]'
      )}
    />
  )
}

/**
 * Step connector line.
 */
function StepLine(): JSX.Element {
  return <div className="w-6 h-px bg-[var(--color-border)]" />
}