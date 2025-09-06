import { app, BrowserWindow, Menu } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL =
  process.env["VITE_DEV_SERVER_URL"] ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5173" : null);
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 640,
    minHeight: 480,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: "default",
    show: false,
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
    console.log("Renderer process finished loading");
  });

  // Add error handling
  win.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
  });

  win.webContents.on("crashed", () => {
    console.error("Renderer process crashed");
  });

  if (VITE_DEV_SERVER_URL) {
    console.log("Loading dev server URL:", VITE_DEV_SERVER_URL);
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open DevTools in development
    win.webContents.openDevTools();
  } else {
    // win.loadFile('dist/index.html')
    console.log("Loading file:", path.join(RENDERER_DIST, "index.html"));
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  // Show window when ready to prevent visual flash
  win.once("ready-to-show", () => {
    win?.show();

    // Focus the window for immediate keyboard input
    win?.focus();
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Everclimb",
      submenu: [
        {
          label: "About Everclimb",
          role: "about",
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Game",
      submenu: [
        {
          label: "New Game",
          accelerator: "F2",
          click: () => {
            win?.webContents.send("new-game");
          },
        },
        {
          label: "Pause",
          accelerator: "Escape",
          click: () => {
            win?.webContents.send("toggle-pause");
          },
        },
        { type: "separator" },
        {
          label: "Fullscreen",
          accelerator: process.platform === "darwin" ? "Ctrl+Cmd+F" : "F11",
          click: () => {
            if (win) {
              win.setFullScreen(!win.isFullScreen());
            }
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
});
