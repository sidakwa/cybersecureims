import { db } from '../client';

export class FindingsRepo {
  static async all(orgId: string) {
    const { data, error } = await db
      .from('audit_findings')
      .select(`
        *,
        audit_engagements (
          audit_ref,
          title
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error };
  }

  static async byAuditId(orgId: string, auditId: string) {
    const { data, error } = await db
      .from('audit_findings')
      .select('*')
      .eq('organization_id', orgId)
      .eq('audit_id', auditId);
    
    if (error) throw error;
    return { data, error };
  }
}
