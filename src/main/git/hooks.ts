/**
 * OpenJuliet — Git Hook Manager
 *
 * Installs and manages git hooks for OpenJuliet repositories:
 * - pre-commit: Runs linting (ESLint) on staged files
 * - commit-msg: Validates conventional commit format
 * - post-merge: Auto-installs dependencies when package.json changes
 *
 * All hooks are written as shell scripts to the repository's `.git/hooks/`
 * directory and made executable.
 *
 * @module main/git/hooks
 */

import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of installing hooks. */
export interface HookInstallResult {
  success: boolean
  hooks: string[]
  errors: { hook: string; error: string }[]
}

/** Options for hook installation. */
export interface HookInstallOptions {
  /** Path to the repository root (contains .git/). */
  repoPath: string
  /** Package manager to use for post-merge (npm, yarn, pnpm, bun). */
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  /** Lint command for pre-commit hook. Defaults to 'npm run lint'. */
  lintCommand?: string
  /** Whether to write hooks even if they already exist. */
  force?: boolean
}

/** Type for individual hook script generators. */
type HookScriptGenerator = () => string

// ---------------------------------------------------------------------------
// Conventional Commit Regex
// ---------------------------------------------------------------------------

/**
 * Regex for validating conventional commit messages.
 *
 * Format: <type>(<scope>): <description>
 *   type: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
 *   scope: optional, any word character or slash/dash
 *   description: required, at least one character
 *
 * Also allows:
 *   - "type: description" (without scope)
 *   - "type(scope): description! (breaking change)
 *   - Merge commits
 *   - Revert commits
 *   - Release/version bump commits
 */
