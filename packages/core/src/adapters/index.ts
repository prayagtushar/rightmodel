import type { AgentAdapter } from "../types.js";
import { claudeCodeAdapter } from "./claude-code.js";

export const ALL_ADAPTERS: AgentAdapter[] = [claudeCodeAdapter];

export function getAdapter(id: string): AgentAdapter | undefined {
  return ALL_ADAPTERS.find((a) => a.id === id);
}

export { claudeCodeAdapter, resetDetectionCache } from "./claude-code.js";
