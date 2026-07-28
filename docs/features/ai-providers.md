# AI Providers

> OpenJuliet supports 7 built-in AI providers plus any OpenAI-compatible custom endpoint. This document covers setup, configuration, model support, and provider selection.

---

## Table of Contents

- [Overview](#overview)
- [Supported Providers](#supported-providers)
- [OpenAI](#openai)
- [Anthropic](#anthropic)
- [Google AI](#google-ai)
- [OpenRouter](#openrouter)
- [Ollama](#ollama)
- [LM Studio](#lm-studio)
- [vLLM](#vllm)
- [Custom Provider](#custom-provider)
- [Provider Comparison](#provider-comparison)
- [Configuration](#configuration)
- [Streaming Support](#streaming-support)
- [Error Handling and Rate Limiting](#error-handling-and-rate-limiting)
- [Switching Providers](#switching-providers)

---

## Overview

OpenJuliet uses AI providers to power its autonomous coding pipeline. Each provider communicates over a standard API interface, with provider-specific adapters for authentication, model selection, and request formatting.

### Provider Type Model

```typescript
type ProviderKind = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'custom'

interface AIProvider {
  id: string
  name: string
  kind: ProviderKind
  apiKey?: string
  baseUrl?: string
  models: AIModel[]
  enabled: boolean
}

interface AIModel {
  id: string
  name: string
  maxTokens: number
  supportsVision: boolean
  supportsFunctions: boolean
}
```

---

## Supported Providers

| # | Provider | Type | Default Base URL | Requires API Key |
|---|----------|------|------------------|:---:|
| 1 | **OpenAI** | Cloud | `https://api.openai.com/v1` | ✅ Yes |
| 2 | **Anthropic** | Cloud | `https://api.anthropic.com/v1` | ✅ Yes |
| 3 | **Google AI** | Cloud | `https://generativelanguage.googleapis.com/v1beta` | ✅ Yes (free tier) |
| 4 | **OpenRouter** | Cloud | `https://openrouter.ai/api/v1` | ✅ Yes |
| 5 | **Ollama** | Local | `http://localhost:11434/v1` | ❌ No |
| 6 | **LM Studio** | Local | `http://localhost:1234/v1` | ❌ No |
| 7 | **vLLM** | Local/Self-hosted | `http://localhost:8000/v1` | ❌ No |
| — | **Custom** | Any | User-defined | Configurable |

---

## OpenAI

**The original AI provider — best for general-purpose coding tasks with GPT-4o.**

### Setup

1. Get an API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. In OpenJuliet: **Settings (`⌘,`) → Providers → Add Provider → OpenAI**
3. Paste your API key
4. Toggle **Enabled**
5. Click **Test Connection**

### Default Configuration

| Setting | Value |
|---------|-------|
| **Base URL** | `https://api.openai.com/v1` |
| **Key Location** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Provider Kind** | `openai` |

### Supported Models

| Model ID | Display Name | Max Tokens | Vision | Functions |
|----------|-------------|:----------:|:------:|:---------:|
| `gpt-4o` | GPT-4o | 128,000 | ✅ | ✅ |
| `gpt-4o-mini` | GPT-4o Mini | 128,000 | ✅ | ✅ |
| `o3-mini` | o3 Mini | 200,000 | ❌ | ✅ |

> **Cost:** Pay-per-token. GPT-4o Mini is the most cost-effective option for routine tasks.

---

## Anthropic

**Home of Claude — widely regarded as the best model for complex coding tasks.**

### Setup

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. In OpenJuliet: **Settings → Providers → Add Provider → Anthropic**
3. Paste your API key
4. Toggle **Enabled**
5. Click **Test Connection**

### Default Configuration

| Setting | Value |
|---------|-------|
| **Base URL** | `https://api.anthropic.com/v1` |
| **Key Location** | [console.anthropic.com](https://console.anthropic.com) |
| **Provider Kind** | `anthropic` |

### Supported Models

| Model ID | Display Name | Max Tokens | Vision | Functions |
|----------|-------------|:----------:|:------:|:---------:|
| `claude-sonnet-4-20250514` | Claude Sonnet 4 | 200,000 | ✅ | ✅ |
| `claude-3-5-haiku-20241022` | Claude 3.5 Haiku | 200,000 | ✅ | ✅ |

> **Cost:** Pay-per-token. Claude Sonnet 4 offers the best coding performance. Claude 3.5 Haiku is faster and cheaper for simpler tasks.

---

## Google AI

**Generous free tier and massive 1M token context window with Gemini.**

### Setup

1. Get an API key from [aistudio.google.com](https://aistudio.google.com/apikey)
2. In OpenJuliet: **Settings → Providers → Add Provider → Google AI**
3. Paste your API key
4. Toggle **Enabled**
5. Click **Test Connection**

### Default Configuration

| Setting | Value |
|---------|-------|
| **Base URL** | `https://generativelanguage.googleapis.com/v1beta` |
| **Key Location** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Provider Kind** | `google` |

### Supported Models

| Model ID | Display Name | Max Tokens | Vision | Functions |
|----------|-------------|:----------:|:------:|:---------:|
| `gemini-2.5-pro` | Gemini 2.5 Pro | 1,000,000 | ✅ | ✅ |
| `gemini-2.5-flash` | Gemini 2.5 Flash | 1,000,000 | ✅ | ✅ |

> **Cost:** [Free tier available](https://ai.google.dev/pricing) with rate limits. Gemini 2.5 Flash is optimized for speed and cost-efficiency.

---

## OpenRouter

**A unified gateway that provides access to 200+ models from all major providers through a single API key.**

### Setup

1. Create an account at [openrouter.ai](https://openrouter.ai)
2. Add a small credit balance
3. Generate an API key at [openrouter.ai/keys](https://openrouter.ai/keys)
4. In OpenJuliet: **Settings → Providers → Add Provider → OpenRouter**
5. Paste your API key
6. Toggle **Enabled**
7. Click **Test Connection**

### Default Configuration

| Setting | Value |
|---------|-------|
| **Base URL** | `https://openrouter.ai/api/v1` |
| **Key Location** | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **Provider Kind** | `openrouter` |

### Supported Models

| Model ID (via OpenRouter) | Display Name | Max Tokens | Vision | Functions |
|--------------------------|-------------|:----------:|:------:|:---------:|
| `openai/gpt-4o` | GPT-4o (via OR) | 128,000 | ✅ | ✅ |
| `anthropic/claude-sonnet-4` | Claude Sonnet 4 (via OR) | 200,000 | ✅ | ✅ |
| `google/gemini-2.5-pro` | Gemini 2.5 Pro (via OR) | 1,000,000 | ✅ | ✅ |

> **Benefits:** One API key for all major models. Pay-per-token billing. Access to free models with rate limits. Built-in fallback routing.

---

## Ollama

**Fully local, completely free AI inference. Runs models on your own hardware.**

### Setup

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull a model:
   ```bash
   ollama pull codellama
   # or
   ollama pull llama3.1
   ```
3. Ensure Ollama is running (`ollama serve`)
4. In OpenJuliet: **Settings → Providers → Add Provider → Custom**
5. Configure:
   - **Name:** `Ollama`
   - **Base URL:** `http://localhost:11434/v1`
   - **API Key:** Any placeholder (e.g., `ollama`)
6. Toggle **Enabled**
7. Click **Test Connection**

### Configuration

| Setting | Value |
|---------|-------|
| **Base URL** | `http://localhost:11434/v1` |
| **API Key** | Any placeholder (Ollama doesn't require authentication) |
| **Provider Kind** | `custom` (OpenAI-compatible) |

### Recommended Models

| Model | Size | Quality | Speed |
|-------|:----:|:-------:|:-----:|
| `codellama:7b` | 3.8 GB | Good | Fast |
| `codellama:13b` | 7.3 GB | Better | Moderate |
| `codellama:34b` | 19 GB | Best | Slow |
| `llama3.1:8b` | 4.7 GB | Good | Fast |
| `deepseek-coder:6.7b` | 3.8 GB | Good | Fast |

> **Cost:** $0 (uses your own hardware). Requires a GPU with sufficient VRAM for larger models.

---

## LM Studio

**Local AI provider with a user-friendly interface for downloading and running models.**

### Setup

1. Download and install [LM Studio](https://lmstudio.ai)
2. Search and download a model from the Hub
3. Start the local inference server (Local Inference Server tab)
4. Note the port (default: `1234`)
5. In OpenJuliet: **Settings → Providers → Add Provider → Custom**
6. Configure:
   - **Name:** `LM Studio`
   - **Base URL:** `http://localhost:1234/v1`
   - **API Key:** Any placeholder
7. Toggle **Enabled**
8. Click **Test Connection**

### Configuration

| Setting | Value |
|---------|-------|
| **Base URL** | `http://localhost:1234/v1` |
| **API Key** | Any placeholder |
| **Provider Kind** | `custom` (OpenAI-compatible) |

> **Cost:** $0. LM Studio provides a GUI for model management and supports GGUF format models.

---

## vLLM

**High-throughput, self-hosted LLM serving for production use.**

### Setup

1. Install vLLM:
   ```bash
   pip install vllm
   ```
2. Start the server:
   ```bash
   python -m vllm.entrypoints.openai.api_server --model codellama/CodeLlama-7b-hf
   ```
3. In OpenJuliet: **Settings → Providers → Add Provider → Custom**
4. Configure:
   - **Name:** `vLLM`
   - **Base URL:** `http://localhost:8000/v1`
   - **API Key:** Optional (set in vLLM config)
5. Toggle **Enabled**
6. Click **Test Connection**

### Configuration

| Setting | Value |
|---------|-------|
| **Base URL** | `http://localhost:8000/v1` |
| **API Key** | Optional |
| **Provider Kind** | `custom` (OpenAI-compatible) |

> **Benefits:** PagedAttention for efficient memory management. Continuous batching for high throughput. Supports quantization (AWQ, GPTQ). Ideal for serving fine-tuned models.

---

## Custom Provider

**Any OpenAI-compatible API endpoint can be used as a custom provider.**

### When to Use a Custom Provider

- Self-hosted models (TGI, Triton, TensorRT-LLM)
- Proxy services with OpenAI-compatible endpoints
- Enterprise/proprietary LLM APIs
- Azure OpenAI Service
- Any provider not in the built-in list

### Setup

1. In OpenJuliet: **Settings → Providers → Add Provider**
2. Fill in the custom form:
   - **Provider Name:** A recognizable name
   - **API Base URL:** Your endpoint URL
   - **API Key:** Your key (if required)
3. Click **Save**

### Example: Azure OpenAI

```yaml
Name: Azure OpenAI
Base URL: https://your-resource.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-01
API Key: <your-azure-key>
```

### Example: Local Text Generation Inference (TGI)

```yaml
Name: Local TGI
Base URL: http://localhost:8080/v1
API Key: (leave blank)
```

> **Note:** Custom providers use the OpenAI-compatible chat completions format. The provider must support `/v1/chat/completions` or similar endpoints.

---

## Provider Comparison

### At a Glance

| Provider | Speed | Cost | Code Quality | Local? | Setup Complexity |
|----------|:-----:|:----:|:-----------:|:------:|:----------------:|
| **OpenAI** | ⚡ Fast | 💰 Paid | ⭐⭐⭐⭐ | ❌ | 🟢 Easy |
| **Anthropic** | ⚡ Fast | 💰 Paid | ⭐⭐⭐⭐⭐ | ❌ | 🟢 Easy |
| **Google AI** | ⚡ Fast | 🆓 Free tier | ⭐⭐⭐⭐ | ❌ | 🟢 Easy |
| **OpenRouter** | ⚡ Fast | 💰 Paid/🆓 Free | ⭐⭐⭐⭐⭐ | ❌ | 🟢 Easy |
| **Ollama** | 🐢 Variable | 🆓 Free | ⭐⭐–⭐⭐⭐⭐ | ✅ Yes | 🟡 Moderate |
| **LM Studio** | 🐢 Variable | 🆓 Free | ⭐⭐–⭐⭐⭐⭐ | ✅ Yes | 🟡 Moderate |
| **vLLM** | ⚡ Fast (batched) | 🆓 Free | ⭐⭐–⭐⭐⭐⭐ | ✅ Yes | 🔴 Advanced |

### Detailed Comparison

| Feature | OpenAI | Anthropic | Google | OpenRouter | Ollama | LM Studio | vLLM |
|---------|:------:|:---------:|:------:|:----------:|:------:|:---------:|:----:|
| **Free option** | ❌ | ❌ | ✅ | ✅* | ✅ | ✅ | ✅ |
| **Requires GPU** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Max context** | 200K | 200K | 1M | Varies | Varies | Varies | Varies |
| **Vision support** | ✅ | ✅ | ✅ | ✅ | ✅** | ✅** | ✅** |
| **Streaming** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Rate limiting** | ✓ Tiered | ✓ Tiered | ✓ Free tier | ✓ Per-model | ⛔ None | ⛔ None | ⛔ None |
| **Offline capable** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **API key needed** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

*\* OpenRouter has free models with rate limits.*
*\*\* Depends on the specific model loaded.*

### Recommended Use Cases

| Use Case | Best Provider | Reason |
|----------|--------------|--------|
| Production coding | **Anthropic** (Claude) | Best code quality and reasoning |
| Budget-conscious | **Google AI** (free tier) or **OpenRouter** | Free or low-cost access to quality models |
| Offline/air-gapped | **Ollama** | Fully local, no internet required |
| High throughput | **vLLM** | Continuous batching for many concurrent requests |
| Quick prototyping | **OpenAI** (GPT-4o Mini) | Fast, cheap, widely available |
| Enterprise | **Custom** (Azure OpenAI) | Compliance and data residency |
| Learning/experiments | **LM Studio** | Easy model swapping with GUI |

---

## Configuration

### Adding a Provider

1. Open **Settings** (`⌘,`)
2. Navigate to the **Providers** tab
3. Click **Add Provider**
4. Choose from presets (OpenAI, Anthropic, Google, OpenRouter) or fill the custom form
5. Enter the API key (if applicable)
6. Optionally modify the base URL
7. Toggle **Enabled**
8. Click **Save**

### Managing Providers

From the **Providers** tab in Settings:

- **Enable/Disable:** Toggle the switch next to each provider
- **Edit:** Modify the base URL, API key, or models
- **Delete:** Click the trash icon to remove a provider
- **Add Preset:** Each built-in provider has an "Add" button for quick setup

### Testing a Provider

After adding a provider, click **Test Connection** to verify:

- The base URL is reachable
- The API key is valid
- The provider responds correctly

### Provider Storage

Provider settings (including encrypted API keys) are persisted to `localStorage` under the key `openjuliet:settings`.

```typescript
// Stored settings structure
{
  providers: AIProvider[],
  github: GitHubAuth,
  workspaceDir: string,
  // ... other settings
}
```

---

## Streaming Support

All built-in providers support streaming responses via server-sent events (SSE). The streaming implementation provides:

- **Real-time token display** — See response tokens as they're generated
- **Early cancellation** — Stop generation mid-stream if output is unsatisfactory
- **Progress indication** — Track generation progress in the UI

### Streaming Architecture

```typescript
// IPC event flow during streaming
// Main Process:
provider.streamCompletion(prompt, model)
  → sends 'execution:progress' events with current token count
  → sends 'execution:log' events with generated content
  
// Renderer Process:
executionStore.handleProgressEvent(data)  // Updates UI progress bar
executionStore.handleLogEvent(data)       // Appends to log view
```

### Provider-Specific Streaming Notes

| Provider | Streaming Protocol | Notes |
|----------|------------------|-------|
| OpenAI | Server-Sent Events | Standard SSE format |
| Anthropic | Server-Sent Events | Custom event types |
| Google AI | Server-Sent Events | gRPC-based under the hood |
| OpenRouter | Pass-through SSE | Inherits from underlying provider |
| Ollama | Streaming JSON | Custom streaming format |
| LM Studio | Server-Sent Events | OpenAI-compatible SSE |
| vLLM | Server-Sent Events | OpenAI-compatible SSE |

---

## Error Handling and Rate Limiting

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `401 Unauthorized` | Invalid API key | Regenerate key and update in Settings |
| `429 Too Many Requests` | Rate limit exceeded | Wait or upgrade your plan |
| `503 Service Unavailable` | Provider overloaded | Retry after a few seconds |
| `Timeout` | Request took too long | Reduce context size or switch to faster model |
| `Invalid model` | Model not available | Check model ID spelling and availability |

### Rate Limiting Strategies

OpenJuliet handles rate limits with:

1. **Graceful degradation** — Errors are logged but don't crash the pipeline
2. **Retry with backoff** — Failed requests can be retried with exponential backoff
3. **Provider fallback** — Switch to an alternative provider if the primary is rate-limited
4. **User notification** — Rate limit errors are surfaced in the UI

### Connection Status

The **NetworkStatus** component shows live connection status for all configured providers:

```typescript
interface SystemStatus {
  providers: { id: string; name: string; connected: boolean }[]
  workspace: { path: string; exists: boolean; size: string }
  git: { configured: boolean; user?: string }
  memoryUsage: string
  uptime: number
}
```

### Tips for Avoiding Rate Limits

- Use **OpenRouter** to distribute load across multiple upstream providers
- Configure **multiple providers** and switch between them
- Run **local models** (Ollama, LM Studio) for unlimited requests
- Reduce request size by narrowing task scope
- Increase delay between tasks in concurrency settings

---

## Switching Providers

### Manual Switching

1. Go to **Settings → Providers**
2. Enable the desired provider
3. Disable the current provider
4. New tasks will use the enabled provider

### Automated Fallback

If a provider fails (authentication error, rate limit, network error), the system can be configured to automatically fall back to the next enabled provider.

### Per-Task Provider Selection

When creating a new task (`⌘N`), you can optionally specify which provider and model to use. If not specified, the first enabled provider is used.
