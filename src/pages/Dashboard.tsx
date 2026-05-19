import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, TrendingUp, TrendingDown, AlertCircle, CheckCircle, 
  Target, Shield, Calendar, Clock, Flame, 
  Gauge, Rocket, Activity, ArrowUpRight,
  ArrowDownRight, Minus, RefreshCw, Database
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function Dashboard() {
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (organizationId) {
      fetchDashboardData();
    }
  }, [organizationId]);

  const fetchDashboardData = async () => {
    if (!organizationId) return;

    try {
      // Fetch all data in parallel
      const [
        risksRes, controlsRes, findingsRes, evidenceRes, 
        wpsRes, auditsRes
      ] = await Promise.all([
        supabase.from('cyber_risks').select('risk_score, status').eq('organization_id', organizationId),
        supabase.from('uci_controls').select('uci_status').eq('organization_id', organizationId),
        supabase.from('audit_findings').select('severity, finding_status, due_date, created_at').eq('organization_id', organizationId),
        supabase.from('audit_evidence').select('expiry_date').eq('organization_id', organizationId),
        supabase.from('work_package_register').select('status, planned_end_date').eq('organization_id', organizationId),
        supabase.from('audit_engagements').select('status, overall_score').eq('organization_id', organizationId)
      ]);

      const risks = risksRes.data || [];
      const controls = controlsRes.data || [];
      const findings = findingsRes.data || [];
      const evidence = evidenceRes.data || [];
      const wps = wpsRes.data || [];
      const audits = auditsRes.data || [];

      // Risk Metrics
      const totalRisks = risks.length;
      const criticalRisks = risks.filter(r => (r.risk_score || 0) >= 20).length;
      const highRisks = risks.filter(r => (r.risk_score || 0) >= 12 && (r.risk_score || 0) < 20).length;
      const openRisks = risks.filter(r => r.status === 'Open').length;
      const avgRiskScore = totalRisks > 0 ? Math.round(risks.reduce((sum, r) => sum + (r.risk_score || 0), 0) / totalRisks) : 0;
      const riskTrend = avgRiskScore > 10 ? 'up' : avgRiskScore > 8 ? 'stable' : 'down';
      
      // Risk concentration (top 2 risks)
      const sortedRisks = [...risks].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
      const top2Exposure = sortedRisks.slice(0, 2).reduce((sum, r) => sum + (r.risk_score || 0), 0);
      const totalExposure = risks.reduce((sum, r) => sum + (r.risk_score || 0), 0);
      const concentrationIndex = totalExposure > 0 ? Math.round((top2Exposure / totalExposure) * 100) : 0;
      
      // Control Metrics
      const totalControls = controls.length;
      const implementedControls = controls.filter(c => c.uci_status === 'In Place' || c.uci_status === 'Implemented').length;
      const controlEffectiveness = totalControls > 0 ? Math.round((implementedControls / totalControls) * 100) : 0;
      
      // Risk Coverage
      const mappedRisks = risks.filter(r => (r.risk_score || 0) > 0).length;
      const riskCoverage = totalRisks > 0 ? Math.round((mappedRisks / totalRisks) * 100) : 0;
      
      // Finding Metrics
      const totalFindings = findings.length;
      const openFindings = findings.filter(f => f.finding_status === 'Open').length;
      const resolvedFindings = findings.filter(f => f.finding_status === 'Resolved').length;
      const closureRate = totalFindings > 0 ? Math.round((resolvedFindings / totalFindings) * 100) : 0;
      const criticalFindings = findings.filter(f => f.severity === 'Critical').length;
      
      // Overdue findings
      const today = new Date();
      const overdueFindings = findings.filter(f => f.due_date && new Date(f.due_date) < today && f.finding_status !== 'Resolved').length;
      
      // SLA Breaches
      const slaBreaches = findings.filter(f => {
        if (!f.due_date || f.finding_status === 'Resolved') return false;
        const daysOverdue = Math.ceil((today.getTime() - new Date(f.due_date).getTime()) / (1000 * 3600 * 24));
        return daysOverdue >= 30;
      }).length;
      
      // Evidence Metrics
      const totalEvidence = evidence.length;
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      const expiringSoon = evidence.filter(e => e.expiry_date && new Date(e.expiry_date) <= thirtyDaysFromNow && new Date(e.expiry_date) > today).length;
      const expired = evidence.filter(e => e.expiry_date && new Date(e.expiry_date) < today).length;
      const fresh = totalEvidence - expiringSoon - expired;
      
      // Work Package Metrics
      const totalWPs = wps.length;
      const completedWPs = wps.filter(w => w.status === 'Completed').length;
      const wpProgress = totalWPs > 0 ? Math.round((completedWPs / totalWPs) * 100) : 0;
      
      // Programme forecast
      const incompleteWPs = wps.filter(w => w.status !== 'Completed' && w.planned_end_date);
      let forecastDate = 'N/A';
      if (incompleteWPs.length > 0) {
        const avgEndDate = incompleteWPs.reduce((sum, w) => sum + new Date(w.planned_end_date).getTime(), 0) / incompleteWPs.length;
        forecastDate = new Date(avgEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      
      // Audit Metrics
      const totalAudits = audits.length;
      const completedAudits = audits.filter(a => a.status === 'Completed').length;
      const avgAuditScore = audits.length > 0 ? Math.round(audits.reduce((sum, a) => sum + (a.overall_score || 0), 0) / audits.length) : 0;
      
      // Security Health Score
      const healthScore = Math.round(
        (controlEffectiveness * 0.35) + 
        (riskCoverage * 0.25) + 
        (closureRate * 0.20) + 
        (wpProgress * 0.10) + 
        (avgAuditScore * 0.10)
      );
      
      // Last 7 days changes
      const lastWeekChanges = {
        controls: implementedControls,
        exceptions: overdueFindings,
        evidence: totalEvidence,
        risksClosed: risks.filter(r => r.status === 'Closed').length
      };
      
      setData({
        healthScore,
        riskTrend,
        concentrationIndex,
        controlEffectiveness,
        riskCoverage,
        totalRisks,
        mappedRisks,
        totalMappings: 0, // Set to 0 since we're not using mappings
        openFindings,
        overdueFindings,
        slaBreaches,
        closureRate,
        criticalFindings,
        fresh,
        expiringSoon,
        expired,
        forecastDate,
        wpProgress,
        avgAuditScore,
        completedAudits,
        totalAudits,
        lastWeekChanges,
        criticalRisks,
        highRisks,
        avgRiskScore,
        totalWPs,
        completedWPs
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Executive Dashboard" 
        description="Strategic security intelligence & decision support" 
        icon={<Activity className="h-6 w-6" />}
        actions={
          <Button onClick={fetchDashboardData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Executive Exceptions Alert */}
      {data?.overdueFindings > 0 && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Executive Exceptions</h3>
                  <p className="text-sm text-red-600">{data.overdueFindings} audit findings overdue - Immediate attention required</p>
                </div>
              </div>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100" onClick={() => navigate('/audits/findings')}>
                View Exceptions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Security Health Score */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate('/scorecard')}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm">Security Health Score</p>
                <div className="text-5xl font-bold mt-2">{data?.healthScore || 0}</div>
                <div className="flex items-center gap-1 mt-2 text-blue-200 text-sm">
                  {getTrendIcon(data?.riskTrend)}
                  <span>{data?.healthScore > 50 ? '↑ Improving' : '↓ Needs attention'}</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-20 h-20">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke="white" 
                      strokeWidth="8" 
                      strokeDasharray={`${(data?.healthScore || 0) * 2.83} 283`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{data?.healthScore || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Concentration */}
        <Card className="hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate('/risk-assessment')}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Risk Concentration</p>
                <div className="text-4xl font-bold mt-2">{data?.concentrationIndex || 0}%</div>
                <p className="text-xs text-gray-400 mt-1">Top 2 risks represent {data?.concentrationIndex || 0}% of exposure</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <Progress value={data?.concentrationIndex || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        {/* Control & Risk Metrics */}
        <Card className="hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate('/controls')}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Control & Risk Metrics</p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <div className="text-3xl font-bold text-green-600">{data?.controlEffectiveness || 0}%</div>
                    <p className="text-xs text-gray-400">Effectiveness</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{data?.riskCoverage || 0}%</div>
                    <p className="text-xs text-gray-400">Risk Coverage</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Programme Progress */}
        <Card className="hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate('/work-packages')}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Programme Progress</p>
                <div className="text-4xl font-bold text-purple-600 mt-2">{data?.wpProgress || 0}%</div>
                <p className="text-xs text-gray-400 mt-1">{data?.completedWPs || 0} of {data?.totalWPs || 0} packages</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Rocket className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <Progress value={data?.wpProgress || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Risk-to-Control Coverage Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/risk-mapping')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Risk-to-Control Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600">{data?.riskCoverage || 0}%</div>
              <p className="text-gray-500 mt-2">{data?.mappedRisks || 0} of {data?.totalRisks || 0} risks monitored</p>
              <Progress value={data?.riskCoverage || 0} className="mt-4 h-3" />
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <div className="text-2xl font-bold text-green-600">{data?.controlEffectiveness || 0}%</div>
                  <p className="text-xs text-gray-500">Control Eff.</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{data?.totalRisks - (data?.mappedRisks || 0)}</div>
                  <p className="text-xs text-gray-500">Unmonitored Risks</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA Breaches */}
        <Card className="lg:col-span-1 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/audits/findings')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              SLA Breaches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-7xl font-bold ${data?.slaBreaches > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {data?.slaBreaches || 0}
              </div>
              <p className="text-gray-500 mt-2">Active SLA breaches</p>
              {data?.slaBreaches > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 font-semibold">⚠️ Immediate escalation required</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Evidence Freshness */}
        <Card className="lg:col-span-1 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/documents')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Evidence Freshness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{data?.fresh || 0}</div>
                <p className="text-xs text-gray-500">Fresh</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{data?.expiringSoon || 0}</div>
                <p className="text-xs text-gray-500">Expiring</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{data?.expired || 0}</div>
                <p className="text-xs text-gray-500">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Programme Forecast */}
        <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/work-packages')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Programme Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{data?.forecastDate}</div>
              <p className="text-gray-500 mt-2">Projected completion date</p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Progress</span>
                  <span className="text-sm font-semibold">{data?.wpProgress || 0}%</span>
                </div>
                <Progress value={data?.wpProgress || 0} className="mt-2 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Closure Rate */}
        <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/audits/metrics')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Audit Closure Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-6xl font-bold ${data?.closureRate >= 70 ? 'text-green-600' : data?.closureRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {data?.closureRate || 0}%
              </div>
              <p className="text-gray-500 mt-2">Findings closed</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{data?.openFindings || 0}</div>
                  <p className="text-xs text-gray-500">Open Findings</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{data?.overdueFindings || 0}</div>
                  <p className="text-xs text-gray-500">Overdue Findings</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What Changed (Last 7 Days) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            What Changed (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-green-600">+{data?.lastWeekChanges?.controls || 0}</div>
              <p className="text-sm text-gray-500">Controls implemented</p>
              <ArrowUpRight className="h-4 w-4 text-green-600 mx-auto mt-1" />
            </div>
            <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-red-600">+{data?.lastWeekChanges?.exceptions || 0}</div>
              <p className="text-sm text-gray-500">New exceptions</p>
              <ArrowUpRight className="h-4 w-4 text-red-600 mx-auto mt-1" />
            </div>
            <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-blue-600">+{data?.lastWeekChanges?.evidence || 0}</div>
              <p className="text-sm text-gray-500">Evidence uploads</p>
              <ArrowUpRight className="h-4 w-4 text-blue-600 mx-auto mt-1" />
            </div>
            <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-green-600">-{data?.lastWeekChanges?.risksClosed || 0}</div>
              <p className="text-sm text-gray-500">Risks closed</p>
              <ArrowDownRight className="h-4 w-4 text-green-600 mx-auto mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
