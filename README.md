# Switchtower

A desktop terminal for AI coding agents that routes every task to the cheapest capable model.

You type a task. Switchtower scores its complexity with transparent heuristics, proposes an agent and model with a one line reason, and launches the agent CLI in an embedded terminal when you hit Enter. Simple questions do not need your most expensive model; Switchtower makes that decision visible and overridable instead of leaving it to habit.

Switchtower calls no APIs and needs no keys. It drives the agent CLIs you already have installed, and they bring their own auth. For a Claude Code user on a subscription plan, routing small tasks to Haiku instead of Opus stretches the plan's usage limits. All data stays on your machine: no accounts, no telemetry.

## How routing works

The scorer reads the task text and collects weighted signals:

- prompt length, code blocks, stack traces
- file and directory references, and how many
- multi step language ("then", numbered steps)
- ambition verbs (refactor, migrate, redesign) versus scoped verbs (rename, explain, typo)
- question form

The summed score maps to a tier: easy, medium, or hard. A user editable config maps tiers to an agent and model. The default for Claude Code is easy to Haiku, medium to Sonnet, hard to Opus. The decision is deterministic and explained, for example:

```
tier       hard (score 8, confidence 0.81)
reason     hard: many file references, ambition verb, multi-step language
agent      claude-code
model      opus
```

Every decision, launch, and override is appended to a local JSONL log. Overrides are labeled disagreements, which makes the log training data for a learned router later.

Measured on the repo's 60 prompt golden set (20 per tier), the scorer routes 60/60 correctly. The heuristics were tuned against this same set, so treat that number as a consistency check, not a generalization claim; the set and the benchmark ship in the repo so you can rerun both.

## Supported agents

- Claude Code (v1): model selection across haiku, sonnet, opus
- opencode and gemini-cli are next; the adapter interface is three functions (detect, capabilities, launchSpec)

Once an agent launches, its own interactive UI owns the session. Switchtower never parses or rewrites agent output, which is why authentication, tool prompts, and rendering all behave exactly as they do in a plain terminal.

## Repository layout

```
packages/core    routing brain: scorer, config, decision log, adapters, CLI, benchmark
apps/desktop     Electron shell: prompt bar, routing chip with override, pty terminal tabs
```

The core package has no Electron dependency and works from any terminal:

```
switchtower "fix the failing test in test_auth.py"   route and launch
switchtower --dry-run "..."                          print the decision only
switchtower --model opus "..."                       override the model (logged)
switchtower wrong                                    mark the last decision wrong (logged)
switchtower bench                                    run the golden set benchmark
```

## Getting started

Prerequisites: Node 20+, pnpm.

```
pnpm install
pnpm -r test          run all tests
pnpm -F switchtower build
node packages/core/dist/cli.js --dry-run "What is a closure?"
```

Desktop app in development mode:

```
pnpm -F @switchtower/desktop dev
```

Desktop smoke test (launches the real app against a stub agent):

```
pnpm -F @switchtower/desktop test
```

Build the installer:

```
pnpm -F @switchtower/desktop dist:mac
```

Installers for macOS (dmg) and Windows (nsis) are built per platform by the release workflow on tag push. Builds are currently unsigned, so both operating systems will warn on first launch; signing is planned once adoption justifies the certificates.

## Configuration

`~/.config/switchtower/config.json` (or `%APPDATA%\switchtower` on Windows, or `$SWITCHTOWER_DIR` if set):

```json
{
  "mode": "heuristic",
  "tiers": {
    "easy": { "agent": "claude-code", "model": "haiku" },
    "medium": { "agent": "claude-code", "model": "sonnet" },
    "hard": { "agent": "claude-code", "model": "opus" }
  }
}
```

A corrupt config never crashes the app; it falls back to defaults with a warning. `mode: "judge"` is reserved in the schema for a planned mode where a fast model classifies ambiguous prompts.

## Status

- [x] Routing core: scorer, tier config, decision log, Claude Code adapter, CLI (33 tests)
- [x] Golden set benchmark: 60/60 on the tuning set, rerunnable via `switchtower bench`
- [x] Desktop app: live routing chip, override dropdown, embedded pty terminal tabs, onboarding
- [x] Playwright smoke test against a stub agent
- [x] Unsigned macOS dmg build; Windows nsis via CI
- [ ] opencode and gemini-cli adapters
- [ ] Judge mode for ambiguous prompts
- [ ] Learned router trained on the decision log

## Stack

| Layer | Choice |
|---|---|
| Routing core | TypeScript, zero runtime dependencies |
| Desktop shell | Electron, React, xterm.js, node-pty |
| Build | pnpm workspaces, electron-vite, electron-builder |
| Tests | vitest (core), Playwright (desktop smoke) |

## License

MIT. See [LICENSE](LICENSE).
