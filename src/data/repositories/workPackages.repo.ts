import { db } from '../client';

export interface WorkPackage {
  wp_id: string;
  organization_id: string;
  wp_code: string;
  wp_name: string;
  status: string;
  owner: string;
  created_at: string;
}

export class WorkPackageRepo {
  static async all(orgId: string) {
    return db
      .from('work_package_register')
      .select('*')
      .eq('organization_id', orgId);
  }

  static async byCode(orgId: string, wpCode: string) {
    return db
      .from('work_package_register')
      .select('*')
      .eq('organization_id', orgId)
      .eq('wp_code', wpCode)
      .single();
  }

  static async byId(orgId: string, wpId: string) {
    return db
      .from('work_package_register')
      .select('*')
      .eq('organization_id', orgId)
      .eq('wp_id', wpId)
      .single();
  }
}
