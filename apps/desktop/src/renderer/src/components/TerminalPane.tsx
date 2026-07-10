import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { api } from "../api.js";

interface Props {
  id: string;
  active: boolean;
}

export function TerminalPane({ id, active }: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "Menlo, Consolas, monospace",
      theme: {
        background: "#101418",
        foreground: "#d8dee9",
        cursor: "#8ab4f8",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    api.resize(id, term.cols, term.rows);

    const offData = api.onData((event) => {
      if (event.id === id) term.write(event.data);
    });
    const offExit = api.onExit((event) => {
      if (event.id === id) term.write("\r\n[session ended]\r\n");
    });
    const inputSub = term.onData((data) => {
      api.write(id, data);
    });
    api.attach(id);

    const observer = new ResizeObserver(() => {
      if (!fitRef.current || !termRef.current) return;
      fitRef.current.fit();
      api.resize(id, termRef.current.cols, termRef.current.rows);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      inputSub.dispose();
      offData();
      offExit();
      term.dispose();
    };
  }, [id]);

  useEffect(() => {
    if (active) {
      fitRef.current?.fit();
      termRef.current?.focus();
    }
  }, [active]);

  return <div ref={containerRef} className={`terminal-pane ${active ? "" : "terminal-hidden"}`} />;
}
