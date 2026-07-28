# OpenJuliet Extensibility Guide

> Comprehensive documentation of OpenJuliet's plugin architecture, provider system, custom prompts, workflow templates, hooks, and configuration APIs.

---

## Overview

OpenJuliet is designed to be extensible at multiple levels. Whether you want to add a new AI provider, customize how the autonomous workflow runs, or build an entirely new feature as a plugin, the extensibility system provides stable, versioned APIs.

### Extensibility Layers

```
┌─────────────────────────────────────────────────┐
│                  OpenJuliet Core                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Execution│ │ Providers│ │ GitHub/Git       │ │
│  │ Engine   │ │ System   │ │ Integration      │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────┘
          │            │                │
          ▼            ▼                ▼
┌─────────────────────────────────────────────────┐
│               Extension Points                   │
│                                                   │
│  Provider API    Workflow Hooks    Plugin API     │
│  Custom Prompts  Templates         Config Import  │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## 1. Plugin Architecture

The plugin system lives in the `plugins/` directory at the project root. Each plugin is a directory containing a `plugin.json` manifest and optionally TypeScript source files.

### Plugin Directory Structure

```
plugins/
├── my-provider-plugin/
│   ├── plugin.json        # Plugin manifest (required)
│   ├── index.ts           # Plugin entry point (optional)
│   └── README.md          # Plugin documentation
├── my-hook-plugin/
│   ├── plugin.json
│   └── index.ts
└── my-workflow-template/
    ├── plugin.json
    └── template.json
```

### Plugin Manifest (`plugin.json`)

```json
{
  "name": "my-provider-plugin",
  "version": "1.0.0",
  "description": "Adds AwesomeAI provider support",
  "author": "Your Name",
  "type": "provider",
  "apiVersion": "1.0",
  "entryPoint": "index.ts",
  "compatibility": {
    "openjuliet": ">=1.0.0"
  }
}
```

### Plugin Types

| `type` | Description |
|--------|-------------|
| `provider` | Add a new AI provider |
| `hook` | Execute code at workflow stages |
| `template` | Define custom workflow templates |
| `prompt` | Override system prompts |
| `ui` | Add custom UI components (future) |

### Loading Mechanism

Plugins are discovered at startup by scanning the `plugins/` directory. The main process reads each `plugin.json`, validates the manifest, and loads the entry point if present.

```typescript
// Pseudocode — plugin loading logic
async function loadPlugins() {
  const pluginsDir = path.join(app.getAppPath(), 'plugins')
  const entries = await fs.readdir(pluginsDir)

  for (const entry of entries) {
    const manifestPath = path.join(pluginsDir, entry, 'plugin.json')
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'))
      // Validate and register
      if (manifest.type === 'provider') {
        registerProviderPlugin(manifest)
      }
    }
  }
}
```

---

## 2. Provider Plugins

Provider plugins allow you to add new AI provider types beyond the built-in set (OpenAI, Anthropic, Google, OpenRouter, Ollama, LM Studio, vLLM).

### Provider Interface

To implement a provider plugin, your module must export the following interface:

```typescript
interface ProviderPlugin {
  /** Unique provider type identifier */
  type: string

  /** Human-readable display name */
  name: string

  /** Default base URL */
  defaultBaseUrl: string

  /** Default model list */
  defaultModels: string[]

  /** Build HTTP URL for chat completions */
  buildChatUrl(config: ProviderConfig, model: string, stream: boolean): string

  /** Build HTTP request headers */
  buildHeaders(config: ProviderConfig): Record<string, string>

  /** Build request body for chat completions */
  buildChatBody(
    config: ProviderConfig,
    messages: ChatMessage[],
    options?: ChatOptions,
    stream?: boolean
  ): Record<string, unknown>

  /** Parse non-streaming response */
  parseChatResponse(config: ProviderConfig, body: unknown): string

