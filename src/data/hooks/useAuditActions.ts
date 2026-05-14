import { useEffect, useState } from 'react';
import { ActionsRepo } from '../repositories/actions.repo';
import { useAuth } from '../../contexts/AuthContext';

export function useAuditActions() {
  const { organizationId } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    const load = async () => {
      const { data } = await ActionsRepo.all(organizationId);
      setData(data || []);
      setLoading(false);
    };
    load();
  }, [organizationId]);

  return { data, loading };
}
