/**
 * AI Provider System Module
 *
 * Manages AI/LLM providers — OpenAI, Anthropic, Google, OpenRouter,
 * Ollama, LM Studio, vLLM, and any custom OpenAI-compatible endpoint.
 *
 * Each provider has a config (id, name, type, baseUrl, apiKey, models,
 * isActive) and supports both simple chat and streaming chat with
 * token-by-token events sent to the renderer via IPC.
 *
 * HTTP architecture:
 *   - OpenAI-compatible (openai, openrouter, lm-studio, vllm, custom):
 *     POST {baseUrl}/chat/completions  with Authorization: Bearer
 *
 *   - Anthropic:
 *     POST https://api.anthropic.com/v1/messages  with x-api-key header
 *
 *   - Google (native):
 *     POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *     API key via ?key= query parameter
 *
 *   - Ollama (native):
 *     POST http://localhost:11434/api/chat
 *     No auth, plain JSON format
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
    baseUrl: 'https://api.anthropic.com',
    models: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307'
    ],
    type: 'anthropic',
    isActive: false
  },
  {
    name: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    type: 'google',
    isActive: false
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'anthropic/claude-sonnet-4',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct'
    ],
    type: 'openrouter',
    isActive: false
  },
  {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434',
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
 * Resolve the effective model name for a given provider/messages/options.
 */
function resolveModel(config: ProviderConfig, options?: ChatOptions): string {
  return options?.model ?? config.models[0] ?? 'gpt-4o'
}

// ---------------------------------------------------------------------------
// Provider-specific request builders
// ---------------------------------------------------------------------------

/**
 * Build the fetch URL for a chat completion call based on provider type.
 */
function buildChatUrl(
  config: ProviderConfig,
  model: string,
  stream: boolean
): string {
  switch (config.type) {
    case 'anthropic':
      return `${config.baseUrl}/v1/messages`

    case 'google':
      // Native Google Generative Language API
      return `${config.baseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(config.apiKey)}`

    case 'ollama':
      // Native Ollama API
      return `${config.baseUrl}/api/chat`

    // OpenAI-compatible endpoints
    case 'openai':
    case 'openrouter':
    case 'lm-studio':
    case 'vllm':
    case 'custom':
    default:
      return `${config.baseUrl}/chat/completions`
  }
}

/**
 * Build HTTP headers for a provider request.
 */