  /** Parse streaming response tokens */
  parseStreamChunk?(chunk: string): { token?: string; done?: boolean; error?: string }
}
```

### Registering a Plugin via Configuration

New providers can also be added by configuring them in the UI settings. Each provider needs:

- **Name** — Display name (e.g., "My Custom Provider")
- **Base URL** — API endpoint URL
- **API Key** — Authentication token
- **Type** — Provider type (`openai`, `anthropic`, `google`, `ollama`, `custom`)
- **Models** — List of available model IDs

### Example: Adding an OpenAI-Compatible Provider

```typescript
// plugins/deepseek-provider/index.ts
import type { ProviderPlugin } from '../../src/main/providers/types'

const deepseekPlugin: ProviderPlugin = {
  type: 'deepseek',
  name: 'DeepSeek',
  defaultBaseUrl: 'https://api.deepseek.com/v1',
  defaultModels: ['deepseek-chat', 'deepseek-coder'],

  buildChatUrl(config, model, stream) {
    return `${config.baseUrl}/chat/completions`
  },

  buildHeaders(config) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    }
  },

  buildChatBody(config, messages, options, stream) {
    return {
      model: options?.model ?? config.models[0],
      messages,
      stream,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens
    }
  },

  parseChatResponse(config, body) {
    const data = body as any
    return data.choices?.[0]?.message?.content ?? ''
  }
}

export default deepseekPlugin
```

### Built-in Provider Types

| Provider | Type | Endpoint | Auth Method |
|----------|------|----------|-------------|
| OpenAI | `openai` | `{baseUrl}/chat/completions` | `Authorization: Bearer` |
| Anthropic | `anthropic` | `{baseUrl}/v1/messages` | `x-api-key` header |
| Google | `google` | `{baseUrl}/v1beta/models/{model}:generateContent` | `?key=` query param |
| OpenRouter | `openrouter` | `{baseUrl}/chat/completions` | `Authorization: Bearer` |
| Ollama | `ollama` | `{baseUrl}/api/chat` | No auth |
| LM Studio | `lm-studio` | `{baseUrl}/chat/completions` | `Authorization: Bearer` (optional) |
| vLLM | `vllm` | `{baseUrl}/chat/completions` | `Authorization: Bearer` (optional) |
| Custom | `custom` | `{baseUrl}/chat/completions` | `Authorization: Bearer` (user configures) |

---

## 3. Custom Prompts

System prompts used by AI interactions can be overridden per-provider or globally.

### Built-in System Prompts

The workflow engine uses several system prompts for different stages:

| Prompt | Used In | Purpose |
|--------|---------|---------|
| `system:analyze` | Repository analysis | Understand project structure |
| `system:plan` | Implementation planning | Generate step-by-step plans |
| `system:implement` | Code generation | Write implementation code |
| `system:review` | Code review | Review changes for quality |
| `system:commit` | Commit message | Generate commit messages |
| `system:pr-description` | PR generation | Create PR descriptions |
| `system:summary` | Workflow summary | Generate execution summary |

### Overriding Prompts

Prompts can be overridden via:

1. **Settings UI** — In Settings → Custom Prompts section
2. **Plugin** — A `prompt` type plugin can override one or more prompts
3. **Configuration file** — Via JSON import

```json
// custom-prompts.json — Import via Settings → Import Config
{
  "prompts": {
    "system:plan": "You are a senior software architect. Generate a detailed implementation plan with specific file paths and code structure.",
    "system:review": "Focus on security vulnerabilities and performance bottlenecks in your review."
  }
}
```

### Prompt Variables

Built-in variables available for interpolation in custom prompts:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{projectPath}}` | Full path to project | `/home/user/projects/my-app` |
| `{{language}}` | Detected language | `TypeScript` |
| `{{framework}}` | Detected framework | `React` |
| `{{testFramework}}` | Detected test framework | `vitest` |
| `{{description}}` | Task/issue description | `Fix login bug` |
| `{{requirements}}` | Parsed requirements JSON | `{"type": "bugfix", ...}` |
| `{{plan}}` | Generated plan JSON | `{"steps": [...], ...}` |

---

## 4. Workflow Templates

Workflow templates allow you to define custom execution pipelines beyond the default 7-stage workflow.

