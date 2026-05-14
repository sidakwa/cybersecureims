import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { SecurityIncident } from '@/lib/cybersecure-types';

export function useSecurityIncidents() {
  const { organizationId } = useAuth();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    if (!organizationId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (!error && data) setIncidents(data);
    setLoading(false);
  };

  useEffect(() => { fetchIncidents(); }, [organizationId]);

  const addIncident = async (incident: Partial<SecurityIncident>) => {
    const { error } = await supabase.from('security_incidents').insert({ ...incident, organization_id: organizationId });
    if (!error) await fetchIncidents();
    return !error;
  };

  const updateIncident = async (id: string, updates: Partial<SecurityIncident>) => {
    const { error } = await supabase.from('security_incidents').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', organizationId);
    if (!error) await fetchIncidents();
    return !error;
  };

  const deleteIncident = async (id: string) => {
    const { error } = await supabase.from('security_incidents').delete().eq('id', id).eq('organization_id', organizationId);
    if (!error) await fetchIncidents();
    return !error;
  };

  const avgMTTD = () => {
    const withMTTD = incidents.filter(i => i.mean_time_to_detect_hours);
    if (!withMTTD.length) return 0;
    return Math.round(withMTTD.reduce((s, i) => s + (i.mean_time_to_detect_hours || 0), 0) / withMTTD.length);
  };
  const avgMTTR = () => {
    const withMTTR = incidents.filter(i => i.mean_time_to_respond_hours);
    if (!withMTTR.length) return 0;
    return Math.round(withMTTR.reduce((s, i) => s + (i.mean_time_to_respond_hours || 0), 0) / withMTTR.length);
  };

  return { incidents, loading, addIncident, updateIncident, deleteIncident, avgMTTD, avgMTTR, refetch: fetchIncidents };
}
