# Architecture

RightModel has two pieces. `packages/core` decides which model a task should go to. `apps/desktop` is an Electron shell that runs that decision in an embedded terminal. The core has no Electron dependency and works on its own from any terminal.

## Data flow

```
task text
  -> scoreTask()        weighted signals, summed to a tier
  -> loadConfig()       tier map lookup, giving an agent and model
  -> adapter.detect()   is that agent on PATH
  -> adapter.launchSpec() binary plus argv array
  -> spawn              the agent CLI owns the session from here
```

A log line is written at decision, launch, and override.

## The scorer

`packages/core/src/scorer.ts` collects weighted signals from the task text and sums them. No model is involved, so it is fast enough to run on every keystroke, which is what makes the desktop app's live routing chip feel like typeahead.

| Signal | Weight |
|---|---|
| Prompt over 120 words | +3 |
| Prompt over 50 words | +2 |
| Code block | +2 |
| Stack trace | +1 |
| Three or more file or directory references | +3 |
| One or two file references | +1 |
| Three or more numbered steps | +3 |
| Two numbered steps, or multi step language | +2 |
| Ambition verb in the first five words | +3 |
| Ambition verb mentioned later | +1 |
| Action verb | +2 |
| Three or more distinct verbs | +1 |
| Scoped small task language | -3 |
| Question form, 25 words or fewer | -2 |

Thresholds: 5 or above is hard, 2 or above is medium, below that is easy.

Ambition verbs (refactor, migrate, redesign, rewrite) only score the full +3 in the first five words. A late mention such as "after the token refactor" describes context rather than the request, and scores +1.

Confidence is distance from the nearest tier boundary, scaled and capped at 0.95. It is a measure of how close the call was, not a probability.

### On the benchmark number

`rightmodel bench` runs the scorer against the 60 labeled prompts in `packages/core/src/golden.ts` and reports 60 out of 60. The heuristics were tuned against that same set, so it is a consistency check, not evidence of generalization. Both the set and the benchmark ship in the repo so the number can be re-derived and argued with.

## Adapters

An adapter is the entire integration surface for an agent CLI. `AgentAdapter` in `packages/core/src/types.ts` is three functions:

- `detect()` looks for the binary on PATH and reads its version.
- `capabilities(detection)` returns the available models, each with a `costRank` ordinal where 1 is cheapest.
- `launchSpec(task, model)` returns a binary and an argv array.

`costRank` is deliberately an ordinal rather than a price. The audience is people on subscription plans trying to stretch usage limits, not people paying per token, so relative order is the part that transfers.

`launchSpec` returns an argv array, never a shell string. Nothing in a task ever reaches a shell, which is both why quoting cannot break on Windows and why task text cannot be interpreted as a command.

`packages/core/src/adapters/claude-code.ts` is the reference implementation, at roughly 45 lines.

## Not parsing agent output

Once an agent launches, its own interactive UI owns the session. RightModel never reads, rewrites, or interprets the stream. That is the reason authentication flows, tool permission prompts, and rendering all behave exactly as they do in a plain terminal: there is nothing in between. It also means RightModel cannot break when an agent CLI changes its output format, only when it changes its flags, which is contained in the adapter.

## Configuration

`loadConfig()` reads `config.json` from `$RIGHTMODEL_DIR`, or `~/.config/rightmodel`, or `%APPDATA%\rightmodel` on Windows. Every field is validated individually and falls back to the default, so a hand edited or truncated config degrades to defaults with a warning rather than crashing. `rightmodel init` writes the default file.

`mode` accepts `heuristic` or `judge`. Only `heuristic` is implemented. `judge` is reserved in the schema for a mode where a fast model classifies prompts the heuristics find ambiguous.

## The decision log

`decisions.jsonl` is append only, one JSON object per line, in the same directory as the config. Three entry types: `decision`, `launch`, and `override`.

Each line stores a SHA-256 hash of the task and its first 80 characters. The truncation is deliberate: enough to evaluate a routing decision after the fact, not enough to become an archive of everything you have asked an agent to do.

An `override` records both what the router proposed and what the user actually chose. That makes the log labeled disagreement data, which is what a learned router would need later.

Reading skips lines that fail to parse. An interrupted append leaves a partial line, and one bad line should not make the whole log unreadable.

The desktop app does not log during live typeahead routing, since that would write an entry per debounce. It logs the decision, any override, and the launch together at launch time. The CLI logs on every run.

## Desktop app

The main process owns node-pty sessions, agent detection, the config, and the log. The renderer is React with xterm.js and talks to the main process over a preload bridge with `contextIsolation` on and `nodeIntegration` off.

Terminal output produced between spawning a process and xterm mounting is buffered in the main process and replayed on attach, so nothing is lost in that window. The buffer is capped, since a tab the user never opens would otherwise grow without limit.

`apps/desktop` is CommonJS on purpose, with no `"type": "module"`, so electron-vite emits its default CJS bundles. The core package stays pure ESM and is bundled into the main process via `externalizeDepsPlugin({ exclude: ["rightmodel"] })`. node-pty is rebuilt for the Electron ABI by the desktop package's postinstall.

## What is deliberately absent

No network calls, no telemetry, no accounts, no API keys, and no runtime dependencies in the core package. RightModel picks a `--model` flag for a CLI you already installed and authenticated. That is the whole product, and keeping it that small is what makes the privacy claim checkable rather than a promise.
