import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrganizationId } from '@/lib/tenant';
import type { 
  ComplianceFramework, 
  FrameworkControl, 
  EvidenceSubmission,
  ControlVerification,
  EvidenceRequest 
} from '@/types/compliance';

export function useFrameworks() {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFrameworks = async () => {
    try {
      const orgId = await getCurrentOrganizationId();
      const { data, error } = await supabase
        .from('compliance_frameworks')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setFrameworks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrameworks();
  }, []);

  return { frameworks, loading, error, refetch: fetchFrameworks };
}

export function useEvidenceSubmissions(clientOrgId?: string) {
  const [submissions, setSubmissions] = useState<EvidenceSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    try {
      let query = supabase.from('evidence_submissions').select('*');
      
      if (clientOrgId) {
        query = query.eq('client_organization_id', clientOrgId);
      } else {
        const orgId = await getCurrentOrganizationId();
        query = query.eq('client_organization_id', orgId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubmissions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSubmission = async (submission: Omit<EvidenceSubmission, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('evidence_submissions')
        .insert([submission])
        .select()
        .single();
      
      if (error) throw error;
      await fetchSubmissions();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateSubmission = async (id: string, updates: Partial<EvidenceSubmission>) => {
    try {
      const { data, error } = await supabase
        .from('evidence_submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchSubmissions();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [clientOrgId]);

  return { 
    submissions, 
    loading, 
    error, 
    refetch: fetchSubmissions,
    createSubmission,
    updateSubmission
  };
}

export function useVerifications() {
  const [verifications, setVerifications] = useState<ControlVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('control_verifications')
        .select('*')
        .order('verified_at', { ascending: false });
      
      if (error) throw error;
      setVerifications(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createVerification = async (verification: Omit<ControlVerification, 'id' | 'verified_at'>) => {
    try {
      const { data, error } = await supabase
        .from('control_verifications')
        .insert([verification])
        .select()
        .single();
      
      if (error) throw error;
      await fetchVerifications();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  return { verifications, loading, error, refetch: fetchVerifications, createVerification };
}
