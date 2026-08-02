**What this changes**

**Why**

**Checklist**

- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] No emojis or em dashes, including in commit messages

**If this touches the scorer**

Paste `rightmodel bench` output from before and after. Say whether the golden set itself changed, since that changes what the accuracy number means.

Before:

```

```

After:

```

```

**If this adds an adapter**

- [ ] Flags verified against the tool's current `--help`, not from memory
- [ ] `launchSpec` returns an argv array, never a shell string
- [ ] Registered in `adapters/index.ts` and the `ALL_ADAPTERS.length` assertion updated
