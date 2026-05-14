import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';

export default function CyberRiskAssessment() {
  const { profile, loading: authLoading } = useAuth();
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const organizationId = profile?.organization_id;

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchRisks();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchRisks = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cyber_risks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('risk_score', { ascending: false });

      if (error) throw error;
      setRisks(data || []);
    } catch (err) {
      console.error('Error fetching risks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelBadge = (score: number) => {
    if (score >= 20) return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
    if (score >= 10) return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
    if (score >= 5) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cyber Risk Register</h1>
          <p className="text-gray-500 mt-1">Identify and manage cybersecurity risks</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Risk</Button>
      </div>

      <div className="grid gap-4">
        {risks.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No risks found.</CardContent></Card>
        ) : (
          risks.map((risk) => (
            <Card key={risk.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-semibold text-lg">{risk.risk_title}</h3>
                      {getRiskLevelBadge(risk.risk_score)}
                    </div>
                    <p className="text-sm text-gray-600">{risk.risk_description}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>Score: {risk.risk_score}</span>
                      <span>Status: {risk.status || 'Active'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
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
