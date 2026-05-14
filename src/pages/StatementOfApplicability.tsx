import { FileCheck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function StatementOfApplicability() {
  const { profile, loading: authLoading } = useAuth();
  const [controls, setControls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { organizationId } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchControls();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchControls = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('uci_controls')
        .select('id, control_code, control_name, uci_status')
        .eq('organization_id', organizationId)
        .order('control_code', { ascending: true });

      if (error) throw error;
      setControls(data || []);
    } catch (error) {
      console.error('Error fetching SoA:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const implemented = controls.filter(c => c.uci_status === 'In Place').length;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <PageHeader title="Statement of Applicability" description="ISO 27001 control applicability and justification" icon={<FileCheck className="h-6 w-6" />} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{controls.length}</div>
            <p className="text-sm text-gray-500">Total Controls</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{implemented}</div>
            <p className="text-sm text-gray-500">Implemented</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-600">{controls.length - implemented}</div>
            <p className="text-sm text-gray-500">Not Started</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Control ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Control Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {controls.map((control) => (
                  <tr key={control.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{control.control_code}</td>
                    <td className="px-4 py-3">{control.control_name}</td>
                    <td className="px-4 py-3">
                      <Badge className={control.uci_status === 'In Place' ? 'bg-green-500' : 'bg-gray-500'}>
                        {control.uci_status || 'Not Started'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
