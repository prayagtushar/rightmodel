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

export function TerminalTabs({
  sessions,
  activeId,
  onSelect,
  onClose,
}: Props): React.JSX.Element | null {
  if (sessions.length === 0) return null;
  return (
    <div className="tabs" role="tablist">
      {sessions.map((s) => (
        // Not a button: it contains the close button, and nested buttons are
        // invalid. role=tab with an explicit key handler gives the same
        // keyboard behaviour.
        <div
          key={s.id}
          role="tab"
          tabIndex={0}
          aria-selected={s.id === activeId}
          className={`tab ${s.id === activeId ? "tab-active" : ""} ${s.exited ? "tab-exited" : ""}`}
          onClick={() => onSelect(s.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(s.id);
            }
          }}
        >
          <span className="tab-title">{s.title}</span>
          <button
            type="button"
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