const CONVENTIONAL_COMMIT_REGEX =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([\w\d\/\\.#-]+\))?!?:\s.+/

const MERGE_COMMIT_REGEX = /^Merge\s/
const REVERT_COMMIT_REGEX = /^Revert\s/
const RELEASE_COMMIT_REGEX = /^release:|^v?\d+\.\d+\.\d+/

// ---------------------------------------------------------------------------
// Hook Script Generators
// ---------------------------------------------------------------------------

/**
 * Generate the pre-commit hook script.
 * Runs linting on staged files (or a full lint if stage is empty).
 */
function generatePreCommitScript(options: HookInstallOptions): string {
  const lintCmd = options.lintCommand ?? 'npm run lint'
  const pm = options.packageManager ?? 'npm'

  return `#!/bin/sh
# OpenJuliet — pre-commit hook
# Runs linting before allowing a commit.
# To skip, use: git commit --no-verify

set -e

echo "🔍 Running pre-commit checks..."

# Collect staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  echo "✅ No staged files to check."
  exit 0
fi

# Check for lint-staged or run lint on staged files
if command -v npx >/dev/null 2>&1; then
  # Check if lint-staged is configured
  if [ -f "package.json" ] && grep -q '"lint-staged"' package.json 2>/dev/null; then
    echo "   Running lint-staged..."
    npx lint-staged
  else
    echo "   Running ${lintCmd}..."
    ${lintCmd}
  fi
else
  echo "⚠️  npx not found, skipping lint check."
fi

echo "✅ Pre-commit checks passed."
`
}

/**
 * Generate the commit-msg hook script.
 * Validates that commit messages follow the conventional commits format.
 */
function generateCommitMsgScript(): string {
  return `#!/bin/sh
# OpenJuliet — commit-msg hook
# Validates conventional commit message format.
# To skip, use: git commit --no-verify

set -e

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Allow merge, revert, and release commits
echo "$COMMIT_MSG" | grep -E '^(Merge|Revert|release:)' > /dev/null 2>&1 && exit 0
echo "$COMMIT_MSG" | grep -E '^v?[0-9]+\\.[0-9]+\\.[0-9]+' > /dev/null 2>&1 && exit 0

# Validate conventional commit format
echo "$COMMIT_MSG" | grep -E '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\/\.#-]+\))?!?:\s.+' > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Invalid commit message format."
  echo ""
  echo "Conventional commit format:"
  echo "  <type>(<scope>): <description>"
  echo ""
  echo "Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
  echo ""
  echo "Examples:"
  echo "  feat: add user authentication"
  echo "  fix(api): handle null pointer in response"
  echo "  docs(readme): update installation instructions"
  echo "  refactor!: drop Node 16 support"
  echo ""
  echo "To skip validation: git commit --no-verify"
  echo ""
  exit 1
fi

echo "✅ Commit message follows conventional format."
`
}

/**
 * Generate the post-merge hook script.
 * Auto-installs dependencies when package.json or package-lock.json changed.
 */
function generatePostMergeScript(options: HookInstallOptions): string {
  const pm = options.packageManager ?? 'npm'
  let installCmd: string

  switch (pm) {
    case 'yarn':
      installCmd = 'yarn install'
      break
    case 'pnpm':
      installCmd = 'pnpm install'
      break
    case 'bun':
      installCmd = 'bun install'
      break
    default:
      installCmd = 'npm install'
  }

  return `#!/bin/sh
# OpenJuliet — post-merge hook
# Auto-installs dependencies when package manifests change.

set -e

CHANGED_FILES=$(git diff HEAD~1 --name-only)

if echo "$CHANGED_FILES" | grep -E '(package\\.json|package-lock\\.json|yarn\\.lock|pnpm-lock\\.yaml|bun\\.lockb)$' > /dev/null 2>&1; then
  echo "📦 Package manifest changed — running ${installCmd}..."
  ${installCmd}
  echo "✅ Dependencies updated."
else
  echo "✅ No dependency changes detected."
fi
`
}

// ---------------------------------------------------------------------------
// Hook Descriptors
// ---------------------------------------------------------------------------

interface HookDescriptor {
  name: string
  filename: string
  generator: HookScriptGenerator
}

function getHooks(options: HookInstallOptions): HookDescriptor[] {
  return [
    {
      name: 'pre-commit',
      filename: 'pre-commit',
      generator: () => generatePreCommitScript(options)
    },
    {
      name: 'commit-msg',
      filename: 'commit-msg',
      generator: generateCommitMsgScript
    },
    {
      name: 'post-merge',
      filename: 'post-merge',
      generator: () => generatePostMergeScript(options)
    }
  ]
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Install git hooks into a repository's `.git/hooks/` directory.
 *
 * Creates the hooks directory if it doesn't exist, writes each hook
 * script, and makes it executable.
 *
 * @param options - Hook installation configuration
 * @returns Result with success status, installed hooks, and any errors
 *
 * @example
 * const result = await installHooks({
 *   repoPath: '/path/to/repo',
 *   packageManager: 'npm',
 *   lintCommand: 'npm run lint'
 * })
 * // { success: true, hooks: ['pre-commit', 'commit-msg', 'post-merge'], errors: [] }
 */
export async function installHooks(options: HookInstallOptions): Promise<HookInstallResult> {
  const hooksDir = resolve(options.repoPath, '.git', 'hooks')
  const installed: string[] = []
  const errors: { hook: string; error: string }[] = []

  // Ensure .git/hooks directory exists
  if (!existsSync(hooksDir)) {
    try {
      mkdirSync(hooksDir, { recursive: true })
    } catch (err) {
      return {
        success: false,
        hooks: [],
        errors: [{ hook: 'init', error: `Cannot create hooks directory: ${(err as Error).message}` }]
      }
    }
  }

  // Verify this is actually a git repo
  if (!existsSync(join(options.repoPath, '.git'))) {
    return {
      success: false,
      hooks: [],
      errors: [{ hook: 'verify', error: 'Not a git repository: missing .git directory' }]
    }
  }

  const hooks = getHooks(options)

  for (const hook of hooks) {
    const hookPath = join(hooksDir, hook.filename)

    // Skip if hook already exists and force is not set
    if (existsSync(hookPath) && !options.force) {
      installed.push(hook.name)
      continue
    }

    try {
      const script = hook.generator()
      writeFileSync(hookPath, script, 'utf-8')
      chmodSync(hookPath, 0o755) // rwxr-xr-x
      installed.push(hook.name)
    } catch (err) {
      errors.push({ hook: hook.name, error: (err as Error).message })
    }
  }

  return {
    success: errors.length === 0,
    hooks: installed,
    errors
  }
}

/**
 * Remove installed OpenJuliet git hooks from a repository.
 *
 * @param repoPath - Path to the repository root
 * @param hooksToRemove - Array of hook names to remove ('pre-commit', 'commit-msg', 'post-merge').
 *                        If omitted, removes all known OpenJuliet hooks.
 * @returns Result with success status
 */
export async function removeHooks(
  repoPath: string,
  hooksToRemove: string[] = ['pre-commit', 'commit-msg', 'post-merge']
): Promise<HookInstallResult> {
  const hooksDir = resolve(repoPath, '.git', 'hooks')
  const removed: string[] = []
  const errors: { hook: string; error: string }[] = []

  if (!existsSync(hooksDir)) {
    return { success: true, hooks: [], errors: [] }
  }

  for (const hook of hooksToRemove) {
    const hookPath = join(hooksDir, hook)
    if (existsSync(hookPath)) {
      try {
        // Only remove hooks that match our generated content
        // (check shebang to avoid removing user-customised hooks)
        const { readFileSync } = await import('fs')
        const content = readFileSync(hookPath, 'utf-8')
        if (content.includes('OpenJuliet')) {
          const { unlinkSync } = await import('fs')
          unlinkSync(hookPath)
          removed.push(hook)
        }
      } catch (err) {
        errors.push({ hook, error: (err as Error).message })
      }
    }
  }

  return {
    success: errors.length === 0,
    hooks: removed,
    errors
  }
}

/**
 * Check which OpenJuliet hooks are currently installed in a repository.
 *
 * @param repoPath - Path to the repository root
 * @returns Array of installed hook names
 */
export async function getInstalledHooks(repoPath: string): Promise<string[]> {
  const hooksDir = resolve(repoPath, '.git', 'hooks')
  const installed: string[] = []

  if (!existsSync(hooksDir)) return installed

  const hookNames = ['pre-commit', 'commit-msg', 'post-merge']

  for (const hook of hookNames) {
    const hookPath = join(hooksDir, hook)
    if (existsSync(hookPath)) {
      try {
        const { readFileSync } = await import('fs')
        const content = readFileSync(hookPath, 'utf-8')
        if (content.includes('OpenJuliet')) {
          installed.push(hook)
        }
      } catch {
        // Unreadable or non-file — skip
      }
    }
  }

  return installed
}

/**
 * Run the linting command defined in package.json.
 * Used by the pre-commit hook when invoked directly.
 *
 * @param repoPath - Path to the repository root
 * @returns Object with success status and output
 */
export async function runLint(repoPath: string): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('npm', ['run', 'lint'], {
      cwd: repoPath,
      maxBuffer: 5 * 1024 * 1024
    })
    return { success: true, output: stdout || stderr }
  } catch (err) {
    const error = err as { stdout?: string; stderr?: string; message?: string }
    return {
      success: false,
      output: error.stdout || error.stderr || error.message || 'Lint failed'
    }
  }
}

export default {
  installHooks,
  removeHooks,
  getInstalledHooks,
  runLint
}