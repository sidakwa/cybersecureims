import { useEffect, useState } from 'react';
import { FindingsRepo } from '../repositories/findings.repo';
import { useAuth } from '../../contexts/AuthContext';

export function useAuditFindings() {
  const { organizationId } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await FindingsRepo.all(organizationId);
        if (error) throw error;
        setData(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [organizationId]);

  return { data, loading, error };
}
