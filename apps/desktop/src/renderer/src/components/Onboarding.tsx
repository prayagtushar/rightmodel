import type { AgentStatus } from "../api.js";

interface Props {
  agents: AgentStatus[];
  onRescan(): void;
}

export function Onboarding({ agents, onRescan }: Props): React.JSX.Element {
  return (
    <div className="onboarding">
      <h1>No agent CLIs found</h1>
      <p>
        RightModel routes your tasks to AI coding agents already installed on this machine. None of
        the supported agents were found on your PATH.
      </p>
      <ul className="agent-list">
        {agents.map((a) => (
          <li key={a.id}>
            <span className="agent-name">{a.displayName}</span>
            <code className="agent-hint">{a.installHint}</code>
          </li>
        ))}
      </ul>
      <p>Install one, then scan again.</p>
      <button type="button" className="launch-button" onClick={onRescan}>
        Scan again
      </button>
    </div>
  );
}
