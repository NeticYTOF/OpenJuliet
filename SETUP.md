# Welcome to OpenJuliet! 🎉

Thank you for installing OpenJuliet — your local-first autonomous coding agent.

## Quick Start (3 minutes)

### 1. Connect GitHub
OpenJuliet needs access to your GitHub repositories. You have two options:

**Option A: Personal Access Token (Recommended)**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Give it repo, issues, pull requests, and workflow scopes
4. Copy the token and paste it into OpenJuliet's GitHub settings

**Option B: OAuth**
1. Click "Sign in with GitHub" in OpenJuliet
2. Authorize the application
3. You'll be redirected back to OpenJuliet

### 2. Configure an AI Provider
OpenJuliet supports 7 AI providers. Pick one:

| Provider | Free Tier? | Setup |
|----------|-----------|-------|
| **Ollama** | ✅ Yes (local) | Install Ollama, pull a model: `ollama pull codellama` |
| **OpenAI** | ❌ Paid | Add your API key from platform.openai.com |
| **Anthropic** | ❌ Paid | Add your API key from console.anthropic.com |
| **Google** | ✅ Yes (free tier) | Get API key from aistudio.google.com |
| **OpenRouter** | ✅ Yes (free models) | Sign up at openrouter.ai, use free models |
| **LM Studio** | ✅ Yes (local) | Download LM Studio, start local server |
| **vLLM** | ✅ Yes (local) | Deploy vLLM with your model |

### 3. Clone or Open a Repository
- Click "Clone Repository" to clone from GitHub
- Or click "Open Local" to work with an existing folder

### 4. Browse Issues & Start Working
- Navigate to the Issues tab
- Select an issue
- Click "Execute" to watch OpenJuliet work autonomously

### 5. Review & Approve
- Watch live progress in the Execution Panel
- Review diffs and test results
- Approve or request changes
- OpenJuliet will create a PR with the changes

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Command Palette |
| `⌘⇧K` | Keyboard Shortcuts |
| `⌘B` | Toggle Sidebar |
| `⌘,` | Settings |
| `⌘1-7` | Navigate Views |
| `⌘⏎` | Execute Task |
| `⎋` | Close/Cancel |

## Architecture

```
src/
├── main/         Electron main process (IPC, providers, git, GitHub)
├── preload/      TypeScript context bridge (30+ IPC channels)
└── renderer/     React 19 UI (24 feature components, 29 UI components)
```

## Need Help?
- **GitHub Issues**: https://github.com/NeticYTOF/OpenJuliet/issues
- **Documentation**: See the `docs/` folder
- **Architecture**: `docs/ARCHITECTURE.md`
- **Development Guide**: `docs/DEVELOPMENT.md`

Happy coding! 🚀