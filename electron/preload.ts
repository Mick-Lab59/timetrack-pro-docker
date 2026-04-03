import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getEntries: () => ipcRenderer.invoke('get-entries'),
  saveEntry: (entry: any) => ipcRenderer.invoke('save-entry', entry),
  deleteEntry: (id: number) => ipcRenderer.invoke('delete-entry', id),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSetting: (key: string, value: string) => ipcRenderer.invoke('update-setting', key, value),
  exportCSV: (csvContent: string, fileName: string) => ipcRenderer.invoke('export-csv', csvContent, fileName),
  getDbPath: () => ipcRenderer.invoke('get-db-path'),
  renameEnterprise: (oldName: string, newName: string) => ipcRenderer.invoke('rename-enterprise', oldName, newName),
  exportBackup: () => ipcRenderer.invoke('export-backup'),
  importBackup: () => ipcRenderer.invoke('import-backup'),
  getCompanyNames: () => ipcRenderer.invoke('get-company-names'),
})


