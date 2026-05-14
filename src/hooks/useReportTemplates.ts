import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  template_data: any;
  created_at: string;
}

export function useReportTemplates() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTemplates = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('report_templates')
        .select('*');

      if (fetchError) {
        // If table doesn't exist yet, return default templates
        if (fetchError.code === 'PGRST205') {
          const defaultTemplates = [
            { id: '1', name: 'Compliance Summary', description: 'Overall compliance status report', type: 'compliance', template_data: {}, created_at: new Date().toISOString() },
            { id: '2', name: 'Risk Assessment Report', description: 'Detailed risk analysis', type: 'risk', template_data: {}, created_at: new Date().toISOString() },
            { id: '3', name: 'Incident Report', description: 'Security incident summary', type: 'incident', template_data: {}, created_at: new Date().toISOString() },
          ];
          setTemplates(defaultTemplates);
          setError(null);
        } else {
          throw fetchError;
        }
      } else {
        setTemplates(data || []);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching report templates:', err);
      // Return default templates on error
      const defaultTemplates = [
        { id: '1', name: 'Compliance Summary', description: 'Overall compliance status report', type: 'compliance', template_data: {}, created_at: new Date().toISOString() },
        { id: '2', name: 'Risk Assessment Report', description: 'Detailed risk analysis', type: 'risk', template_data: {}, created_at: new Date().toISOString() },
        { id: '3', name: 'Incident Report', description: 'Security incident summary', type: 'incident', template_data: {}, created_at: new Date().toISOString() },
      ];
      setTemplates(defaultTemplates);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates };
}
