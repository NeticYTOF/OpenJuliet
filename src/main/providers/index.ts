/**
 * AI Provider System Module
 *
 * Manages AI/LLM providers — OpenAI, Anthropic, Google, OpenRouter,
 * Ollama, LM Studio, vLLM, and any custom OpenAI-compatible endpoint.
 *
 * Each provider is defined by a name, base URL, API key, and list of
 * available models. Supports both simple chat and streaming chat with
 * token-by-token events sent to the renderer via IPC.
 *
 * @module providers
 */

import type { BrowserWindow } from 'electron'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProviderConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  models: string[]
  type:
    | 'openai'
    | 'anthropic'
    | 'google'
    | 'openrouter'
    | 'ollama'
    | 'lm-studio'
    | 'vllm'
    | 'custom'
  isActive: boolean
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stop?: string[]
}

export interface ProviderTestResult {
  success: boolean
  latencyMs: number
  model?: string
  error?: string
}

/** Internal runtime state for a provider instance */
interface ProviderInstance {
  config: ProviderConfig
  abortController: AbortController | null
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const providers: Map<string, ProviderInstance> = new Map()
let activeProviderId: string | null = null
let mainWindowRef: BrowserWindow | null = null

// ---------------------------------------------------------------------------
// Default configurations for known providers
// ---------------------------------------------------------------------------

const DEFAULT_PROVIDERS: Omit<ProviderConfig, 'apiKey' | 'id'>[] = [
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ],
    type: 'openai',
    isActive: false
  },
  {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    type: 'anthropic',
    isActive: false
  },
  {
    name: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    type: 'google',
    isActive: false
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct'
    ],
    type: 'openrouter',
    isActive: false
  },
  {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama3.3', 'codellama', 'mistral', 'mixtral'],
    type: 'ollama',
    isActive: false
  },
  {
    name: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
    models: ['local-model'],
    type: 'lm-studio',
    isActive: false
  },
  {
    name: 'vLLM',
    baseUrl: 'http://localhost:8000/v1',
    models: ['default'],
    type: 'vllm',
    isActive: false
  }
]

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic id from a provider name.
 */
function makeId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Create headers for an OpenAI-compatible streaming request.
 */
function buildHeaders(config: ProviderConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  switch (config.type) {
    case 'anthropic':
      headers['x-api-key'] = config.apiKey
      headers['anthropic-version'] = '2023-06-01'
      break
    case 'google':
      // Google uses query parameter — no API key header needed
      break
    default:
      headers['Authorization'] = `Bearer ${config.apiKey}`
      break
  }

  // OpenRouter specific headers
  if (config.type === 'openrouter') {
    headers['HTTP-Referer'] = 'https://openjuliet.app'
    headers['X-Title'] = 'OpenJuliet'
  }

  return headers
}

/**
 * Build the request body for a chat completion call based on provider type.
 */
function buildChatBody(
  config: ProviderConfig,
  messages: ChatMessage[],
  options?: ChatOptions,
  stream = false
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: options?.model ?? config.models[0] ?? 'gpt-4o',
    messages,
    stream
  }

  if (options?.temperature !== undefined) body.temperature = options.temperature
  if (options?.maxTokens !== undefined) body.max_tokens = options.maxTokens
  if (options?.topP !== undefined) body.top_p = options.topP
  if (options?.stop !== undefined) body.stop = options.stop

  // Anthropic uses a slightly different shape
  if (config.type === 'anthropic') {
    body.max_tokens = options?.maxTokens ?? 4096
    body.system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n')
    body.messages = messages.filter((m) => m.role !== 'system')
  }

  return body
}

/**
 * Determine the chat completions endpoint for a provider.
 */
