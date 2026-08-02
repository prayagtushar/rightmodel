# Contributing to RightModel

Thanks for taking a look. Bug reports, adapters for new agent CLIs, and golden set additions are all welcome.

## Setup

Requirements: Node 20 or newer, and pnpm.

```
git clone https://github.com/prayagtushar/rightmodel.git
cd rightmodel
pnpm install
```

pnpm 10 blocks package build scripts by default. The root `package.json` allowlists `electron`, `esbuild`, and `node-pty` under `pnpm.onlyBuiltDependencies`, so `pnpm install` handles the native rebuild of node-pty for the Electron ABI.

## Layout

```
packages/core    routing brain: scorer, config, decision log, adapters, CLI, benchmark
apps/desktop     Electron shell: prompt bar, routing chip, pty terminal tabs
```

`packages/core` has no Electron dependency and no runtime dependencies at all. Keep it that way: it is what ships to npm, and its zero dependency footprint is a feature.

## Running things

```
pnpm test                                  everything
pnpm -F rightmodel test                   core: typecheck plus 44 vitest tests
pnpm -F @rightmodel/desktop typecheck     desktop types
pnpm -F @rightmodel/desktop test          desktop: builds, then Playwright against a stub agent
pnpm lint                                  Biome check
pnpm format                                Biome write
```

Local development:

```
pnpm -F rightmodel build
node packages/core/dist/cli.js --dry-run "What is a closure?"
pnpm -F @rightmodel/desktop dev
```

`RIGHTMODEL_DIR` overrides the config and log directory. Use it to avoid touching your real config while testing:

```
RIGHTMODEL_DIR=/tmp/swt node packages/core/dist/cli.js init
```

## Adding an agent adapter

This is the most useful contribution right now. An adapter is three functions, defined by `AgentAdapter` in `packages/core/src/types.ts`:

- `detect()` reports whether the binary is on PATH and which version it is.
- `capabilities(detection)` returns the models it offers, each with a `costRank` ordinal where 1 is cheapest.
- `launchSpec(task, model)` returns a binary plus an argv array.

`launchSpec` must return an argv array, never a shell string. That is what keeps quoting from breaking on Windows.

To add one:

1. Copy the shape of `packages/core/src/adapters/claude-code.ts`.
2. Register it in `packages/core/src/adapters/index.ts`.
3. Update the `ALL_ADAPTERS.length` assertion in `packages/core/test/claude-code.test.ts`.
4. Add tests covering detection, the model list ordering, and the argv shape.

Verify the CLI flags against the tool's current `--help` output rather than from memory. Agent CLIs change flags between releases, and a stale alias silently routes to the wrong model.

## Changing the scorer

The scorer in `packages/core/src/scorer.ts` is tuned against the 60 prompt golden set in `packages/core/src/golden.ts`. Run `node packages/core/dist/cli.js bench` before and after any change and report both numbers in the pull request.

Be aware that the published accuracy is a consistency check, not a generalization claim, because the heuristics were tuned on that same set. If you add prompts to the golden set, say so explicitly, since it changes what the number means.

## Style

- TypeScript throughout, `strict` on. No `any`.
- No emojis, no em dashes, anywhere in the repo including commit messages.
- The README states what is built and measured, never what is planned. Numbers in it are measured, not estimated.

## Releasing

Versions are not automated. To cut a release, update the `version` field in both `packages/core/package.json` and `apps/desktop/package.json`, update `CHANGELOG.md`, then tag:

```
git tag v0.2.0
git push origin v0.2.0
```

The tag triggers `.github/workflows/release.yml`, which runs the test suites, builds the macOS dmg and Windows installer, and attaches them to a **draft** release. Review it and publish when it looks right.

Publishing the CLI to npm is a separate manual step:

```
pnpm -F rightmodel build
cd packages/core
npm publish --dry-run    # check the tarball contains dist/ and nothing else
npm publish
```

Keep the git tag and both package versions in sync by hand.
