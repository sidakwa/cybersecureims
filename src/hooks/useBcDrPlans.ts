import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { BcDrPlan } from '@/lib/cybersecure-types';

export function useBcDrPlans() {
  const { organizationId } = useAuth();
  const [plans, setPlans] = useState<BcDrPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    if (!organizationId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('bc_dr_plans')
      .select('*')
      .eq('organization_id', organizationId)
      .order('plan_type')
      .order('plan_name');
    if (!error && data) setPlans(data);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, [organizationId]);

  const addPlan = async (plan: Partial<BcDrPlan>) => {
    const { error } = await supabase.from('bc_dr_plans').insert({ ...plan, organization_id: organizationId });
    if (!error) await fetchPlans();
    return !error;
  };

  const updatePlan = async (id: string, updates: Partial<BcDrPlan>) => {
    const { error } = await supabase.from('bc_dr_plans').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', organizationId);
    if (!error) await fetchPlans();
    return !error;
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from('bc_dr_plans').delete().eq('id', id).eq('organization_id', organizationId);
    if (!error) await fetchPlans();
    return !error;
  };

  return { plans, loading, addPlan, updatePlan, deletePlan, refetch: fetchPlans };
}
