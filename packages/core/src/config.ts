import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { RightModelConfig, Tier, TierTarget } from "./types.js";

export const DEFAULT_CONFIG: RightModelConfig = {
  mode: "heuristic",
  tiers: {
    easy: { agent: "claude-code", model: "haiku" },
    medium: { agent: "claude-code", model: "sonnet" },
    hard: { agent: "claude-code", model: "opus" },
  },
};

export function configDir(): string {
  if (process.env.RIGHTMODEL_DIR) return process.env.RIGHTMODEL_DIR;
  if (process.platform === "win32" && process.env.APPDATA) {
    return join(process.env.APPDATA, "rightmodel");
  }
  return join(homedir(), ".config", "rightmodel");
}

function configPath(): string {
  return join(configDir(), "config.json");
}

export function loadConfig(): { config: RightModelConfig; warning?: string } {
  const path = configPath();
  if (!existsSync(path)) return { config: structuredClone(DEFAULT_CONFIG) };
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<RightModelConfig>;
    const tiers = {} as Record<Tier, TierTarget>;
    for (const tier of ["easy", "medium", "hard"] as const) {
      const t = raw.tiers?.[tier];
      tiers[tier] =
        t && typeof t.agent === "string" && typeof t.model === "string"
          ? { agent: t.agent, model: t.model, ...(t.effort ? { effort: t.effort } : {}) }
          : structuredClone(DEFAULT_CONFIG.tiers[tier]);
    }
    const mode = raw.mode === "judge" ? "judge" : "heuristic";
    return { config: { mode, tiers } };
  } catch {
    return {
      config: structuredClone(DEFAULT_CONFIG),
      warning: "config.json was unreadable, using defaults",
    };
  }
}

export function saveConfig(config: RightModelConfig): void {
  mkdirSync(configDir(), { recursive: true });
  writeFileSync(configPath(), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
