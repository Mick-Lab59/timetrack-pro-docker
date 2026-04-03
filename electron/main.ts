import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, Notification } from 'electron'
import { getFrenchHolidays, getFeast, getSeason, getDSTChange } from './calendar'
import { isSameDay } from 'date-fns'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readDB, writeDB, dbPath, writeSettings, writeMonth, updateCache } from './db'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let tray: Tray | null = null
let isQuitting = false

function createTray() {
  if (tray) return
  const iconPath = path.join(process.env.VITE_PUBLIC, 'icon.png')
  tray = new Tray(iconPath)
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Ouvrir TimeTrack Pro', click: () => win?.show() },
    { type: 'separator' },
    { label: 'Quitter', click: () => { 
        isQuitting = true
        app.quit() 
      } 
    }
  ])

  tray.setToolTip('TimeTrack Pro')
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    if (win?.isVisible()) {
      win.focus()
    } else {
      win?.show()
    }
  })
}

function updateAutoLaunch(enabled: boolean) {
  // On ne configure le démarrage auto que si l'app est packagée
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: process.execPath,
      args: ['--hidden']
    })
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    backgroundColor: '#0a0b0d', // Couleur sombre pour stabiliser le rendu Chromium
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      backgroundThrottling: false, // Empêche de ralentir les calculs quand la fenêtre n'a pas le focus
    },
  })

  // Gérer la fermeture de la fenêtre pour la masquer à la place
  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      win?.hide()
    }
    return false
  })

  // Masquer la barre de menu (File, Edit, etc.)
  win.setMenu(null)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(async () => {
  createWindow()
  createTray()

  // Briefing matinal au démarrage
  const showBriefing = async () => {
    const now = new Date();
    const holidays = getFrenchHolidays(now.getFullYear());
    const holiday = holidays.find(h => isSameDay(h.date, now));
    const feast = getFeast(now);
    const season = getSeason(now);
    const dst = getDSTChange(now);

    let title = "Bonjour ! TimeTrack Pro est prêt.";
    let body = "L'application est lancée et réduite dans la barre des tâches.";
    
    const events: string[] = [];
    if (holiday) events.push(`C'est férié : ${holiday.label} ⛱️`);
    if (feast) events.push(`On fête les ${feast} 💐`);
    if (season) events.push(season);
    if (dst) events.push(dst);

    if (events.length > 0) {
      body = events.join('\n');
    }

    if (Notification.isSupported()) {
      new Notification({
        title: title,
        body: body,
        icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
        silent: false
      }).show();
    }
  };

  // Vérifier le paramètre de démarrage au lancement
  try {
    const db = await readDB()
    if (db.settings.start_with_windows === 'true') {
      updateAutoLaunch(true)
      // Si lancé avec l'argument --hidden, on cache la fenêtre et on notifie
      if (process.argv.includes('--hidden')) {
        win?.hide()
        showBriefing();
      }
    }
  } catch (e) {
    console.error('Erreur init startup:', e)
  }
})

// IPC Handlers
ipcMain.handle('get-db-path', async () => {
  return dbPath;
});

ipcMain.handle('get-entries', async () => {
  const content = await readDB();
  return content.entries;
});

ipcMain.handle('save-entry', async (_, entry: any) => {
  try {
    const content = await readDB();
    const monthKey = entry.date.substring(0, 7);
    
    if (entry.id) {
      const index = content.entries.findIndex(e => e.id === entry.id);
      if (index !== -1) {
        content.entries[index] = { ...entry };
      }
    } else {
      entry.id = content.nextId++;
      content.entries.push(entry);
    }

    // Sauvegarde ciblée
    await writeSettings(content.settings, content.nextId);
    const monthEntries = content.entries.filter(e => e.date.startsWith(monthKey));
    await writeMonth(monthKey, monthEntries);
    updateCache(content.entries);
    
    return { success: true };
  } catch (error: any) {
    console.error('Save error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-entry', async (_, id: number) => {
  try {
    const content = await readDB();
    const entryToDelete = content.entries.find(e => e.id === id);
    if (!entryToDelete) return true;

    const monthKey = entryToDelete.date.substring(0, 7);
    content.entries = content.entries.filter(e => e.id !== id);

    await writeSettings(content.settings, content.nextId);
    const monthEntries = content.entries.filter(e => e.date.startsWith(monthKey));
    await writeMonth(monthKey, monthEntries);
    updateCache(content.entries);
    
    return true;
  } catch (e) {
    console.error('Delete error:', e);
    return false;
  }
});


ipcMain.handle('get-settings', async () => {
  const content = await readDB();
  return Object.entries(content.settings).map(([key, value]) => ({ key, value }));
});

ipcMain.handle('update-setting', async (_, key: string, value: string) => {
  const content = await readDB();
  content.settings[key] = value;
  await writeDB(content);

  // Si c'est le paramètre de démarrage Windows, on met à jour le système
  if (key === 'start_with_windows') {
    updateAutoLaunch(value === 'true');
  }

  return true;
});

ipcMain.handle('export-csv', async (_, csvContent: string, fileName: string) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: fileName,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });

  if (filePath) {
    fs.writeFileSync(filePath, csvContent);
    return true;
  }
  return false;
});

ipcMain.handle('rename-enterprise', async (_, oldName: string, newName: string) => {
  try {
    const content = await readDB();
    let count = 0;
    content.entries = content.entries.map(e => {
      if (e.enterprise === oldName) {
        count++;
        return { ...e, enterprise: newName };
      }
      return e;
    });
    
    if (count > 0) {
      await writeDB(content);
    }
    return { success: true, count };
  } catch (error: any) {
    console.error('Erreur lors du renommage:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-backup', async () => {
  try {
    const content = await readDB();
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `TimeTrackPro_Backup_${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'TimeTrack Pro Backup', extensions: ['json'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
      return true;
    }
    return false;
  } catch (e) {
    console.error('Erreur export backup:', e);
    return false;
  }
});

ipcMain.handle('import-backup', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'TimeTrack Pro Backup', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (filePaths && filePaths[0]) {
    try {
      const data = fs.readFileSync(filePaths[0], 'utf8');
      const content = JSON.parse(data);
      if (content.entries && content.settings) {
        await writeDB(content);
        return { success: true };
      }
      return { success: false, error: 'Format de fichier invalide' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
  return { success: false };
});

ipcMain.handle('get-company-names', async () => {
  try {
    const db = await readDB();
    return Array.from(new Set(db.entries.map(e => e.enterprise))).filter(Boolean).sort();
  } catch (e) {
    console.error('Erreur get-company-names:', e);
    return [];
  }
});



