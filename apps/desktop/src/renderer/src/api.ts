export type Tier = "easy" | "medium" | "hard";

export interface TierTarget {
  agent: string;
  model: string;
  effort?: string;
}

export interface RouteDecision {
  tier: Tier;
  score: number;
  confidence: number;
  reason: string;
  target: TierTarget;
  agentInstalled: boolean;
}

export interface ModelInfo {
  id: string;
  label: string;
  costRank: number;
}

export interface AgentStatus {
  id: string;
  displayName: string;
  installHint: string;
  installed: boolean;
  version: string | null;
  models: ModelInfo[];
}

export interface PtyDataEvent {
  id: string;
  data: string;
}

export interface PtyExitEvent {
  id: string;
  exitCode: number;
}

export interface SwitchtowerApi {
  listAgents(): Promise<AgentStatus[]>;
  route(task: string): Promise<RouteDecision>;
  launch(payload: { task: string; proposed: TierTarget; chosen: TierTarget }): Promise<{ id: string }>;
  plainTerminal(): Promise<{ id: string }>;
  attach(id: string): Promise<void>;
  write(id: string, data: string): Promise<void>;
  resize(id: string, cols: number, rows: number): Promise<void>;
  kill(id: string): Promise<void>;
  onData(cb: (event: PtyDataEvent) => void): () => void;
  onExit(cb: (event: PtyExitEvent) => void): () => void;
}

export const api: SwitchtowerApi = (window as unknown as { switchtower: SwitchtowerApi })
  .switchtower;
