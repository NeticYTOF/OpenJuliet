# OpenJuliet Development Guide

> Complete development guide for contributors to OpenJuliet v1.1.0 — a beautiful, open-source, local-first autonomous coding agent built with Electron + React 19.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Packaging for Distribution](#packaging-for-distribution)
- [Code Quality](#code-quality)
- [Contribution Workflow](#contribution-workflow)
- [Debugging Tips](#debugging-tips)
- [Release Process](#release-process)

---

## Prerequisites

### Required

| Dependency | Minimum Version | Recommended | Purpose |
|------------|----------------|-------------|---------|
| Node.js | 18.x | 22.x | JavaScript runtime |
| npm | 9.x | 10.x | Package manager |
| Git | 2.x | Latest | Version control |

### Optional

| Dependency | Purpose | Notes |
|------------|---------|-------|
| Docker | Sandboxed execution | Only needed if using sandbox feature |
| electron-builder | Packaging for distribution | Pre-installed as dev dependency |
| VS Code | Development IDE | With ESLint + Prettier extensions recommended |

### Verify Installation

```bash
node --version   # v18.0.0+
npm --version    # 9.0.0+
git --version    # 2.0.0+
```

---

## Project Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/NeticYTOF/OpenJuliet.git
cd OpenJuliet
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all dependencies including Electron (35.x), React 19, and all development tools.

### Step 3: Verify Setup

```bash
# Type checking
npm run typecheck

# Should output: No errors found
```

---

## Development Workflow

### Running in Development Mode

```bash
npm run dev
```

This launches the application using `electron-vite dev`, which provides:

- **Hot Module Replacement (HMR)** — Changes to React components are reflected instantly
- **Chrome DevTools** — Opens automatically (F12) in development
- **Source Maps** — Full TypeScript source maps for debugging
- **Vite Dev Server** — Renderer served from `http://localhost:5173` (or next available)

The development flow:

```
npm run dev
    │
    ├── electron-vite dev
    │       │
    │       ├── Builds main process (TypeScript → JavaScript)
    │       ├── Creates preload bundle
    │       └── Starts Vite dev server for renderer
    │
    └── Electron launches BrowserWindow
        │
        ├── Loads renderer from Vite dev server
        ├── DevTools open (F12)
        ├── HMR enabled for React components
        └── Node.js integration: DISABLED
            (all communication via IPC)
```

### Development Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `electron-vite dev` | Start development server with HMR |
| `npm run build` | `electron-vite build` | Build all processes for production |
| `npm run preview` | `electron-vite preview` | Preview production build locally |
| `npm run start` | `electron-vite preview` | Alias for preview |
| `npm run typecheck` | `tsc --noEmit` for node + web | Full type checking |
| `npm run typecheck:node` | `tsc --noEmit -p tsconfig.node.json` | Main process type check |
| `npm run typecheck:web` | `tsc --noEmit -p tsconfig.web.json` | Renderer type check |
| `npm run lint` | `eslint . --ext .ts,.tsx` | Run ESLint on all source files |
| `npm run format` | `prettier --write "src/**/*.{ts,tsx,css,json}"` | Format all source files |
| `npm run clean` | `rm -rf out dist dist_electron node_modules/.vite` | Clean build artifacts |

### Important Development Notes

1. **Never use `nodeIntegration: true`** — All main-renderer communication goes through IPC
2. **Preload is always needed** for Electron API access
3. **Context isolation is always on** — `contextIsolation: true`
4. **F12 opens DevTools** in development only (blocked in production)
5. **Cmd/Ctrl+R** is disabled in production to prevent accidental reloads

---

## Project Structure

```
OpenJuliet/
├── src/
│   ├── main/                      # Electron main process
│   │   ├── index.ts               # Entry point, window creation, lifecycle
│   │   ├── error-logger.ts        # Error logging utility
│   │   ├── database/
│   │   │   ├── index.ts           # SQLite database abstraction
│   │   │   ├── seed.ts            # Database seeding
│   │   │   └── sql.js.d.ts        # TypeScript declarations for sql.js
│   │   ├── execution/
│   │   │   ├── index.ts           # Task execution engine + queue
│   │   │   └── workflow.ts        # Autonomous workflow pipeline
│   │   ├── git/
│   │   │   ├── index.ts           # Git operations via CLI
│   │   │   └── hooks.ts           # Git hook manager
│   │   ├── github/
│   │   │   ├── index.ts           # GitHub API (Octokit)
│   │   │   └── pr.ts              # PR description generation
│   │   ├── ipc/
│   │   │   └── handlers.ts        # All IPC handler registrations
│   │   ├── providers/
│   │   │   └── index.ts           # AI provider system
│   │   ├── sandbox/
│   │   │   └── index.ts           # Execution sandbox
│   │   ├── demo/
│   │   │   ├── demo-runner.ts     # Demo workflow runner
│   │   │   └── workflow-demo.ts   # Demo workflow definitions
│   │   └── __tests__/             # Main process tests
│   │       ├── git.test.ts
│   │       └── github.test.ts
│   │
│   ├── preload/
│   │   ├── index.ts               # contextBridge API exposure
│   │   ├── index.d.ts             # Preload type declarations
│   │   └── types.d.ts             # Shared IPC type definitions
│   │
│   ├── renderer/
│   │   └── src/
│   │       ├── main.tsx           # React entry point
│   │       ├── App.tsx            # Root component
│   │       ├── components/
│   │       │   ├── layout/        # App shell components
│   │       │   │   ├── AppLayout.tsx
│   │       │   │   ├── Titlebar.tsx
│   │       │   │   ├── Sidebar.tsx
│   │       │   │   ├── MainArea.tsx
│   │       │   │   └── StatusBar.tsx
│   │       │   ├── features/      # Feature components
│   │       │   │   ├── Dashboard.tsx
│   │       │   │   ├── GitHubPanel.tsx
│   │       │   │   ├── EditorView.tsx
│   │       │   │   ├── ExecutionPanel.tsx
│   │       │   │   ├── SettingsView.tsx
│   │       │   │   ├── CommandPalette.tsx
│   │       │   │   ├── ThemeCustomizer.tsx
│   │       │   │   ├── Terminal.tsx
│   │       │   │   └── ... (25+ feature components)
│   │       │   ├── editor/        # Code editor components
│   │       │   │   ├── CodeViewer.tsx
│   │       │   │   ├── DiffViewer.tsx
│   │       │   │   ├── FileExplorer.tsx
│   │       │   │   ├── LazyMonacoEditor.tsx
│   │       │   │   ├── Terminal.tsx
│   │       │   │   └── XtermWrapper.tsx
│   │       │   └── ui/            # Reusable UI primitives
│   │       │       ├── Button.tsx
│   │       │       ├── Card.tsx
│   │       │       ├── Dialog.tsx
│   │       │       ├── Modal.tsx
│   │       │       ├── Select.tsx
│   │       │       ├── Tabs.tsx
│   │       │       ├── Toast.tsx
│   │       │       └── ... (30+ UI components)
│   │       ├── stores/            # Zustand state management
│   │       │   ├── appStore.ts
│   │       │   ├── executionStore.ts
│   │       │   ├── githubStore.ts
│   │       │   └── settingsStore.ts
│   │       ├── hooks/             # Custom React hooks
│   │       │   ├── useIPC.ts
│   │       │   ├── useKeyboard.ts
│   │       │   ├── useBreakpoint.ts
│   │       │   ├── useLocale.ts
│   │       │   └── useWindowSize.ts
│   │       ├── lib/               # Utilities
│   │       │   ├── constants.ts
│   │       │   ├── utils.ts
│   │       │   ├── locale.ts
│   │       │   ├── a11y.ts
│   │       │   └── lazyImport.tsx
│   │       ├── styles/
│   │       │   └── globals.css    # Global styles + Tailwind
│   │       └── types/
│   │           └── index.d.ts     # Renderer type declarations
│   │
│   ├── tools/                     # Developer tooling
│   │   ├── dev.sh
│   │   └── typecheck.sh
│   └── types/                     # Shared types
│
├── plugins/                       # Plugin system directory
├── resources/                     # App icons and assets
├── scripts/                       # Build and utility scripts
├── samples/                       # Sample projects
├── release/                       # Packaged distributions (gitignored)
├── docs/                          # Documentation
│
├── electron.vite.config.ts        # Vite configuration
├── electron-builder.yml           # Electron Builder configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # Base TypeScript configuration
├── tsconfig.node.json             # Main process TypeScript configuration
├── tsconfig.web.json              # Renderer TypeScript configuration
├── vitest.config.ts               # Vitest configuration
├── vitest.config.main.ts          # Main process test configuration
├── eslint.config.js               # ESLint flat config
├── postcss.config.js              # PostCSS configuration
├── .prettierrc                    # Prettier configuration
├── .releaserc.json                # semantic-release configuration
├── .editorconfig                  # Editor settings
├── .gitattributes                 # Git attributes
├── .gitignore                     # Git ignore rules
├── .node-version                  # Node version pinning
├── .nvmrc                         # nvm configuration
└── package.json                   # Project metadata + scripts
```

---

## Testing

### Test Framework

OpenJuliet uses **Vitest** for both unit and component tests.

### Running Tests

```bash
# Run all tests once
npm test                 # vitest run

# Run tests in watch mode (TDD)
npm run test:watch       # vitest

# Run tests with coverage report
npm run test:coverage    # vitest run --coverage
```

### Test Structure

Tests are co-located with source files in `__tests__/` directories:

```
src/
├── main/
│   └── __tests__/
│       ├── git.test.ts              # Git operations tests
│       └── github.test.ts           # GitHub API tests
├── renderer/src/
│   ├── __tests__/                   # General renderer tests
│   │   ├── SettingsView.test.tsx
│   │   └── WelcomeScreen.test.tsx
│   ├── components/
│   │   ├── editor/__tests__/
│   │   │   ├── CodeViewer.test.tsx
│   │   │   └── Terminal.test.tsx
│   │   ├── features/__tests__/
│   │   │   ├── CommandPalette.test.tsx
│   │   │   └── Dashboard.test.tsx
│   │   └── ui/__tests__/
│   │       ├── Badge.test.tsx
│   │       ├── Button.test.tsx
│   │       ├── Card.test.tsx
│   │       ├── Dialog.test.tsx
│   │       └── EmptyState.test.tsx
│   ├── lib/__tests__/
│   │   ├── constants.test.ts
│   │   ├── i18n.test.ts
│   │   └── utils.test.ts
│   └── stores/__tests__/
│       └── appStore.test.ts
```

### Writing Tests

**Unit Test Example:**

```typescript
// src/renderer/src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest'
import { generateId, formatDuration } from '../utils'

describe('generateId', () => {
  it('produces a non-empty string', () => {
    const id = generateId()
    expect(id).toBeTypeOf('string')
    expect(id.length).toBeGreaterThan(0)
  })
})

describe('formatDuration', () => {
  it('formats milliseconds as human-readable time', () => {
    expect(formatDuration(1000)).toBe('1s')
    expect(formatDuration(65000)).toBe('1m 5s')
    expect(formatDuration(3600000)).toBe('1h 0m')
  })
})
```

**Component Test Example:**

```typescript
// src/renderer/src/components/ui/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children and handles click', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click Me</Button>)

    expect(screen.getByText('Click Me')).toBeDefined()
    fireEvent.click(screen.getByText('Click Me'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

### Test Configuration

The project has two Vitest configs:

- `vitest.config.ts` — Main test config (used by default)
- `vitest.config.main.ts` — Main process-specific test config

Test environment uses **jsdom** (configured in `vitest.config.ts`) with `@testing-library/react` for component tests.

---

## Building for Production

### Production Build

```bash
npm run build
```

This runs `electron-vite build`, which:

1. **Compiles main process** — TypeScript → JavaScript in `out/main/`
2. **Compiles preload** — TypeScript → JavaScript in `out/preload/`
3. **Bundles renderer** — Vite builds React app in `out/renderer/`

### Output Structure

```
out/
├── main/
│   ├── index.js              # Main process entry
│   ├── ipc/handlers.js       # IPC handlers
│   ├── execution/index.js    # Execution engine
│   ├── providers/index.js    # Provider system
│   ├── database/index.js     # Database module
│   ├── github/index.js       # GitHub integration
│   ├── sandbox/index.js      # Sandbox module
│   └── demo/demo-runner.js   # Demo runner
├── preload/
│   └── index.js              # Preload script
└── renderer/
    ├── index.html            # HTML entry point
    ├── assets/               # Bundled JS/CSS
    └── ...
```

### Previewing the Build

```bash
npm run preview
```

Launches the application using the production build from `out/`.

---

## Packaging for Distribution

### Platform Targets

OpenJuliet uses **electron-builder** for cross-platform packaging.

#### Windows

```bash
npm run package:win
```

- **Target**: NSIS installer (.exe)
- **Architectures**: x64, arm64
- **Features**: One-click or custom install, desktop shortcut, uninstaller
- **Output**: `release/OpenJuliet-Setup-{version}.exe`

#### macOS

```bash
npm run package:mac
```

- **Target**: DMG (.dmg)
- **Architectures**: x64, arm64
- **Category**: `public.app-category.developer-tools`
- **Entitlements**: Sandbox entitlements via `build/entitlements.mac.plist`
- **Notarization**: Disabled by default (enable via `electron-builder.yml`)
- **Output**: `release/OpenJuliet-{version}-{arch}.dmg`

#### Linux

```bash
npm run package:linux
```

- **Targets**: AppImage (.AppImage), Debian (.deb)
- **Architectures**: x64 (AppImage + deb), arm64 (AppImage only)
- **Category**: Development
- **Output**: `release/OpenJuliet-{version}.AppImage`, `release/openjuliet_{version}_{arch}.deb`

#### All Platforms

```bash
npm run package:all
```

Builds and packages for Windows, macOS, and Linux simultaneously.

### Package Configuration

Packaging settings are in `electron-builder.yml`:

```yaml
appId: com.openjuliet.app
productName: OpenJuliet
directories:
  buildResources: resources
  output: release

win:
  target:
    - target: nsis
      arch: [x64, arm64]

mac:
  target:
    - target: dmg
      arch: [x64, arm64]

linux:
  target:
    - target: AppImage
      arch: [x64, arm64]
    - target: deb
      arch: [x64]
```

### Build Artifacts

All packaged files are placed in the `release/` directory:

```
release/
├── OpenJuliet-Setup-1.0.0.exe       # Windows installer
├── OpenJuliet-1.0.0-x64.dmg         # macOS DMG
├── OpenJuliet-1.0.0-arm64.dmg       # macOS ARM DMG
├── OpenJuliet-1.0.0.AppImage        # Linux AppImage
└── openjuliet_1.0.0_amd64.deb       # Linux Debian package
```

---

## Code Quality

### TypeScript Strict Mode

OpenJuliet uses full TypeScript strict mode across the codebase:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false
  }
}
```

Separate TypeScript configs ensure proper type checking:

| Config | Targets | Purpose |
|--------|---------|---------|
| `tsconfig.json` | All | Base config, extends to others |
| `tsconfig.node.json` | `src/main/`, `src/preload/` | Node.js/Electron APIs |
| `tsconfig.web.json` | `src/renderer/` | DOM/React APIs |

### Run Type Checking

```bash
npm run typecheck          # Both node + web
npm run typecheck:node     # Main process only
npm run typecheck:web      # Renderer only
```

### ESLint Configuration

ESLint uses flat config (`eslint.config.js`) with:

```javascript
// eslint.config.js — highlights
import electronConfig from '@electron-toolkit/eslint-config'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import typescriptParser from '@typescript-eslint/parser'

export default [
  electronConfig,               // Electron-specific rules
  reactPlugin.configs.flat.recommended,
  reactHooksPlugin.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/react-in-jsx-scope': 'off',       // React 19 JSX transform
      'react/prop-types': 'off',                // Covered by TypeScript
    }
  }
]
```

### Prettier Configuration

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### Format Code

```bash
npm run format
```

### Code Quality Checklist

Before submitting a PR:

- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run format` has been run
- [ ] `npm test` passes (all tests green)
- [ ] New code includes tests
- [ ] TypeScript strict mode violations avoided
- [ ] No `console.log` in production code (use `console.warn` or `console.error` for non-critical)
- [ ] IPC channels named with domain prefix (e.g., `github:list-repos`)
- [ ] All IPC handlers return `{ success, data?, error? }` envelope
- [ ] Streaming IPC events check `!webContents.isDestroyed()` before sending

---

## Contribution Workflow

### 1. Find an Issue

Browse [open issues](https://github.com/NeticYTOF/OpenJuliet/issues) or create a new one describing the feature/bug.

### 2. Create a Branch

```bash
git checkout -b feat/my-feature       # New feature
git checkout -b fix/my-bug-fix        # Bug fix
git checkout -b docs/my-doc-update    # Documentation
```

Branch naming convention:

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation |
| `refactor/` | Code restructuring |
| `test/` | Adding or fixing tests |
| `chore/` | Build, CI, dependencies |

### 3. Make Changes

Follow the [development workflow](#development-workflow) above.

### 4. Write Tests

Add tests for new functionality. See [Testing](#testing) section.

### 5. Commit Using Conventional Commits

```bash
git commit -m "feat(execution): add multi-stage workflow pipeline"
git commit -m "fix(github): handle null response in listIssues"
git commit -m "docs: add development guide"
```

Commit message format: `<type>(<scope>): <description>`

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Code restructuring |
| `test` | Tests |
| `chore` | Build, CI, dependencies |

### 6. Run Quality Checks

```bash
npm run typecheck
npm run lint
npm test
```

### 7. Push and Create a PR

```bash
git push -u origin feat/my-feature
```

Then create a Pull Request on GitHub. Use the PR template from `PRETITLE.md`.

### 8. PR Review

- Maintainers will review your PR
- Address review feedback
- Keep PRs focused on a single change
- Link related issues

### 9. Merge

After approval and passing CI, a maintainer will merge your PR.

---

## Debugging Tips

### Main Process Debugging

**Using DevTools for main process:**

The main process doesn't have DevTools, but you can:

1. **Use `console.log` / `console.warn` / `console.error`** — Output appears in the terminal where you ran `npm run dev`.

2. **Use the `--inspect` flag with Electron** (advanced):
   ```bash
   # Start with debugger
   npx electron-vite dev --inspect=9229
   # Then open chrome://inspect in Chrome
   ```

### Renderer Debugging

**Using Chrome DevTools:**

- DevTools open automatically in development mode (F12)
- Debug React components using the **Components** tab (requires React DevTools extension)
- Check **Console** for errors and logs
- Use **Network** tab to inspect API requests
- Use **Sources** tab for breakpoint debugging (source maps enabled)

**Common Issues:**

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| IPC call returns `undefined` | Channel name mismatch | Check `invoke` channel matches `handle` channel exactly |
| TypeError: Cannot read properties of undefined (reading 'api') | window.api not available | Ensure preload script is correct and contextBridge is working |
| Component not re-rendering | Zustand selector not reactive | Use shallow equality check or correct selector |
| `require is not defined` | nodeIntegration false (correct) | Use IPC instead of require() |
| White screen on launch | Build error or missing preload | Check console for errors, verify build output |
| CORS errors in development | webSecurity mismatch | webSecurity is disabled in dev by default |

### IPC Debugging

Use the `debugger` statement in main process code:

```typescript
// src/main/ipc/handlers.ts
ipcMain.handle('github:list-repos', async () => {
  debugger   // Pauses if DevTools or inspector is attached
  ...
})
```

### Database Debugging

View the SQLite database directly:

```bash
# Find the database file
# On development: ./out/main/openjuliet.db
# On production: in electron's userData directory

# Inspect with sqlite3 CLI
sqlite3 ./out/main/openjuliet.db
.tables
SELECT * FROM settings;
```

### Vite HMR Issues

If HMR stops working:

1. Check the terminal for Vite errors
2. Try a hard refresh (Cmd/Ctrl+Shift+R)
3. Kill and restart `npm run dev`
4. Clear Vite cache: `rm -rf node_modules/.vite`

---

## Release Process

OpenJuliet uses **semantic-release** for automated releases:

1. Commits follow conventional commits format
2. On push to `main`, CI runs:
   - Type checking
   - Linting
   - Tests
   - Build
3. `semantic-release` determines the next version number from commit messages
4. Changelog is auto-generated
5. Release is published to GitHub Releases

Manual packaging:

```bash
# For testing specific platforms
npm run package:win
npm run package:mac
npm run package:linux
```

---

## Additional Resources

- [Features Overview](../features-overview.md) — Complete feature listing
- [Architecture Overview](../architecture/overview.md) — System architecture
- [Data Flow Documentation](../architecture/data-flow.md) — IPC channels and event flow
- [Extensibility Guide](../features/extensibility.md) — Plugin and extension system
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — Contribution guidelines
- [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) — Community standards
- [SECURITY.md](../../SECURITY.md) — Security policies
- [README.md](../../README.md) — Project overview
