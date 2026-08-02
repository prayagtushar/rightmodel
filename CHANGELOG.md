# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `switchtower init` writes a default config file, so the tier map no longer has to be hand authored.
- `--help` and `--version`.
- `fable` in the Claude Code model registry, ranked above `opus` by cost.
- Validation of `--model` against the adapter's model list, with the valid names listed on rejection.
- An error banner in the desktop app for failures that previously only appeared in the console.
- A React error boundary, so a render error shows a message instead of an empty window.

### Fixed

- Reading the decision log no longer throws when a line is truncated by an interrupted write. `switchtower wrong` now works against a partially written log.
- The desktop onboarding rescan detects an agent CLI installed after the app started. Agent detection cached the resolved path for the lifetime of the process, so the button had no effect until restart.
- A failed process launch reports the reason instead of raising an uncaught exception.
- `--model` as the final argument reports an error instead of being silently ignored.
- The routing chip no longer shows a stale result when a slow response arrives after a newer one.
- Pre-attach terminal output is capped, so a tab that is never opened cannot grow memory without limit.
- `shell.openExternal` is restricted to http and https URLs.

### Changed

- The renderer imports its types from the core package rather than redeclaring them.

## [0.1.0] - 2026-07-10

### Added

- Routing core: heuristic scorer, tier config, JSONL decision log, Claude Code adapter, and CLI.
- Golden set benchmark over 60 labeled prompts, runnable with `switchtower bench`.
- Desktop app: live routing chip, model override, embedded pty terminal tabs, and onboarding.
- Playwright smoke test against a stub agent.
- Unsigned macOS dmg and Windows installer built by CI on tag push.
