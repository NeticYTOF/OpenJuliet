# 🚀 OpenJuliet — First Launch Configuration Guide

Welcome to **OpenJuliet**, a beautiful, open-source, local-first autonomous coding agent.

This guide walks you through configuring OpenJuliet for first use. Even without an
AI provider or GitHub account, you can run the built-in **Demo Workflow** to see
the full autonomous coding pipeline in action.

---

## 📋 Quick Start (No Configuration Required)

1. Launch OpenJuliet.
2. Complete the onboarding flow (if shown).
3. On the **Dashboard**, click **"Run Full Demo"** to see the autonomous workflow:
   - Analyzes a sample project with an intentional bug
   - Plans the fix
   - Implements the correction
   - Runs tests
   - Reviews the changes
   - Creates a commit
   - Generates a PR summary

The demo runs entirely offline with realistic simulated stages and live progress
in the **Execution Panel** (`⌘5` / "History" view).

---

## ⚙️ Configuration Steps

### 1. Set Your Workspace Directory

The workspace is where OpenJuliet clones repositories and creates projects.

1. Go to **Settings** (`⌘,`).
2. Under **Workspace**, click **Browse** and select a directory (e.g., `~/projects`).
3. All cloned repositories and demo projects will live here.

### 2. Connect an AI Provider

At least one AI provider must be configured for autonomous coding to work.

| Provider    | Setup                                                                 |
|-------------|-----------------------------------------------------------------------|
| **OpenAI**  | Get an API key from [platform.openai.com](https://platform.openai.com) |
| **Anthropic** | Get an API key from [console.anthropic.com](https://console.anthropic.com) |
| **Google**  | Get an API key from [aistudio.google.com](https://aistudio.google.com) |
| **OpenRouter** | Get an API key from [openrouter.ai](https://openrouter.ai) (one key for many models) |

**To add a provider:**

1. Go to **Settings** → **Providers**.
2. Click **Add Provider**.
3. Select the provider type from the dropdown.
4. Enter your API key.
5. Optionally change the base URL (for self-hosted or proxy endpoints).
6. Click **Test Connection** to verify.
7. Click **Save**.

> **Tip:** If you're unsure, start with **OpenRouter**. Create a free account,
> add a small credit balance, and use their single API key to access models
> from OpenAI, Anthropic, Google, and many others.

### 3. Connect GitHub (Optional)

OpenJuliet can list repositories, manage issues, create pull requests, and more.

1. Go to **Settings** → **GitHub**.
2. Choose an authentication method:
   - **Personal Access Token (PAT):** Create a classic token at
     [github.com/settings/tokens](https://github.com/settings/tokens) with
     `repo` and `user` scopes, then paste it in.
   - **OAuth (coming soon):** OAuth flow will be available in a future release.
3. Click **Authenticate**.
4. Once connected, your avatar and username appear in the sidebar.

### 4. Configure Git

If you plan to commit and push via OpenJuliet:

1. Go to **Settings** → **Git**.
2. Set your **Git Username** and **Git Email** (matching your GitHub account).
3. These are used for commit authorship.

### 5. Customise the Look & Feel

OpenJuliet supports deep visual customisation:

- **Accent Color:** Pick from 10 presets or enter any hex color.
- **Background Density:** Adjust the background darkness.
- **Animation Speed:** Choose `Normal`, `Reduced`, or `None`.
- **Font Size:** Adjust the editor and UI font size.

All settings are on the **Settings** → **Appearance** tab.

---

## 🎮 Keyboard Shortcuts

| Shortcut      | Action               |
|---------------|----------------------|
| `⌘1` – `⌘6`  | Switch views         |
| `⌘,`         | Open Settings        |
| `⌘K`         | Command Palette      |
| `⌘B`         | Toggle Sidebar       |
| `⌘N`         | New Task             |
| `⌘⇧K`        | Keyboard Shortcuts   |

Full reference: **Settings** → **Shortcuts**, or press `⌘⇧K` at any time.

---

## 🧪 Running the Demo

The **Demo Workflow** is the fastest way to experience OpenJuliet:

1. Go to **Dashboard** (`⌘1`).
2. Click **"Run Full Demo"** in the left column.
3. Watch as the 7-stage pipeline runs:
   ```
   Analyze → Plan → Implement → Test → Review → Commit → PR
   ```
4. Monitor live logs, stage progress, and timing.
5. After completion, a summary shows all stages and results.

The demo creates real files in a temporary directory under your app's user data
folder, then cleans up automatically on app restart.

---

## ❓ Troubleshooting

**"No provider configured"**
→ Add an AI provider in Settings (or use the demo to explore without one).

**"GitHub: authentication failed"**
→ Ensure your PAT has `repo` scope. Generate a new one if the existing token
  has expired.

**"Demo doesn't start"**
→ Check the developer console (`Ctrl+Shift+I` / `⌘⌥I`) for errors.
→ Ensure you're running the latest version.

**"Tests fail in demo"**
→ The demo runs simulated tests — this is expected behaviour. No actual test
  runner is required.

---

## 📚 Learn More

- [User Guide](./docs/USER_GUIDE.md) — Complete user documentation
- [Architecture](./docs/ARCHITECTURE.md) — How OpenJuliet works internally
- [Development](./docs/DEVELOPMENT.md) — Contributing and building from source
- [GitHub](https://github.com/NeticYTOF/OpenJuliet) — Source code and issues

---

*OpenJuliet v1.0.0 — Built with ❤️ by Nous Research*
