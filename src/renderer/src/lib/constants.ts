import type { AppSettings, TaskPriority, AnimationSpeed } from '../types'

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
  },
  /* ─── Theme customization defaults ─── */
  accentColor: '#6c5ce7',
  bgDensity: 50,
  animationSpeed: 'normal' as AnimationSpeed
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

/* ──── Keyboard Shortcuts (grouped by category) ──── */

export interface ShortcutEntry {
  keys: string[]
  description: string
  category: 'Navigation' | 'Editor' | 'Tasks' | 'GitHub' | 'General'
}

export const KEYBOARD_SHORTCUTS: ShortcutEntry[] = [
  /* ─── Navigation ─── */
  { keys: ['⌘', '1'], description: 'Dashboard view', category: 'Navigation' },
  { keys: ['⌘', '2'], description: 'Repositories view', category: 'Navigation' },
  { keys: ['⌘', '3'], description: 'Issues view', category: 'Navigation' },
  { keys: ['⌘', '4'], description: 'Tasks view', category: 'Navigation' },
  { keys: ['⌘', '5'], description: 'History view', category: 'Navigation' },
  { keys: ['⌘', '6'], description: 'Editor view', category: 'Navigation' },
  { keys: ['⌘', ','], description: 'Open settings', category: 'Navigation' },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar', category: 'Navigation' },
  { keys: ['⌘', 'Shift', 'K'], description: 'Keyboard shortcuts reference', category: 'Navigation' },
  /* ─── Editor ─── */
  { keys: ['⌘', 'S'], description: 'Save file', category: 'Editor' },
  { keys: ['⌘', 'Z'], description: 'Undo', category: 'Editor' },
  { keys: ['⌘', 'Shift', 'Z'], description: 'Redo', category: 'Editor' },
  { keys: ['⌘', 'F'], description: 'Find in file', category: 'Editor' },
  { keys: ['⌘', 'H'], description: 'Find and replace', category: 'Editor' },
  { keys: ['⌘', 'D'], description: 'Duplicate selection', category: 'Editor' },
  { keys: ['⌘', '/'], description: 'Toggle comment', category: 'Editor' },
  { keys: ['⌘', ']'], description: 'Indent', category: 'Editor' },
  { keys: ['⌘', '['], description: 'Outdent', category: 'Editor' },
  /* ─── Tasks ─── */
  { keys: ['⌘', 'N'], description: 'New task', category: 'Tasks' },
  { keys: ['⌘', 'Shift', 'Enter'], description: 'Run selected task', category: 'Tasks' },
  { keys: ['⌘', '. '], description: 'Cancel running task', category: 'Tasks' },
  { keys: ['⌘', 'P'], description: 'Pause / resume task', category: 'Tasks' },
  { keys: ['⌘', 'Shift', 'P'], description: 'Open task palette', category: 'Tasks' },
  /* ─── GitHub ─── */
  { keys: ['⌘', 'Shift', 'G'], description: 'Open GitHub panel', category: 'GitHub' },
  { keys: ['⌘', 'Shift', 'I'], description: 'Open issues', category: 'GitHub' },
  { keys: ['⌘', 'Shift', 'R'], description: 'Create PR', category: 'GitHub' },
  { keys: ['⌘', 'Shift', 'C'], description: 'Clone repository', category: 'GitHub' },
  /* ─── General ─── */
  { keys: ['⌘', 'K'], description: 'Command palette', category: 'General' },
  { keys: ['⌘', 'Shift', 'K'], description: 'Keyboard shortcuts', category: 'General' },
  { keys: ['Esc'], description: 'Close modals / dialogs', category: 'General' },
  { keys: ['⌘', 'W'], description: 'Close tab / panel', category: 'General' },
  { keys: ['⌘', 'Q'], description: 'Quit application', category: 'General' },
  { keys: ['⌘', 'M'], description: 'Minimize window', category: 'General' },
  { keys: ['⌘', 'R'], description: 'Reload app', category: 'General' },
  { keys: ['⌘', 'Shift', 'T'], description: 'Theme customizer', category: 'General' }
]

/* ──── Theme Preset Colors ──── */

export const THEME_PRESET_COLORS = [
  { name: 'Purple', value: '#6c5ce7' },
  { name: 'Blue', value: '#4a9eff' },
  { name: 'Cyan', value: '#00d2d3' },
  { name: 'Green', value: '#00b894' },
  { name: 'Lime', value: '#a8e053' },
  { name: 'Yellow', value: '#fdcb6e' },
  { name: 'Orange', value: '#e17055' },
  { name: 'Red', value: '#ff6b6b' },
  { name: 'Pink', value: '#fd79a8' },
  { name: 'Rose', value: '#e84393' }
] as const

/* ──── Storage Keys ──── */

export const STORAGE_KEYS = {
  SETTINGS: 'openjuliet:settings',
  ONBOARDING: 'openjuliet:onboarding',
  RECENT_PROJECTS: 'openjuliet:recent-projects'
} as const