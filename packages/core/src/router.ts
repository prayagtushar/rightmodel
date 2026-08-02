import { getAdapter } from "./adapters/index.js";
import { loadConfig } from "./config.js";
import { DecisionLog } from "./log.js";
import { scoreTask } from "./scorer.js";
import type { LaunchSpec, RightModelConfig, RouteDecision } from "./types.js";

export interface RouteOptions {
  config?: RightModelConfig;
  log?: boolean;
}

export async function route(task: string, opts: RouteOptions = {}): Promise<RouteDecision> {
  const config = opts.config ?? loadConfig().config;
  const result = scoreTask(task);
  const target = config.tiers[result.tier];
  const adapter = getAdapter(target.agent);

  let agentInstalled = false;
  let launch: LaunchSpec | null = null;
  if (adapter) {
    const detection = await adapter.detect();
    agentInstalled = detection.installed;
    if (agentInstalled) launch = adapter.launchSpec(task, target.model);
  }

  if (opts.log !== false) {
    new DecisionLog().logDecision(task, result, target);
  }

  return {
    tier: result.tier,
    score: result.score,
    confidence: result.confidence,
    reason: result.reason,
    signals: result.signals,
    target,
    agentInstalled,
    launch,
  };
}
