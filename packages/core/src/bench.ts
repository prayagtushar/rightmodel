import { GOLDEN, type GoldenCase } from "./golden.js";
import { scoreTask } from "./scorer.js";
import type { Tier } from "./types.js";

const TIERS: Tier[] = ["easy", "medium", "hard"];

export interface BenchResult {
  total: number;
  correct: number;
  accuracy: number;
  perTier: Record<Tier, { total: number; correct: number }>;
  confusion: Record<Tier, Record<Tier, number>>;
  misses: { task: string; expected: Tier; got: Tier }[];
}

export function runBench(cases: GoldenCase[] = GOLDEN): BenchResult {
  const perTier = Object.fromEntries(
    TIERS.map((t) => [t, { total: 0, correct: 0 }])
  ) as BenchResult["perTier"];
  const confusion = Object.fromEntries(
    TIERS.map((t) => [t, Object.fromEntries(TIERS.map((u) => [u, 0]))])
  ) as BenchResult["confusion"];
  const misses: BenchResult["misses"] = [];

  for (const c of cases) {
    const got = scoreTask(c.task).tier;
    perTier[c.tier].total += 1;
    confusion[c.tier][got] += 1;
    if (got === c.tier) perTier[c.tier].correct += 1;
    else misses.push({ task: c.task, expected: c.tier, got });
  }

  const total = cases.length;
  const correct = TIERS.reduce((sum, t) => sum + perTier[t].correct, 0);
  return {
    total,
    correct,
    accuracy: total === 0 ? 0 : correct / total,
    perTier,
    confusion,
    misses,
  };
}

export function formatBench(r: BenchResult): string {
  const lines = [
    `routing accuracy: ${(r.accuracy * 100).toFixed(1)}% (${r.correct}/${r.total})`,
    "",
    "per tier:",
    ...TIERS.map((t) => `  ${t.padEnd(6)} ${r.perTier[t].correct}/${r.perTier[t].total}`),
    "",
    "confusion (rows expected, columns predicted):",
    `         ${TIERS.map((t) => t.padEnd(7)).join("")}`,
    ...TIERS.map(
      (t) => `  ${t.padEnd(7)}${TIERS.map((u) => String(r.confusion[t][u]).padEnd(7)).join("")}`
    ),
  ];
  if (r.misses.length > 0) {
    lines.push("", "misses:");
    for (const m of r.misses) {
      lines.push(`  [${m.expected} -> ${m.got}] ${m.task.replace(/\s+/g, " ").slice(0, 70)}`);
    }
  }
  return lines.join("\n");
}
