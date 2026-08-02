# Security Policy

## Reporting a vulnerability

Report security issues through GitHub's private vulnerability reporting on this repository, under the Security tab. Please do not open a public issue for a security problem.

Include what you did, what happened, and the versions of Switchtower, Node, and your operating system. Expect an initial response within seven days.

## What Switchtower does and does not do

This is relevant to assessing impact, so it is stated precisely:

- **No network calls.** Switchtower makes no outbound requests of its own. It has no telemetry, no update check, no analytics, and no accounts. `packages/core` has zero runtime dependencies.
- **No credentials.** Switchtower never reads, stores, or forwards API keys or auth tokens. The agent CLIs it launches bring their own authentication and handle it in their own process.
- **Local writes only.** The only files it writes are `config.json` and `decisions.jsonl`, in `$SWITCHTOWER_DIR`, or `~/.config/switchtower` on macOS and Linux, or `%APPDATA%\switchtower` on Windows.
- **It launches processes.** This is the core function. Switchtower spawns the agent CLI named in your config, using an argv array rather than a shell string, so task text is never interpreted by a shell.

## The decision log

`decisions.jsonl` stores a SHA-256 hash of each task plus the first 80 characters of its text. The preview is deliberately truncated so the log is useful for evaluating routing without becoming a full archive of your prompts. Delete the file at any time; it is regenerated as needed.

## Unsigned builds

The macOS and Windows installers are not code signed. macOS Gatekeeper and Windows SmartScreen will both warn on first launch. Verify you downloaded from the GitHub Releases page of this repository. If you would rather not run an unsigned binary, use the CLI from npm instead, which has no such distribution step.
