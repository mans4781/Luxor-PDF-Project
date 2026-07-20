import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface PDFFile {
  id: string;
  name: string;
  size: number;
  pages: number;
  lastModified: string;
  status: 'Unsecured' | 'Encrypted' | 'Password Protected' | 'Redacted';
  encryptionLevel?: string;
}

export interface Activity {
  id: string;
  action: string;
  target: string;
  date: string;
  status: 'success' | 'failed' | 'processing';
}

export interface SecureShare {
  id: string;
  document: string;
  recipient: string;
  created: string;
  expires: string;
  views: number;
  downloads: number;
  status: 'Active' | 'Expired' | 'Revoked';
}

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  recentFiles: PDFFile[];
  activities: Activity[];
  secureShares: SecureShare[];
  addShare: (share: SecureShare) => void;
  addFile: (file: PDFFile) => void;
  addActivity: (activity: Activity) => void;
  deleteFile: (id: string) => void;
}

const STORAGE_PREFIX = 'luxor-secure:';

const seedFiles: PDFFile[] = [
  { id: '1', name: 'Annual_Report_2024.pdf', size: 2400000, pages: 24, lastModified: '2024-05-12T10:30:00Z', status: 'Encrypted', encryptionLevel: 'AES-256' },
  { id: '2', name: 'Q3_Financials_Draft.pdf', size: 1200000, pages: 8, lastModified: '2024-05-11T14:15:00Z', status: 'Unsecured' },
  { id: '3', name: 'Employee_Contracts_Batch.pdf', size: 5600000, pages: 124, lastModified: '2024-05-10T09:00:00Z', status: 'Password Protected' },
  { id: '4', name: 'Merger_Agreement_v2.pdf', size: 3100000, pages: 42, lastModified: '2024-05-09T16:45:00Z', status: 'Redacted' },
];

const seedActivities: Activity[] = [
  { id: '1', action: 'PDF Encrypted', target: 'Annual_Report_2024.pdf', date: '2024-05-12T10:35:00Z', status: 'success' },
  { id: '2', action: 'Secure Link Created', target: 'Merger_Agreement_v2.pdf', date: '2024-05-09T17:00:00Z', status: 'success' },
  { id: '3', action: 'Password Changed', target: 'Employee_Contracts_Batch.pdf', date: '2024-05-08T11:20:00Z', status: 'success' },
];

const seedShares: SecureShare[] = [
  { id: '1', document: 'Q3_Financials_Draft.pdf', recipient: 'investors@example.com', created: '2024-05-10T10:00:00Z', expires: '2024-05-17T10:00:00Z', views: 4, downloads: 2, status: 'Active' },
  { id: '2', document: 'Merger_Agreement_v2.pdf', recipient: 'legal@partner.com', created: '2024-04-01T09:00:00Z', expires: '2024-04-08T09:00:00Z', views: 12, downloads: 3, status: 'Expired' },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => loadFromStorage(key, fallback));

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage may be unavailable (private mode, quota); keep working in memory.
    }
  }, [key, value]);

  return [value, setValue] as const;
}

const defaultState: AppState = {
  sidebarCollapsed: false,
  toggleSidebar: () => {},
  recentFiles: seedFiles,
  activities: seedActivities,
  secureShares: seedShares,
  addShare: () => {},
  addFile: () => {},
  addActivity: () => {},
  deleteFile: () => {},
};

const AppContext = createContext<AppState>(defaultState);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState('sidebar-collapsed', false);
  const [recentFiles, setRecentFiles] = usePersistentState<PDFFile[]>('recent-files', seedFiles);
  const [activities, setActivities] = usePersistentState<Activity[]>('activities', seedActivities);
  const [secureShares, setSecureShares] = usePersistentState<SecureShare[]>('secure-shares', seedShares);

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);
  const addShare = (share: SecureShare) => setSecureShares(prev => [share, ...prev]);
  const addFile = (file: PDFFile) => setRecentFiles(prev => [file, ...prev]);
  const addActivity = (activity: Activity) => setActivities(prev => [activity, ...prev]);
  const deleteFile = (id: string) => setRecentFiles(prev => prev.filter(f => f.id !== id));

  return (
    <AppContext.Provider value={{
      sidebarCollapsed,
      toggleSidebar,
      recentFiles,
      activities,
      secureShares,
      addShare,
      addFile,
      addActivity,
      deleteFile,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => useContext(AppContext);
