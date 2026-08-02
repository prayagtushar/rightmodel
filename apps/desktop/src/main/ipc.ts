import { type BrowserWindow, ipcMain } from "electron";
import {
  ALL_ADAPTERS,
  DecisionLog,
  getAdapter,
  resetDetectionCache,
  route,
  scoreTask,
  type TierTarget,
} from "switchtower";
import { PtyManager } from "./pty-manager.js";

export interface LaunchPayload {
  task: string;
  proposed: TierTarget;
  chosen: TierTarget;
}

export function registerIpc(getWindow: () => BrowserWindow | null): PtyManager {
  const ptys = new PtyManager({
    onData: (id, data) => getWindow()?.webContents.send("pty:data", { id, data }),
    onExit: (id, exitCode) => getWindow()?.webContents.send("pty:exit", { id, exitCode }),
  });

  ipcMain.handle("agents:list", async () => {
    // Detection caches the resolved binary path for the life of the process.
    // Clear it first so the onboarding rescan sees an agent installed after
    // the app started.
    resetDetectionCache();
    const statuses = [];
    for (const adapter of ALL_ADAPTERS) {
      const detection = await adapter.detect();
      statuses.push({
        id: adapter.id,
        displayName: adapter.displayName,
        installHint: adapter.installHint,
        installed: detection.installed,
        version: detection.version ?? null,
        models: adapter.capabilities(detection).models,
      });
    }
    return statuses;
  });

  ipcMain.handle("route:task", async (_event, task: string) => {
    return route(task, { log: false });
  });

  ipcMain.handle("session:launch", async (_event, payload: LaunchPayload) => {
    const { task, proposed, chosen } = payload;
    const adapter = getAdapter(chosen.agent);
    if (!adapter) throw new Error(`unknown agent: ${chosen.agent}`);

    const log = new DecisionLog();
    log.logDecision(task, scoreTask(task), proposed);
    if (proposed.agent !== chosen.agent || proposed.model !== chosen.model) {
      log.logOverride(task, proposed, chosen);
    }
    log.logLaunch(task, chosen);

    const id = ptys.create(adapter.launchSpec(task, chosen.model));
    return { id };
  });

  ipcMain.handle("session:plain", async () => {
    const shell =
      process.platform === "win32" ? "powershell.exe" : (process.env.SHELL ?? "/bin/zsh");
    const id = ptys.create({ binary: shell, args: [] });
    return { id };
  });

  ipcMain.handle("session:attach", (_event, id: string) => ptys.attach(id));
  ipcMain.handle("session:write", (_event, id: string, data: string) => ptys.write(id, data));
  ipcMain.handle("session:resize", (_event, id: string, cols: number, rows: number) =>
    ptys.resize(id, cols, rows)
  );
  ipcMain.handle("session:kill", (_event, id: string) => ptys.kill(id));

  return ptys;
}
