import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { WorkPackageRepo, WorkPackage } from '../repositories/workPackages.repo';

export function useWorkPackages() {
  const [data, setData] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const { organizationId } = useAuth();

  useEffect(() => {
    if (!organizationId) return;
    
    const fetchData = async () => {
      setLoading(true);
      const { data: result } = await WorkPackageRepo.all(organizationId);
      setData(result || []);
      setLoading(false);
    };
    
    fetchData();
  }, [organizationId]);

  return { data, loading };
}