function chatEndpoint(config: ProviderConfig): string {
  switch (config.type) {
    case 'anthropic':
      return `${config.baseUrl}/messages`
    case 'google':
      return `${config.baseUrl}/openai/chat/completions`
    default:
      return `${config.baseUrl}/chat/completions`
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register the main window reference for sending IPC events.
 */
export function setMainWindow(win: BrowserWindow): void {
  mainWindowRef = win
}

/**
 * Initialize providers, optionally from a saved config list.
 * If no configs are provided, the default provider list is used (without keys).
 */
export function initialize(savedConfigs?: ProviderConfig[]): void {
  providers.clear()

  const configs = savedConfigs && savedConfigs.length > 0
    ? savedConfigs
    : DEFAULT_PROVIDERS.map((p) => ({
        ...p,
        id: makeId(p.name),
        apiKey: '',
        isActive: false
      }))

  for (const config of configs) {
    providers.set(config.id, { config, abortController: null })
  }

  // Restore active provider if one was set
  const active = configs.find((p) => p.isActive)
  if (active) {
    activeProviderId = active.id
  }
}

/**
 * Return all configured providers (safe copies).
 */
export function listProviders(): ProviderConfig[] {
  return Array.from(providers.values()).map((p) => ({ ...p.config }))
}

/**
 * Get a single provider config by id.
 */
export function getProvider(id: string): ProviderConfig | undefined {
  const instance = providers.get(id)
  return instance ? { ...instance.config } : undefined
}

/**
 * Add or update a provider configuration.
 */
export function upsertProvider(config: ProviderConfig): void {
  providers.set(config.id, { config, abortController: null })
}

/**
 * Remove a provider configuration.
 */
export function removeProvider(id: string): boolean {
  return providers.delete(id)
}

/**
 * Set the active provider by id.
 */
export function setActiveProvider(id: string): void {
  if (!providers.has(id)) {
    throw new Error(`Provider "${id}" not found`)
  }
  activeProviderId = id

  // Update isActive flag on all providers
  Array.from(providers.entries()).forEach(([pid, instance]) => {
    instance.config.isActive = pid === id
  })
}

/**
 * Get the currently active provider id.
 */
export function getActiveProviderId(): string | null {
  return activeProviderId
}

/**
 * Test a provider by making a lightweight model list or chat request.
 * Measures latency and returns whether the endpoint is reachable.
 */
export async function testProvider(id: string): Promise<ProviderTestResult> {
  const instance = providers.get(id)
  if (!instance) {
    return { success: false, latencyMs: 0, error: `Provider "${id}" not found` }
  }

  const start = Date.now()

  try {
    const response = await fetch(`${instance.config.baseUrl}/models`, {
      method: 'GET',
      headers: buildHeaders(instance.config)
    })

    const latencyMs = Date.now() - start

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown error')
      return {
        success: false,
        latencyMs,
        error: `HTTP ${response.status}: ${text}`
      }
    }

    const body = (await response.json()) as { data?: { id: string }[] }

    // Fallback: try a minimal chat completion
    if (!body.data || body.data.length === 0) {
      return {
        success: true,
        latencyMs,
        model: instance.config.models[0] ?? 'unknown'
      }
    }

    return {
      success: true,
      latencyMs,
      model: body.data[0]?.id ?? instance.config.models[0] ?? 'unknown'
    }
  } catch (err) {
    const latencyMs = Date.now() - start
    return {
      success: false,
      latencyMs,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

/**
 * Send a chat completion request (non-streaming) to a provider.
 *
 * @param providerId - The provider to use.
 * @param messages   - Array of chat messages.
 * @param options    - Optional model/temperature/maxTokens/etc.
 * @returns The full response content as a string.
 */
export async function chat(
  providerId: string,
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<string> {
  const instance = providers.get(providerId)
  if (!instance) {
    throw new Error(`Provider "${providerId}" not found`)
  }

  const controller = new AbortController()
  instance.abortController = controller

  try {
    const response = await fetch(chatEndpoint(instance.config), {
      method: 'POST',
      headers: {
        ...buildHeaders(instance.config),
        'Accept': 'application/json'
      },
      body: JSON.stringify(
        buildChatBody(instance.config, messages, options, false)
      ),
      signal: controller.signal
    })

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown error')
      throw new Error(`Chat request failed (HTTP ${response.status}): ${text}`)
    }

    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }

    const content = body.choices?.[0]?.message?.content ?? ''
    return content
  } finally {
    instance.abortController = null
  }
}

/**
 * Stream a chat completion, sending token events to the renderer via IPC.
 *
 * Events sent:
 *   'provider:token'   - { id, token, done, model }
 *   'provider:error'   - { id, error }
 *   'provider:done'    - { id, model, usage }
 *
 * @param providerId - The provider to use.
 * @param messages   - Array of chat messages.
 * @param options    - Optional model/temperature/maxTokens/etc.
 */
export async function streamChat(
  providerId: string,
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<void> {
  const instance = providers.get(providerId)
  if (!instance) {
    throw new Error(`Provider "${providerId}" not found`)
  }

  const controller = new AbortController()
  instance.abortController = controller

  const win = mainWindowRef
  const emit = (channel: string, data: Record<string, unknown>): void => {
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, data)
    }
  }

  try {
    const response = await fetch(chatEndpoint(instance.config), {
      method: 'POST',
      headers: {
        ...buildHeaders(instance.config),
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(
        buildChatBody(instance.config, messages, options, true)
      ),
      signal: controller.signal
    })

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown error')
      emit('provider:error', {
        id: providerId,
        error: `Stream request failed (HTTP ${response.status}): ${text}`
      })
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      emit('provider:error', {
        id: providerId,
        error: 'Response body is not readable'
      })
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let model = ''
    let usage: Record<string, unknown> | undefined

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? '' // keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const payload = trimmed.slice(6)
        if (payload === '[DONE]') continue

        try {
          const parsed = JSON.parse(payload) as {
            choices?: {
              delta?: { content?: string }
              finish_reason?: string | null
            }[]
            model?: string
            usage?: Record<string, unknown>
          }

          if (parsed.model) model = parsed.model
          if (parsed.usage) usage = parsed.usage

          const delta = parsed.choices?.[0]?.delta?.content
          const finishReason = parsed.choices?.[0]?.finish_reason

          if (delta) {
            emit('provider:token', {
              id: providerId,
              token: delta,
              done: false,
              model: parsed.model ?? ''
            })
          }

          if (finishReason && finishReason !== 'null') {
            emit('provider:token', {
              id: providerId,
              token: '',
              done: true,
              model: parsed.model ?? ''
            })
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    emit('provider:done', {
      id: providerId,
      model,
      usage: usage ?? {}
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      emit('provider:done', {
        id: providerId,
        model: '',
        usage: {},
        aborted: true
      })
      return
    }
    emit('provider:error', {
      id: providerId,
      error: err instanceof Error ? err.message : String(err)
    })
  } finally {
    instance.abortController = null
  }
}

/**
 * Abort an in-flight streaming request for a provider.
 */
export function abortStream(providerId: string): void {
  const instance = providers.get(providerId)
  if (instance?.abortController) {
    instance.abortController.abort()
    instance.abortController = null
  }
}

/**
 * Abort all in-flight streaming requests.
 */
export function abortAllStreams(): void {
  Array.from(providers.values()).forEach((instance) => {
    if (instance.abortController) {
      instance.abortController.abort()
      instance.abortController = null
    }
  })
}