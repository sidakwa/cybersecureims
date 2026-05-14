import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ScheduledReport {
  id: string;
  name: string;
  cron_expression: string;
  status: string;
  last_run: string;
  next_run: string;
}

export function useScheduledReports() {
  const { organizationId } = useAuth();
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      
      let query = supabase.from('scheduled_reports').select('*');
      if (organizationId) query = query.eq('organization_id', orgId);
      const { data, error } = await query;
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReport = async (report: any) => {
    try {
      
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert([{ ...report, organization_id: organizationId }])
        .select();
      if (error) throw error;
      await fetchReports();
      return { success: true, data: data?.[0] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateReport = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      await fetchReports();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchReports();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  useEffect(() => { fetchReports(); }, []);
  return { reports, loading, addReport, updateReport, deleteReport, refresh: fetchReports };
}
