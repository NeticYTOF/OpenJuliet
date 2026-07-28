# Settings

OpenJuliet provides comprehensive settings organized into tabs.

## General

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Theme | select | dark | dark, light, system |
| Workspace Directory | path | '' | Default directory for repositories |
| Font Size | slider | 14 | Editor and UI font size (10-24) |
| Language | select | en-US | UI language (6 supported locales) |
| Animations | toggle | true | Enable/disable UI animations |

## AI Providers

### Provider Configuration
Each provider requires:
- **Name** — display name
- **Base URL** — API endpoint
- **API Key** — authentication token
- **Models** — comma-separated model IDs
- **Enabled** — toggle to activate

### Built-in Providers

| Provider | Type | Base URL | Free? |
|----------|------|----------|-------|
| OpenAI | Cloud | https://api.openai.com/v1 | ❌ |
| Anthropic | Cloud | https://api.anthropic.com/v1 | ❌ |
| Google AI | Cloud | https://generativelanguage.googleapis.com | ✅ Free tier |
| OpenRouter | Gateway | https://openrouter.ai/api/v1 | ✅ Free models |
| Ollama | Local | http://localhost:11434 | ✅ Free |
| LM Studio | Local | http://localhost:1234 | ✅ Free |
| vLLM | Local | Configured by user | ✅ Free |
| Custom | Any | Any OpenAI-compatible | Varies |

### Provider Settings
- **Add Provider** — configure a new provider
- **Remove Provider** — delete a provider config
- **Test** — sends a test request to verify connection
- **Reorder** — drag to set priority order
- **Default provider** — automatically used for new tasks

## GitHub

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Auth Method | select | none | none, oauth, pat |
| PAT Token | password | '' | Personal Access Token |
| Connected As | readonly | — | GitHub username |
| Connection Status | badge | — | Live/Offline indicator |

### Authentication Methods

**OAuth (Recommended for desktop)**
1. Click "Sign in with GitHub"
2. Browser opens to authorize
3. Redirect back to app with token

**Personal Access Token (Recommended for headless)**
1. Create token at GitHub.com → Settings → Developer settings
2. Scopes needed: repo, issues, pull_requests, workflow
3. Paste token into OpenJuliet

## Execution

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| Concurrency | slider | 2 | 1-10 | Max simultaneous tasks |
| Sandbox | toggle | true | — | Use Docker sandbox |
| Execution Timeout | number | 300000 | 10000- | Task timeout in ms |
| Auto-retry | toggle | true | — | Auto-retry failed tasks |
| Retry Count | slider | 2 | 0-5 | Max retry attempts |
| Notify on Complete | toggle | true | — | Show toast on task complete |

## Appearance

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Accent Color | picker | Purple | UI accent color |
| Background Density | slider | 60% | Glass effect intensity |
| Animation Speed | select | normal | normal, reduced, none |
| Font Family | select | Inter | UI font |
| Monospace Font | select | JetBrains Mono | Code font |
| Font Size | slider | 14 | px |

### Accent Color Presets
- **Purple** (#6c5ce7) — default, inspired by Nous Research
- **Blue** (#3b82f6)
- **Green** (#22c55e)
- **Amber** (#f59e0b)
- **Red** (#ef4444)
- **Pink** (#ec4899)
- **Cyan** (#06b6d4)
- **Custom** — any hex color

## Notifications

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Enabled | toggle | true | Master toggle |
| Execution Complete | toggle | true | Task finished |
| PR Created | toggle | true | Auto-generated PR |
| Errors | toggle | true | Task failures |
| Updates Available | toggle | true | New version |
| Sound | toggle | false | Play sound on notification |
| Duration | slider | 5s | 2-15s, auto-dismiss time |

## Updates

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Auto-check | toggle | true | Check on startup |
| Channel | select | stable | stable, beta, nightly |
| Auto-download | toggle | false | Download updates automatically |
| Install on Quit | toggle | true | Apply update when quitting |

## Experimental Features

| Feature | Description |
|---------|-------------|
| Git Hooks | Auto-install pre-commit hooks |
| AI Review | AI-powered code review on all changes |
| Auto-suggest | Continuous AI suggestions while editing |
| Collaborative | Real-time collaboration (future) |
| Voice Commands | Control via voice input (future) |
