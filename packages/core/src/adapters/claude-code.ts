import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { findOnPath } from "../path-lookup.js";
import type { AgentAdapter, AgentCapabilities, AgentDetection, LaunchSpec } from "../types.js";

const execFileAsync = promisify(execFile);

let cachedPath: string | null | undefined;

export const claudeCodeAdapter: AgentAdapter = {
  id: "claude-code",
  displayName: "Claude Code",
  binary: "claude",
  installHint: "npm install -g @anthropic-ai/claude-code",

  async detect(): Promise<AgentDetection> {
    if (cachedPath === undefined) cachedPath = findOnPath(this.binary);
    if (!cachedPath) return { installed: false };
    try {
      const { stdout } = await execFileAsync(cachedPath, ["--version"], { timeout: 10000 });
      const version = stdout.trim().split(/\s+/)[0];
      return { installed: true, path: cachedPath, version };
    } catch {
      return { installed: true, path: cachedPath };
    }
  },

  capabilities(_detection: AgentDetection): AgentCapabilities {
    return {
      models: [
        { id: "haiku", label: "Haiku", costRank: 1 },
        { id: "sonnet", label: "Sonnet", costRank: 2 },
        { id: "opus", label: "Opus", costRank: 3 },
      ],
    };
  },

  launchSpec(task: string, model: string): LaunchSpec {
    const binary = cachedPath ?? findOnPath(this.binary) ?? this.binary;
    return { binary, args: ["--model", model, task] };
  },
};

export function resetDetectionCache(): void {
  cachedPath = undefined;
}
