import { db } from '../client';

export class EvidenceRepo {
  static async all(orgId: string) {
    const { data, error } = await db
      .from('audit_evidence')
      .select(`
        *,
        audit_engagements (
          audit_ref,
          title
        )
      `)
      .eq('organization_id', orgId);
    
    if (error) throw error;
    return { data, error };
  }
}
