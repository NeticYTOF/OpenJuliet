import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import {
  Settings,
  Palette,
  Cpu,
  Github,
  Play,
  Info,
  Key,
  Plus,
  Trash2,
  RefreshCw,
  User,
  Mail,
  FolderOpen,
  Clock,
  Shield,
  BookOpen
} from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAppStore } from '../../stores/appStore'
import { useWindowSize } from '../../hooks/useWindowSize'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Switch } from '../ui/Switch'
import { Badge } from '../ui/Badge'
import { AnimatedContainer, AnimatedItem } from '../ui/AnimatedContainer'
import { PRESET_PROVIDERS, APP_NAME, APP_VERSION } from '../../lib/constants'
import { cn } from '../../lib/utils'
import type { AIProvider, ThemeMode } from '../../types'

const tabStyles = cn(
  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
  'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]',
  'data-[state=active]:bg-[var(--color-accent-subtle)] data-[state=active]:text-[var(--color-accent)] data-[state=active]:shadow-sm'
)

/**
 * SettingsView — Full settings panel with tabbed sections for General, Providers, GitHub, Execution, Appearance, and About.
 */
export default function SettingsView(): JSX.Element {
  const [activeTab, setActiveTab] = useState('general')
  const { isSmall } = useWindowSize()

  return (
    <AnimatedContainer animation="slideUp">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={22} className="text-[var(--color-text-primary)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Configure your OpenJuliet experience</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <Tabs.Root orientation={isSmall ? 'horizontal' : 'vertical'} value={activeTab} onValueChange={setActiveTab} className={isSmall ? "w-full" : "flex gap-6 w-full"}>
          <Tabs.List className={isSmall
            ? "flex gap-1 mb-6 p-1 bg-[var(--color-bg-tertiary)] rounded-lg overflow-x-auto w-full"
            : "flex flex-col gap-1 w-48 shrink-0"
          }>
            <Tabs.Trigger value="general" className={tabStyles}><User size={16} /><span className="hide-sm">{isSmall ? '' : 'General'}</span></Tabs.Trigger>
            <Tabs.Trigger value="providers" className={tabStyles}><Cpu size={16} /><span className="hide-sm">{isSmall ? '' : 'Providers'}</span></Tabs.Trigger>
            <Tabs.Trigger value="github" className={tabStyles}><Github size={16} /><span className="hide-sm">{isSmall ? '' : 'GitHub'}</span></Tabs.Trigger>
            <Tabs.Trigger value="execution" className={tabStyles}><Play size={16} /><span className="hide-sm">{isSmall ? '' : 'Execution'}</span></Tabs.Trigger>
            <Tabs.Trigger value="appearance" className={tabStyles}><Palette size={16} /><span className="hide-sm">{isSmall ? '' : 'Appearance'}</span></Tabs.Trigger>
            <Tabs.Trigger value="about" className={tabStyles}><Info size={16} /><span className="hide-sm">{isSmall ? '' : 'About'}</span></Tabs.Trigger>
          </Tabs.List>

          {/* Tab panels */}
          <div className={isSmall ? "w-full" : "flex-1 max-w-2xl"}>
            <Tabs.Content value="general"><GeneralSettings /></Tabs.Content>
            <Tabs.Content value="providers"><ProviderSettings /></Tabs.Content>
            <Tabs.Content value="github"><GitHubSettings /></Tabs.Content>
            <Tabs.Content value="execution"><ExecutionSettings /></Tabs.Content>
            <Tabs.Content value="appearance"><AppearanceSettings /></Tabs.Content>
            <Tabs.Content value="about"><AboutSettings /></Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </AnimatedContainer>
  )
}

// ─── General ───

