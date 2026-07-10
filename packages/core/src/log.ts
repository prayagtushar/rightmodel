import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { configDir } from "./config.js";
import type { LogEntry, ScoreResult, TierTarget } from "./types.js";

export function taskHash(task: string): string {
  return createHash("sha256").update(task).digest("hex").slice(0, 16);
}

export function taskPreview(task: string): string {
  return task.replace(/\s+/g, " ").slice(0, 80);
}

export class DecisionLog {
  private get path(): string {
    return join(configDir(), "decisions.jsonl");
  }

  private append(entry: LogEntry): void {
    mkdirSync(configDir(), { recursive: true });
    appendFileSync(this.path, JSON.stringify(entry) + "\n", "utf8");
  }

  private base(task: string): Pick<LogEntry, "ts" | "taskHash" | "taskPreview"> {
    return {
      ts: new Date().toISOString(),
      taskHash: taskHash(task),
      taskPreview: taskPreview(task),
    };
  }

  logDecision(task: string, result: ScoreResult, proposed: TierTarget): void {
    this.append({
      ...this.base(task),
      type: "decision",
      tier: result.tier,
      score: result.score,
      confidence: result.confidence,
      signals: result.signals.map((s) => s.name),
      proposed,
    });
  }

  logLaunch(task: string, chosen: TierTarget): void {
    this.append({ ...this.base(task), type: "launch", chosen });
  }

  logOverride(task: string, proposed: TierTarget, chosen: TierTarget): void {
    this.append({ ...this.base(task), type: "override", proposed, chosen });
  }

  readAll(): LogEntry[] {
    if (!existsSync(this.path)) return [];
    return readFileSync(this.path, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as LogEntry);
  }

  lastDecision(): LogEntry | null {
    const decisions = this.readAll().filter((e) => e.type === "decision");
    return decisions.length > 0 ? decisions[decisions.length - 1] : null;
  }
}
