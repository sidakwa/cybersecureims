import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { supabase } from '../lib/supabase';

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
      if (op.operation === 'CREATE') {
        const { error } = await supabase.from(op.table as any).insert(op.data);
        if (error) throw error;
      } else if (op.operation === 'UPDATE') {
        const { error } = await supabase.from(op.table as any).update(op.data).eq('id', op.data.id);
        if (error) throw error;
      } else if (op.operation === 'DELETE') {
        const { error } = await supabase.from(op.table as any).delete().eq('id', op.data.id);
        if (error) throw error;
      }
      // Only remove from queue after confirmed Supabase write
      await database.delete('pending_operations', op.id);
    } catch (error) {
      console.error(`Failed to sync ${op.operation} on ${op.table}:`, error);
      // Leave in queue — will retry on next online event
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
