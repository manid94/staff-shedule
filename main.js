const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require('fs');
const path = require('path');

// Create preload script content
const preloadScript = `
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveFile: (buffer, filename) => ipcRenderer.invoke('save-file', buffer, filename)
});
`;

// Write preload script to temp file
const preloadPath = path.join(app.getPath('temp'), 'preload.js');
fs.writeFileSync(preloadPath, preloadScript);

// Start the server
console.log("Starting server...");
require("./server/server.js");
console.log("Server required, waiting for startup...");

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Don't show until ready
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false,
            allowRunningInsecureContent: true,
            preload: preloadPath
        }
    });

    // retry loading until server ready
    const loadApp = () => {
        win.loadURL("http://localhost:5000").catch((err) => {
            console.log("Loading failed, retrying...", err);
            setTimeout(loadApp, 500);
        });
    };

    // Ensure window gets focus
    win.on('ready-to-show', () => {
        win.show();
        win.focus();
    });

    // Handle focus events
    win.on('blur', () => {
        // Re-focus if needed
        setTimeout(() => win.focus(), 100);
    });

    win.on('focus', () => {
        console.log("Window focused");
    });

    setTimeout(loadApp, 1000);
}

app.whenReady().then(createWindow);

// IPC handler for saving files
ipcMain.handle('save-file', async (event, buffer, filename) => {
    try {
        const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
            title: 'Save Excel File',
            defaultPath: filename,
            filters: [
                { name: 'Excel Files', extensions: ['xlsx'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePath) {
            fs.writeFileSync(result.filePath, Buffer.from(buffer));
            return { success: true, filePath: result.filePath };
        }
        
        return { success: false, canceled: true };
    } catch (error) {
        console.error('Save file error:', error);
        return { success: false, error: error.message };
    }
});