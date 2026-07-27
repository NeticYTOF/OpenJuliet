// ---------------------------------------------------------------------------
// OpenJuliet preload type declarations.
// Re-exports all types from types.d.ts for convenient single-import usage.
// Also augments the global Window interface so renderer code can use
// window.api without additional type assertions.
// ---------------------------------------------------------------------------

export type {
  AppAPI,
  DbAPI,
  DemoAPI,
  ElectronAPI,
  EventsAPI,
  ExecutionAPI,
  ExecutionStatus,
  ExecutionTask,
  GitAPI,
  GitChange,
  GitHubIssue,
  GitHubPR,
  GitHubRepo,
  GitLogEntry,
  GitStatus,
  GithubAPI,
  Project,
  Provider,
  ProviderAPI,
  ProviderConfig,
  Settings,
  SettingsAPI,
  ShellAPI,
  ShellOutput,
  UpdateAPI,
  Workspace,
  WorkspaceAPI
} from './types'