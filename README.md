# RightModel

Routes each coding task to the cheapest capable model in the agent CLIs you already have.

Simple questions do not need your most expensive model, but reaching for it is the default because choosing is friction. RightModel scores a task's complexity with transparent heuristics, picks an agent and model, tells you why in one line, and launches the agent CLI. The decision is visible and overridable instead of habitual.

RightModel calls no APIs and needs no keys. It drives the agent CLIs you already have installed, and they bring their own auth. For a Claude Code user on a subscription plan, routing small tasks to Haiku instead of Opus stretches the plan's usage limits. All data stays on your machine: no accounts, no telemetry.

## Install

```
npm install -g rightmodel
```

Node 20 or newer. Zero runtime dependencies.

## Use it

Prefix any task with `rightmodel` and it picks the model:

```
rightmodel "fix the failing test in test_auth.py"
```

Add `--dry-run` to see the decision without launching anything:

```
$ rightmodel --dry-run "What is a closure?"
tier       easy (score -5, confidence 0.95)
reason     easy: scoped small task, short question
agent      claude-code
model      haiku
command    claude --model haiku What is a closure?
```

```
$ rightmodel --dry-run "refactor the auth module across src/auth.ts and src/session.ts then update the tests"
tier       hard (score 10, confidence 0.95)
reason     hard: many file references, ambition verb, multi-step language
agent      claude-code
model      opus
command    claude --model opus refactor the auth module across src/auth.ts and src/session.ts then update the tests
```

Everything else:

```
rightmodel init                       write a default config file
rightmodel --model opus "..."         override the model, logged as a disagreement
rightmodel wrong                      mark the last decision wrong, also logged
rightmodel bench                      run the golden set benchmark
rightmodel --help
```

## How routing works

The scorer reads the task text and collects weighted signals:

- prompt length, code blocks, stack traces
- file and directory references, and how many
- multi step language ("then", numbered steps)
- ambition verbs (refactor, migrate, redesign) versus scoped verbs (rename, explain, typo)
- question form

The summed score maps to a tier: easy, medium, or hard. A user editable config maps tiers to an agent and model. The default for Claude Code is easy to Haiku, medium to Sonnet, hard to Opus.

No model is involved in the decision, so it is fast enough to run on every keystroke, and it works offline.

Every decision, launch, and override is appended to a local JSONL log. Overrides are labeled disagreements, which makes the log training data for a learned router later.

Measured on the repo's 60 prompt golden set (20 per tier), the scorer routes 60/60 correctly. The heuristics were tuned against this same set, so treat that number as a consistency check, not a generalization claim; the set and the benchmark ship in the repo so you can rerun both.

`docs/architecture.md` documents the signal weights, the adapter interface, and the log format.

## Configuration

`rightmodel init` writes the default config to `~/.config/rightmodel/config.json` (or `%APPDATA%\rightmodel` on Windows, or `$RIGHTMODEL_DIR` if set):

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

## Supported agents

- Claude Code: model selection across haiku, sonnet, opus, and fable
- opencode and gemini-cli are next; the adapter interface is three functions (detect, capabilities, launchSpec)

Once an agent launches, its own interactive UI owns the session. RightModel never parses or rewrites agent output, which is why authentication, tool prompts, and rendering all behave exactly as they do in a plain terminal.

Adding an agent is a small, self contained contribution. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Desktop app

There is also an Electron app: the same router behind a prompt bar, with a routing chip that updates as you type, a dropdown to override the model before launching, and pty terminal tabs for parallel sessions.

Installers for macOS (dmg) and Windows are attached to each [release](https://github.com/prayagtushar/rightmodel/releases). Builds are currently unsigned, so both operating systems will warn on first launch. On macOS, right click the app and choose Open the first time. Signing is not planned until adoption justifies the certificates. If you would rather not run an unsigned binary, the CLI above does the same routing.

Run it from source:

```
pnpm -F @rightmodel/desktop dev
```

## Repository layout

```
packages/core    routing brain: scorer, config, decision log, adapters, CLI, benchmark
apps/desktop     Electron shell: prompt bar, routing chip with override, pty terminal tabs
```

The core package has no Electron dependency and no runtime dependencies.

## Development

Requires Node 20 or newer, and pnpm.

```
pnpm install
pnpm test            all suites
pnpm lint
pnpm -F rightmodel build
node packages/core/dist/cli.js --dry-run "What is a closure?"
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

## Status

- [x] Routing core: scorer, tier config, decision log, Claude Code adapter, CLI (44 tests)
- [x] Golden set benchmark: 60/60 on the tuning set, rerunnable via `rightmodel bench`
- [x] Desktop app: live routing chip, override dropdown, embedded pty terminal tabs, onboarding
- [x] Playwright smoke test against a stub agent
- [x] Unsigned macOS dmg and Windows installer via CI
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