### Template Definition

```json
// plugins/custom-workflow/template.json
{
  "name": "minimal-review",
  "version": "1.0.0",
  "description": "Minimal workflow: analyze → implement → commit",
  "stages": [
    {
      "id": "analyze",
      "label": "Analyze Repository",
      "commands": [
        "ls -la",
        "find . -maxdepth 2 -name '*.ts' | head -50"
      ],
      "required": true
    },
    {
      "id": "implement",
      "label": "Implement Changes",
      "aiRequired": true,
      "commands": [
        "echo 'Implementing...'"
      ],
      "required": true
    },
    {
      "id": "commit",
      "label": "Commit Changes",
      "commands": [
        "git add -A",
        "git commit -m '{{commitMessage}}'"
      ],
      "required": true
    }
  ],
  "output": {
    "type": "commit",
    "requirePR": false
  }
}
```

### Stage Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique stage identifier |
| `label` | `string` | Human-readable display name |
| `commands` | `string[]` | Shell commands to execute |
| `aiRequired` | `boolean` | Whether this stage needs AI |
| `required` | `boolean` | Whether failure stops the workflow |
| `prompt` | `string` | Custom system prompt for this stage |
| `timeout` | `number` | Stage-specific timeout in ms |
| `retryCount` | `number` | Number of automatic retries on failure |

### Default Workflow Stages

```
Stage          AI?   Commands               Purpose
────────────────────────────────────────────────────────
analyze         No   ls, find, cat          Understand the codebase
understandIssue Yes  —                      Parse issue description
plan            Yes  —                      Generate implementation plan
implement       Yes  echo, write files      Apply changes
test            No   npm test, npx jest     Run test suite
review          Yes  —                      Review quality of changes
commit          No   git add, git commit    Stage and commit
pr              No   git push, gh pr create  Create pull request
summary         Yes  —                      Generate execution summary
```

---

## 5. Hooks

Hooks allow you to execute custom code at specific points in the workflow lifecycle.

### Available Hook Points

```
Workflow Pipeline
════════════════════════════════════════════════════════

  pre:analyze        pre:plan          pre:implement       pre:test
      │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼
  [ANALYZE]          [PLAN]           [IMPLEMENT]          [TEST]
      │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼
  post:analyze       post:plan         post:implement      post:test


  pre:review         pre:commit         pre:pr
      │                  │                  │
      ▼                  ▼                  ▼
  [REVIEW]           [COMMIT]           [PR]
      │                  │                  │
      ▼                  ▼                  ▼
  post:review        post:commit        post:pr
```

### Hook Interface

```typescript
interface WorkflowHook {
  /** Hook point identifier */
  hook: string

  /** Execution priority (lower runs first) */
  priority?: number

  /** Hook handler function */
  handler: (context: HookContext) => Promise<HookResult>
}

interface HookContext {
  taskId: string
  projectPath: string
  stage: string
  description: string
  metadata: Record<string, unknown>
  workflowState: {
    stagesCompleted: string[]
    currentProgress: number
    errors: string[]
  }
}

interface HookResult {
  /** Whether the hook succeeded */
  success: boolean
  /** Optional data to pass to the next stage */
  data?: Record<string, unknown>
  /** Error message if failed */
  error?: string
  /** Whether to block the workflow on failure */
  blocking?: boolean
}
```

### Hook Registration Example

```typescript
// plugins/my-hooks/index.ts
export default {
  hooks: [
    {
      hook: 'post:analyze',
      priority: 10,
      handler: async (ctx) => {
        console.log(`[hook] Analysis complete for task ${ctx.taskId}`)
        // Send a notification, log to external service, etc.
        return { success: true }
      }
    },
    {
      hook: 'pre:commit',
      priority: 5,
      handler: async (ctx) => {
        // Ensure all tests pass before committing
        const testResult = await runTests(ctx.projectPath)
        if (!testResult.passed) {
          return {
            success: false,
            error: 'Tests must pass before commit',
            blocking: true
          }
        }
        return { success: true }
      }
    }
  ]
}
```

