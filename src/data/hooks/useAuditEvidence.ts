import { useEffect, useState } from 'react';
import { EvidenceRepo } from '../repositories/evidence.repo';
import { useAuth } from '../../contexts/AuthContext';

export function useAuditEvidence() {
  const { organizationId } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    const load = async () => {
      const { data } = await EvidenceRepo.all(organizationId);
      setData(data || []);
      setLoading(false);
    };
    load();
  }, [organizationId]);

  return { data, loading };
}
