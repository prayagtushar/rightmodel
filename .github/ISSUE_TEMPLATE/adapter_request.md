---
name: Agent adapter request
about: Ask for support for another agent CLI
labels: adapter
---

**Which agent CLI**

Name, homepage, and install command.

**Binary name on PATH**

**Version output**

What `<binary> --version` prints.

**How it selects a model**

The flag and the accepted values, copied from the tool's current `--help` output rather than from memory. Include the relevant lines:

```

```

**How it starts an interactive session with a task pre-filled**

The exact invocation, as an argv list rather than a shell string.

**Are you willing to open a pull request?**

The adapter interface is three functions and `packages/core/src/adapters/claude-code.ts` is a complete worked example. See CONTRIBUTING.md.
