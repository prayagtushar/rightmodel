import { describe, expect, it } from "vitest";
import { GOLDEN } from "../src/golden.js";
import { formatBench, runBench } from "../src/bench.js";

describe("bench", () => {
  it("golden set has 60 cases, 20 per tier", () => {
    expect(GOLDEN).toHaveLength(60);
    for (const tier of ["easy", "medium", "hard"] as const) {
      expect(GOLDEN.filter((c) => c.tier === tier)).toHaveLength(20);
    }
  });

  it("reports totals that add up", () => {
    const r = runBench();
    expect(r.total).toBe(60);
    expect(r.correct).toBe(
      r.perTier.easy.correct + r.perTier.medium.correct + r.perTier.hard.correct
    );
    expect(r.accuracy).toBeCloseTo(r.correct / r.total, 5);
  });

  it("scores at least 70 percent on the golden set", () => {
    expect(runBench().accuracy).toBeGreaterThanOrEqual(0.7);
  });

  it("formats a plain text report", () => {
    const text = formatBench(runBench());
    expect(text).toContain("accuracy");
    expect(text).toContain("easy");
  });
});
