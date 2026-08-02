import { describe, expect, it } from "vitest";
import { claudeCodeAdapter } from "../src/adapters/claude-code.js";
import { ALL_ADAPTERS, getAdapter } from "../src/adapters/index.js";

describe("claudeCodeAdapter", () => {
  it("exposes the model aliases ordered by cost", () => {
    const caps = claudeCodeAdapter.capabilities({ installed: true });
    expect(caps.models.map((m) => m.id)).toEqual(["haiku", "sonnet", "opus", "fable"]);
    const ranks = caps.models.map((m) => m.costRank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("builds an argv launch spec with model flag and positional prompt", () => {
    const spec = claudeCodeAdapter.launchSpec("fix the bug in a.ts", "sonnet");
    expect(spec.args).toEqual(["--model", "sonnet", "fix the bug in a.ts"]);
    expect(spec.binary.length).toBeGreaterThan(0);
  });

  it("is registered in the adapter index", () => {
    expect(getAdapter("claude-code")).toBe(claudeCodeAdapter);
    expect(ALL_ADAPTERS.length).toBe(1);
  });
});
