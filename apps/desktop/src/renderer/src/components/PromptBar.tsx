import { useEffect, useRef, useState } from "react";
import { type AgentStatus, api, type RouteDecision, type TierTarget } from "../api.js";
import { RoutingChip } from "./RoutingChip.js";

interface Props {
  agents: AgentStatus[] | null;
  onLaunch(task: string, proposed: TierTarget, chosen: TierTarget): void;
}

export function PromptBar({ agents, onLaunch }: Props): React.JSX.Element {
  const [text, setText] = useState("");
  const [decision, setDecision] = useState<RouteDecision | null>(null);
  const [overrideModel, setOverrideModel] = useState<string>("auto");
  const debounceRef = useRef<number | null>(null);
  // Routing is debounced, so responses can arrive out of order. Only the most
  // recent request is allowed to set the chip.
  const requestSeq = useRef(0);

  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    if (!text.trim()) {
      requestSeq.current++;
      setDecision(null);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      const seq = ++requestSeq.current;
      api
        .route(text)
        .then((next) => {
          if (seq === requestSeq.current) setDecision(next);
        })
        .catch((err: unknown) => {
          if (seq === requestSeq.current) setDecision(null);
          console.error("routing failed:", err);
        });
    }, 150);
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, [text]);

  const launch = () => {
    if (!decision || !text.trim() || !decision.agentInstalled) return;
    const chosen: TierTarget =
      overrideModel === "auto"
        ? decision.target
        : { agent: decision.target.agent, model: overrideModel };
    onLaunch(text, decision.target, chosen);
    setText("");
    setDecision(null);
    setOverrideModel("auto");
  };

  const routedAgent = agents?.find((a) => a.id === decision?.target.agent);

  return (
    <div className="prompt-bar">
      <input
        className="prompt-input"
        type="text"
        placeholder="What do you want to do?"
        value={text}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") launch();
        }}
      />
      <RoutingChip
        decision={decision}
        agent={routedAgent ?? null}
        overrideModel={overrideModel}
        onOverride={setOverrideModel}
      />
      <button
        type="button"
        className="launch-button"
        disabled={!decision?.agentInstalled || !text.trim()}
        onClick={launch}
      >
        Launch
      </button>
    </div>
  );
}
