import { FileBarChart } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function ReportPortal() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    uciTotal: 0,
    uciImplemented: 0,
    riskTotal: 0,
    riskCritical: 0,
    riskHigh: 0,
    riskMedium: 0,
    riskLow: 0
  });
  
  const { organizationId } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchData = async () => {
    if (!organizationId) return;

    try {
      const [uciRes, riskRes] = await Promise.all([
        supabase.from('uci_controls').select('uci_status'),
        supabase.from('cyber_risks').select('risk_level')
      ]);

      const uciControls = uciRes.data || [];
      const risks = riskRes.data || [];

      const uciImplemented = uciControls.filter(c => c.uci_status === 'In Place').length;

      const riskCritical = risks.filter(r => r.risk_level === 'Critical').length;
      const riskHigh = risks.filter(r => r.risk_level === 'High').length;
      const riskMedium = risks.filter(r => r.risk_level === 'Medium').length;
      const riskLow = risks.filter(r => r.risk_level === 'Low').length;

      setStats({
        uciTotal: uciControls.length,
        uciImplemented,
        riskTotal: risks.length,
        riskCritical,
        riskHigh,
        riskMedium,
        riskLow
      });
    } catch (error) {
      console.error('ReportPortal error:', error);
    } finally {
      setLoading(false);
    }
  };

  const riskData = [
    { name: 'Critical', value: stats.riskCritical, color: '#ef4444' },
    { name: 'High', value: stats.riskHigh, color: '#f97316' },
    { name: 'Medium', value: stats.riskMedium, color: '#f59e0b' },
    { name: 'Low', value: stats.riskLow, color: '#10b981' }
  ];

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <PageHeader title="Report Portal" description="Generate and view compliance reports" icon={<FileBarChart className="h-6 w-6" />} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Control Implementation</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-green-600">{Math.round((stats.uciImplemented / (stats.uciTotal || 1)) * 100)}%</div>
              <p className="text-gray-500">Implementation Rate</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Implemented:</span><span className="font-bold">{stats.uciImplemented}</span></div>
              <div className="flex justify-between"><span>Total Controls:</span><span className="font-bold">{stats.uciTotal}</span></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Risk Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Available Reports</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">Compliance Summary Report</Button>
            <Button variant="outline" className="w-full justify-start">Risk Assessment Report</Button>
            <Button variant="outline" className="w-full justify-start">Control Implementation Report</Button>
            <Button variant="outline" className="w-full justify-start">Audit Findings Report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
