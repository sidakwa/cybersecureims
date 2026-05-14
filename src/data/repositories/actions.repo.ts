import { db } from '../client';

export class ActionsRepo {
  static async all(orgId: string) {
    const { data, error } = await db
      .from('audit_actions')
      .select(`
        *,
        audit_findings (
          finding_title,
          severity
        )
      `)
      .eq('organization_id', orgId);
    
    if (error) throw error;
    return { data, error };
  }
}
