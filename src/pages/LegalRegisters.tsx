import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Plus, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LegalRegisters() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [obligations, setObligations] = useState<any[]>([]);
  
  const organizationId = profile?.organization_id;

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchObligations();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchObligations = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('compliance_obligations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setObligations(data || []);
    } catch (error) {
      console.error('LegalRegisters error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'compliant': return <Badge className="bg-green-100 text-green-800">Compliant</Badge>;
      case 'non_compliant': return <Badge className="bg-red-100 text-red-800">Non-Compliant</Badge>;
      case 'in_progress': return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      default: return <Badge variant="outline">{status || 'Pending'}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <PageHeader title="Regulatory Register" description="Track compliance obligations and legal requirements" icon={<BookOpen className="h-6 w-6" />} />
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Obligation</Button>
      </div>
      
      <div className="grid gap-4">
        {obligations.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No compliance obligations found.</CardContent></Card>
        ) : (
          obligations.map((obligation) => (
            <Card key={obligation.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{obligation.title || obligation.obligation_name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{obligation.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      {obligation.effective_date && <span>Effective: {new Date(obligation.effective_date).toLocaleDateString()}</span>}
                      {obligation.authority && <span>Authority: {obligation.authority}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(obligation.status)}
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
