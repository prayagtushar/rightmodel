import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/config.js";
import { DecisionLog } from "../src/log.js";
import { route } from "../src/router.js";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "swt-router-"));
  process.env.RIGHTMODEL_DIR = dir;
});
afterEach(() => {
  delete process.env.RIGHTMODEL_DIR;
  rmSync(dir, { recursive: true, force: true });
});

describe("route", () => {
  it("maps an easy task to the easy tier target", async () => {
    const d = await route("What is a closure?", { log: false });
    expect(d.tier).toBe("easy");
    expect(d.target).toEqual(DEFAULT_CONFIG.tiers.easy);
  });

  it("builds a launch spec when the agent is installed", async () => {
    const d = await route("What is a closure?", { log: false });
    if (d.agentInstalled) {
      expect(d.launch?.args).toContain("--model");
      expect(d.launch?.args).toContain(d.target.model);
    } else {
      expect(d.launch).toBeNull();
    }
  });

  it("returns null launch for an unknown agent id", async () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.tiers.easy.agent = "no-such-agent";
    const d = await route("What is a closure?", { config, log: false });
    expect(d.agentInstalled).toBe(false);
    expect(d.launch).toBeNull();
  });

  it("logs a decision entry by default", async () => {
    await route("What is a closure?");
    const last = new DecisionLog().lastDecision();
    expect(last?.taskPreview).toBe("What is a closure?");
    expect(last?.proposed).toEqual(DEFAULT_CONFIG.tiers.easy);
  });
});
