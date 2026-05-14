import { db } from '../client';
import { WorkPackageRepo } from '../repositories/workPackages.repo';

export class CSIService {
  static async getPriorityActions(orgId: string) {
    const { data: csiItems } = await db
      .from('csi_items')
      .select(`
        *,
        work_package_register (
          wp_code,
          wp_name
        )
      `)
      .eq('organization_id', orgId)
      .eq('priority', 'High');
    
    return csiItems || [];
  }

  static async getStats(orgId: string) {
    const { data: items } = await db
      .from('csi_items')
      .select('status, priority')
      .eq('organization_id', orgId);
    
    return {
      total: items?.length || 0,
      critical: items?.filter(i => i.priority === 'Critical').length || 0,
      high: items?.filter(i => i.priority === 'High').length || 0,
      inProgress: items?.filter(i => i.status === 'In Progress').length || 0,
      completed: items?.filter(i => i.status === 'Completed').length || 0
    };
  }
}
