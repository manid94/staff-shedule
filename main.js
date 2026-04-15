const { app, BrowserWindow } = require("electron");

require("./server/server.js");

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            allowRunningInsecureContent: false
        }
    });

    // retry loading until server ready
    const loadApp = () => {
        win.loadURL("http://localhost:5000").catch(() => {
            setTimeout(loadApp, 500);
        });
    };

    setTimeout(loadApp, 1000);
}

app.whenReady().then(createWindow);