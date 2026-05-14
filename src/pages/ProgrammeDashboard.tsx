import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Package, Shield, Target, AlertCircle, Rocket } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

export default function ProgrammeDashboard() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

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
      const [wpRes, uciRes, csiRes, risksRes] = await Promise.all([
        supabase.from('work_package_register').select('*'),
        supabase.from('uci_controls').select('uci_status'),
        supabase.from('csi_items').select('status, priority, created_at'),
        supabase.from('cyber_risks').select('risk_score, status')
      ]);

      const wps = wpRes.data || [];
      const uci = uciRes.data || [];
      const csi = csiRes.data || [];
      const risks = risksRes.data || [];

      const completedWPs = wps.filter(w => w.status === 'Completed').length;
      const completionPercent = Math.round((completedWPs / (wps.length || 1)) * 100);
      const velocity = wps.filter(w => w.status === 'Completed' && new Date(w.created_at).getMonth() === new Date().getMonth()).length;
      const blockedWPs = wps.filter(w => w.status === 'Blocked').length;

      const implementedControls = uci.filter(c => c.uci_status === 'In Place').length;
      const controlUplift = Math.round((implementedControls / (uci.length || 1)) * 100);
      const riskReduction = risks.filter(r => r.status === 'Mitigated').length;

      const healthScore = Math.round((completionPercent * 0.3) + (controlUplift * 0.25) + ((riskReduction / (risks.length || 1)) * 100 * 0.25) + 20);

      const wpByProject = wps.reduce((acc: any, wp) => {
        const project = wp.wp_code?.split('-')[0] || 'Other';
        acc[project] = (acc[project] || 0) + 1;
        return acc;
      }, {});

      const uciStatus = [
        { name: 'Implemented', value: implementedControls, color: '#10b981' },
        { name: 'Partial', value: uci.filter(c => c.uci_status === 'Partial').length, color: '#f59e0b' },
        { name: 'Not Started', value: uci.length - implementedControls, color: '#ef4444' }
      ];

      const burnData = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        const monthName = month.toLocaleString('default', { month: 'short' });
        burnData.push({ month: monthName, remaining: wps.length });
      }

      setData({
        completionPercent, velocity, blockedWPs, controlUplift, riskReduction, healthScore,
        wpByProject: Object.entries(wpByProject).map(([k, v]) => ({ name: k, value: v })),
        uciStatus, burnData,
        totalWPs: wps.length, totalCSI: csi.length, completedCSI: csi.filter(c => c.status === 'Completed').length,
        implementedControls, totalControls: uci.length
      });
    } catch (error) {
      console.error('ProgrammeDashboard fetch error:', error);
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

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <PageHeader title="CSI Programme Dashboard" description="Track your cyber security improvement programme" icon={<Target className="h-6 w-6" />} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6"><div className="text-3xl font-bold">{data?.healthScore || 0}/100</div><p>Programme Health Score</p></CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Work Package Progress</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{data?.completionPercent || 0}%</div><Progress value={data?.completionPercent || 0} className="mt-2" /></CardContent></Card>
        <Card><CardHeader><CardTitle>Controls Implemented</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{data?.implementedControls || 0}/{data?.totalControls || 0}</div><p className="text-sm text-gray-500">{data?.controlUplift || 0}% uplift</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Risks Mitigated</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{data?.riskReduction || 0}</div><p className="text-sm text-gray-500">Total risks reduced</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Work Package Status</CardTitle></CardHeader><CardContent><div className="space-y-2"><div className="flex justify-between"><span>Completed</span><span className="font-bold">{data?.completionPercent || 0}%</span></div><Progress value={data?.completionPercent || 0} /><div className="flex justify-between mt-4"><span>Velocity</span><span className="font-bold">{data?.velocity || 0}/month</span></div><div className="flex justify-between"><span>Blocked</span><span className="font-bold text-red-600">{data?.blockedWPs || 0}</span></div></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Control Implementation</CardTitle></CardHeader><CardContent><div className="space-y-2">{data?.uciStatus?.map((item: any, idx: number) => (<div key={idx} className="flex justify-between"><span>{item.name}</span><span className="font-bold">{item.value}</span></div>))}</div></CardContent></Card>
      </div>
    </div>
  );
}
