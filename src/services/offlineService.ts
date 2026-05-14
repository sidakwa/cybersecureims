import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CyberSecureIMSDB extends DBSchema {
  pending_operations: {
    key: string;
    value: {
      id: string;
      operation: 'CREATE' | 'UPDATE' | 'DELETE';
      table: string;
      data: any;
      timestamp: number;
    };
  };
  offline_data: {
    key: string;
    value: {
      table: string;
      data: any[];
      last_sync: number;
    };
  };
}

let db: IDBPDatabase<CyberSecureIMSDB> | null = null;

async function getDB() {
  if (!db) {
    db = await openDB<CyberSecureIMSDB>('cybersecureims-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pending_operations')) {
          db.createObjectStore('pending_operations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offline_data')) {
          db.createObjectStore('offline_data', { keyPath: 'table' });
        }
      },
    });
  }
  return db;
}

export async function addPendingOperation(
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  table: string,
  data: any
) {
  const database = await getDB();
  await database.add('pending_operations', {
    id: `${Date.now()}-${Math.random()}`,
    operation,
    table,
    data,
    timestamp: Date.now()
  });
}

export async function syncPendingOperations() {
  const database = await getDB();
  const pendingOps = await database.getAll('pending_operations');
  
  for (const op of pendingOps) {
    try {
      // Sync with Supabase
      // Implementation depends on your API structure
      await database.delete('pending_operations', op.id);
    } catch (error) {
      console.error('Failed to sync operation:', error);
    }
  }
}

export async function cacheOfflineData(table: string, data: any[]) {
  const database = await getDB();
  await database.put('offline_data', {
    table,
    data,
    last_sync: Date.now()
  });
}

export async function getOfflineData(table: string) {
  const database = await getDB();
  const cached = await database.get('offline_data', table);
  return cached?.data || [];
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Listen for online/offline events
export function initOfflineListeners() {
  window.addEventListener('online', () => {
    syncPendingOperations();
  });
  
  window.addEventListener('offline', () => {
  });
}
