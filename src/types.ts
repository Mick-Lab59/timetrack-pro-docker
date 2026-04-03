export interface TimeSlot {
  type: 'work' | 'break';
  start: string;
  end: string;
}

export interface WorkEntry {
  id?: number;
  date: string;
  enterprise: string;
  rate_brut: number;
  net_ratio: number;
  prime: number;
  panier: number;
  notes: string;
  total_hours: number;
  total_net: number;
  slots: TimeSlot[];
  is_leave?: boolean;
}

export interface Setting {
  key: string;
  value: string;
}

declare global {
  interface Window {
    api: {
      getEntries: () => Promise<WorkEntry[]>;
      saveEntry: (entry: WorkEntry) => Promise<number>;
      deleteEntry: (id: number) => Promise<void>;
      getSettings: () => Promise<Setting[]>;
      updateSetting: (key: string, value: string) => Promise<void>;
      exportCSV: (csvContent: string, fileName: string) => Promise<boolean>;
      getDbPath: () => Promise<string>;
      renameEnterprise: (oldName: string, newName: string) => Promise<{ success: boolean, count?: number, error?: string }>;
      exportBackup: () => Promise<boolean>;
      importBackup: () => Promise<{ success: boolean, error?: string }>;
      getCompanyNames: () => Promise<string[]>;
    };



  }
}
