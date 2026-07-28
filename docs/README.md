# OpenJuliet Documentation

> A beautiful, open-source, local-first autonomous coding agent.

## Quick Links

- [Feature Overview](features-overview.md)
- [Getting Started Guide](getting-started.md)
- [Keyboard Shortcuts](keyboard-shortcuts.md)

## Feature Documentation

| Document | Description |
|----------|-------------|
| [Autonomous Workflow](features/autonomous-workflow.md) | 7-stage AI-powered coding pipeline |
| [AI Providers](features/ai-providers.md) | 7 supported AI providers + custom |
| [GitHub Integration](features/github-integration.md) | Repos, issues, PRs, auth |
| [Editor Experience](features/editor-experience.md) | Monaco editor, diff viewer, file explorer |
| [Terminal](features/terminal.md) | Integrated terminal with xterm.js |
| [Live Execution](features/live-execution.md) | Progress, logs, resource monitoring |
| [Project Management](features/project-management.md) | Tasks, queue, history, scheduling |
| [User Interface](features/user-interface.md) | Navigation, theming, components |
| [Settings](features/settings.md) | All configuration options |
| [Extensibility](features/extensibility.md) | Plugins, custom providers, hooks |

## Architecture Documentation

| Document | Description |
|----------|-------------|
| [Architecture Overview](architecture/overview.md) | High-level app structure |
| [Data Flow](architecture/data-flow.md) | IPC between main and renderer |
| [Security](architecture/security.md) | CSP, auth, data handling |

## Development

| Document | Description |
|----------|-------------|
| [Development Guide](development.md) | Setup, build, test, package |
| [API Reference](api.md) | IPC channels and preload API |

## Quick Stats

- **Source files:** 100+ TypeScript/TSX
- **Components:** 29 UI + 24 feature + 4 editor
- **Tests:** 416+ (20 test files)
- **Build:** Electron 35 + React 19 + TypeScript 5
- **i18n:** 6 languages (en-US, es, fr, de, ja, zh)
