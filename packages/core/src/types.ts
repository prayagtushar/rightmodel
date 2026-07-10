export type Tier = "easy" | "medium" | "hard";

export interface Signal {
  name: string;
  weight: number;
}

export interface ScoreResult {
  tier: Tier;
  score: number;
  confidence: number;
  reason: string;
  signals: Signal[];
}

export interface TierTarget {
  agent: string;
  model: string;
  effort?: string;
}

export interface SwitchtowerConfig {
  mode: "heuristic" | "judge";
  tiers: Record<Tier, TierTarget>;
}

export interface LaunchSpec {
  binary: string;
  args: string[];
}

export interface AgentDetection {
  installed: boolean;
  path?: string;
  version?: string;
}

export interface ModelInfo {
  id: string;
  label: string;
  costRank: number;
}

export interface AgentCapabilities {
  models: ModelInfo[];
}

export interface AgentAdapter {
  id: string;
  displayName: string;
  binary: string;
  installHint: string;
  detect(): Promise<AgentDetection>;
  capabilities(detection: AgentDetection): AgentCapabilities;
  launchSpec(task: string, model: string): LaunchSpec;
}

export type LogType = "decision" | "launch" | "override";

export interface LogEntry {
  ts: string;
  type: LogType;
  taskHash: string;
  taskPreview: string;
  tier?: Tier;
  score?: number;
  confidence?: number;
  signals?: string[];
  proposed?: TierTarget;
  chosen?: TierTarget;
}

export interface RouteDecision {
  tier: Tier;
  score: number;
  confidence: number;
  reason: string;
  signals: Signal[];
  target: TierTarget;
  agentInstalled: boolean;
  launch: LaunchSpec | null;
}
