import type { AgentStatus, RouteDecision } from "../api.js";

interface Props {
  decision: RouteDecision | null;
  agent: AgentStatus | null;
  overrideModel: string;
  onOverride(model: string): void;
}

export function RoutingChip({
  decision,
  agent,
  overrideModel,
  onOverride,
}: Props): React.JSX.Element {
  if (!decision) {
    return <div className="routing-chip routing-chip-idle">router idle</div>;
  }

  const effectiveModel = overrideModel === "auto" ? decision.target.model : overrideModel;
  const overridden = overrideModel !== "auto" && overrideModel !== decision.target.model;

  return (
    <div className={`routing-chip tier-${decision.tier}`} title={decision.reason}>
      <span className="chip-tier">{decision.tier}</span>
      <span className="chip-agent">{agent?.displayName ?? decision.target.agent}</span>
      <select
        className="chip-model"
        value={overrideModel}
        onChange={(e) => onOverride(e.target.value)}
        title="Override the proposed model"
      >
        <option value="auto">auto: {decision.target.model}</option>
        {(agent?.models ?? []).map((m) => (
          <option key={m.id} value={m.id}>
            {m.label.toLowerCase()}
          </option>
        ))}
      </select>
      {overridden && <span className="chip-overridden">override: {effectiveModel}</span>}
      <span className="chip-reason">{decision.reason}</span>
      {!decision.agentInstalled && <span className="chip-missing">agent not installed</span>}
    </div>
  );
}
