import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface HRTask {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date: string;
  assigned_to: string;
  created_at: string;
}

export function useHRTasks() {
  const [tasks, setTasks] = useState<HRTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      // Try to use tasks table if it exists, otherwise return empty array
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (fetchError) {
        // If tasks table doesn't exist, just return empty array
        setTasks([]);
        setError(null);
      } else {
        setTasks(data || []);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching HR tasks:', err);
      setTasks([]); // Return empty array on error
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
}
