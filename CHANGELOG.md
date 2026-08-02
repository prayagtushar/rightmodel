# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-03

First public release. The project was previously developed locally under the name Switchtower and was never published, so everything below is new to anyone outside the repository.

### Added

- Routing core: a heuristic scorer over the task text, a tier to agent and model config, a JSONL decision log, and a Claude Code adapter.
- CLI: `rightmodel "<task>"` routes and launches, `--dry-run` prints the decision only, `--model` overrides it, `init` writes a default config, `wrong` marks the last decision wrong, `bench` runs the benchmark, plus `--help` and `--version`.
- Golden set benchmark over 60 hand labeled prompts, 20 per tier, rerunnable with `rightmodel bench`.
- Desktop app: prompt bar with a routing chip that updates as you type, a dropdown to override the model before launching, pty terminal tabs for parallel sessions, a plain terminal, and an onboarding screen when no agent CLI is detected.
- `fable` in the Claude Code model registry, ranked above `opus` by cost.
- 45 core tests and a Playwright smoke test that drives the real Electron app against a stub agent.
- Continuous integration on Linux, macOS, and Windows.
- Unsigned macOS dmg and Windows installer, built by CI on tag push.

### Notes

- The published routing accuracy of 60/60 is measured against the same golden set the heuristics were tuned on. It is a consistency check, not a generalization claim. Both the set and the benchmark ship in the package.
- Builds are unsigned, so macOS and Windows both warn on first launch. The CLI has no such step.
- Configuration lives in `$RIGHTMODEL_DIR`, or `~/.config/rightmodel`, or `%APPDATA%\rightmodel` on Windows.
