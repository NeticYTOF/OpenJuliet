# OpenJuliet User Guide

> Version 1.0.0 — Complete guide for installing, configuring, and using OpenJuliet, the open-source autonomous coding agent.

---

## Table of Contents

- [Installation](#installation)
- [First Launch Setup](#first-launch-setup)
- [Connecting GitHub](#connecting-github)
- [Configuring AI Providers](#configuring-ai-providers)
- [Managing Repositories](#managing-repositories)
- [Creating and Executing Tasks](#creating-and-executing-tasks)
- [Understanding the Workflow](#understanding-the-workflow)
- [Reviewing Changes](#reviewing-changes)
- [Managing Settings](#managing-settings)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Installation

### System Requirements

| Component | Minimum Requirement |
|---|---|
| Operating System | Windows 10+, macOS 12+, or Linux (Ubuntu 20.04+) |
| CPU | Dual-core, 2 GHz+ |
| RAM | 4 GB (8 GB recommended) |
| Storage | 500 MB free space |
| Node.js | 18.x+ (not required for pre-built binaries) |
| Git | 2.x+ |
| Docker | Optional (for sandboxed execution) |

### Option 1: Pre-built Installer (Recommended)

Download the latest installer for your platform from the [Releases page](https://github.com/NeticYTOF/OpenJuliet/releases):

| Platform | Download |
|---|---|
| Windows | `OpenJuliet-Setup-[version]-x64.exe` |
| macOS (Intel) | `OpenJuliet-[version]-x64.dmg` |
| macOS (Apple Silicon) | `OpenJuliet-[version]-arm64.dmg` |
| Linux | `OpenJuliet-[version]-x86_64.AppImage` |
| Linux (Debian/Ubuntu) | `OpenJuliet_[version]_amd64.deb` |

**Windows** — Run the installer and follow the prompts. You can choose the installation directory.

**macOS** — Open the `.dmg` file and drag OpenJuliet to your Applications folder.

**Linux** — For AppImage: `chmod +x OpenJuliet-*.AppImage && ./OpenJuliet-*.AppImage`. For DEB: `sudo dpkg -i openjuliet_*.deb`.

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/NeticYTOF/OpenJuliet.git
cd OpenJuliet

# Install dependencies
npm install

# Build for production
npm run build

# Package for your platform
npx electron-builder --config electron-builder.yml
```

---

## First Launch Setup

When you open OpenJuliet for the first time, you'll see the **Welcome Screen** with a guided onboarding flow.

### Step 1: Welcome

The welcome screen introduces OpenJuliet's key capabilities. Click **Get Started** to proceed.

### Step 2: Configure AI Provider

Select or configure an AI provider. See [Configuring AI Providers](#configuring-ai-providers) for details.

### Step 3: Connect GitHub

Connect your GitHub account to browse repositories and create pull requests. See [Connecting GitHub](#connecting-github) for details.

### Step 4: Choose Workspace

Select a directory where OpenJuliet will clone repositories and perform work. This can be changed later in Settings.

### Step 5: Start Using OpenJuliet

After completing onboarding, you'll be taken to the **Dashboard** — the main hub of the application.

---

## Connecting GitHub

OpenJuliet supports two authentication methods:

### Personal Access Token (PAT)

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select these scopes:
   - `repo` — Full control of private repositories
   - `read:org` — Read org membership (optional)
   - `workflow` — Update GitHub Actions workflows
4. Copy the generated token
5. In OpenJuliet, go to **Settings → GitHub**
6. Select **PAT** authentication
7. Paste your token and click **Connect**

### OAuth (Browser-based)

1. In OpenJuliet, go to **Settings → GitHub**
2. Click **Sign in with GitHub**
3. Your browser opens a GitHub OAuth authorization page
4. Authorize the application
5. Return to OpenJuliet — you're connected

### Verifying Connection

Once connected:
- Your username and avatar appear in the settings.
- The GitHub panel (sidebar) shows your repositories.
- You can browse issues, create PRs, and manage repositories.

### Disconnecting

To disconnect GitHub: **Settings → GitHub → Disconnect**.

---

## Configuring AI Providers

OpenJuliet supports multiple AI providers. Configure them in **Settings → AI Providers**.

### Built-in Provider Types

| Provider | Type | Default Models |
|---|---|---|
| OpenAI | Cloud API | GPT-4o, GPT-4o-mini, o3-mini |
| Anthropic | Cloud API | Claude Sonnet 4, Claude 3.5 Haiku |
| Google AI | Cloud API | Gemini 2.5 Pro, Gemini 2.5 Flash |
| OpenRouter | Gateway | Various (configurable) |
| Ollama | Local | llama3.3, codellama, mistral |
| LM Studio | Local | Server-configured |
| vLLM | Local | Server-configured |
| Custom | Any | As configured |

### Adding a Provider

1. Go to **Settings → AI Providers**
2. Click **Add Provider**
3. Select the provider type
4. Fill in:
   - **Name** — A friendly label
   - **Base URL** — The API endpoint
   - **API Key** — Your API key
   - **Models** — Comma-separated model identifiers
5. Click **Save**

### Setting the Active Provider

Click the radio button or toggle next to the provider you want to use. The active provider is used for all task execution.

### Testing a Provider

Click the **Test** button next to any provider to verify connectivity. OpenJuliet will:
1. Make a request to the `/models` endpoint
2. Measure response latency
3. Display success/failure status

### Local Provider Setup

**Ollama:**
```bash
# Install Ollama
# https://ollama.com/download

# Pull a model
ollama pull llama3.3

# Ollama serves at http://localhost:11434 by default
# Configure in OpenJuliet as type 'ollama'
```

**LM Studio:**
1. Download LM Studio from [lmstudio.ai](https://lmstudio.ai)
2. Load a model
3. Start the local inference server (typically `http://localhost:1234`)
4. Configure in OpenJuliet

**vLLM:**
```bash
# Install vLLM
pip install vllm

# Start the server
python -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-3.3-70B-Instruct
```

---

## Managing Repositories

### Adding a Repository

From the **Repositories** view:

1. Click **Add Repository**
2. Choose one:
   - **Clone from GitHub** — Enter a GitHub repository URL
   - **Open Local Folder** — Browse to an existing local repository
3. The repository appears in your repository list

### GitHub Repository Browser

When connected to GitHub:

1. Navigate to **Repositories** → **GitHub Repos**
2. Browse your repositories (search by name)
3. Click a repository to see:
   - Description, language, stars, forks
   - Open issues count
   - Default branch
4. Click **Clone** to clone it locally

### Repository Details

Click on a repository to view:
- **Issues** — Browse and select issues to work on
- **Pull Requests** — See existing PRs
- **Branch** — View and switch branches
- **Status** — Current git status

### Removing a Repository

Hover over the repository and click the **Delete** icon to remove it from the project list.

---

## Creating and Executing Tasks

### From an Issue

The most common way to create a task:

1. Navigate to **Issues** view
2. Select a repository
3. Browse open issues
4. Click an issue to view its details
5. Click **Execute** to create a task from this issue

The task will start with the **analyze** stage, reading the issue description and codebase.

### From Scratch

1. Navigate to **Tasks** view
2. Click **New Task**
3. Fill in:
   - **Title** — A descriptive name
   - **Description** — What you want to accomplish (be specific)
   - **Repository** — Which project to work on
   - **Priority** — Low, Medium, High, or Critical
4. Click **Create Task**

### Managing the Queue

In the **Tasks** view:

- **Reorder** — Drag tasks to change priority
- **Cancel** — Click X to remove a pending task
- **Pause/Resume** — Pause the execution queue
- **Clear History** — Remove completed/failed tasks from history

### Task Execution Controls

While a task is running:
- **Pause** — Pause after the current stage completes
- **Cancel** — Stop execution immediately
- **View Logs** — See real-time output from each stage

---

## Understanding the Workflow

OpenJuliet's autonomous workflow consists of seven sequential stages:

```
analyze → plan → implement → test → review → commit → pr
```

### 1. Analyze 🔍

The AI examines:
- The issue description and requirements
- The repository structure and relevant files
- Existing tests and patterns

**Output**: A problem statement and relevant code areas identified.

### 2. Plan 📋

The AI creates:
- An implementation strategy
- List of files to modify
- Testing approach
- Estimated changes

**Output**: A structured plan for the implementation.

### 3. Implement ✏️

The AI:
- Reads and understands the relevant source files
- Writes code changes
- Creates new files if needed
- Applies changes to the working directory

**Output**: Modified files in the local repository.

### 4. Test 🧪

The AI:
- Runs existing test suites
- Verifies the implementation works
- Identifies test failures
- Fixes issues if possible

**Output**: Test results showing pass/fail status.

### 5. Review 👁️

The AI:
- Reviews its own changes for quality
- Checks for edge cases
- Verifies code style consistency
- Generates a summary of changes

**Output**: A code review summary with change details.

### 6. Commit 📝

The AI:
- Stages the changes
- Creates a descriptive commit message
- Commits to a new branch

**Output**: A commit in a feature branch.

### 7. Pull Request 🚀

The AI:
- Pushes the branch to GitHub
- Creates a pull request with:
  - Descriptive title and body
  - Reference to the original issue
  - Summary of changes
  - Suggested reviewers

**Output**: A pull request on GitHub ready for human review.

### Stage Statuses

| Status | Meaning |
|---|---|
| ⏳ Queued | Waiting in line for execution |
| 🔄 Running | Currently being executed |
| ⏸️ Paused | Execution paused |
| ✅ Completed | Stage finished successfully |
| ❌ Failed | Stage encountered an error |
| 🚫 Cancelled | Manually stopped |

---

## Reviewing Changes

### During Execution

- The **Execution Panel** shows real-time progress
- Each stage displays its current step and progress percentage
- Logs show detailed output from the LLM and git operations

### After Execution

- **Task Results** — View the final output of each stage
- **Diff Viewer** — See exactly what changed in each file
- **Git Log** — Review commit history
- **PR Link** — Click to open the pull request on GitHub

### Pull Request Details

When a PR is created, you can review:
- PR title and description
- Changed files
- Commit history
- Status checks

You can also:
- Edit the PR on GitHub before merging
- Add reviewers
- Request changes

---

## Managing Settings

Access settings via **Settings** in the sidebar, or press `⌘,` (macOS) / `Ctrl+,` (Windows/Linux).

### General

| Setting | Description | Default |
|---|---|---|
| Theme | Dark or light mode | Dark |
| Font Size | UI font size (12–24) | 14 |
| Animations | Enable/disable UI animations | Enabled |
| Workspace Directory | Default directory for projects | (user-set) |

### Execution

| Setting | Description | Default |
|---|---|---|
| Concurrency | Max parallel tasks | 2 |
| Sandbox | Use Docker for isolated execution | Enabled |
| Execution Timeout | Max time per task (ms) | 300,000 (5 min) |
| Notifications | Show desktop notifications | Enabled |

### Git

| Setting | Description | Default |
|---|---|---|
| Git Username | Name for commits | (user-set) |
| Git Email | Email for commits | (user-set) |

### GitHub

| Setting | Description |
|---|---|
| Authentication Method | PAT or OAuth |
| Connected Account | Your GitHub username |
| Disconnect | Remove GitHub authorization |

### AI Providers

Manage the list of AI providers — add, edit, remove, test, and set active. See [Configuring AI Providers](#configuring-ai-providers).

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘/Ctrl + K` | Open command palette |
| `⌘/Ctrl + B` | Toggle sidebar |
| `⌘/Ctrl + ,` | Open settings |
| `⌘/Ctrl + Enter` | Execute/create task |
| `⌘/Ctrl + 1` | Dashboard |
| `⌘/Ctrl + 2` | Repositories |
| `⌘/Ctrl + 3` | Issues |
| `⌘/Ctrl + 4` | Tasks |
| `⌘/Ctrl + 5` | History |
| `⌘/Ctrl + 6` | Settings |
| `Escape` | Close modal/dialog |
| `⌘/Ctrl + R` | Refresh current view |

**Note**: On macOS, use `⌘` (Command). On Windows/Linux, use `Ctrl`.

---

## Troubleshooting

### OpenJuliet won't start

**Symptom**: The application crashes on launch or shows a blank window.

**Solutions:**
1. Check system requirements (RAM, OS version).
2. Reinstall the application.
3. Delete the settings file and restart:
   - **Windows**: `%APPDATA%/OpenJuliet/`
   - **macOS**: `~/Library/Application Support/OpenJuliet/`
   - **Linux**: `~/.config/OpenJuliet/`
   - Delete `openjuliet.db` and `localStorage/`.
4. Check the application logs in the same directory.

### AI provider connection fails

**Symptom**: Provider test fails or tasks stall at the first stage.

**Solutions:**
1. Verify the provider's base URL is correct.
2. Check that your API key is valid and has not expired.
3. For local providers (Ollama, LM Studio), ensure the server is running.
4. Check firewall settings — some local providers need port access.
5. Use the **Test** button in Settings → AI Providers to diagnose.

### GitHub authentication fails

**Symptom**: Cannot connect GitHub or repos don't load.

**Solutions:**
1. Regenerate your PAT with the required scopes (`repo` is essential).
2. For OAuth, ensure pop-ups are allowed in your browser.
3. Disconnect and reconnect your GitHub account.
4. Check GitHub's status at [status.github.com](https://status.github.com).

### Task execution stalls

**Symptom**: A task stays on one stage without progressing.

**Solutions:**
1. Cancel the task and try again.
2. Check the execution logs for error messages.
3. Verify the AI provider is responsive (test it).
4. Check disk space — the sandbox needs room to work.
5. Reduce the task complexity or provide more specific instructions.

### Build from source fails

**Symptom**: `npm install` or `npm run build` returns errors.

**Solutions:**
1. Update Node.js to version 18 or 20.
2. Clear npm cache: `npm cache clean --force`.
3. Delete `node_modules` and `package-lock.json`, then run `npm install` again.
4. On Linux, install required system libraries (see Prerequisites).
5. On Windows, ensure Git Bash is used for shell commands.

### Plugin not working

**Symptom**: A plugin doesn't load or has no effect.

**Solutions:**
1. Ensure the plugin is in the `plugins/` directory with the correct structure.
2. Check the plugin's manifest file is valid JSON.
3. Restart OpenJuliet after adding a plugin.
4. Check the console for plugin loading errors (open DevTools with F12).

### Performance issues

**Symptom**: OpenJuliet feels slow or unresponsive.

**Solutions:**
1. Reduce the number of concurrent tasks (Settings → Concurrency).
2. Increase execution timeout for complex tasks.
3. Disable UI animations (Settings → General).
4. Close other resource-intensive applications.
5. For large repositories, ensure sufficient RAM (8 GB+ recommended).

---

## FAQ

**Q: Is OpenJuliet free?**
A: Yes! OpenJuliet is MIT-licensed open-source software. You may need to pay for API usage from AI providers (OpenAI, Anthropic, etc.) or run local models for free.

**Q: Does OpenJuliet send my code anywhere?**
A: No. OpenJuliet runs locally. Your code stays on your machine. AI provider API calls send code context to the provider you've selected (you choose which provider).

**Q: Can I use OpenJuliet without an internet connection?**
A: Yes, if you use a local AI provider (Ollama, LM Studio, vLLM). GitHub operations require internet, but local git repositories work offline.

**Q: Which AI provider is best?**
A: It depends on your needs:
- **Best overall**: Claude Sonnet 4 (Anthropic) or GPT-4o (OpenAI)
- **Best value**: Gemini 2.5 Flash (Google) or OpenRouter routing
- **Best for privacy**: Ollama with a local model
- **Best for custom models**: vLLM or LM Studio

**Q: How do I update OpenJuliet?**
A: The built-in auto-updater checks for updates every 30 minutes. When an update is available, you'll be prompted to download and install it. Alternatively, download the latest release from GitHub.

**Q: Can I run multiple tasks at the same time?**
A: Yes. Increase the **Concurrency** setting in Settings → Execution. Each task runs in its own worker thread.

**Q: What happens if my computer goes to sleep during a task?**
A: The task will pause and may fail with a timeout error. Cancel it and re-run from the last completed stage when you resume.

**Q: Does OpenJuliet support monorepos?**
A: Yes. OpenJuliet works with any git repository structure, including monorepos.

**Q: Can I customise the workflow stages?**
A: Yes, through the plugin system. You can create custom workflow templates or override system prompts per stage.
