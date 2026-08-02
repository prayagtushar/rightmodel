import { appendFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DecisionLog, taskHash, taskPreview } from "../src/log.js";
import { scoreTask } from "../src/scorer.js";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "swt-log-"));
  process.env.SWITCHTOWER_DIR = dir;
});
afterEach(() => {
  delete process.env.SWITCHTOWER_DIR;
  rmSync(dir, { recursive: true, force: true });
});

describe("DecisionLog", () => {
  const target = { agent: "claude-code", model: "haiku" };

  it("hashes deterministically and previews first 80 chars", () => {
    expect(taskHash("abc")).toBe(taskHash("abc"));
    expect(taskHash("abc")).toHaveLength(16);
    expect(taskPreview("x".repeat(200))).toHaveLength(80);
  });

  it("appends decision, launch and override entries", () => {
    const log = new DecisionLog();
    const task = "What is a closure?";
    log.logDecision(task, scoreTask(task), target);
    log.logLaunch(task, target);
    log.logOverride(task, target, { agent: "claude-code", model: "opus" });
    const all = log.readAll();
    expect(all.map((e) => e.type)).toEqual(["decision", "launch", "override"]);
    expect(all[2].chosen?.model).toBe("opus");
  });

  it("lastDecision returns the latest decision entry, skipping launches", () => {
    const log = new DecisionLog();
    log.logDecision("task one", scoreTask("task one"), target);
    log.logLaunch("task one", target);
    expect(log.lastDecision()?.taskPreview).toBe("task one");
  });

  it("lastDecision is null on empty log", () => {
    expect(new DecisionLog().lastDecision()).toBeNull();
  });

  it("skips a corrupt line and still reads the entries around it", () => {
    const log = new DecisionLog();
    log.logDecision("task one", scoreTask("task one"), target);
    appendFileSync(join(dir, "decisions.jsonl"), '{"ts":"2026-01-01T00:00:00.000Z","ty\n');
    log.logDecision("task two", scoreTask("task two"), target);

    const all = log.readAll();
    expect(all).toHaveLength(2);
    expect(log.lastDecision()?.taskPreview).toBe("task two");
  });

  it("survives a truncated final line with no newline", () => {
    const log = new DecisionLog();
    log.logDecision("task one", scoreTask("task one"), target);
    appendFileSync(join(dir, "decisions.jsonl"), '{"ts":"2026-01-01T00:00:00.000Z","ty');

    expect(() => log.readAll()).not.toThrow();
    expect(log.readAll()).toHaveLength(1);
    expect(log.lastDecision()?.taskPreview).toBe("task one");
  });
});