function GeneralSettings(): JSX.Element {
  const { workspaceDir, setWorkspaceDir, gitUser, gitEmail, setGitUser, setGitEmail, resetSettings } = useSettingsStore()

  const handleSelectDir = async (): Promise<void> => {
    const dir = await window.api?.openDirectory()
    if (dir) setWorkspaceDir(dir)
  }

  return (
    <div className="space-y-6">
      <AnimatedItem>
        <Card variant="default" padding="lg">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Workspace</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Workspace Directory</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <FolderOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--color-text-primary)]"
                    value={workspaceDir}
                    readOnly
                    placeholder="Select a workspace directory..."
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={handleSelectDir}>Browse</Button>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card variant="default" padding="lg">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Git Configuration</h3>
          <div className="space-y-4">
            <Input label="Git Username" icon={<User size={16} />} value={gitUser} onChange={(e) => setGitUser(e.target.value)} placeholder="Your Git username" />
            <Input label="Git Email" icon={<Mail size={16} />} value={gitEmail} onChange={(e) => setGitEmail(e.target.value)} placeholder="your@email.com" />
          </div>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card variant="default" padding="lg">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 text-[var(--color-error)]">Danger Zone</h3>
          <Button variant="danger" size="sm" onClick={resetSettings}>Reset All Settings</Button>
        </Card>
      </AnimatedItem>
    </div>
  )
}

// ─── Providers ───

function ProviderSettings(): JSX.Element {
  const { providers, addProvider, removeProvider, updateProvider } = useSettingsStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProvider, setNewProvider] = useState<Partial<AIProvider>>({})

  const handleAddPreset = (preset: typeof PRESET_PROVIDERS[0]): void => {
    addProvider({
      ...preset,
      apiKey: '',
      enabled: false
    })
  }

  return (
    <div className="space-y-4">
      <AnimatedItem>
        <Card variant="default" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">AI Providers</h3>
            <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setShowAddForm(!showAddForm)}>
              Add Provider
            </Button>
          </div>

          {/* Add from presets */}
          <div className="space-y-2 mb-4">
            {PRESET_PROVIDERS.map((preset) => {
              const existing = providers.find((p) => p.id === preset.id)
              return (
                <div key={preset.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                  <div className="flex items-center gap-3">
                    <Cpu size={16} className="text-[var(--color-accent)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{preset.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{preset.models.length} models</p>
                    </div>
                  </div>
                  {existing ? (
                    <Badge variant="success" size="sm" dot>Added</Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleAddPreset(preset)}>Add</Button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Custom provider form */}
          {showAddForm && (
            <div className="p-3 rounded-lg border border-[var(--color-border)] space-y-3 mb-4">
              <Input label="Provider Name" value={newProvider.name || ''} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} placeholder="My Provider" />
              <Input label="API Base URL" value={newProvider.baseUrl || ''} onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })} placeholder="https://api.example.com/v1" icon={<Globe size={16} />} />
              <Input label="API Key" type="password" value={newProvider.apiKey || ''} onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })} icon={<Key size={16} />} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={() => {
                  if (newProvider.name) {
                    addProvider({
                      id: `custom-${Date.now()}`,
                      name: newProvider.name,
                      kind: 'custom',
                      baseUrl: newProvider.baseUrl,
                      apiKey: newProvider.apiKey,
                      models: [],
                      enabled: true
                    } as AIProvider)
                    setNewProvider({})
                    setShowAddForm(false)
                  }
                }}>Save</Button>
              </div>
            </div>
          )}

          {/* Existing providers */}
          {providers.map((provider) => (
            <div key={provider.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors group">
              <div className="flex items-center gap-3">
                <Switch checked={provider.enabled} onCheckedChange={(enabled) => updateProvider(provider.id, { enabled })} size="sm" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{provider.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{provider.models.length} models · {provider.baseUrl}</p>
                </div>
              </div>
              <button
                onClick={() => removeProvider(provider.id)}
                className="p-1.5 rounded text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {providers.length === 0 && !showAddForm && (
            <div className="text-center py-6">
              <div className="inline-flex p-2 rounded-lg bg-[var(--color-bg-tertiary)] mb-3">
                <Cpu size={20} className="text-[var(--color-text-muted)]" />
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">No providers configured yet</p>
              <p className="text-xs text-[var(--color-text-muted)] mb-4 max-w-xs mx-auto">
                Add an AI provider from the presets above or create a custom one to start executing tasks.
              </p>
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setShowAddForm(true)}>
                Add Your First Provider
              </Button>
            </div>
          )}
        </Card>
      </AnimatedItem>
    </div>
  )
}

// ─── GitHub ───

