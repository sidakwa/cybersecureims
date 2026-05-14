import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface SecurityAssessment {
  id: string;
  organization_id: string;
  title: string;
  assessment_date: string;
  assessor: string;
  standard: string;
  audit_type: string;
  framework_scope: string[];
  control_domain?: string;
  corrective_actions: any[];
  status: string;
  score?: number;
  findings?: string;
  created_at: string;
  updated_at: string;
}

export function useAudits() {
  const [audits, setAudits] = useState<SecurityAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAudits = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('security_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAudits(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching audits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addAudit = async (audit: Omit<SecurityAssessment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('security_assessments')
        .insert([audit])
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchAudits();
      return data;
    } catch (err: any) {
      console.error('Error adding audit:', err);
      throw err;
    }
  };

  const updateAudit = async (id: string, updates: Partial<SecurityAssessment>) => {
    try {
      const { error: updateError } = await supabase
        .from('security_assessments')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchAudits();
    } catch (err: any) {
      console.error('Error updating audit:', err);
      throw err;
    }
  };

  const deleteAudit = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('security_assessments')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchAudits();
    } catch (err: any) {
      console.error('Error deleting audit:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  return { audits, loading, error, addAudit, updateAudit, deleteAudit, refetch: fetchAudits };
}

export default useAudits;
