import { join } from "node:path";
import { app, BrowserWindow, shell } from "electron";
import { registerIpc } from "./ipc.js";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 720,
    minHeight: 480,
    title: "RightModel",
    backgroundColor: "#101418",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Only hand web URLs to the OS. Anything else (file:, and the various
    // scheme handlers registered on a desktop) is dropped.
    let scheme = "";
    try {
      scheme = new URL(url).protocol;
    } catch {
      return { action: "deny" };
    }
    if (scheme === "https:" || scheme === "http:") {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const ptys = registerIpc(() => mainWindow);

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .catch((err: unknown) => {
    console.error("failed to start RightModel:", err);
    app.quit();
  });

app.on("window-all-closed", () => {
  ptys.killAll();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  ptys.killAll();
});
