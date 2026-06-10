import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock idb before importing offlineService so the DB never actually opens
vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

// Mock supabase — we want to verify the calls were made, not hit the network
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../lib/supabase';
import { openDB } from 'idb';

// Helper to build a fake IDB with preset pending_operations
function mockDB(ops: any[]) {
  const deleted: string[] = [];
  return {
    getAll: vi.fn().mockResolvedValue(ops),
    delete: vi.fn().mockImplementation((_store: string, id: string) => {
      deleted.push(id);
      return Promise.resolve();
    }),
    _deleted: deleted,
  };
}

// Helper to make supabase.from().insert/update/delete chains succeed
function mockSupabaseSuccess() {
  const chain = { error: null };
  const fromMock = {
    insert: vi.fn().mockResolvedValue(chain),
    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(chain) }),
    delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(chain) }),
  };
  (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(fromMock);
  return fromMock;
}

describe('syncPendingOperations', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('calls supabase.insert for CREATE operations', async () => {
    const db = mockDB([{ id: 'op1', operation: 'CREATE', table: 'cyber_risks', data: { name: 'test' } }]);
    (openDB as ReturnType<typeof vi.fn>).mockResolvedValue(db);
    const sbMock = mockSupabaseSuccess();

    // Re-import after mocking DB
    const { syncPendingOperations } = await import('../services/offlineService');
    await syncPendingOperations();

    expect(sbMock.insert).toHaveBeenCalledWith({ name: 'test' });
    expect(db.delete).toHaveBeenCalledWith('pending_operations', 'op1');
  });

  it('does NOT delete from queue if Supabase write fails', async () => {
    const db = mockDB([{ id: 'op2', operation: 'CREATE', table: 'cyber_risks', data: { name: 'fail' } }]);
    (openDB as ReturnType<typeof vi.fn>).mockResolvedValue(db);
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: new Error('network error') }),
    });

    const { syncPendingOperations } = await import('../services/offlineService');
    await syncPendingOperations();

    // Must NOT delete — leave in queue for retry
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('processes all pending ops and deletes each after success', async () => {
    const ops = [
      { id: 'op3', operation: 'UPDATE', table: 'framework_controls', data: { id: 'c1', status: 'implemented' } },
      { id: 'op4', operation: 'DELETE', table: 'audit_findings', data: { id: 'f1' } },
    ];
    const db = mockDB(ops);
    (openDB as ReturnType<typeof vi.fn>).mockResolvedValue(db);
    mockSupabaseSuccess();

    const { syncPendingOperations } = await import('../services/offlineService');
    await syncPendingOperations();

    expect(db.delete).toHaveBeenCalledTimes(2);
    expect(db._deleted).toContain('op3');
    expect(db._deleted).toContain('op4');
  });
});
