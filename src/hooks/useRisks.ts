import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Risk {
  id: string;
  risk_title: string;
  risk_description: string;
  likelihood: number;
  impact: number;
  risk_score: number;
  status: string;
  work_package_id: string;
  created_at: string;
}

export function useRisks() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organizationId } = useAuth();

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const fetchRisks = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('cyber_risks')
          .select('*')
          .eq('organization_id', organizationId)
          .order('risk_score', { ascending: false });

        if (fetchError) throw fetchError;
        setRisks(data || []);
      } catch (err: any) {
        console.error('Error fetching risks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRisks();
  }, [organizationId]);

  return { risks, loading, error };
}
