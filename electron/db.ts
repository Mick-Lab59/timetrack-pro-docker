import path from 'node:path';
import { app } from 'electron';
import fs from 'node:fs';

const isDev = !app.isPackaged;
let rootPath = isDev ? app.getAppPath() : path.dirname(process.execPath);
let dataDir = path.join(rootPath, 'data');

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (e) {
  dataDir = path.join(app.getPath('userData'), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export const dbPath = path.join(dataDir, 'database.json');
export const entriesDir = path.join(dataDir, 'entries');
export const settingsPath = path.join(dataDir, 'settings.json');
export const backupsDir = path.join(dataDir, 'backups');

if (!fs.existsSync(entriesDir)) {
  fs.mkdirSync(entriesDir, { recursive: true });
}

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

export interface Entry {
  id: number;
  date: string;
  enterprise: string;
  rate_brut: number;
  net_ratio: number;
  prime: number;
  panier: number;
  notes: string;
  total_hours: number;
  total_net: number;
  slots: any[];
  is_leave?: boolean;
}

export interface Settings {
  [key: string]: string | undefined;
  net_ratio: string;
  currency: string;
  theme: string;
  auto_backup?: string;
  start_with_windows?: string;
}

export interface DBContent {
  entries: Entry[];
  settings: Settings;
  nextId: number;
}

const defaultSettings: Settings = {
  net_ratio: '0.77',
  currency: '€',
  theme: 'system',
  auto_backup: 'false',
  start_with_windows: 'false'
};




// Migration automatique de l'ancien format vers le nouveau format mensuel
function migrateIfNeeded() {
  if (fs.existsSync(dbPath)) {
    try {
      console.log('Migration des données en cours...');
      const data = fs.readFileSync(dbPath, 'utf8');
      const oldDB: DBContent = JSON.parse(data);

      // 1. Sauvegarder les settings
      fs.writeFileSync(settingsPath, JSON.stringify({ 
        settings: oldDB.settings, 
        nextId: oldDB.nextId 
      }, null, 2));

      // 2. Éclater les entrées par mois
      const months: Record<string, Entry[]> = {};
      oldDB.entries.forEach(entry => {
        const monthKey = entry.date.substring(0, 7); // YYYY-MM
        if (!months[monthKey]) months[monthKey] = [];
        months[monthKey].push(entry);
      });

      Object.entries(months).forEach(([monthKey, entries]) => {
        const filePath = path.join(entriesDir, `${monthKey}.json`);
        fs.writeFileSync(filePath, JSON.stringify(entries, null, 2));
      });

      // 3. Renommer l'ancien fichier
      fs.renameSync(dbPath, dbPath + '.bak');
      console.log('Migration terminée avec succès !');
    } catch (err) {
      console.error('Erreur lors de la migration:', err);
    }
  }
}

migrateIfNeeded();

export let cachedEntries: Entry[] | null = null;

export function updateCache(entries: Entry[]) {
  cachedEntries = entries;
}

export async function readDB(): Promise<DBContent> {
  try {
    // 1. Lire settings & nextId
    let settings = defaultSettings;
    let nextId = 1;
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      settings = data.settings || defaultSettings;
      nextId = data.nextId || 1;
    } else {
      fs.writeFileSync(settingsPath, JSON.stringify({ settings: defaultSettings, nextId: 1 }, null, 2));
    }

    // 2. Utiliser le cache si disponible
    if (cachedEntries) {
      return { entries: cachedEntries, settings, nextId };
    }

    // 3. Lire toutes les entrées mensuelles
    let allEntries: Entry[] = [];

    const files = await fs.promises.readdir(entriesDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(entriesDir, file);
          const content = await fs.promises.readFile(filePath, 'utf8');
          const entries = JSON.parse(content);
          allEntries = allEntries.concat(entries);
        } catch (e) {
          console.error(`Erreur lecture fichier ${file}:`, e);
        }
      }
    }

    // Trier par date décroissante
    allEntries.sort((a, b) => b.date.localeCompare(a.date));

    cachedEntries = allEntries;
    return { entries: allEntries, settings, nextId };
  } catch (err) {
    console.error('Error reading DB:', err);
    return { entries: [], settings: defaultSettings, nextId: 1 };
  }
}

export async function writeSettings(settings: Settings, nextId: number) {
  try {
    await fs.promises.writeFile(settingsPath, JSON.stringify({ settings, nextId }, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing settings:', err);
  }
}

export async function writeMonth(monthKey: string, entries: Entry[]) {
  try {
    const filePath = path.join(entriesDir, `${monthKey}.json`);
    if (entries.length === 0) {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } else {
      await fs.promises.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf8');
    }
  } catch (err) {
    console.error(`Error writing month ${monthKey}:`, err);
  }
}

export async function writeDB(db: DBContent) {
  try {
    // 1. Sauvegarder settings
    await writeSettings(db.settings, db.nextId);
    
    // 2. Mettre à jour le cache mémoire
    cachedEntries = db.entries;

    // 3. Identifier tous les mois
    const months: Record<string, Entry[]> = {};
    db.entries.forEach(entry => {
      const monthKey = entry.date.substring(0, 7);
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(entry);
    });

    // 4. Récupérer les fichiers existants pour nettoyer les mois vides
    const existingFiles = (await fs.promises.readdir(entriesDir)).filter(f => f.endsWith('.json'));

    // 5. Tout réécrire (pour import/backup complet)
    // On le fait en parallèle pour aller plus vite
    const writePromises = Object.entries(months).map(([key, entries]) => writeMonth(key, entries));
    await Promise.all(writePromises);

    // 6. Supprimer les fichiers obsolètes
    for (const file of existingFiles) {
      const monthKey = file.replace('.json', '');
      if (!months[monthKey]) {
        try {
          await fs.promises.unlink(path.join(entriesDir, file));
        } catch (e) {}
      }
    }

    // 7. Sauvegarde automatique si activée (en arrière-plan)
    if (db.settings.auto_backup === 'true') {
      const year = new Date().getFullYear().toString();
      const yearlyBackupDir = path.join(backupsDir, year);
      if (!fs.existsSync(yearlyBackupDir)) {
        await fs.promises.mkdir(yearlyBackupDir, { recursive: true });
      }
      const backupPath = path.join(yearlyBackupDir, 'backup_auto.json');
      fs.promises.writeFile(backupPath, JSON.stringify(db, null, 2), 'utf8').catch(e => console.error('Auto-backup error:', e));
    }
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}


