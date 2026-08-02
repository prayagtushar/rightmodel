import { contextBridge, type IpcRendererEvent, ipcRenderer } from "electron";

export interface PtyDataEvent {
  id: string;
  data: string;
}

export interface PtyExitEvent {
  id: string;
  exitCode: number;
}

const api = {
  listAgents: () => ipcRenderer.invoke("agents:list"),
  route: (task: string) => ipcRenderer.invoke("route:task", task),
  launch: (payload: unknown) => ipcRenderer.invoke("session:launch", payload),
  plainTerminal: () => ipcRenderer.invoke("session:plain"),
  attach: (id: string) => ipcRenderer.invoke("session:attach", id),
  write: (id: string, data: string) => ipcRenderer.invoke("session:write", id, data),
  resize: (id: string, cols: number, rows: number) =>
    ipcRenderer.invoke("session:resize", id, cols, rows),
  kill: (id: string) => ipcRenderer.invoke("session:kill", id),
  onData: (cb: (event: PtyDataEvent) => void) => {
    const listener = (_e: IpcRendererEvent, payload: PtyDataEvent) => cb(payload);
    ipcRenderer.on("pty:data", listener);
    return () => ipcRenderer.removeListener("pty:data", listener);
  },
  onExit: (cb: (event: PtyExitEvent) => void) => {
    const listener = (_e: IpcRendererEvent, payload: PtyExitEvent) => cb(payload);
    ipcRenderer.on("pty:exit", listener);
    return () => ipcRenderer.removeListener("pty:exit", listener);
  },
};

contextBridge.exposeInMainWorld("switchtower", api);

export type SwitchtowerApi = typeof api;
