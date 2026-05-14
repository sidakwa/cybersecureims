import { supabase } from '@/lib/supabase';

export interface AuditLogEntry {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
  table_name?: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  details?: string;
}

export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action: entry.action,
      table_name: entry.table_name,
      record_id: entry.record_id,
      old_data: entry.old_data,
      new_data: entry.new_data,
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

// Helper function to create audit wrapper for CRUD operations
export function withAudit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  action: AuditLogEntry['action'],
  tableName: string
): T {
  return (async (...args: Parameters<T>) => {
    const result = await fn(...args);
    
    if (result?.data?.[0]) {
      await logAuditEvent({
        action,
        table_name: tableName,
        record_id: result.data[0].id,
        new_data: result.data[0]
      });
    }
    
    return result;
  }) as T;
}
