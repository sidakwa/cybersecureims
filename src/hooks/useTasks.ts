import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: string;
  created_at: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
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
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (fetchError) {
        // If table doesn't exist yet, return empty array
        if (fetchError.code === 'PGRST205') {
          setTasks([]);
          setError(null);
        } else {
          throw fetchError;
        }
      } else {
        setTasks(data || []);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (task: Omit<Task, 'id' | 'created_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchTasks();
      return data;
    } catch (err: any) {
      console.error('Error adding task:', err);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchTasks();
    } catch (err: any) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchTasks();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  return { tasks, loading, error, addTask, updateTask, deleteTask, refetch: fetchTasks };
}
