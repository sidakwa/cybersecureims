import { db } from '../client';

export interface UCIControl {
  id: string;
  organization_id: string;
  control_code: string;
  control_name: string;
  uci_status: string;
  current_maturity: string;
  target_maturity: string;
  work_package_id: string;
}

export class UCIControlsRepo {
  static async all(orgId: string) {
    return db
      .from('uci_controls')
      .select('*')
      .eq('organization_id', orgId);
  }

  static async byWorkPackage(orgId: string, wpId: string) {
    return db
      .from('uci_controls')
      .select('*')
      .eq('organization_id', orgId)
      .eq('work_package_id', wpId);
  }

  static async updateStatus(orgId: string, controlId: string, status: string) {
    return db
      .from('uci_controls')
      .update({ uci_status: status, updated_at: new Date().toISOString() })
      .eq('id', controlId)
      .eq('organization_id', orgId);
  }
}
