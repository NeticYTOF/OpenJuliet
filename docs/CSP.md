# Content Security Policy (CSP)

OpenJuliet uses a strict Content Security Policy to protect users from XSS and data injection attacks.

## Current Policy (Renderer)

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' https://api.github.com https://*.githubusercontent.com wss://localhost:*;
```

## Provider API Endpoints

When AI providers are configured, the CSP must allow connections to their API endpoints:

- **OpenAI**: `https://api.openai.com`
- **Anthropic**: `https://api.anthropic.com`
- **Google**: `https://generativelanguage.googleapis.com`
- **OpenRouter**: `https://openrouter.ai`
- **Ollama**: `http://localhost:11434`
- **LM Studio**: `http://localhost:1234`
- **vLLM**: Configured by user

These are set dynamically at runtime via IPC from the main process.

## Update Strategy

When adding new external service integrations, add the relevant domain to `connect-src` in `src/renderer/index.html`.

## Reporting

CSP violations are logged via the `securitypolicyviolation` event and sent to the error logger.
