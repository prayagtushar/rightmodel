import { useCallback, useEffect, useState } from "react";
import { api, type AgentStatus, type TierTarget } from "./api.js";
import { Onboarding } from "./components/Onboarding.js";
import { PromptBar } from "./components/PromptBar.js";
import { TerminalPane } from "./components/TerminalPane.js";
import { TerminalTabs, type SessionTab } from "./components/TerminalTabs.js";

export function App(): React.JSX.Element {
  const [agents, setAgents] = useState<AgentStatus[] | null>(null);
  const [sessions, setSessions] = useState<SessionTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const loadAgents = useCallback(() => {
    api.listAgents().then(setAgents);
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  useEffect(() => {
    return api.onExit(({ id }) => {
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, exited: true } : s)));
    });
  }, []);

  const addSession = useCallback((id: string, title: string) => {
    setSessions((prev) => [...prev, { id, title, exited: false }]);
    setActiveId(id);
  }, []);

  const handleLaunch = useCallback(
    async (task: string, proposed: TierTarget, chosen: TierTarget) => {
      const { id } = await api.launch({ task, proposed, chosen });
      const preview = task.replace(/\s+/g, " ").slice(0, 24) || "task";
      addSession(id, `${chosen.model} ${preview}`);
    },
    [addSession]
  );

  const handlePlainTerminal = useCallback(async () => {
    const { id } = await api.plainTerminal();
    addSession(id, "shell");
  }, [addSession]);

  const handleClose = useCallback(
    (id: string) => {
      api.kill(id);
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        setActiveId((current) =>
          current === id ? (next.length > 0 ? next[next.length - 1].id : null) : current
        );
        return next;
      });
    },
    []
  );

  const noAgents = agents !== null && agents.every((a) => !a.installed);

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Switchtower</span>
        <PromptBar agents={agents} onLaunch={handleLaunch} />
        <button className="ghost-button" onClick={handlePlainTerminal} title="Open a plain shell">
          Terminal
        </button>
      </header>
      {noAgents ? (
        <Onboarding agents={agents ?? []} onRescan={loadAgents} />
      ) : (
        <>
          <TerminalTabs
            sessions={sessions}
            activeId={activeId}
            onSelect={setActiveId}
            onClose={handleClose}
          />
          <div className="panes">
            {sessions.length === 0 && (
              <div className="empty-state">
                <p>Type a task above. Switchtower picks the cheapest capable model and opens the agent here.</p>
                <p className="empty-hint">Enter launches the proposal. The dropdown overrides it. Terminal opens a plain shell.</p>
              </div>
            )}
            {sessions.map((s) => (
              <TerminalPane key={s.id} id={s.id} active={s.id === activeId} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
