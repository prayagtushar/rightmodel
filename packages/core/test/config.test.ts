import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_CONFIG, configDir, loadConfig, saveConfig } from "../src/config.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "swt-"));
  process.env.SWITCHTOWER_DIR = dir;
});

afterEach(() => {
  delete process.env.SWITCHTOWER_DIR;
  rmSync(dir, { recursive: true, force: true });
});

describe("config", () => {
  it("configDir honors SWITCHTOWER_DIR", () => {
    expect(configDir()).toBe(dir);
  });

  it("returns defaults when no file exists", () => {
    const { config, warning } = loadConfig();
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(warning).toBeUndefined();
  });

  it("default tiers map easy/medium/hard to haiku/sonnet/opus on claude-code", () => {
    expect(DEFAULT_CONFIG.tiers.easy).toEqual({ agent: "claude-code", model: "haiku" });
    expect(DEFAULT_CONFIG.tiers.medium).toEqual({ agent: "claude-code", model: "sonnet" });
    expect(DEFAULT_CONFIG.tiers.hard).toEqual({ agent: "claude-code", model: "opus" });
  });

  it("round-trips save and load", () => {
    const custom = structuredClone(DEFAULT_CONFIG);
    custom.tiers.easy.model = "sonnet";
    saveConfig(custom);
    expect(existsSync(join(dir, "config.json"))).toBe(true);
    expect(loadConfig().config.tiers.easy.model).toBe("sonnet");
  });

  it("falls back to defaults with a warning on corrupt json", () => {
    writeFileSync(join(dir, "config.json"), "{not json", "utf8");
    const { config, warning } = loadConfig();
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(warning).toMatch(/config/i);
  });

  it("fills missing tiers from defaults", () => {
    writeFileSync(join(dir, "config.json"), JSON.stringify({ mode: "heuristic", tiers: {} }), "utf8");
    const { config } = loadConfig();
    expect(config.tiers.hard.model).toBe("opus");
  });
});