function buildHeaders(
  config: ProviderConfig
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  switch (config.type) {
    case 'anthropic':
      headers['x-api-key'] = config.apiKey
      headers['anthropic-version'] = '2023-06-01'
      break

    case 'google':
      // API key is passed as query parameter, not header
      // No auth header needed for the native API
      break

    case 'ollama':
      // Ollama doesn't need auth headers
      break

    default:
      // OpenAI-compatible: openai, openrouter, lm-studio, vllm, custom
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`
      }
      break
  }

  // OpenRouter-specific headers
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
  const model = resolveModel(config, options)

  switch (config.type) {
    // -----------------------------------------------------------------------
    // Anthropic native API
    // -----------------------------------------------------------------------
    case 'anthropic': {
      const systemMessages = messages.filter((m) => m.role === 'system')
      const chatMessages = messages.filter(
        (m) => m.role === 'user' || m.role === 'assistant'
      )

      const body: Record<string, unknown> = {
        model,
        max_tokens: options?.maxTokens ?? 4096,
        messages: chatMessages.map((m) => ({
          role: m.role,
          content: m.content
        })),
        stream
      }

      if (systemMessages.length > 0) {
        body.system = systemMessages.map((m) => m.content).join('\n')
      }

      if (options?.temperature !== undefined) body.temperature = options.temperature
      if (options?.topP !== undefined) body.top_p = options.topP
      if (options?.stop !== undefined) body.stop_sequences = options.stop

      return body
    }

    // -----------------------------------------------------------------------
    // Google native API
    // -----------------------------------------------------------------------
    case 'google': {
      // Extract system prompt from messages
      const systemMessages = messages.filter((m) => m.role === 'system')
      const chatMessages = messages.filter(
        (m) => m.role === 'user' || m.role === 'assistant'
      )

      const body: Record<string, unknown> = {
        contents: chatMessages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: {}
      }

      if (systemMessages.length > 0) {
        body.systemInstruction = {
          parts: [{ text: systemMessages.map((m) => m.content).join('\n') }]
        }
      }

      const gc = body.generationConfig as Record<string, unknown>
      if (options?.temperature !== undefined) gc.temperature = options.temperature
      if (options?.maxTokens !== undefined) gc.maxOutputTokens = options.maxTokens
      if (options?.topP !== undefined) gc.topP = options.topP
      if (options?.stop !== undefined) gc.stopSequences = options.stop

      return body
    }

    // -----------------------------------------------------------------------
    // Ollama native API
    // -----------------------------------------------------------------------
    case 'ollama': {
      const body: Record<string, unknown> = {
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content
        })),
        stream
      }

      if (options?.temperature !== undefined) body.temperature = options.temperature
      if (options?.maxTokens !== undefined) body.max_tokens = options.maxTokens
      if (options?.topP !== undefined) body.top_p = options.topP
      if (options?.stop !== undefined) body.stop = options.stop

      return body
    }

    // -----------------------------------------------------------------------
    // OpenAI-compatible: openai, openrouter, lm-studio, vllm, custom
    // -----------------------------------------------------------------------
    default: {
      const body: Record<string, unknown> = {
        model,
        messages,
        stream
      }

      if (options?.temperature !== undefined) body.temperature = options.temperature
      if (options?.maxTokens !== undefined) body.max_tokens = options.maxTokens
      if (options?.topP !== undefined) body.top_p = options.topP
      if (options?.stop !== undefined) body.stop = options.stop

      return body
    }
  }
}

// ---------------------------------------------------------------------------
// Provider-specific response parsers (non-streaming)
// ---------------------------------------------------------------------------

function parseChatResponse(
  config: ProviderConfig,
  body: unknown
): string {
  const data = body as Record<string, unknown>

  switch (config.type) {
    // -----------------------------------------------------------------------
    // Anthropic
    // -----------------------------------------------------------------------
    case 'anthropic': {
      // Anthropic response: { content: [{ type: 'text', text: '...' }] }
      const content = data.content as Array<{ type?: string; text?: string }> | undefined
      if (content && content.length > 0) {
        return content.map((c) => c.text ?? '').join('')
      }
      return ''
    }

    // -----------------------------------------------------------------------
    // Google
    // -----------------------------------------------------------------------
    case 'google': {
      // Google response: { candidates: [{ content: { parts: [{ text: '...' }] } }] }
      const candidates = data.candidates as
        | Array<{ content?: { parts?: Array<{ text?: string }> } }>
        | undefined
      if (candidates && candidates.length > 0) {
        const parts = candidates[0]?.content?.parts
        if (parts && parts.length > 0) {
          return parts.map((p) => p.text ?? '').join('')
        }
      }
      return ''
    }

    // -----------------------------------------------------------------------
    // Ollama native
    // -----------------------------------------------------------------------
    case 'ollama': {
      // Ollama response: { message: { role: 'assistant', content: '...' } }
      const msg = data.message as { content?: string } | undefined
      if (msg?.content) return msg.content
      return ''
    }

    // -----------------------------------------------------------------------
    // OpenAI-compatible
    // -----------------------------------------------------------------------
    default: {
      // OpenAI response: { choices: [{ message: { content: '...' } }] }
      const choices = data.choices as
        | Array<{ message?: { content?: string } }>
        | undefined
      return choices?.[0]?.message?.content ?? ''
    }
  }
}

// ---------------------------------------------------------------------------
// Provider-specific streaming response parsers
// ---------------------------------------------------------------------------

/**
 * Stream parser for OpenAI-compatible SSE (data: {...} lines).
 * Signals completion with a resolved promise.
 */
async function parseOpenAIStream(
  config: ProviderConfig,
  reader: ReadableStreamDefaultReader<Uint8Array>,
  emit: (channel: string, data: Record<string, unknown>) => void,
  providerId: string
): Promise<{ model: string; usage: Record<string, unknown> }> {
  const decoder = new TextDecoder()
  let buffer = ''
  let model = ''
  let usage: Record<string, unknown> = {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

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

  return { model, usage }
}

/**
 * Stream parser for Anthropic SSE (event: content_block_delta, etc.).
 */
async function parseAnthropicStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  emit: (channel: string, data: Record<string, unknown>) => void,
  providerId: string
): Promise<{ model: string; usage: Record<string, unknown> }> {
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''
  let model = ''
  let usage: Record<string, unknown> = {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith('event: ')) {
        currentEvent = trimmed.slice(7)
        continue
      }

      if (trimmed.startsWith('data: ')) {
        const payload = trimmed.slice(6)
        if (payload === '[DONE]') continue

        try {
          const parsed = JSON.parse(payload) as Record<string, unknown>

          if (parsed.model) model = parsed.model as string
          if (parsed.type === 'message_start' && parsed.message) {
            const msg = parsed.message as Record<string, unknown>
            if (msg.model) model = msg.model as string
          }
          if (parsed.type === 'message_delta' && parsed.usage) {
            usage = parsed.usage as Record<string, unknown>
          }

          // content_block_delta with text delta
          if (
            currentEvent === 'content_block_delta' ||
            parsed.type === 'content_block_delta'
          ) {
            const delta = parsed.delta as { text?: string } | undefined
            if (delta?.text) {
              emit('provider:token', {
                id: providerId,
                token: delta.text,
                done: false,
                model
              })
            }
          }

          // message_stop signals completion
          if (
            currentEvent === 'message_stop' ||
            parsed.type === 'message_stop'
          ) {
            emit('provider:token', {
              id: providerId,
              token: '',
              done: true,
              model
            })
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  return { model, usage }
}

/**
 * Stream parser for Google native API.
 * Google streams JSON objects separated by \n (not SSE data: prefix).
 */
async function parseGoogleStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  emit: (channel: string, data: Record<string, unknown>) => void,
  providerId: string
): Promise<{ model: string; usage: Record<string, unknown> }> {
  const decoder = new TextDecoder()
  let buffer = ''
  let model = ''
  let usage: Record<string, unknown> = {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>

        // Google streaming response structure:
        // { candidates: [{ content: { parts: [{ text: '...' }] }, finishReason?: '...' }] }
        const candidates = parsed.candidates as
          | Array<{
              content?: { parts?: Array<{ text?: string }> }
              finishReason?: string
            }>
          | undefined

        if (candidates && candidates.length > 0) {
          const candidate = candidates[0]
          const parts = candidate?.content?.parts

          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.text) {
                emit('provider:token', {
                  id: providerId,
                  token: part.text,
                  done: false,
                  model
                })
              }
            }
          }

          if (candidate.finishReason && candidate.finishReason !== 'null') {
            emit('provider:token', {
              id: providerId,
              token: '',
              done: true,
              model
            })
          }
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }

  return { model, usage }
}

/**
 * Stream parser for Ollama native API.
 * Ollama streams newline-delimited JSON objects (no SSE prefix).
 */
async function parseOllamaStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  emit: (channel: string, data: Record<string, unknown>) => void,
  providerId: string
): Promise<{ model: string; usage: Record<string, unknown> }> {
  const decoder = new TextDecoder()
  let buffer = ''
  let model = ''
  let usage: Record<string, unknown> = {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>

        // Ollama streaming response:
        // { message: { role: 'assistant', content: '...' }, done: false }
        // Final: { ... done: true, total_duration, ... }
        if (parsed.model) model = parsed.model as string

        const msg = parsed.message as { content?: string } | undefined
        if (msg?.content) {
          emit('provider:token', {
            id: providerId,
            token: msg.content,
            done: false,
            model
          })
        }

        if (parsed.done === true) {
          if (parsed.total_duration !== undefined) {
            usage = {
              total_duration: parsed.total_duration,
              load_duration: parsed.load_duration,
              prompt_eval_count: parsed.prompt_eval_count,
              eval_count: parsed.eval_count,
              eval_duration: parsed.eval_duration
            }
          }
          emit('provider:token', {
            id: providerId,
            token: '',
            done: true,
            model
          })
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }

  return { model, usage }
}

/**
 * Route streaming parsing to the correct handler based on provider type.
 */
async function parseProviderStream(
  config: ProviderConfig,
  reader: ReadableStreamDefaultReader<Uint8Array>,
  emit: (channel: string, data: Record<string, unknown>) => void,
  providerId: string
): Promise<{ model: string; usage: Record<string, unknown> }> {
  switch (config.type) {
    case 'anthropic':
      return parseAnthropicStream(reader, emit, providerId)
    case 'google':
      return parseGoogleStream(reader, emit, providerId)
    case 'ollama':
      return parseOllamaStream(reader, emit, providerId)
    default:
      return parseOpenAIStream(config, reader, emit, providerId)
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

  const configs =
    savedConfigs && savedConfigs.length > 0
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
    let url: string
    let options: RequestInit

    const { config } = instance

    switch (config.type) {
      case 'google': {
        // Google: list models endpoint
        url = `${config.baseUrl}/v1beta/models?key=${encodeURIComponent(config.apiKey)}`
        options = { method: 'GET' }
        break
      }
      case 'ollama': {
        // Ollama: list local models
        url = `${config.baseUrl}/api/tags`
        options = { method: 'GET' }
        break
      }
      case 'anthropic': {
        // Anthropic: minimal message to test
        url = `${config.baseUrl}/v1/messages`
        options = {
          method: 'POST',
          headers: buildHeaders(config),
          body: JSON.stringify({
            model: config.models[0] ?? 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }]
          })
        }
        break
      }
      default: {
        // OpenAI-compatible: list models endpoint
        url = `${config.baseUrl}/models`
        options = {
          method: 'GET',
          headers: buildHeaders(config)
        }
        break
      }
    }

    const response = await fetch(url, options)
    const latencyMs = Date.now() - start

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown error')
      return {
        success: false,
        latencyMs,
        error: `HTTP ${response.status}: ${text}`
      }
    }

    // Try to extract model name from response
    const body = (await response.json()) as Record<string, unknown>

    let model = instance.config.models[0] ?? 'unknown'

    if (config.type === 'google') {
      const models = body.models as Array<{ name?: string }> | undefined
      if (models && models.length > 0 && models[0]?.name) {
        // Strip the 'models/' prefix
        model = models[0].name.replace(/^models\//, '')
      }
    } else if (config.type === 'ollama') {
      const models = body.models as Array<{ name?: string }> | undefined
      if (models && models.length > 0 && models[0]?.name) {
        model = models[0].name
      }
    } else {
      const models = body.data as Array<{ id?: string }> | undefined
      if (models && models.length > 0 && models[0]?.id) {
        model = models[0].id
      }
    }

    return { success: true, latencyMs, model }
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
    const { config } = instance
    const model = resolveModel(config, options)

    // Google native API uses key in URL, not header
    const headers = buildHeaders(config)
    if (config.type !== 'google') {
      headers['Accept'] = 'application/json'
    }

    const url = buildChatUrl(config, model, false)
    const body = buildChatBody(config, messages, options, false)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    })

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown error')
      throw new Error(`Chat request failed (HTTP ${response.status}): ${text}`)
    }

    const responseBody = (await response.json()) as unknown
    return parseChatResponse(config, responseBody)
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
    const { config } = instance
    const model = resolveModel(config, options)

    // Google native API uses key in URL, not in Accept header
    const headers = buildHeaders(config)

    const url = buildChatUrl(config, model, true)
    const body = buildChatBody(config, messages, options, true)

    // Anthropic needs a special Accept header for SSE
    if (config.type === 'anthropic') {
      headers['Accept'] = 'text/event-stream'
      headers['anthropic-beta'] = 'messages-2023-12-15'
    } else if (config.type !== 'google' && config.type !== 'ollama') {
      // OpenAI-compatible SSE
      headers['Accept'] = 'text/event-stream'
      headers['Cache-Control'] = 'no-cache'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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

    const { model: resolvedModel, usage } = await parseProviderStream(
      config,
      reader,
      emit,
      providerId
    )

    emit('provider:done', {
      id: providerId,
      model: resolvedModel,
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