function GitHubSettings(): JSX.Element {
  const { github, setGitHubAuth } = useSettingsStore()
  const [tokenInput, setTokenInput] = useState('')

  return (
    <div className="space-y-4">
      <AnimatedItem>
        <Card variant="default" padding="lg">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">GitHub Authentication</h3>

          {github.isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-success-bg)]">
                <Github size={20} className="text-[var(--color-success)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Connected as @{github.username || 'user'}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Method: {github.method.toUpperCase()}</p>
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={() => setGitHubAuth({ isConnected: false, method: 'none' })}>
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="secondary" size="md" icon={<Github size={16} />} fullWidth disabled>
                Sign in with GitHub OAuth <Badge variant="default" size="sm" className="ml-2">Soon</Badge>
              </Button>
              <Input
                label="Personal Access Token"
                type="password"
                icon={<Key size={16} />}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_..."
                hint="Create a token at GitHub Settings → Developer Settings with repo scope"
              />
              <Button
                variant="primary"
                size="sm"
                disabled={!tokenInput.trim()}
                onClick={() => {
                  setGitHubAuth({ token: tokenInput.trim(), isConnected: true, method: 'pat', username: 'user' })
                  setTokenInput('')
                }}
              >
                Connect
              </Button>
            </div>
          )}
        </Card>
      </AnimatedItem>
    </div>
  )
}

// ─── Execution ───

function ExecutionSettings(): JSX.Element {
  const { concurrency, setConcurrency, sandboxEnabled, setSandboxEnabled, executionTimeout, setExecutionTimeout, notificationsEnabled, setNotificationsEnabled } = useSettingsStore()

  return (
    <div className="space-y-4">
      <AnimatedItem>
        <Card variant="default" padding="lg">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Execution Settings</h3>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Max Concurrency</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value))}
                  className="flex-1 accent-[var(--color-accent)]"
                />
                <span className="text-sm font-medium text-[var(--color-text-primary)] w-6 text-center">{concurrency}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Execution Timeout (seconds)</label>
              <Input
                type="number"
                value={Math.floor(executionTimeout / 1000)}
                onChange={(e) => setExecutionTimeout(parseInt(e.target.value) * 1000)}
                icon={<Clock size={16} />}
                min={10}
              />
            </div>

            <Switch
              checked={sandboxEnabled}
              onCheckedChange={setSandboxEnabled}
              label="Sandbox mode"
              description="Execute tasks in an isolated sandbox environment"
            />
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              label="Notifications"
              description="Show desktop notifications when tasks complete"
            />
          </div>
        </Card>
      </AnimatedItem>
    </div>
  )
}

// ─── Appearance ───

function AppearanceSettings(): JSX.Element {
  const { theme, setTheme, fontSize, setFontSize, animationsEnabled, setAnimationsEnabled, sidebarCollapsed, setSidebarCollapsed } = useSettingsStore()

  return (
    <div className="space-y-4">
      <AnimatedItem>
        <Card variant="default" padding="lg">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Appearance</h3>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">Theme</label>
              <div className="flex gap-2">
                {(['dark', 'light'] as ThemeMode[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all border',
                      theme === t
                        ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent)]'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]'
                    )}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Font Size</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={12}
                  max={20}
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="flex-1 accent-[var(--color-accent)]"
                />
                <span className="text-sm font-medium text-[var(--color-text-primary)] w-8 text-center">{fontSize}px</span>
              </div>
            </div>

            <Switch
              checked={animationsEnabled}
              onCheckedChange={setAnimationsEnabled}
              label="Animations"
              description="Enable smooth animations and transitions"
            />

            <Switch
              checked={sidebarCollapsed}
              onCheckedChange={setSidebarCollapsed}
              label="Collapse sidebar by default"
              description="Start with the sidebar minimized"
            />
          </div>
        </Card>
      </AnimatedItem>
    </div>
  )
}

// ─── About ───

function AboutSettings(): JSX.Element {
  const { toggleQuickStart } = useAppStore()

  return (
    <div className="space-y-4">
      <AnimatedItem>
        <Card variant="default" padding="lg">
          <div className="text-center mb-4">
            <div className="inline-flex p-3 rounded-xl bg-[var(--color-accent-subtle)] mb-3">
              <Cpu size={24} className="text-[var(--color-accent)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{APP_NAME}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{APP_VERSION}</p>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            A beautiful, open-source, local-first autonomous coding agent.
            Built with Electron, React, and TypeScript.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" size="sm" icon={<BookOpen size={14} />} onClick={toggleQuickStart}>
              Quick Start Guide
            </Button>
            <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />}>Check for Updates</Button>
          </div>
        </Card>
      </AnimatedItem>
    </div>
  )
}

