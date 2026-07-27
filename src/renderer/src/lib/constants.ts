import type { AppSettings, TaskPriority } from '../types'

/* ──── Application Metadata ──── */

export const APP_NAME = 'OpenJuliet'
export const APP_VERSION = '1.0.0'
export const APP_DESCRIPTION = 'A beautiful, open-source, local-first autonomous coding agent'

/* ──── URLs ──── */

export const REPO_URL = 'https://github.com/NeticYTOF/OpenJuliet'
export const DOCS_URL = 'https://openjuliet.dev/docs'
export const ISSUES_URL = `${REPO_URL}/issues`

/* ──── Default Settings ──── */

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  workspaceDir: '',
  fontSize: 14,
  animationsEnabled: true,
  sidebarCollapsed: false,
  concurrency: 2,
  sandboxEnabled: true,
  executionTimeout: 300_000, // 5 minutes
  notificationsEnabled: true,
  gitUser: '',
  gitEmail: '',
  providers: [],
  github: {
    isConnected: false,
    method: 'none'
  }
}

/* ──── AI Provider Presets ──── */

export const PRESET_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'openai' as const,
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 128_000, supportsVision: true, supportsFunctions: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 128_000, supportsVision: true, supportsFunctions: true },
      { id: 'o3-mini', name: 'o3 Mini', maxTokens: 200_000, supportsVision: false, supportsFunctions: true }
    ],
    enabled: false
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    kind: 'anthropic' as const,
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', maxTokens: 200_000, supportsVision: true, supportsFunctions: true },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', maxTokens: 200_000, supportsVision: true, supportsFunctions: true }
    ],
    enabled: false
  },
  {
    id: 'google',
    name: 'Google AI',
    kind: 'google' as const,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', maxTokens: 1_000_000, supportsVision: true, supportsFunctions: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', maxTokens: 1_000_000, supportsVision: true, supportsFunctions: true }
    ],
    enabled: false
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    kind: 'openrouter' as const,
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o (via OR)', maxTokens: 128_000, supportsVision: true, supportsFunctions: true },
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4 (via OR)', maxTokens: 200_000, supportsVision: true, supportsFunctions: true },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (via OR)', maxTokens: 1_000_000, supportsVision: true, supportsFunctions: true }
    ],
    enabled: false
  }
]

/* ──── Navigation Items ──── */

export type NavItem = {
  id: string
  label: string
  icon: string // lucide icon name
  shortcut?: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', shortcut: '⌘1' },
  { id: 'repositories', label: 'Repositories', icon: 'GitBranch', shortcut: '⌘2' },
  { id: 'issues', label: 'Issues', icon: 'Bug', shortcut: '⌘3' },
  { id: 'tasks', label: 'Tasks', icon: 'ListChecks', shortcut: '⌘4' },
  { id: 'history', label: 'History', icon: 'History', shortcut: '⌘5' },
  { id: 'editor', label: 'Editor', icon: 'Code', shortcut: '⌘6' },
  { id: 'settings', label: 'Settings', icon: 'Settings', shortcut: '⌘,' }
]

/* ──── Task Priorities ──── */

export const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'var(--color-text-muted)' },
  { value: 'medium', label: 'Medium', color: 'var(--color-info)' },
  { value: 'high', label: 'High', color: 'var(--color-warning)' },
  { value: 'critical', label: 'Critical', color: 'var(--color-error)' }
]

/* ──── Keyboard Shortcut Descriptions ──── */

export const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Command palette' },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
  { keys: ['⌘', ','], description: 'Open settings' },
  { keys: ['Esc'], description: 'Close modals / dialogs' },
  { keys: ['⌘', '1–6'], description: 'Navigate views' }
]

/* ──── Storage Keys ──── */

export const STORAGE_KEYS = {
  SETTINGS: 'openjuliet:settings',
  ONBOARDING: 'openjuliet:onboarding',
  RECENT_PROJECTS: 'openjuliet:recent-projects'
} as const