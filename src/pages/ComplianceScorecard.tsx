import { CheckCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function ComplianceScorecard() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  const { organizationId } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchComplianceData();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchComplianceData = async () => {
    if (!organizationId) return;

    try {
      const [controlsRes, frameworkRes, findingsRes] = await Promise.all([
        supabase.from('uci_controls').select('uci_status, target_maturity'),
        supabase.from('framework_controls').select('framework, status'),
        supabase.from('audit_findings').select('finding_status')
      ]);

      const uciControls = controlsRes.data || [];
      const frameworkControls = frameworkRes.data || [];
      const findings = findingsRes.data || [];

      const totalControls = uciControls.length;
      const implemented = uciControls.filter(c => c.uci_status === 'In Place').length;
      const partial = uciControls.filter(c => c.uci_status === 'Partial').length;
      const implementationRate = totalControls > 0 ? (implemented / totalControls) * 100 : 0;

      const criticalControls = uciControls.filter(c => c.target_maturity === 'L3' || c.target_maturity === 'L4').length;
      const criticalImplemented = uciControls.filter(c => (c.target_maturity === 'L3' || c.target_maturity === 'L4') && c.uci_status === 'In Place').length;
      const criticalGap = criticalControls - criticalImplemented;

      setData({
        totalControls,
        implemented,
        partial,
        implementationRate,
        criticalControls,
        criticalImplemented,
        criticalGap,
        frameworkControls: frameworkControls.length,
        openFindings: findings.filter(f => f.finding_status !== 'Resolved').length
      });
    } catch (error) {
      console.error('ComplianceScorecard error:', error);
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

  const pieData = [
    { name: 'Implemented', value: data?.implemented || 0 },
    { name: 'Partial', value: data?.partial || 0 },
    { name: 'Not Implemented', value: (data?.totalControls || 0) - (data?.implemented || 0) - (data?.partial || 0) }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <PageHeader title="Compliance Scorecard" description="Track your compliance metrics across frameworks" icon={<CheckCircle className="h-6 w-6" />} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Implementation Rate</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{Math.round(data?.implementationRate || 0)}%</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Controls Implemented</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{data?.implemented || 0}/{data?.totalControls || 0}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Critical Controls Gap</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-red-600">{data?.criticalGap || 0}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Open Findings</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-yellow-600">{data?.openFindings || 0}</div></CardContent></Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Control Implementation</CardTitle></CardHeader><CardContent><Progress value={data?.implementationRate || 0} className="mb-4" /><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value"><Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div></CardContent></Card>
        
        <Card><CardHeader><CardTitle>Framework Coverage</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-center">{data?.frameworkControls || 0}</div><p className="text-center text-gray-500 mt-2">Framework Controls Mapped</p></CardContent></Card>
      </div>
    </div>
  );
}
