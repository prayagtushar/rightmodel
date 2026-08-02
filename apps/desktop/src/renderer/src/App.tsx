import { useCallback, useEffect, useState } from "react";
import { api, type AgentStatus, type TierTarget } from "./api.js";
import { Onboarding } from "./components/Onboarding.js";
import { PromptBar } from "./components/PromptBar.js";
import { TerminalPane } from "./components/TerminalPane.js";
import { TerminalTabs, type SessionTab } from "./components/TerminalTabs.js";

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function App(): React.JSX.Element {
  const [agents, setAgents] = useState<AgentStatus[] | null>(null);
  const [sessions, setSessions] = useState<SessionTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = useCallback(() => {
    api
      .listAgents()
      .then((next) => {
        setAgents(next);
        setError(null);
      })
      .catch((err: unknown) => {
        setAgents([]);
        setError(`Could not scan for agent CLIs: ${message(err)}`);
      });
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
    (task: string, proposed: TierTarget, chosen: TierTarget) => {
      api
        .launch({ task, proposed, chosen })
        .then(({ id }) => {
          const preview = task.replace(/\s+/g, " ").slice(0, 24) || "task";
          addSession(id, `${chosen.model} ${preview}`);
          setError(null);
        })
        .catch((err: unknown) => setError(`Could not launch ${chosen.agent}: ${message(err)}`));
    },
    [addSession]
  );

  const handlePlainTerminal = useCallback(() => {
    api
      .plainTerminal()
      .then(({ id }) => {
        addSession(id, "shell");
        setError(null);
      })
      .catch((err: unknown) => setError(`Could not open a terminal: ${message(err)}`));
  }, [addSession]);

  const handleClose = useCallback(
    (id: string) => {
      api.kill(id).catch((err: unknown) => console.error("failed to kill session:", err));
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
      {error !== null && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button className="ghost-button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}
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
