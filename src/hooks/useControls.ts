import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { FrameworkControl, Framework } from '@/lib/cybersecure-types';

export function useControls(framework?: Framework) {
  const { organizationId } = useAuth();
  const [controls, setControls] = useState<FrameworkControl[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchControls = async () => {
    if (!organizationId) return;
    setLoading(true);
    let query = supabase
      .from('framework_controls')
      .select('*')
      .eq('organization_id', organizationId)
      .order('framework')
      .order('control_id');
    if (framework) query = query.eq('framework', framework);
    const { data, error } = await query;
    if (!error && data) setControls(data);
    setLoading(false);
  };

  useEffect(() => { fetchControls(); }, [organizationId, framework]);

  const updateControl = async (id: string, updates: Partial<FrameworkControl>) => {
    const { error } = await supabase
      .from('framework_controls')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId);
    if (!error) await fetchControls();
    return !error;
  };

  const addControl = async (control: Partial<FrameworkControl>) => {
    const { error } = await supabase
      .from('framework_controls')
      .insert({ ...control, organization_id: organizationId });
    if (!error) await fetchControls();
    return !error;
  };

  const deleteControl = async (id: string) => {
    const { error } = await supabase
      .from('framework_controls')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);
    if (!error) await fetchControls();
    return !error;
  };

  // Computed stats
  const getStats = (fw?: Framework) => {
    const filtered = fw ? controls.filter(c => c.framework === fw) : controls;
    const implemented = filtered.filter(c => c.status === 'implemented').length;
    const inProgress = filtered.filter(c => c.status === 'in_progress').length;
    const notApplicable = filtered.filter(c => c.status === 'not_applicable').length;
    const total = filtered.length;
    const applicable = total - notApplicable;
    const score = applicable > 0 ? Math.round((implemented / applicable) * 100) : 0;
    return { total, implemented, inProgress, notApplicable, applicable, score };
  };

  const getDomainStats = (fw: Framework) => {
    const filtered = controls.filter(c => c.framework === fw);
    const domains = [...new Set(filtered.map(c => c.control_domain))];
    return domains.map(domain => {
      const domainControls = filtered.filter(c => c.control_domain === domain);
      const implemented = domainControls.filter(c => c.status === 'implemented').length;
      const total = domainControls.length;
      return { domain, total, implemented, score: total > 0 ? Math.round((implemented / total) * 100) : 0 };
    });
  };

  return { controls, loading, updateControl, addControl, deleteControl, getStats, getDomainStats, refetch: fetchControls };
}
