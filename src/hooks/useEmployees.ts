import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Personnel {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: string;
  training_type: string;
  training_completion_rate: number;
  last_training_date: string;
  created_at: string;
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEmployees = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('personnel')
        .select('*')
        .order('full_name', { ascending: true });

      if (fetchError) throw fetchError;
      setEmployees(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { employees, loading, error, refetch: fetchEmployees };
}