### Built-in Hook: Git Hooks

OpenJuliet automatically installs git hooks in managed repositories:

| Hook | Trigger | Action |
|------|---------|--------|
| `pre-commit` | Before each commit | Run linter on staged files |
| `commit-msg` | After commit message is written | Validate conventional commit format |
| `post-merge` | After git merge | Auto-install dependencies if package manifests changed |

Git hooks are managed through the `src/main/git/hooks.ts` module with three operations:

```typescript
import { installHooks, removeHooks, getInstalledHooks } from './git/hooks'

// Install all hooks
const result = await installHooks({
  repoPath: '/path/to/repo',
  packageManager: 'npm',
  lintCommand: 'npm run lint'
})

// Remove hooks
await removeHooks('/path/to/repo')

// Check installed hooks
const installed = await getInstalledHooks('/path/to/repo')
```

---

## 6. Configuration Import/Export

Full application configuration can be exported and imported via the settings UI.

### Export Format

```json
{
  "version": "1.0",
  "exportedAt": "2025-07-28T12:00:00Z",
  "openjuliet": "1.1.0",
  "settings": {
    "theme": "dark",
    "fontSize": 14,
    "animationsEnabled": true,
    "concurrency": 2,
    "sandboxEnabled": true,
    "executionTimeout": 300000,
    "notificationsEnabled": true,
    "gitUser": "John Doe",
    "gitEmail": "john@example.com",
    "accentColor": "#6c5ce7",
    "bgDensity": 50,
    "animationSpeed": "normal"
  },
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "type": "openai",
      "baseUrl": "https://api.openai.com/v1",
      "models": ["gpt-4o", "gpt-4o-mini"],
      "isActive": true
    }
  ],
  "github": {
    "type": "pat",
    "username": "johndoe"
  },
  "prompts": {},
  "workflowTemplates": []
}
```

### Security Note

API keys are included in exports. Handle exported files with the same care as the application configuration. The export can be optionally sanitized to remove sensitive fields.

---

## 7. Versioned APIs

### API Version Compatibility

OpenJuliet uses semantic versioning for its extension APIs:

| API | Stability | Version | Notes |
|-----|-----------|---------|-------|
| `ProviderPlugin` interface | Stable | 1.0 | Will not change in 1.x |
| `WorkflowHook` interface | Stable | 1.0 | Will not change in 1.x |
| IPC channel contracts | Stable | 1.0 | Will not change in 1.x |
| `plugin.json` manifest | Stable | 1.0 | Will not change in 1.x |
| Workflow template format | Experimental | 0.9 | May change in minor releases |
| Custom prompts system | Enhanced | 1.0 | Stable, with room for growth |

### Backward Compatibility

- **IPC channels** — All `github:*`, `git:*`, `execution:*`, `provider:*`, `db:*`, `shell:*`, `app:*`, `workspace:*`, `update:*`, and `demo:*` channels maintain backward compatibility within the 1.x series.
- **Database schema** — Migrations are designed to be forward-compatible: new columns use `IF NOT EXISTS`, and removed columns are soft-deprecated.
- **Preload API** — The `window.api` object shape is versioned and will not change without a major version bump.

### Deprecation Policy

1. Deprecated APIs are marked with a `@deprecated` JSDoc tag
2. Deprecated features continue to work for at least one minor release
3. Removal happens only in major version bumps
4. Migration guides are provided for removed features

---

## Summary

| Extension Point | What You Can Do | Complexity |
|----------------|----------------|------------|
| Provider Plugin | Add a new AI provider | Medium |
| Custom Prompts | Override system prompts | Low |
| Workflow Template | Define custom pipeline stages | Medium |
| Workflow Hook | Execute code at any stage | Medium |
| Plugin System | Full-featured extension | High |
| Config Import/Export | Backup and restore settings | Low |

For plugin development questions, refer to the examples in the `plugins/` directory or open an issue on the [OpenJuliet repository](https://github.com/NeticYTOF/OpenJuliet).
