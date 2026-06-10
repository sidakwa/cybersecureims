import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Loader2, Shield, CheckCircle, AlertCircle, Target, 
  Award, TrendingUp, TrendingDown, Minus, Download, 
  RefreshCw, FileText, Eye, Activity, BarChart3,
  CheckSquare, XCircle, Clock, Flame, Zap, Heart
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function ComplianceScorecard() {
  const { organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (organizationId) {
      fetchComplianceData();
    }
  }, [organizationId]);

  const fetchComplianceData = async () => {
    if (!organizationId) return;

    try {
      // Fetch all data in parallel
      const [
        risksRes, controlsRes, findingsRes, auditsRes, 
        evidenceRes, workPackagesRes, mappingsRes
      ] = await Promise.all([
        supabase.from('cyber_risks').select('risk_score, status, risk_level').eq('organization_id', organizationId),
        supabase.from('uci_controls').select('uci_status').eq('organization_id', organizationId),
        supabase.from('audit_findings').select('severity, finding_status, due_date, created_at').eq('organization_id', organizationId),
        supabase.from('audit_engagements').select('status, overall_score, standard').eq('organization_id', organizationId),
        supabase.from('audit_evidence').select('expiry_date, evidence_status').eq('organization_id', organizationId),
        supabase.from('work_package_register').select('status, progress_pct').eq('organization_id', organizationId),
        supabase.from('risk_control_mappings').select('mapping_effectiveness').eq('organization_id', organizationId)
      ]);

      const risks = risksRes.data || [];
      const controls = controlsRes.data || [];
      const findings = findingsRes.data || [];
      const audits = auditsRes.data || [];
      const evidence = evidenceRes.data || [];
      const workPackages = workPackagesRes.data || [];
      const mappings = mappingsRes.data || [];

      // Overall Compliance Score (weighted)
      const controlCompliance = controls.length > 0 
        ? (controls.filter(c => c.uci_status === 'In Place' || c.uci_status === 'Implemented').length / controls.length) * 100 
        : 0;
      
      const riskCompliance = risks.length > 0 
        ? (risks.filter(r => r.status === 'Mitigated' || r.status === 'Closed').length / risks.length) * 100 
        : 0;
      
      const findingCompliance = findings.length > 0 
        ? (findings.filter(f => f.finding_status === 'Resolved').length / findings.length) * 100 
        : 0;
      
      const completedAudits = audits.filter(a => a.status === 'Completed' && a.overall_score != null);
      const auditCompliance = completedAudits.length > 0
        ? completedAudits.reduce((sum, a) => sum + (a.overall_score || 0), 0) / completedAudits.length
        : 0;
      
      const evidenceCompliance = evidence.length > 0 
        ? (evidence.filter(e => !e.expiry_date || new Date(e.expiry_date) > new Date()).length / evidence.length) * 100 
        : 100;
      
      const workPackageCompliance = workPackages.length > 0 
        ? (workPackages.filter(w => w.status === 'Completed').length / workPackages.length) * 100 
        : 0;
      
      const mappingCompliance = risks.length > 0 
        ? (mappings.length / risks.length) * 100 
        : 0;
      
      // Overall Score
      const overallScore = Math.round(
        (controlCompliance * 0.25) + 
        (riskCompliance * 0.20) + 
        (findingCompliance * 0.20) + 
        (auditCompliance * 0.15) + 
        (evidenceCompliance * 0.10) + 
        (workPackageCompliance * 0.10)
      );
      
      // Risk Score by Level
      const riskLevels = {
        critical: risks.filter(r => (r.risk_score || 0) >= 20).length,
        high: risks.filter(r => (r.risk_score || 0) >= 12 && (r.risk_score || 0) < 20).length,
        medium: risks.filter(r => (r.risk_score || 0) >= 6 && (r.risk_score || 0) < 12).length,
        low: risks.filter(r => (r.risk_score || 0) < 6).length
      };
      
      // Framework Scores (by standard)
      const frameworkScores = audits.reduce((acc: any, audit) => {
        const framework = audit.standard || 'Other';
        if (!acc[framework]) {
          acc[framework] = { total: 0, count: 0 };
        }
        acc[framework].total += audit.overall_score || 0;
        acc[framework].count += 1;
        return acc;
      }, {});
      
      const frameworkAvgScores = Object.entries(frameworkScores).map(([framework, data]: [string, any]) => ({
        framework,
        score: Math.round(data.total / data.count)
      }));
      
      // Finding Severity
      const findingSeverity = {
        critical: findings.filter(f => f.severity === 'Critical').length,
        high: findings.filter(f => f.severity === 'High').length,
        medium: findings.filter(f => f.severity === 'Medium').length,
        low: findings.filter(f => f.severity === 'Low').length
      };
      
      // Trend Data
      const today = new Date();
      const overdueFindings = findings.filter(f => f.due_date && new Date(f.due_date) < today && f.finding_status !== 'Resolved').length;
      const expiringEvidence = evidence.filter(e => e.expiry_date && new Date(e.expiry_date) > today && new Date(e.expiry_date) < new Date(today.setDate(today.getDate() + 30))).length;
      
      // Compliance by Domain
      const complianceDomains = [
        { name: 'Control Management', score: controlCompliance, icon: Shield },
        { name: 'Risk Management', score: riskCompliance, icon: Target },
        { name: 'Finding Resolution', score: findingCompliance, icon: CheckCircle },
        { name: 'Audit Performance', score: auditCompliance, icon: Award },
        { name: 'Evidence Management', score: evidenceCompliance, icon: FileText },
        { name: 'Programme Delivery', score: workPackageCompliance, icon: Activity },
        { name: 'Risk-Control Mapping', score: mappingCompliance, icon: Eye }
      ];
      
      setData({
        overallScore,
        controlCompliance: Math.round(controlCompliance),
        riskCompliance: Math.round(riskCompliance),
        findingCompliance: Math.round(findingCompliance),
        auditCompliance: Math.round(auditCompliance),
        evidenceCompliance: Math.round(evidenceCompliance),
        workPackageCompliance: Math.round(workPackageCompliance),
        mappingCompliance: Math.round(mappingCompliance),
        riskLevels,
        frameworkAvgScores,
        findingSeverity,
        overdueFindings,
        expiringEvidence,
        complianceDomains,
        totalRisks: risks.length,
        totalControls: controls.length,
        totalFindings: findings.length,
        totalAudits: audits.length,
        resolvedFindings: findings.filter(f => f.finding_status === 'Resolved').length,
        implementedControls: controls.filter(c => c.uci_status === 'In Place' || c.uci_status === 'Implemented').length
      });
      
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportScorecard = () => {
    const headers = ['Domain', 'Metric', 'Score', 'Status'];
    const rows = [
      ['Overall', 'Compliance Score', `${data?.overallScore || 0}%`, data?.overallScore >= 70 ? 'Compliant' : 'Needs Improvement'],
      ['Control Management', 'Implementation Rate', `${data?.controlCompliance || 0}%`, data?.controlCompliance >= 70 ? 'Good' : 'Attention Required'],
      ['Risk Management', 'Mitigation Rate', `${data?.riskCompliance || 0}%`, data?.riskCompliance >= 70 ? 'Good' : 'Attention Required'],
      ['Finding Resolution', 'Closure Rate', `${data?.findingCompliance || 0}%`, data?.findingCompliance >= 70 ? 'Good' : 'Attention Required'],
      ['Audit Performance', 'Completion Rate', `${data?.auditCompliance || 0}%`, data?.auditCompliance >= 70 ? 'Good' : 'Attention Required'],
      ['Evidence Management', 'Freshness Rate', `${data?.evidenceCompliance || 0}%`, data?.evidenceCompliance >= 70 ? 'Good' : 'Attention Required']
    ];
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-scorecard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Compliance Scorecard" 
        description="Enterprise compliance metrics and performance tracking" 
        icon={<Award className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button onClick={exportScorecard} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export Scorecard
            </Button>
            <Button onClick={fetchComplianceData} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Overall Compliance Score - Hero Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Overall Compliance Score</p>
              <div className="text-7xl font-bold mt-2">{data?.overallScore || 0}%</div>
              <p className="text-blue-100 text-sm mt-2">Enterprise compliance rating</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
                <Activity className="h-4 w-4" />
                <span className="text-sm">{data?.overallScore >= 70 ? 'Compliant' : 'Needs Improvement'}</span>
              </div>
              <div className="mt-4">
                <Award className="h-16 w-16 text-blue-200 opacity-75" />
              </div>
            </div>
          </div>
          <Progress value={data?.overallScore || 0} className="mt-4 h-3 bg-blue-400" />
        </CardContent>
      </Card>

      {/* Compliance Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.complianceDomains.map((domain: any, idx: number) => (
          <Card key={idx} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => {
            if (domain.name === 'Control Management') navigate('/controls');
            if (domain.name === 'Risk Management') navigate('/risk-assessment');
            if (domain.name === 'Finding Resolution') navigate('/audits/findings');
            if (domain.name === 'Audit Performance') navigate('/audits/metrics');
            if (domain.name === 'Evidence Management') navigate('/documents');
            if (domain.name === 'Programme Delivery') navigate('/work-packages');
          }}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{domain.name}</p>
                  <div className={`text-4xl font-bold mt-2 ${getScoreColor(domain.score)}`}>
                    {Math.round(domain.score)}%
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {domain.score >= 80 ? 'Excellent' : domain.score >= 60 ? 'Good' : 'Needs Improvement'}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${domain.score >= 80 ? 'bg-green-100' : domain.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  <domain.icon className={`h-6 w-6 ${domain.score >= 80 ? 'text-green-600' : domain.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                </div>
              </div>
              <Progress value={domain.score} className="mt-3 h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 bg-transparent">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Compliance Overview
          </TabsTrigger>
          <TabsTrigger value="risks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Target className="h-4 w-4 mr-2" />
            Risk Compliance
          </TabsTrigger>
          <TabsTrigger value="controls" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Control Compliance
          </TabsTrigger>
          <TabsTrigger value="findings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <AlertCircle className="h-4 w-4 mr-2" />
            Findings & Audit
          </TabsTrigger>
        </TabsList>

        {/* Compliance Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Framework Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Framework Compliance Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.frameworkAvgScores.map((framework: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{framework.framework}</span>
                      <span className={getScoreColor(framework.score)}>{framework.score}%</span>
                    </div>
                    <Progress value={framework.score} className="h-2" />
                  </div>
                ))}
                {data?.frameworkAvgScores.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No audit data available for framework scoring</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{data?.totalControls || 0}</div>
                <p className="text-sm text-gray-500">Total Controls</p>
                <Shield className="h-8 w-8 text-blue-400 mx-auto mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600">{data?.implementedControls || 0}</div>
                <p className="text-sm text-gray-500">Controls Implemented</p>
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-orange-600">{data?.totalFindings || 0}</div>
                <p className="text-sm text-gray-500">Total Findings</p>
                <AlertCircle className="h-8 w-8 text-orange-400 mx-auto mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-purple-600">{data?.resolvedFindings || 0}</div>
                <p className="text-sm text-gray-500">Findings Resolved</p>
                <CheckSquare className="h-8 w-8 text-purple-400 mx-auto mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Compliance Tab */}
        <TabsContent value="risks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Risk Heat Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                    <span className="font-semibold">Critical</span>
                    <Badge className="bg-red-600 text-white text-lg px-3 py-1">{data?.riskLevels?.critical || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
                    <span className="font-semibold">High</span>
                    <Badge className="bg-orange-600 text-white text-lg px-3 py-1">{data?.riskLevels?.high || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-100 rounded-lg">
                    <span className="font-semibold">Medium</span>
                    <Badge className="bg-yellow-600 text-white text-lg px-3 py-1">{data?.riskLevels?.medium || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                    <span className="font-semibold">Low</span>
                    <Badge className="bg-green-600 text-white text-lg px-3 py-1">{data?.riskLevels?.low || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Risk Compliance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600">{data?.riskCompliance || 0}%</div>
                  <p className="text-gray-500 mt-2">Risk Mitigation Rate</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Target: 80%</span>
                      <span className={getScoreColor(data?.riskCompliance || 0)}>{data?.riskCompliance || 0}%</span>
                    </div>
                    <Progress value={data?.riskCompliance || 0} className="h-2" />
                  </div>
                  <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Risk-Controls Mapped</p>
                    <p className="text-2xl font-bold text-blue-600">{data?.mappingCompliance || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Control Compliance Tab */}
        <TabsContent value="controls" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Control Implementation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                        <circle 
                          cx="50" cy="50" r="45" fill="none" 
                          stroke={data?.controlCompliance >= 70 ? '#22c55e' : data?.controlCompliance >= 40 ? '#eab308' : '#ef4444'}
                          strokeWidth="10" 
                          strokeDasharray={`${(data?.controlCompliance || 0) * 2.83} 283`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-4xl font-bold ${data?.controlCompliance >= 70 ? 'text-green-600' : data?.controlCompliance >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {data?.controlCompliance || 0}%
                          </div>
                          <p className="text-xs text-gray-500">Implemented</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{data?.implementedControls || 0}</div>
                      <p className="text-xs text-gray-500">Implemented</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">{data?.totalControls - (data?.implementedControls || 0)}</div>
                      <p className="text-xs text-gray-500">Remaining</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Control Compliance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span>Control Effectiveness</span>
                    <span className="text-2xl font-bold text-blue-600">{data?.controlCompliance || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span>Implementation Rate</span>
                    <span className="text-2xl font-bold text-green-600">{data?.controlCompliance || 0}%</span>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Gap Analysis</p>
                    <p className="text-xl font-bold text-yellow-600">{data?.totalControls - (data?.implementedControls || 0)} controls need implementation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Findings & Audit Tab */}
        <TabsContent value="findings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Finding Severity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                    <span className="font-semibold">Critical</span>
                    <Badge className="bg-red-600 text-white text-lg px-3 py-1">{data?.findingSeverity?.critical || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
                    <span className="font-semibold">High</span>
                    <Badge className="bg-orange-600 text-white text-lg px-3 py-1">{data?.findingSeverity?.high || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-100 rounded-lg">
                    <span className="font-semibold">Medium</span>
                    <Badge className="bg-yellow-600 text-white text-lg px-3 py-1">{data?.findingSeverity?.medium || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                    <span className="font-semibold">Low</span>
                    <Badge className="bg-green-600 text-white text-lg px-3 py-1">{data?.findingSeverity?.low || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Finding Resolution Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-600">{data?.findingCompliance || 0}%</div>
                  <p className="text-gray-500 mt-2">Finding Closure Rate</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span>Open Findings</span>
                      <span className="text-2xl font-bold text-orange-600">{data?.totalFindings - (data?.resolvedFindings || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span>Overdue Findings</span>
                      <span className="text-2xl font-bold text-red-600">{data?.overdueFindings || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span>Audit Completion</span>
                      <span className="text-2xl font-bold text-blue-600">{data?.auditCompliance || 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expiring Evidence Alert */}
          {data?.expiringEvidence > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Evidence Expiring Soon</h3>
                    <p className="text-sm text-yellow-700">{data.expiringEvidence} evidence items will expire within 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
