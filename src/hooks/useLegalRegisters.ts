import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface LegalRegister {
  id: string;
  title: string;
  jurisdiction: string;
  category: string;
  status: string;
  compliance_deadline: string;
  cross_reference_status: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function useLegalRegisters() {
  const [registers, setRegisters] = useState<LegalRegister[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegisters = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('legal_registers')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }
      
      setRegisters(data || []);
    } catch (error) {
      console.error('Error fetching legal registers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRegister = async (register: any) => {
    try {
      
      // Prepare the data for insert
      const insertData = {
        title: register.title,
        jurisdiction: register.jurisdiction || null,
        category: register.category || null,
        status: register.status || 'active',
        compliance_deadline: register.compliance_deadline || null,
        cross_reference_status: register.cross_reference_status || 0,
        notes: register.notes || null,
      };
      
      
      const { data, error } = await supabase
        .from('legal_registers')
        .insert([insertData])
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        return { success: false, error: error.message };
      }
      
      
      // Refresh the list
      await fetchRegisters();
      
      return { success: true, data: data?.[0] };
    } catch (error: any) {
      console.error('Exception in addRegister:', error);
      return { success: false, error: error.message };
    }
  };

  const updateRegister = async (id: string, updates: any) => {
    try {
      
      const { error } = await supabase
        .from('legal_registers')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      await fetchRegisters();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating register:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteRegister = async (id: string) => {
    try {
      
      const { error } = await supabase
        .from('legal_registers')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      await fetchRegisters();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting register:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchRegisters();
  }, []);

  return { registers, loading, addRegister, updateRegister, deleteRegister, refresh: fetchRegisters };
}
