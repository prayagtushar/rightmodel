import { homedir } from "node:os";
import { type IPty, spawn } from "node-pty";
import type { LaunchSpec } from "rightmodel";

export interface PtyEvents {
  onData(id: string, data: string): void;
  onExit(id: string, exitCode: number): void;
}

interface Session {
  pty: IPty;
  attached: boolean;
  buffer: string[];
}

let nextId = 1;

// Output produced before the renderer attaches is held here. A tab the user
// never selects would otherwise grow this without limit, so keep only the most
// recent chunks: a terminal only ever renders the tail anyway.
const MAX_BUFFERED_CHUNKS = 2000;

export class PtyManager {
  private sessions = new Map<string, Session>();

  constructor(private events: PtyEvents) {}

  create(spec: LaunchSpec): string {
    const id = String(nextId++);
    const pty = spawn(spec.binary, spec.args, {
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      cwd: homedir(),
      env: process.env as Record<string, string>,
    });
    const session: Session = { pty, attached: false, buffer: [] };
    this.sessions.set(id, session);

    pty.onData((data) => {
      if (session.attached) {
        this.events.onData(id, data);
        return;
      }
      session.buffer.push(data);
      if (session.buffer.length > MAX_BUFFERED_CHUNKS) session.buffer.shift();
    });
    pty.onExit(({ exitCode }) => {
      this.events.onExit(id, exitCode);
      this.sessions.delete(id);
    });
    return id;
  }

  attach(id: string): void {
    const session = this.sessions.get(id);
    if (!session) return;
    session.attached = true;
    for (const chunk of session.buffer) this.events.onData(id, chunk);
    session.buffer = [];
  }

  write(id: string, data: string): void {
    this.sessions.get(id)?.pty.write(data);
  }

  resize(id: string, cols: number, rows: number): void {
    if (cols > 0 && rows > 0) this.sessions.get(id)?.pty.resize(cols, rows);
  }

  kill(id: string): void {
    this.sessions.get(id)?.pty.kill();
    this.sessions.delete(id);
  }

  killAll(): void {
    for (const [, session] of this.sessions) session.pty.kill();
    this.sessions.clear();
  }
}
