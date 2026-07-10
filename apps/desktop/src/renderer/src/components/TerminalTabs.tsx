export interface SessionTab {
  id: string;
  title: string;
  exited: boolean;
}

interface Props {
  sessions: SessionTab[];
  activeId: string | null;
  onSelect(id: string): void;
  onClose(id: string): void;
}

export function TerminalTabs({ sessions, activeId, onSelect, onClose }: Props): React.JSX.Element | null {
  if (sessions.length === 0) return null;
  return (
    <div className="tabs">
      {sessions.map((s) => (
        <div
          key={s.id}
          className={`tab ${s.id === activeId ? "tab-active" : ""} ${s.exited ? "tab-exited" : ""}`}
          onClick={() => onSelect(s.id)}
        >
          <span className="tab-title">{s.title}</span>
          <button
            className="tab-close"
            title="Close session"
            onClick={(e) => {
              e.stopPropagation();
              onClose(s.id);
            }}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
