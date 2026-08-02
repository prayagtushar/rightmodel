# rightmodel

Routes each coding task to the cheapest capable model in the agent CLIs you already have.

Simple questions do not need your most expensive model, but reaching for it is the default because choosing is friction. RightModel scores a task's complexity with transparent heuristics, picks an agent and model, tells you why in one line, and launches the agent CLI.

RightModel calls no APIs and needs no keys. It drives the agent CLIs you already have installed, and they bring their own auth. For a Claude Code user on a subscription plan, routing small tasks to Haiku instead of Opus stretches the plan's usage limits. All data stays on your machine: no accounts, no telemetry, no network calls, and no runtime dependencies.

## Install

```
npm install -g rightmodel
```

Node 20 or newer. You also need at least one supported agent CLI installed. Today that is [Claude Code](https://github.com/anthropics/claude-code).

## Use it

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

The scorer reads the task text and collects weighted signals: prompt length, code blocks, stack traces, file and directory references, multi step language, ambition verbs versus scoped verbs, and question form. The summed score maps to a tier, and a user editable config maps tiers to an agent and model.

No model is involved in the decision, so it is instant and works offline.

Measured on the repo's 60 prompt golden set (20 per tier), the scorer routes 60/60 correctly. The heuristics were tuned against this same set, so treat that number as a consistency check, not a generalization claim; the set and the benchmark ship in the package so you can rerun both with `rightmodel bench`.

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

A corrupt config never crashes; it falls back to defaults with a warning.

## Library use

The package also exports the router, so you can use the decision without launching anything:

```ts
import { route, scoreTask } from "rightmodel";

scoreTask("What is a closure?");
// { tier: "easy", score: -5, confidence: 0.95, reason: "easy: scoped small task, short question", signals: [...] }

await route("refactor the auth module across src/auth.ts and src/session.ts");
// adds the configured agent and model, whether it is installed, and the launch spec
```

## Desktop app

There is also an Electron app built on this package, with a routing chip that updates as you type and pty terminal tabs. See the [repository](https://github.com/prayagtushar/rightmodel).

## License

MIT
