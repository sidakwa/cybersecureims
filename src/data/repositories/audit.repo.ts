import { db } from '../client';

export interface AuditEngagement {
  id?: string;
  organization_id: string;
  audit_ref: string;
  title: string;
  audit_type: string;
  standard?: string;
  scope?: string;
  assessor?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  overall_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuditFinding {
  id?: string;
  audit_id: string;
  control_id?: string;
  work_package_id?: string;
  finding_ref: string;
  finding_title: string;
  severity?: string;
  finding_status?: string;
  observation?: string;
  root_cause?: string;
  recommendation?: string;
  owner?: string;
  due_date?: string;
  resolved_date?: string;
}

export class AuditRepo {
  static async all(orgId: string) {
    return db
      .from('audit_engagements')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
  }

  static async byId(id: string) {
    return db
      .from('audit_engagements')
      .select('*')
      .eq('id', id)
      .single();
  }

  static async create(payload: AuditEngagement) {
    return db
      .from('audit_engagements')
      .insert(payload)
      .select()
      .single();
  }

  static async update(id: string, payload: Partial<AuditEngagement>) {
    return db
      .from('audit_engagements')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
  }

  static async delete(id: string) {
    return db
      .from('audit_engagements')
      .delete()
      .eq('id', id);
  }

  static async findings(auditId: string) {
    return db
      .from('audit_findings')
      .select('*')
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false });
  }

  static async createFinding(payload: AuditFinding) {
    return db
      .from('audit_findings')
      .insert(payload)
      .select()
      .single();
  }

  static async updateFinding(id: string, payload: Partial<AuditFinding>) {
    return db
      .from('audit_findings')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
  }

  static async deleteFinding(id: string) {
    return db
      .from('audit_findings')
      .delete()
      .eq('id', id);
  }
}
