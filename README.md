# OpenJuliet

> A beautiful, open-source, local-first autonomous coding agent.

OpenJuliet is a premium desktop application that brings autonomous AI-powered software engineering to your local machine. Connect GitHub, browse repositories, select issues, and watch as OpenJuliet analyzes, plans, implements, tests, and generates pull requests — all under your control.

![OpenJuliet](resources/icon.svg)

## Philosophy

OpenJuliet is built on the belief that AI-assisted development should be:
- **Local-first** — Your code, your repositories, your data. No mandatory cloud.
- **Autonomous** — From issue to PR, end-to-end execution.
- **Beautiful** — A premium desktop experience, not an engineering dashboard.
- **Open** — MIT licensed, extensible, and community-driven.

## Features

### 🤖 Autonomous Workflow
- Repository analysis → Issue understanding → Planning → Implementation
- Testing → Review → Commit → Pull Request generation
- Each stage exposes real-time progress

### 🌐 Multi-Provider AI
- OpenAI • Anthropic • Google • OpenRouter • Azure
- Ollama • LM Studio • vLLM • Custom OpenAI-compatible
- Hot-swap providers mid-session

### 🚀 GitHub Integration
- Repository browser • Issue browser • PR browser
- OAuth & PAT authentication • Commit history • Diff viewer
- Auto-generated PR descriptions • Suggested reviewers

### 🎨 Beautiful Design
- Dark theme with purple accent
- Glassmorphic UI • Smooth animations
- Keyboard-first workflow • Professional typography
- Thoughtful empty states • Polished loading states

### 📦 Local Storage
- SQLite database for all local data
- No mandatory cloud backend
- Full export/import capability

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Docker (optional, for sandboxed execution)

### Installation

```bash
# Clone the repository
git clone https://github.com/NeticYTOF/OpenJuliet.git
cd OpenJuliet

# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
```

### First Launch
1. Launch OpenJuliet
2. Connect your GitHub account (OAuth or PAT)
3. Select or configure an AI provider
4. Choose your workspace directory
5. Clone a repository or open an existing one
6. Browse an issue and click "Execute"

## Architecture

```
OpenJuliet/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # App entry, window management
│   │   ├── github/     # GitHub API integration
│   │   ├── git/        # Git operations
│   │   ├── providers/  # AI provider system
│   │   ├── execution/  # Task execution engine
│   │   ├── database/   # SQLite persistence
│   │   ├── sandbox/    # Execution sandbox
│   │   └── ipc/        # IPC handlers
│   ├── preload/        # Context bridge API
│   └── renderer/       # React UI
│       └── src/
│           ├── components/  # React components
│           ├── stores/      # Zustand state management
│           ├── hooks/       # React hooks
│           ├── lib/         # Utilities
│           ├── styles/      # CSS & Tailwind
│           └── types/       # TypeScript types
├── resources/          # App icons and assets
├── docs/               # Documentation
├── plugins/            # Plugin system
└── scripts/            # Build scripts
```

## Configuration

### AI Providers

OpenJuliet supports multiple AI providers. Configure them in Settings:

| Provider   | Type     | Default Model              |
|------------|----------|----------------------------|
| OpenAI     | API      | gpt-4o                     |
| Anthropic  | API      | claude-sonnet-4            |
| Google     | API      | gemini-2.0-flash           |
| OpenRouter | Gateway  | Various                    |
| Ollama     | Local    | llama3                     |
| LM Studio  | Local    | Server-configured          |
| vLLM       | Local    | Server-configured          |
| Custom     | Any      | As configured              |

### Keyboard Shortcuts

| Shortcut          | Action          |
|-------------------|-----------------|
| `Cmd/Ctrl+K`      | Command palette |
| `Cmd/Ctrl+B`      | Toggle sidebar  |
| `Cmd/Ctrl+,`      | Settings        |
| `Cmd/Ctrl+Enter`  | Execute task    |
| `Escape`          | Close modal     |

## Extensibility

OpenJuliet supports a plugin architecture:
- **Provider plugins** — Add new AI providers
- **Execution plugins** — Custom execution stages
- **Custom prompts** — Override system prompts
- **Workflow templates** — Define custom workflows
- **Hooks** — Execute code at workflow stages

## Development

```bash
# Development with hot reload
npm run dev

# Type checking
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Package for distribution
npm run package
```

## Tech Stack

- **Electron** — Desktop framework
- **React 19** — UI library
- **TypeScript** — Type safety
- **Vite** — Build tooling
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **Radix UI** — Accessible primitives
- **Zustand** — State management
- **SQLite (sql.js)** — Local database
- **Octokit** — GitHub API

## License

MIT License — see [LICENSE](LICENSE)

## Acknowledgements

Inspired by the autonomous coding agent paradigm. Built with ❤️ for the open-source community.