import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Vulnerability } from '@/lib/cybersecure-types';

export function useVulnerabilities() {
  const { organizationId } = useAuth();
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVulnerabilities = async () => {
    if (!organizationId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('vulnerabilities')
      .select('*')
      .eq('organization_id', organizationId)
      .order('severity')
      .order('discovered_date', { ascending: false });
    if (!error && data) setVulnerabilities(data);
    setLoading(false);
  };

  useEffect(() => { fetchVulnerabilities(); }, [organizationId]);

  const addVulnerability = async (v: Partial<Vulnerability>) => {
    const { error } = await supabase.from('vulnerabilities').insert({ ...v, organization_id: organizationId });
    if (!error) await fetchVulnerabilities();
    return !error;
  };

  const updateVulnerability = async (id: string, updates: Partial<Vulnerability>) => {
    const { error } = await supabase.from('vulnerabilities').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', organizationId);
    if (!error) await fetchVulnerabilities();
    return !error;
  };

  const deleteVulnerability = async (id: string) => {
    const { error } = await supabase.from('vulnerabilities').delete().eq('id', id).eq('organization_id', organizationId);
    if (!error) await fetchVulnerabilities();
    return !error;
  };

  const getSLAStatus = (v: Vulnerability): 'overdue' | 'warning' | 'ok' => {
    if (!v.due_date || v.status === 'resolved') return 'ok';
    const due = new Date(v.due_date);
    const now = new Date();
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 7) return 'warning';
    return 'ok';
  };

  return { vulnerabilities, loading, addVulnerability, updateVulnerability, deleteVulnerability, getSLAStatus, refetch: fetchVulnerabilities };
}
