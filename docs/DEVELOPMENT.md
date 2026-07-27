# OpenJuliet Development Guide

> Version 1.0.0 — Guide for setting up, developing, testing, building, and debugging OpenJuliet.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Packaging for Distribution](#packaging-for-distribution)
- [Debugging Tips](#debugging-tips)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Code Style and Conventions](#code-style-and-conventions)
- [Environment Variables](#environment-variables)

---

## Prerequisites

### Required

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | >= 18.x (20.x recommended) | JavaScript runtime |
| [npm](https://www.npmjs.com/) | >= 9.x | Package manager |
| [Git](https://git-scm.com/) | >= 2.x | Version control |
| [TypeScript](https://www.typescriptlang.org/) | 5.7+ | Type checking |

### Optional

| Tool | Version | Purpose |
|---|---|---|
| [Docker](https://www.docker.com/) | Latest | Sandboxed execution mode |
| [ESLint](https://eslint.org/) | 8.x+ | Code linting (installed locally) |
| [electron-builder](https://www.electron.build/) | 25.x | Packaging (installed locally) |

### Platform-Specific Notes

- **Windows**: Install Git for Windows (includes Git Bash). Ensure `git` is available in your PATH.
- **macOS**: Xcode Command Line Tools required (`xcode-select --install`).
- **Linux**: `libgtk-3-dev`, `libnotify-dev`, `libgconf-2-4`, `libnss3`, `libxss1`, `libasound2` for Electron.

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/NeticYTOF/OpenJuliet.git
cd OpenJuliet
```

### 2. Install Dependencies

```bash
npm install
```

This installs all runtime and development dependencies. The `postinstall` script runs `electron-builder install-app-deps` to rebuild native modules for Electron's Node.js version.

### 3. Verify Setup

```bash
# Type checking
npm run typecheck

# Lint
npm run lint

# Should complete without errors or warnings
```

---

## Development Workflow

### Starting the Dev Server

```bash
npm run dev
```

This launches:

1. **Vite dev server** — Serves the React renderer with Hot Module Replacement (HMR).
2. **TypeScript watch** — Compiles main and preload processes on file changes.
3. **Electron** — Launches the app window, connected to the dev server.

The dev server URL (`http://localhost:5173` by default) is loaded by Electron. Changes to renderer code hot-reload instantly. Changes to main/preload code trigger an automatic Electron restart.

### Hot Reload Behaviour

| Code Area | Reload Behaviour |
|---|---|
| Renderer (`.tsx`, `.css`) | **HMR** — Instant update, no window reload |
| Preload (`src/preload/`) | **Full restart** — Window re-creates |
| Main process (`src/main/`) | **Full restart** — Application re-launches |
| Electron config | **Manual restart** required |

### Development Architecture

```
npm run dev
     │
     ▼
electron-vite dev
     │
     ├── Main process: tsc --watch → out/main/
     ├── Preload: tsc --watch → out/preload/
     └── Renderer: Vite dev server (HMR) → http://localhost:5173
                      │
                      ▼
              Electron loads renderer URL
              (or file:// in production)
```

### Useful Commands

```bash
# Run with debug logging
DEBUG=electron-vite:* npm run dev

# Run with custom dev tools state
ELECTRON_DEVTOOLS=true npm run dev

# Open DevTools manually (F12 in dev mode)
```

---

## Testing

### Current State

OpenJuliet does not yet have a test framework configured. Tests are planned for:

- **Unit tests**: Vitest or Jest for store logic, utility functions, and IPC handler logic.
- **Integration tests**: Playwright or Spectron for Electron window behaviour and IPC round-trips.
- **E2E tests**: Full workflow testing with GitHub API mocking.

### Setting Up Tests

To add a test framework:

```bash
# Install Vitest (recommended for Vite projects)
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Add test script to package.json
# "test": "vitest run",
# "test:watch": "vitest"
```

### Test Structure (Recommended)

```
src/
├── __tests__/
│   ├── main/
│   │   ├── providers.test.ts
│   │   ├── database.test.ts
│   │   └── execution.test.ts
│   ├── preload/
│   │   └── ipc-bridge.test.ts
│   └── renderer/
│       ├── stores/
│       │   ├── appStore.test.ts
│       │   ├── executionStore.test.ts
│       │   └── settingsStore.test.ts
│       └── components/
│           └── Button.test.tsx
```

### Testing Guidelines

- **Mock IPC**: Use `vi.mock` to mock `window.api` for renderer tests.
- **Mock Network**: Use `MSW` (Mock Service Worker) for provider API tests.
- **Store Tests**: Test Zustand stores directly — they're plain functions.
- **Component Tests**: Use `@testing-library/react` with user-event simulation.

---

## Building for Production

```bash
# Build the app
npm run build
```

This runs `electron-vite build`, which:

1. **Bundles the renderer** — Vite produces optimised static assets (JS, CSS).
2. **Compiles main/preload** — TypeScript compiles to JavaScript in `out/`.
3. **Output structure**:

```
out/
├── main/
│   ├── index.js          # Main process entry
│   ├── ipc/handlers.js   # IPC handlers
│   ├── github/index.js   # GitHub module
│   ├── providers/index.js
│   ├── execution/index.js
│   ├── database/index.js
│   └── sandbox/index.js
├── preload/
│   └── index.js           # Preload bridge
└── renderer/
    ├── index.html          # Entry HTML
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── ...
```

### Verify the Build

```bash
# Preview the production build locally
npm run preview
```

---

## Packaging for Distribution

OpenJuliet uses **electron-builder** for platform-specific packaging.

### Configuration

Packaging configuration is in `electron-builder.yml`:

```yaml
win:
  target:
    - target: nsis        # Windows installer
      arch: [x64, arm64]

mac:
  target:
    - target: dmg         # macOS disk image
      arch: [x64, arm64]

linux:
  target:
    - target: AppImage    # Portable Linux app
      arch: [x64, arm64]
    - target: deb         # Debian/Ubuntu package
      arch: [x64]
```

### Package Commands

```bash
# Package for current platform
npx electron-builder --config electron-builder.yml

# Package for specific platforms
npx electron-builder --win         # Windows only
npx electron-builder --mac         # macOS only
npx electron-builder --linux       # Linux only

# Package all platforms (cross-platform build)
npx electron-builder --win --mac --linux

# Publish to GitHub releases
npx electron-builder --publish always
```

### Artifacts

Output directory: `release/`

| Platform | Artifact | Type |
|---|---|---|
| Windows | `OpenJuliet-Setup-[version]-x64.exe` | NSIS installer |
| Windows | `OpenJuliet-Setup-[version]-arm64.exe` | NSIS installer (ARM) |
| macOS | `OpenJuliet-[version]-x64.dmg` | Disk image |
| macOS | `OpenJuliet-[version]-arm64.dmg` | Disk image (Apple Silicon) |
| Linux | `OpenJuliet-[version]-x86_64.AppImage` | Portable AppImage |
| Linux | `OpenJuliet-[version]-x86_64.deb` | Debian package |

### Code Signing (Production)

- **Windows**: Set `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables for Authenticode certificate.
- **macOS**: Set `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` for notarization.

---

## Debugging Tips

### DevTools

- DevTools open **automatically** in development mode (`is.dev` check in `src/main/index.ts`).
- Toggle manually with **F12**.
- Use the **React DevTools** Chrome extension for component inspection.
- Use the **Redux DevTools** extension (Zustand logs state changes).

### Main Process Debugging

```bash
# Attach Chrome DevTools to the main process
# Set a --inspect flag on the Electron process
npx electron --inspect=5858 out/main/index.js

# Then open chrome://inspect in Chrome and connect
```

Alternatively, add this to `src/main/index.ts` temporarily:

```typescript
// Enable debug logging
process.env.DEBUG = 'electron-vite:*'
```

### Renderer Debugging

- Console logs are visible in DevTools.
- Use `console.warn` and `console.error` for important messages (the ESLint config allows these by default).

### IPC Debugging

Add a debug interceptor in `src/preload/index.ts`:

```typescript
// Debug: Log all IPC invocations
const originalInvoke = ipcRenderer.invoke.bind(ipcRenderer)
ipcRenderer.invoke = (channel, ...args) => {
  console.warn(`[IPC] invoke: ${channel}`, args)
  return originalInvoke(channel, ...args)
}
```

### Network Debugging

- Use DevTools Network tab to inspect provider API calls.
- Provider health checks hit `/models` endpoint — verify the URL and headers.
- GitHub API calls use Octokit with the configured token.

### Database Inspection

The SQLite database is stored at:

- **Windows**: `%APPDATA%/OpenJuliet/openjuliet.db`
- **macOS**: `~/Library/Application Support/OpenJuliet/openjuliet.db`
- **Linux**: `~/.config/OpenJuliet/openjuliet.db`

Use any SQLite browser (DB Browser for SQLite, TablePlus, etc.) to inspect.

### Common Sources of Bugs

1. **Preload not reloading** — After changes to `src/preload/`, the window must be fully re-created (closing and reopening DevTools is not sufficient).
2. **Native module errors** — Run `npx electron-rebuild` if native modules fail after Node.js version changes.
3. **CORS in production** — `webSecurity: true` in production may block local API calls. Configure CORS on your provider endpoints.
4. **Worker path resolution** — Worker script paths are resolved relative to `__dirname` of the compiled `execution/index.js`. Ensure `workers/` directory is inside `out/main/`.

---

## Common Issues and Solutions

### `electron-builder` fails with native module errors

```bash
# Solution: Rebuild native modules for Electron
npx electron-rebuild -f -w <module-name>

# Or clean and reinstall everything
rm -rf node_modules out
npm install
```

### Vite dev server not starting

```bash
# Check for port conflicts
lsof -i :5173

# Kill existing processes
kill -9 $(lsof -t -i:5173)
```

### TypeScript compilation errors in main process

```bash
# Check TypeScript version compatibility
npx tsc --version  # Should be 5.7+

# Run typecheck separately for detailed output
npm run typecheck:node
npm run typecheck:web
```

### Electron window shows white screen

```
Possible causes:
1. Dev server not running — Wait for Vite to compile
2. Port mismatch — Check electron.vite.config.ts
3. Missing dependencies — Run npm install
4. Preload script error — Check DevTools console for preload errors
```

### ESLint errors on `no-console`

The ESLint config allows `console.warn` and `console.error`. Use these instead of `console.log`:

```typescript
// Allowed
console.warn('Deprecated API used')
console.error('Something went wrong', err)

// Will trigger lint warning
console.log('debug info')
```

### Docker sandbox not found

```bash
# Verify Docker is installed and running
docker info

# If Docker Desktop is installed but not running
# Start Docker Desktop from your applications menu
```

---

## Code Style and Conventions

### TypeScript

- **Strict mode** enabled in `tsconfig.json`.
- Use explicit types for function parameters and return types.
- Prefer `interface` over `type` for object shapes; use `type` for unions and aliases.
- Use `const` assertions (`as const`) for literal types.
- Prefix unused parameters with `_` (e.g., `_event` in IPC handlers).

### React

- Functional components with hooks — no class components.
- Named exports preferred over default exports.
- Props interface defined above the component.
- Use Radix UI primitives for accessibility — don't build custom dialogs/dropdowns.

### Imports

- Use `@/` path alias for renderer source (e.g., `import { Button } from '@/components/ui/Button'`).
- Group imports: third-party → internal absolute → relative.
- No barrel files (index.ts re-exports) — import directly from the module file.

### File Naming

- **Components**: PascalCase (`Button.tsx`, `AppLayout.tsx`).
- **Hooks**: camelCase prefixed with `use` (`useIPC.ts`, `useKeyboard.ts`).
- **Stores**: camelCase (`appStore.ts`, `settingsStore.ts`).
- **Utilities**: camelCase (`utils.ts`, `constants.ts`).

### ESLint Rules

```javascript
// Key rules from eslint.config.js
'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
'@typescript-eslint/no-explicit-any': 'warn'
'react/react-in-jsx-scope': 'off'        // Not needed with new JSX transform
'react/prop-types': 'off'                 // Using TypeScript
'no-console': ['warn', { allow: ['warn', 'error'] }]
```

---

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `NODE_ENV` | Environment mode | `development` / `production` |
| `ELECTRON_RENDERER_URL` | Vite dev server URL (set by electron-vite) | `http://localhost:5173` |
| `DEBUG` | Debug logging filter | — |

No `.env` file is required for development. Provider API keys are configured through the settings UI and stored in the local SQLite database.

---

## Project Scripts Reference

```json
{
  "dev": "electron-vite dev",
  "build": "electron-vite build",
  "preview": "electron-vite preview",
  "postinstall": "electron-builder install-app-deps",
  "lint": "eslint .",
  "typecheck:node": "tsc --noEmit -p tsconfig.node.json",
  "typecheck:web": "tsc --noEmit -p tsconfig.web.json",
  "typecheck": "npm run typecheck:node && npm run typecheck:web"
}
```

---

## Continuous Integration

See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) for the CI pipeline.

The CI pipeline runs on every push and pull request to `main`:

1. **Setup** — Node.js 18 and 20 matrix.
2. **Dependencies** — `npm ci` (clean install).
3. **Type checking** — `npm run typecheck`.
4. **Linting** — `npm run lint`.
5. **Build** — `npm run build`.
6. **Artifacts** — Upload build output.
