# Security Policy

## Supported Versions

OpenJuliet is currently in active development. The following versions receive security updates:

| Version | Supported |
|---|---|
| 1.0.x (latest) | ✅ Actively supported |
| < 1.0 | ❌ Not supported |

We recommend always using the latest release. Security updates are delivered as part of regular releases and patch releases.

---

## Reporting a Vulnerability

We take the security of OpenJuliet seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT File a Public Issue

Please **do not** report security vulnerabilities through public GitHub issues, discussions, or pull requests. Public disclosure of a vulnerability could put all users at risk.

### 2. Submit a Report

Send an email to the project maintainer at **NeticYTOF** via GitHub's private vulnerability reporting:

- **Preferred**: Use [GitHub's Private Vulnerability Reporting](https://github.com/NeticYTOF/OpenJuliet/security/advisories/new)
- **Alternative**: Open a [security advisory](https://github.com/NeticYTOF/OpenJuliet/security) directly on the repository

### 3. What to Include

Please include the following information in your report:

- **Type of vulnerability** (e.g., remote code execution, XSS, privilege escalation, data exposure)
- **Affected versions** — Which versions of OpenJuliet are affected
- **Steps to reproduce** — Detailed, minimal steps to reproduce the vulnerability
- **Impact** — What a successful exploit could allow an attacker to do
- **Suggested fix** — If you have a proposed fix, include it (optional but appreciated)

### 4. Response Timeline

| Timeframe | Activity |
|---|---|
| Within 48 hours | Initial acknowledgment of your report |
| Within 5 business days | Assessment and initial triage |
| Within 30 days | Patch release or detailed remediation plan |

We will keep you informed of the progress throughout the process.

---

## Security Practices

### Code Security

- **TypeScript strict mode** — Full type safety across the codebase.
- **ESLint security rules** — Warnings for dangerous patterns (`no-eval`, `no-implied-eval`, etc.).
- **Dependency scanning** — `npm audit` runs as part of the CI pipeline to detect known vulnerabilities in dependencies.
- **Dependabot** — Enabled on the repository for automated dependency update PRs.

### Electron Security

| Practice | Implementation |
|---|---|
| **Context Isolation** | `contextIsolation: true` — Renderer has no direct Node.js access |
| **Node Integration** | `nodeIntegration: false` — No `require()` in renderer |
| **Web Security** | `webSecurity: !is.dev` — Strict CORS in production |
| **Sandbox** | Optional Docker-based sandbox for command execution |
| **External Links** | Routed through `shell.openExternal` — never loaded in Electron |
| **Window Creation** | Denied via `setWindowOpenHandler` |

### Data Security

- **Local storage**: All data (settings, tokens, task history, logs) is stored locally in a SQLite database on your machine.
- **API keys**: Provider API keys and GitHub tokens are stored in plaintext in the local SQLite database.
- **Network**: Communication with AI providers and GitHub uses HTTPS.
- **No telemetry**: OpenJuliet does not collect usage statistics, analytics, or crash reports.

### Recommended Security Practices for Users

1. **Use a Personal Access Token (PAT)** with the minimum required scopes (`repo` is sufficient for most operations).
2. **Rotate API keys** periodically, especially if you suspect they may have been compromised.
3. **Secure your machine** — Since API keys are stored locally, anyone with access to your user account can read them.
4. **Enable Docker sandbox** for executing untrusted code tasks (go to Settings → Execution → Sandbox).
5. **Keep updated** — Always use the latest version of OpenJuliet.

---

## Known Security Considerations

### API Key Storage

API keys and GitHub tokens are currently stored in **plaintext** in the SQLite database (`openjuliet.db`). This is by design to allow offline access and easy configuration, but it means:

- Anyone with filesystem access to your user data directory can read your keys.
- We recommend using a machine with appropriate filesystem permissions.
- Future versions may add encryption via Electron's `safeStorage` API.

### Code Execution

OpenJuliet executes shell commands during the implementation and testing stages. When **Docker sandbox** is enabled:

- Commands run in ephemeral containers with read-write access only to the project directory.
- Without Docker sandbox, commands run with the same privileges as the OpenJuliet process.
- Always review the generated code before allowing execution if security is a concern.

### Network Communication

- All communication with GitHub is over HTTPS via Octokit.
- All communication with AI providers is over HTTPS via the Fetch API.
- Local providers (Ollama, LM Studio, vLLM) communicate over localhost HTTP — ensure these services are not exposed to the network.

---

## Security Vulnerability Disclosure Program

We currently do not operate a formal bug bounty program. However, we deeply appreciate and will publicly acknowledge responsible security disclosures (with your permission) in our release notes.

### Safe Harbor

We consider the following activities as authorised research:

- Testing with your own accounts and repositories.
- Reporting vulnerabilities through the proper channels as described above.
- Good-faith testing that does not harm users, disrupt services, or access data beyond your own.

We will not take legal action against researchers who follow this policy.

---

## Dependency Security

We use the following tools to maintain dependency security:

1. **`npm audit`** — Checks for known vulnerabilities in the dependency tree.
2. **Dependabot** — Automated PRs for dependency updates.
3. **`package-lock.json`** — Locked dependency versions for reproducible builds.
4. **Minimal dependencies** — We keep the dependency tree as small as practical.

### Reporting a Vulnerability in a Dependency

If you discover a vulnerability in one of our dependencies:

1. Check if the dependency has already been updated by checking Dependabot PRs.
2. If not, follow the reporting process above.
3. In your report, specify which dependency and version is affected.

---

## Security Contacts

- **Maintainer**: [NeticYTOF](https://github.com/NeticYTOF) (via GitHub)
- **Security Advisories**: https://github.com/NeticYTOF/OpenJuliet/security/advisories
- **Email**: Use GitHub's private vulnerability reporting system

---

## Changelog

| Date | Change |
|---|---|
| July 2025 | Initial security policy established |
