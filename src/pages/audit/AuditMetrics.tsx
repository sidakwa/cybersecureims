import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Calendar, CheckCircle, AlertCircle, Clock, Target, BarChart3 } from 'lucide-react';
import { AuditNavigation } from '../../components/audit/AuditNavigation';

export default function AuditMetrics() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    totalFindings: 0,
    criticalFindings: 0,
    openFindings: 0,
    resolvedFindings: 0,
    avgComplianceScore: 0,
    auditScores: [],
    findingsBySeverity: [],
    frameworkScores: [],
    findingStatus: [],
    upcomingDeadlines: []
  });

  const { organizationId } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchMetrics();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchMetrics = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      
      const { data: findings } = await supabase
        .from('audit_findings')
        .select('*')
        .eq('organization_id', organizationId);

      const { data: audits } = await supabase
        .from('audit_engagements')
        .select('title, overall_score, standard')
        .eq('organization_id', organizationId)
        .not('overall_score', 'is', null);

      const totalFindings = findings?.length || 0;
      const criticalFindings = findings?.filter(f => f.severity === 'Critical' || f.severity === 'Major').length || 0;
      const openFindings = findings?.filter(f => f.finding_status === 'Open').length || 0;
      const resolvedFindings = findings?.filter(f => f.finding_status === 'Closed' || f.finding_status === 'Resolved').length || 0;
      
      const avgComplianceScore = audits?.length > 0 
        ? Math.round(audits.reduce((sum, a) => sum + parseFloat(a.overall_score), 0) / audits.length)
        : 0;

      const auditScores = audits?.map(audit => ({
        name: audit.title?.substring(0, 25) + (audit.title?.length > 25 ? '...' : ''),
        score: parseFloat(audit.overall_score)
      })).slice(0, 5) || [];

      const severityMap: Record<string, number> = {};
      findings?.forEach(f => { severityMap[f.severity] = (severityMap[f.severity] || 0) + 1; });
      const findingsBySeverity = Object.entries(severityMap).map(([name, value]) => ({ name, value }));

      const frameworkMap: Record<string, { total: number; count: number }> = {};
      audits?.forEach(a => {
        if (a.standard) {
          if (!frameworkMap[a.standard]) frameworkMap[a.standard] = { total: 0, count: 0 };
          frameworkMap[a.standard].total += parseFloat(a.overall_score);
          frameworkMap[a.standard].count++;
        }
      });
      const frameworkScores = Object.entries(frameworkMap).map(([name, data]) => ({ name, score: Math.round(data.total / data.count) })).sort((a, b) => b.score - a.score);

      const statusMap: Record<string, number> = {};
      findings?.forEach(f => { statusMap[f.finding_status || 'Unknown'] = (statusMap[f.finding_status || 'Unknown'] || 0) + 1; });
      const findingStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      const today = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(today.getDate() + 90);
      const upcomingDeadlines = findings?.filter(f => 
        f.due_date && new Date(f.due_date) >= today && new Date(f.due_date) <= ninetyDaysFromNow && f.finding_status !== 'Closed'
      ).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).slice(0, 5) || [];

      setData({ totalFindings, criticalFindings, openFindings, resolvedFindings, avgComplianceScore, auditScores, findingsBySeverity, frameworkScores, findingStatus, upcomingDeadlines });
    } catch (error) {
      console.error('Error fetching metrics:', error);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Metrics & Trends</h1>
        <p className="text-gray-500 mt-1">Compliance analytics and performance insights</p>
      </div>

      <AuditNavigation />

      {/* Rest of the metrics content remains the same */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{data.totalFindings}</div><p className="text-sm text-gray-500">Total Findings</p></CardContent></Card>
        <Card className="bg-red-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{data.criticalFindings}</div><p className="text-sm text-red-600">Critical Findings</p></CardContent></Card>
        <Card className="bg-yellow-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-yellow-600">{data.openFindings}</div><p className="text-sm text-yellow-600">Open Findings</p></CardContent></Card>
        <Card className="bg-green-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{data.resolvedFindings}</div><p className="text-sm text-green-600">Resolved</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Audit Score Trend</CardTitle></CardHeader><CardContent><div className="space-y-3">{data.auditScores.map((audit: any, idx: number) => (<div key={idx}><div className="flex justify-between text-sm mb-1"><span>{audit.name}</span><span>{audit.score}%</span></div><Progress value={audit.score} className="h-2" /></div>))}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Findings by Severity</CardTitle></CardHeader><CardContent><div className="space-y-3">{data.findingsBySeverity.map((item: any, idx: number) => (<div key={idx} className="flex justify-between items-center"><span>{item.name}</span><span className="font-semibold">{item.value}</span></div>))}<div className="pt-3 border-t"><div className="flex justify-between font-semibold"><span>Total Findings</span><span>{data.totalFindings}</span></div></div></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Framework Compliance Scores</CardTitle></CardHeader><CardContent><div className="space-y-3">{data.frameworkScores.map((framework: any, idx: number) => (<div key={idx}><div className="flex justify-between text-sm mb-1"><span>{framework.name}</span><span>{framework.score}%</span></div><Progress value={framework.score} className="h-2" /></div>))}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Finding Status</CardTitle></CardHeader><CardContent><div className="space-y-3">{data.findingStatus.map((status: any) => (<div key={status.name} className="flex justify-between items-center"><span>{status.name}</span><span className="font-semibold">{status.value}</span></div>))}</div></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Upcoming Deadlines (Next 90 Days)</CardTitle></CardHeader><CardContent><div className="space-y-3">{data.upcomingDeadlines.length === 0 ? <p className="text-gray-500 text-center py-4">No upcoming deadlines</p> : data.upcomingDeadlines.map((finding: any) => (<div key={finding.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><div><p className="font-medium">{finding.finding_title}</p><div className="flex items-center gap-2 mt-1"><Badge className="bg-red-100 text-red-800">{finding.severity}</Badge><span className="text-sm text-gray-500">Due: {new Date(finding.due_date).toLocaleDateString()}</span></div></div><Badge>{new Date(finding.due_date) < new Date() ? 'Overdue' : 'Pending'}</Badge></div>))}</div></CardContent></Card>
    </div>
  );
}
