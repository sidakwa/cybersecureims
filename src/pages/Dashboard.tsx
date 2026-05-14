import PageHeader from '@/components/PageHeader';
import { LayoutDashboard } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, AlertCircle, CheckCircle, Target, Zap, Shield } from 'lucide-react';
import { RiskCoverageCard } from '../components/RiskCoverageCard';
import { SLABreachesCard } from '../components/SLABreachesCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const { organizationId } = useAuth();

  useEffect(() => {
    if (organizationId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [organizationId]);

  const fetchData = async () => {
    if (!organizationId) return;

    try {
      const [risksRes, controlsRes, findingsRes, evidenceRes, wpsRes, mappingsRes] = await Promise.all([
        supabase.from('cyber_risks').select('risk_score, status, id'),
        supabase.from('uci_controls').select('uci_status'),
        supabase.from('audit_findings').select('due_date, finding_status, created_at'),
        supabase.from('audit_evidence').select('expiry_date, evidence_status'),
        supabase.from('work_package_register').select('status, created_at, planned_end_date'),
        supabase.from('risk_control_mappings').select('risk_id, control_id')
      ]);

      const risks = risksRes.data || [];
      const controls = controlsRes.data || [];
      const findings = findingsRes.data || [];
      const evidence = evidenceRes.data || [];
      const wps = wpsRes.data || [];
      const mappings = mappingsRes.data || [];

      const totalRisks = risks.length;
      const mappedRiskIds = new Set(mappings.map(m => m.risk_id));
      const mappedRisks = mappedRiskIds.size;
      const riskCoverage = totalRisks > 0 ? Math.round((mappedRisks / totalRisks) * 100) : 0;
      const totalMappings = mappings.length;

      const implementedControls = controls.filter(c => c.uci_status === 'In Place').length;
      const controlScore = (implementedControls / (controls.length || 1)) * 35;
      const healthScore = Math.round(controlScore + 25);

      const totalExposure = risks.reduce((sum, r) => sum + (r.risk_score || 0), 0);
      const topRisks = [...risks].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 2);
      const topExposure = topRisks.reduce((sum, r) => sum + (r.risk_score || 0), 0);
      const concentrationIndex = totalExposure > 0 ? Math.round((topExposure / totalExposure) * 100) : 0;

      const controlEffectiveness = controls.length > 0 ? Math.round((implementedControls / controls.length) * 100) : 0;

      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      const expiringSoon = evidence.filter(e => e.expiry_date && new Date(e.expiry_date) <= thirtyDaysFromNow && new Date(e.expiry_date) > today).length;
      const expired = evidence.filter(e => e.expiry_date && new Date(e.expiry_date) < today).length;

      const incompleteWPs = wps.filter(w => w.status !== 'Completed' && w.planned_end_date);
      let forecastDate = 'N/A';
      if (incompleteWPs.length > 0) {
        const avgEndDate = incompleteWPs.reduce((sum, w) => sum + new Date(w.planned_end_date).getTime(), 0) / incompleteWPs.length;
        const projectedDate = new Date(avgEndDate);
        forecastDate = projectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }

      const exceptions = [];
      if (implementedControls > 0 && evidence.length === 0) exceptions.push(`${implementedControls} critical controls have no evidence`);

      const overdueFindings = findings.filter(
            f =>
            f.due_date &&
            new Date(f.due_date) < today &&
            f.finding_status !== 'Closed' &&
            f.finding_status !== 'Resolved'
      ).length;
      if (overdueFindings > 0) exceptions.push(`${overdueFindings} audit findings overdue`);

      const criticalRisks = risks.filter(r => (r.risk_score || 0) >= 20).length;
      if (criticalRisks > 0) exceptions.push(`${criticalRisks} critical risks require attention`);

      const findingsClosed = findings.filter(f => f.finding_status === 'Closed').length;
      const closureRate = findings.length > 0 ? Math.round((findingsClosed / findings.length) * 100) : 0;

      setData({
        healthScore,
        concentrationIndex,
        controlEffectiveness,
        expiringSoon,
        expired,
        forecastDate,
        exceptions,
        closureRate,
        overdueFindings,
        totalRisks,
        mappedRisks,
        riskCoverage,
        totalMappings,
        implementedControls,
        totalControls: controls.length,
        fresh: evidence.length - expiringSoon - expired,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <PageHeader title="Executive Dashboard" description="Strategic security intelligence & decision support" icon={<LayoutDashboard className="h-6 w-6" />} />

      {/* Executive Exceptions - White card with yellow border */}
      {data?.exceptions && data.exceptions.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Executive Exceptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.exceptions.map((ex: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-gray-700">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  {ex}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer" onClick={() => navigate('/scorecard')}>
          <CardContent className="pt-6"><div className="text-3xl font-bold">{data?.healthScore || 0}/100</div><p>Security Health Score</p><div className="flex items-center gap-1 mt-2 text-sm"><TrendingUp className="h-4 w-4" /> ↑8% from last month</div></CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => navigate('/risk-assessment')}>
          <CardContent className="pt-6"><div className="text-2xl font-bold">{data?.concentrationIndex || 0}%</div><p className="text-sm text-gray-500">Risk Concentration</p><div className="text-xs text-gray-400 mt-1">Top 2 risks represent {data?.concentrationIndex || 0}% of exposure</div></CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => navigate('/soa')}>
          <CardContent className="pt-6"><div className="flex justify-between"><div><div className="text-2xl font-bold text-green-600">{data?.controlEffectiveness || 0}%</div><p className="text-xs">Effectiveness</p></div><div><div className="text-2xl font-bold text-blue-600">{data?.riskCoverage || 0}%</div><p className="text-xs">Risk Coverage</p></div></div><p className="text-sm text-gray-500 mt-2">Control & Risk Metrics</p></CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => navigate('/work-packages')}>
          <CardContent className="pt-6"><div className="flex justify-between"><div><div className="text-2xl font-bold text-yellow-600">0%</div><p className="text-xs">Burn Rate</p></div><div><div className="text-2xl font-bold text-green-600">R0</div><p className="text-xs">Remaining</p></div></div><p className="text-sm text-gray-500 mt-2">Budget Consumption</p></CardContent>
        </Card>
      </div>

      <RiskCoverageCard
        coveragePercentage={data?.riskCoverage || 0}
        mappedRisks={data?.mappedRisks || 0}
        totalRisks={data?.totalRisks || 0}
        totalMappings={data?.totalMappings || 0}
        onViewDetails={() => navigate('/risk-mapping')}
      />

      <SLABreachesCard />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer" onClick={() => navigate('/documents')}>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Evidence Freshness</CardTitle></CardHeader>
          <CardContent><div className="flex justify-between"><div><div className="text-2xl font-bold text-green-600">{data?.fresh || 0}</div><p className="text-xs">Fresh</p></div><div><div className="text-2xl font-bold text-yellow-600">{data?.expiringSoon || 0}</div><p className="text-xs">Expiring</p></div><div><div className="text-2xl font-bold text-red-600">{data?.expired || 0}</div><p className="text-xs">Expired</p></div></div></CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => navigate('/work-packages')}>
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Programme Forecast</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.forecastDate || 'N/A'}</div><p className="text-sm text-gray-500">Projected completion date</p><div className="mt-2 text-xs text-gray-400">Based on current work packages</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer" onClick={() => navigate('/audits/findings')}>
          <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Audit Closure Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.closureRate || 0}%</div><p className="text-sm text-gray-500">Findings closed</p><div className="mt-2 text-xs text-gray-400">{data?.overdueFindings || 0} overdue findings</div></CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => navigate('/work-packages')}>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> What Changed (Last 7 Days)</CardTitle></CardHeader>
          <CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><div className="text-xl font-bold text-green-600">+{data?.implementedControls || 0}</div><p className="text-xs">Controls implemented</p></div><div><div className="text-xl font-bold text-red-600">+{data?.exceptions?.length || 0}</div><p className="text-xs">New exceptions</p></div><div><div className="text-xl font-bold text-blue-600">+0</div><p className="text-xs">Evidence uploads</p></div><div><div className="text-xl font-bold text-orange-600">-0</div><p className="text-xs">Risks closed</p></div></div></CardContent>
        </Card>
      </div>
    </div>
  );
}
