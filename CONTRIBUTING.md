# Contributing to OpenJuliet

Thank you for your interest in contributing to OpenJuliet! We welcome contributions from everyone, whether it's a bug report, feature suggestion, code change, or documentation improvement.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Conventions](#commit-message-conventions)
- [Testing Requirements](#testing-requirements)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Release Process](#release-process)

---

## Code of Conduct

### Our Pledge

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, caste, color, religion, or sexual identity and orientation.

We pledge to act and interact in ways that contribute to an open, welcoming, diverse, inclusive, and healthy community.

### Our Standards

**Examples of behaviour that contributes to a positive environment:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behaviour:**

- The use of sexualized language or imagery, and sexual attention or advances of any kind
- Trolling, insulting or derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behaviour may be reported to the project maintainers at [NeticYTOF](https://github.com/NeticYTOF). All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### 1. Find Something to Work On

- **Good First Issues** — Look for issues labelled `good-first-issue` or `help-wanted`.
- **Bug Reports** — Check issues for confirmed bugs.
- **Feature Requests** — Look for `enhancement` labelled issues.
- **Documentation** — Improvements to docs are always welcome.

### 2. Discuss Before Starting

For significant changes (new features, architectural changes, new integrations), please open an issue first to discuss the approach. This saves time and ensures alignment with the project direction.

### 3. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/OpenJuliet.git
cd OpenJuliet

# Add upstream remote
git remote add upstream https://github.com/NeticYTOF/OpenJuliet.git

# Create a feature branch
git checkout -b feat/my-feature
```

---

## How to Contribute

### Reporting Bugs

Before submitting a bug report:

1. Check the [existing issues](https://github.com/NeticYTOF/OpenJuliet/issues) to avoid duplicates.
2. Try to reproduce the bug on the latest version.

When filing a bug report, include:

- **Summary** — Clear, concise description of the problem.
- **Steps to reproduce** — Minimal, reproducible set of steps.
- **Expected behaviour** — What you expected to happen.
- **Actual behaviour** — What actually happened.
- **Environment** — OS, Node.js version, OpenJuliet version.
- **Screenshots** — If applicable.
- **Logs** — Relevant console output or error messages.

### Suggesting Features

Feature suggestions are welcome! When proposing:

1. Check existing issues and discussions for similar ideas.
2. Describe the problem you're trying to solve.
3. Explain the proposed solution and any alternatives considered.
4. Note if you'd be willing to help implement it.

### Improving Documentation

Documentation improvements are highly valued. These include:

- Fixing typos or unclear text.
- Adding missing documentation.
- Improving code comments.
- Adding examples and tutorials.

### Submitting Code Changes

See [Pull Request Process](#pull-request-process).

---

## Pull Request Process

### Step 1: Ensure Your Fork is Up-to-Date

```bash
git fetch upstream
git rebase upstream/main
```

### Step 2: Develop Your Changes

- Follow the [Coding Standards](#coding-standards).
- Write or update tests as needed.
- Update documentation if your change affects the user-facing behaviour or architecture.

### Step 3: Run Checks Locally

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build (ensure no build errors)
npm run build
```

### Step 4: Commit Your Changes

Follow [Commit Message Conventions](#commit-message-conventions).

```bash
git add .
git commit -m "feat(github): add support for issue templates"
```

### Step 5: Push and Create a Pull Request

```bash
git push origin feat/my-feature
```

Then create a Pull Request on GitHub against the `main` branch.

### Step 6: PR Title and Description

**Title format:** `<type>(<scope>): <short description>`

Examples:
- `feat(providers): add support for Azure OpenAI`
- `fix(execution): handle empty task description`
- `docs: update installation instructions`

**Description should include:**

- What this PR does
- Why it's needed
- How it was tested
- Screenshots (for UI changes)
- Related issue(s)

### Step 7: PR Review

- A maintainer will review your PR.
- Address review feedback with additional commits.
- Once approved, a maintainer will merge your PR.

### PR Checklist

Before submitting, verify:

- [ ] Code follows the project's coding standards
- [ ] TypeScript types are correct (no `any` where avoidable)
- [ ] ESLint passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation is updated (if applicable)
- [ ] Changes are covered by tests (if applicable)
- [ ] Commit messages follow conventions

---

## Coding Standards

### Language

- **TypeScript** — All source code must be written in TypeScript. Strict mode is enabled.
- **React** — Use functional components with hooks (never class components).

### Style Guide

The project uses ESLint with the `@electron-toolkit/eslint-config` base. Key rules:

```javascript
// Refer to eslint.config.js for the complete config
'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
'@typescript-eslint/no-explicit-any': 'warn'
'react/react-in-jsx-scope': 'off'
'react/prop-types': 'off'
'no-console': ['warn', { allow: ['warn', 'error'] }]
```

### Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `Button.tsx`, `AppLayout.tsx` |
| Files (utilities) | camelCase | `utils.ts`, `constants.ts` |
| Files (hooks) | camelCase, `use` prefix | `useIPC.ts`, `useKeyboard.ts` |
| Files (stores) | camelCase | `appStore.ts`, `settingsStore.ts` |
| React components | PascalCase | `function Button()` |
| Functions/methods | camelCase | `handleClick()`, `fetchData()` |
| Types/Interfaces | PascalCase | `interface TaskConfig` |
| Constants | UPPER_SNAKE_CASE or camelCase | `MAX_RETRIES`, `defaultTimeout` |
| CSS classes | kebab-case (Tailwind) | `bg-purple-500`, `text-sm` |

### Imports

Order imports in groups, separated by a blank line:

```typescript
// 1. Third-party modules
import { app, BrowserWindow } from 'electron'
import { useEffect } from 'react'
import { create } from 'zustand'

// 2. Internal absolute imports (using @/ alias)
import { useAppStore } from '@/stores/appStore'
import { Button } from '@/components/ui/Button'

// 3. Relative imports
import { generateId } from '../lib/utils'
```

- Use the `@/` path alias for import paths from `src/renderer/src/`.
- Avoid barrel files (index.ts re-exports).

### TypeScript

- Prefer `interface` over `type` for object shapes.
- Use `type` for unions, intersections, and primitive aliases.
- Use `const` assertions (`as const`) for literal types.
- Mark unused parameters with `_` prefix.
- Avoid `any` where possible — use `unknown` and narrow with type guards.

### Component Structure

```typescript
// Props interface defined above the component
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary'
  onClick: () => void
}

function Button({ label, variant = 'primary', onClick }: ButtonProps): JSX.Element {
  return (
    <button className={variant === 'primary' ? 'bg-purple-500' : 'bg-gray-700'} onClick={onClick}>
      {label}
    </button>
  )
}

export default Button
```

---

## Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Usage |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Code style changes (formatting, missing semicolons, etc.) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, tooling |
| `ci` | CI configuration changes |
| `revert` | Reverting a previous change |

### Scopes

| Scope | Area |
|---|---|
| `main` | Electron main process |
| `preload` | Preload / context bridge |
| `renderer` | React UI |
| `providers` | AI provider system |
| `execution` | Workflow engine |
| `github` | GitHub integration |
| `database` | SQLite persistence |
| `sandbox` | Execution sandbox |
| `plugins` | Plugin system |
| `config` | Build/config files |
| `deps` | Dependencies |
| `docs` | Documentation |

### Examples

```
feat(providers): add streaming support for Anthropic

Implement SSE-based token streaming for the Anthropic provider.
Previously only non-streaming requests were supported.

Closes #42
```

```
fix(execution): handle empty workspace path during task init

Throw a descriptive error instead of crashing when the workspace
path is not configured before starting a task.
```

```
docs: fix broken link to API reference in README
```

```
chore(deps): update electron to v35.1.2
```

---

## Testing Requirements

### Current State

The project does not yet have a test framework configured. Contributions to set up testing are especially welcome!

### Expectations for Contributors

- **Bug fixes**: Include a test that reproduces the bug and verifies the fix.
- **New features**: Include tests covering the core logic.
- **Refactoring**: Ensure existing behaviour is preserved (tests should pass).

### Testing Guidelines

- **Unit tests**: Test individual functions, hooks, and store logic.
- **Component tests**: Test React components with `@testing-library/react`.
- **Store tests**: Zustand stores are plain functions — test them directly.
- **IPC tests**: Mock `window.api` to test renderer→main communication.

When adding tests, use this directory structure:

```
src/
├── __tests__/
│   ├── main/
│   ├── preload/
│   └── renderer/
│       ├── stores/
│       ├── hooks/
│       └── components/
```

---

## Development Setup

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for complete setup instructions.

Quick start:

```bash
git clone https://github.com/NeticYTOF/OpenJuliet.git
cd OpenJuliet
npm install
npm run dev
```

---

## Project Structure

```
OpenJuliet/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Context bridge (window.api)
│   └── renderer/       # React UI
├── plugins/            # Plugin extensions
├── docs/               # Documentation
├── resources/          # Icons and assets
├── scripts/            # Build automation
└── samples/            # Example configs and workflows
```

---

## Release Process

Releases are managed by maintainers and automated via GitHub Actions:

1. A maintainer creates a tag (`v1.0.0`, `v1.1.0`, etc.) on the `main` branch.
2. The [release workflow](.github/workflows/release.yml) builds for Windows, macOS, and Linux.
3. Artifacts are uploaded to a GitHub Release.
4. The release notes are auto-generated from commit messages.

Versioning follows [Semantic Versioning](https://semver.org/):

- **MAJOR** — Incompatible API changes.
- **MINOR** — Backward-compatible feature additions.
- **PATCH** — Backward-compatible bug fixes.

---

## Getting Help

- **Issues**: Use [GitHub Issues](https://github.com/NeticYTOF/OpenJuliet/issues) for bug reports and feature requests.
- **Discussions**: Use [GitHub Discussions](https://github.com/NeticYTOF/OpenJuliet/discussions) for questions and community support.

---

## License

By contributing to OpenJuliet, you agree that your contributions will be licensed under the MIT License (see [LICENSE](LICENSE)).
