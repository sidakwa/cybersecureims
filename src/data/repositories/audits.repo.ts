import { db } from '../client';

export interface AuditEngagement {
  id: string;
  audit_ref: string;
  title: string;
  audit_type: string;
  standard: string;
  scope: string;
  status: string;
  overall_score: number;
  assessor: string;
  start_date: string;
  end_date: string;
  report_link: string;
  organization_id: string;
}

export class AuditsRepo {
  static async all(orgId: string) {
    const { data, error } = await db
      .from('audit_engagements')
      .select('*')
      .eq('organization_id', orgId)
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return { data, error };
  }

  static async byId(orgId: string, id: string) {
    const { data, error } = await db
      .from('audit_engagements')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return { data, error };
  }
}
