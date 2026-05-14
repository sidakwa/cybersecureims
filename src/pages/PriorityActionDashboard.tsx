import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, Zap, TrendingUp, Clock, Target, User } from 'lucide-react';

export default function PriorityActionDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, loading: authLoading } = useAuth();
  const organizationId = profile?.organization_id;
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const filterParam = searchParams.get('filter');

  useEffect(() => {
      if (authLoading) return;
    if (organizationId) {
      fetchPriorityActions();
    }
  }, [organizationId, authLoading]);

  const fetchPriorityActions = async () => {
    if (!organizationId) return;
    
    try {
      const { data: workPackages } = await supabase
        .from('work_package_register')
        .select('*')
        .eq('organization_id', organizationId);
      
      const { data: risks } = await supabase
        .from('cyber_risks')
        .select('*')
        .eq('organization_id', organizationId);
      
      const riskMap = new Map();
      risks?.forEach(risk => { if (risk.work_package_id) riskMap.set(risk.work_package_id, risk); });
      
      const actionItems = (workPackages || []).map(wp => {
        const associatedRisk = riskMap.get(wp.wp_id);
        const riskScore = associatedRisk?.risk_score || 10;
        const impactScore = Math.min(riskScore * 5, 100);
        const priorityScore = Math.round((impactScore * 0.7) + 30);
        const priority = riskScore >= 20 ? 'Critical' : riskScore >= 15 ? 'Major' : riskScore >= 10 ? 'Important' : 'Medium';
        return { ...wp, priority, priority_score: priorityScore, risk_score: riskScore, impact_score: impactScore };
      });
      
      actionItems.sort((a, b) => b.priority_score - a.priority_score);
      
      let filtered = actionItems;
      if (filterParam === 'overdue') {
        filtered = actionItems.filter(a => a.due_date && new Date(a.due_date) < new Date() && a.status !== 'Completed');
      } else if (filterParam === 'blocked') {
        filtered = actionItems.filter(a => a.status === 'Blocked');
      }
      
      setActions(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <PageHeader title="Priority Action Dashboard" description="Based on Compliance Audits and Risk Assessment" icon={<AlertCircle className="h-6 w-6" />} />
      {filterParam && <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center"><span>Filtered by: {filterParam}</span><Button variant="ghost" size="sm" onClick={() => navigate('/priority-actions')}>Clear filter</Button></div>}
      <div className="space-y-4">{actions.slice(0, 10).map((action, idx) => (<div key={action.wp_id} className="border rounded-lg p-4"><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center gap-2 mb-2"><span className="text-lg font-bold text-gray-400">#{idx + 1}</span><Badge className={action.priority === 'Critical' ? 'bg-red-500' : 'bg-orange-500'}>{action.priority}</Badge><Badge className={action.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-500'}>{action.status}</Badge></div><h3 className="font-semibold text-lg">{action.wp_name}</h3><div className="mt-2 text-sm text-gray-600"><span>Risk Score: {action.risk_score}</span></div></div><div className="text-right"><div className="text-xl font-bold text-blue-600">{action.priority_score}</div><div className="text-xs text-gray-500">Priority Score</div></div></div></div>))}</div>
    </div>
  );
}
