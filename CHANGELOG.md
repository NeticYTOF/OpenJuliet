# Changelog

All notable changes to OpenJuliet are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.4] - 2024-07-28

### Added
- Command palette for quick access to all editor actions and tools
- Keyboard shortcut customization panel
- Fuzzy search across files, commands, and settings

### Changed
- Refined editor UI with smoother transitions and improved spacing
- Optimized rendering performance for large files
- Updated documentation to reflect all current features

### Fixed
- Minor visual alignment issues in the status bar
- Edge case where file watcher could trigger duplicate events
- Memory leak in long-running editor sessions

---

## [1.0.3] - 2024-06-15

### Added
- Workflow engine for automating repetitive tasks
- Task runner with support for parallel and sequential execution
- Plugin system with hook-based lifecycle management
- Comprehensive test suite with unit, integration, and e2e tests
- Test coverage reporting and CI integration

### Changed
- Refactored core event bus for better extensibility
- Improved error handling across all provider integrations

### Fixed
- Race condition in file save operations
- Incorrect line numbering in diff views

---

## [1.0.2] - 2024-05-01

### Added
- Real AI provider integrations (OpenAI, Anthropic, local models)
- Provider abstraction layer with pluggable backends
- Pull request creation and review system
- Inline code suggestions from AI providers
- Provider configuration UI

### Changed
- Restructured settings to support per-provider configuration
- Upgraded networking layer for streaming responses

### Fixed
- Timeout issues with large model responses
- Authentication token refresh edge cases

---

## [1.0.1] - 2024-03-20

### Added
- Built-in code editor with syntax highlighting
- Integrated terminal emulator
- Project-level documentation generator
- File explorer with tree view
- Tab-based multi-file editing

### Changed
- Migrated from monaco-editor to custom editor for better integration
- Improved startup time by 40%

### Fixed
- File encoding detection for UTF-8 and UTF-16 files
- Terminal resize handling on Windows

---

## [1.0.0] - 2024-02-01

### Added
- Initial public release of OpenJuliet
- Core application framework with extensible architecture
- Basic project management and file operations
- Command-line interface for headless operations
- Cross-platform support (Windows, macOS, Linux)

---

[1.0.4]: https://github.com/openjuliet/openjuliet/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/openjuliet/openjuliet/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/openjuliet/openjuliet/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/openjuliet/openjuliet/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/openjuliet/openjuliet/releases/tag/v1.0.0
