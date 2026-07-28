# Getting Started with OpenJuliet

> A beautiful, open-source, local-first autonomous coding agent.

This guide walks you through installing, configuring, and running your first autonomous coding task with OpenJuliet.

---

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation from Source](#installation-from-source)
- [First Launch Experience](#first-launch-experience)
- [Step 1: Connect GitHub](#step-1-connect-github)
- [Step 2: Configure AI Provider](#step-2-configure-ai-provider)
- [Step 3: Choose Workspace Directory](#step-3-choose-workspace-directory)
- [Step 4: Clone or Open a Repository](#step-4-clone-or-open-a-repository)
- [Step 5: Run Your First Task](#step-5-run-your-first-task)
- [Platform-Specific Notes](#platform-specific-notes)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## System Requirements

| Requirement | Minimum Version | Recommended |
|-------------|----------------|-------------|
| **Node.js** | 18.x | 22.x LTS |
| **npm** | 9.x | 10.x |
| **Git** | 2.30+ | 2.40+ |
| **Electron** | 28.x | 35.x (bundled) |
| **Operating System** | Windows 10, macOS 12+, Linux (X11/Wayland) | Latest |

**Additional requirements:**

- **RAM:** 4 GB minimum (8 GB+ recommended for large projects)
- **Storage:** 1 GB for the application, plus space for cloned repositories
- **Internet:** Required only for AI provider API calls and GitHub operations
- **Display:** 1280×720 minimum (1920×1080 recommended)

---

## Installation from Source

OpenJuliet is an Electron application built with React 19, TypeScript 5, and Vite.

### Step 1: Clone the Repository

```bash
git clone https://github.com/NeticYTOF/OpenJuliet.git
cd OpenJuliet
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all dependencies including Electron, React, Monaco Editor, xterm.js terminal, Octokit (GitHub API client), database (sql.js), and all UI components.

### Step 3: Start in Development Mode

```bash
npm run dev
```

This launches the Electron app with hot-reload via `electron-vite dev`. The main process and renderer process are both rebuilt automatically on changes.

### Alternative: Build for Production

```bash
npm run build        # Build the application
npm run preview      # Preview production build
```

### Package for Distribution

```bash
npm run package:win     # Windows installer
npm run package:mac     # macOS .dmg
npm run package:linux   # Linux AppImage
npm run package:all     # All platforms
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run all tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint all TypeScript files |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run clean` | Clean build artifacts |

---

## First Launch Experience

When you start OpenJuliet for the first time, you'll be greeted by the **WelcomeScreen** onboarding wizard. This walks you through the essential setup steps to get you productive as quickly as possible.

### WelcomeScreen Overview

The WelcomeScreen appears automatically on first launch. It presents:

1. **Welcome message** — Brief introduction to OpenJuliet
2. **Quick configuration grid** — Shortcuts to key settings:
   - Set workspace directory
   - Connect an AI provider
   - Connect GitHub
   - Configure Git
3. **"Run Full Demo" button** — Start the autonomous workflow demo without any configuration
4. **Quick reference** — Essential keyboard shortcuts
5. **Documentation links** — Links to full user guide

> 💡 **Tip:** You can run the demo workflow immediately without configuring anything. Click **"Run Full Demo"** on the Dashboard to see the full 7-stage pipeline in action with a sample project.

### Navigating After Onboarding

Once you've passed the WelcomeScreen, the app opens to the Dashboard view. Navigation works via:

- **Sidebar icons** — Dashboard, Repositories, Issues, Tasks, History, Settings
- **Keyboard shortcuts** — `⌘1` through `⌘6` to switch views
- **Command Palette** — `⌘K` to search and execute commands
- **Bottom status bar** — Shows active task, provider status, and system health

---

## Step 1: Connect GitHub

OpenJuliet integrates deeply with GitHub for repository browsing, issue management, and pull request creation.

### Authentication Methods

#### Personal Access Token (PAT) — Recommended

1. Go to **Settings** (`⌘,`) → **GitHub** tab
2. Under **Personal Access Token**, paste your token
3. Click **Connect**

Create a PAT at [github.com/settings/tokens](https://github.com/settings/tokens) with these scopes:

| Scope | Required For |
|-------|-------------|
| `repo` | Private repositories, full API access |
| `repo:status` | Commit status access |
| `user` | Profile information (avatar, username) |
| `read:org` | Organization access (if applicable) |

Example PAT creation:

```bash
# A classic PAT looks like: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### OAuth Flow (Coming Soon)

OAuth-based authentication will be available in a future release, providing a browser-based sign-in flow without manual token management.

### Verifying Connection

Once authenticated, your GitHub avatar and username appear in:

- **Sidebar** — Bottom section shows connected status
- **Settings → GitHub** — Shows "Connected as @username"
- **Status bar** — Connection indicator

### Disconnecting

Go to **Settings → GitHub** and click **Disconnect**.

---

## Step 2: Configure AI Provider

At least one AI provider is required for autonomous coding. OpenJuliet supports 7 built-in providers plus any OpenAI-compatible endpoint.

### Quick Start: Which Provider to Pick

| Your Situation | Recommended Provider | Cost |
|---------------|-------------------|------|
| No budget, want to try | **Ollama** (local, fully free) | $0 |
| Need quality, no API key | **Google AI** (free tier available) | Free* |
| One key for many models | **OpenRouter** | Pay-as-you-go |
| Best code model | **Anthropic** (Claude) | Per-token |
| Already have OpenAI | **OpenAI** (GPT-4o) | Per-token |
| Self-hosted | **vLLM** or **LM Studio** | $0 (your hardware) |

*\* Google's free tier has rate limits; check their current policy.*

### Adding a Provider

1. Go to **Settings** (`⌘,`) → **Providers** tab
2. Click **Add Provider**
3. Select from presets (OpenAI, Anthropic, Google, OpenRouter) or create a custom one
4. Enter your API key (if required)
5. Optionally change the base URL for self-hosted endpoints
6. Toggle **Enabled** to activate
7. Click **Test Connection** to verify

### Provider Presets

| Provider | Default Base URL | API Key Location |
|----------|-----------------|-----------------|
| **OpenAI** | `https://api.openai.com/v1` | platform.openai.com |
| **Anthropic** | `https://api.anthropic.com/v1` | console.anthropic.com |
| **Google AI** | `https://generativelanguage.googleapis.com/v1beta` | aistudio.google.com |
| **OpenRouter** | `https://openrouter.ai/api/v1` | openrouter.ai |

### Custom Provider

Any OpenAI-compatible endpoint works:

1. Click **Add Provider** → fill in the **Custom** form
2. Set a name (e.g., "My Local Model")
3. Enter the base URL (e.g., `http://localhost:11434/v1`)
4. Enter an API key (can be placeholder for local servers)
5. Click **Save**

---

## Step 3: Choose Workspace Directory

The workspace directory is where OpenJuliet clones repositories and creates projects.

1. Go to **Settings** (`⌘,`) → **General** tab
2. Under **Workspace Directory**, click **Browse**
3. Select or create a directory (e.g., `~/projects` or `C:\Users\You\projects`)

> 💡 **Tips:**
> - Use a dedicated directory that isn't already a git repository
> - Ensure the directory is on a drive with sufficient space
> - Avoid cloud-synced directories (OneDrive, Dropbox) for large repos

---

## Step 4: Clone or Open a Repository

### Clone from GitHub

1. Navigate to **Repositories** view (`⌘2`)
2. Click **Clone Repository** (or use `⌘⇧C`)
3. Enter the repository URL (e.g., `https://github.com/owner/repo.git`)
4. Select the target directory
5. Click **Clone**

### Open a Local Repository

1. Go to **Dashboard** (`⌘1`)
2. Click **Open Local Repository**
3. Browse to an existing git repository on your machine
4. Click **Open**

### Recent Projects

Your most recently used repositories appear on the Dashboard for quick access.

---

## Step 5: Run Your First Task

### Using the Demo (No Configuration Required)

The fastest way to experience OpenJuliet:

1. Go to **Dashboard** (`⌘1`)
2. Click **"Run Full Demo"**
3. Watch the autonomous 7-stage pipeline:
   ```
   Analyze → Plan → Implement → Test → Review → Commit → PR
   ```
4. Progress is shown live in the **Execution Panel** (`⌘5` / History view)

The demo creates a sample math utilities project with an intentional bug (missing vitest import) and walks through the entire pipeline.

### Creating Your First Real Task

Once you have a provider configured and a repository open:

1. Press **`⌘N`** to create a new task
2. Enter a title (e.g., "Add input validation")
3. Optionally add a description
4. Select priority (Low, Medium, High, Critical)
5. Click **Create Task**

The task appears in the queue and starts executing automatically. Live output appears in the Execution Panel.

### Monitoring Tasks

- **Tasks view** (`⌘4`) — See the queue, active task, and history
- **History view** (`⌘5`) — Detailed logs and execution metrics
- **Status bar** — Current task status and progress percentage

### Task Controls

| Action | Shortcut | Description |
|--------|----------|-------------|
| Run selected task | `⌘⇧Enter` | Start or resume execution |
| Pause task | `⌘P` | Pause the active task |
| Cancel task | `⌘.` | Cancel the running task |
| Open task palette | `⌘⇧P` | Quick task navigation |

---

## Platform-Specific Notes

### Windows

- **Path format:** Use forward slashes (`C:/Users/...`) or escaped backslashes in settings
- **Terminal:** OpenJuliet uses the system `cmd.exe` or PowerShell for git commands
- **Firewall:** Ensure outbound connections to AI provider APIs are allowed
- **Installation:** Download the `.exe` installer from releases, or build from source
- **Squirrel.Windows:** The app uses Squirrel for auto-updates on Windows

### macOS

- **Path format:** Standard Unix paths (`/Users/username/projects`)
- **Code signing:** Development builds run from the terminal; distribution builds are signed
- **Permissions:** Grant accessibility permissions if using advanced features
- **Installation:** Drag the `.dmg` app to Applications folder

### Linux

- **Dependencies:** May require additional system packages:
  ```bash
  # Debian/Ubuntu
  sudo apt install libnss3 libatk-bridge2.0-0 libdrm2 libgbm1 libxkbcommon0

  # Fedora
  sudo dnf install nss atk-bridge at-spi2-atk mesa-libgbm libxkbcommon
  ```
- **Wayland:** Works with Wayland but X11 is recommended for best compatibility
- **AppImage:** Download the `.AppImage` from releases, make executable (`chmod +x`), and run
- **Sandboxing:** Electron's sandbox requires kernel support; enable user namespaces

---

## Troubleshooting Common Issues

### "No provider configured"

**Problem:** You try to run a task but no AI provider is enabled.

**Solution:** Go to **Settings → Providers** and add at least one AI provider. Alternatively, run the Demo workflow which doesn't require a provider.

### "GitHub: authentication failed"

**Problem:** GitHub operations fail with authentication errors.

**Solutions:**
- Regenerate your PAT at [github.com/settings/tokens](https://github.com/settings/tokens)
- Ensure the token has the `repo` scope
- Check for token expiration
- Verify the token is pasted correctly (no extra spaces)

### "Execution: Task timed out"

**Problem:** A task runs longer than the configured timeout.

**Solution:** Increase the timeout in **Settings → Execution** (default: 5 minutes). For large refactoring tasks, set it higher (10–30 minutes).

### Demo doesn't start

**Solutions:**
- Open Developer Tools (`⌘⌥I` / `Ctrl+Shift+I`) and check for errors
- Ensure you're running the latest version
- Try restarting the application
- Check if another demo instance is already running

### Electron fails to launch

**Solutions:**
- Check that your GPU drivers are up to date
- Try running with `--disable-gpu` flag:
  ```bash
  npm run dev -- --disable-gpu
  ```
- On Linux, ensure Wayland/X11 display server is running

### "Cannot find module" after update

**Solutions:**
```bash
rm -rf node_modules out dist
npm install
npm run dev
```

### Tests are slow or failing

**Solutions:**
- Ensure you have a stable internet connection
- Check API rate limits on your AI provider account
- Reduce concurrency in **Settings → Execution**
- Try a different (faster) model

### App not responding

**Solutions:**
- Wait a moment — large repository analysis can temporarily block the UI
- Check the task output for progress indicators
- Force quit and restart if unresponsive for more than 30 seconds

### Port conflicts

If you see `EADDRINUSE` errors during development:

```bash
# Find and kill the process on the conflicting port
lsof -i :5173  # or the port in use
kill -9 <PID>
```

---

## Next Steps

- 📖 **Keyboard Shortcuts** → [keyboard-shortcuts.md](keyboard-shortcuts.md)
- 🤖 **Autonomous Workflow** → [features/autonomous-workflow.md](features/autonomous-workflow.md)
- 🔌 **AI Providers** → [features/ai-providers.md](features/ai-providers.md)
- 🐙 **GitHub Integration** → [features/github-integration.md](features/github-integration.md)
- 🏗️ **Architecture Overview** → [architecture/overview.md](architecture/overview.md)
