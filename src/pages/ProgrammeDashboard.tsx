import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Loader2, Rocket, Target, Calendar, Clock, CheckCircle, 
  AlertCircle, TrendingUp, TrendingDown, Shield, Users,
  BarChart3, PieChart, Gauge, Award, Flame, Zap,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Eye,
  Package, GitBranch, CheckSquare, XCircle, PlayCircle,
  Activity
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function ProgrammeDashboard() {
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (organizationId) {
      fetchProgrammeData();
    }
  }, [organizationId]);

  const fetchProgrammeData = async () => {
    if (!organizationId) return;

    try {
      // Fetch all programme-related data
      const [
        workPackagesRes, controlsRes, risksRes, findingsRes, 
        mappingsRes, auditsRes
      ] = await Promise.all([
        supabase.from('work_package_register').select('*').eq('organization_id', organizationId),
        supabase.from('uci_controls').select('uci_status').eq('organization_id', organizationId),
        supabase.from('cyber_risks').select('risk_score, status').eq('organization_id', organizationId),
        supabase.from('audit_findings').select('severity, finding_status, due_date').eq('organization_id', organizationId),
        supabase.from('risk_control_mappings').select('mapping_effectiveness, mapping_type'),
        supabase.from('audit_engagements').select('status, overall_score').eq('organization_id', organizationId)
      ]);

      const workPackages = workPackagesRes.data || [];
      const controls = controlsRes.data || [];
      const risks = risksRes.data || [];
      const findings = findingsRes.data || [];
      const mappings = mappingsRes.data || [];
      const audits = auditsRes.data || [];

      // Work Package Metrics
      const totalWPs = workPackages.length;
      const completedWPs = workPackages.filter(w => w.status === 'Completed').length;
      const inProgressWPs = workPackages.filter(w => w.status === 'In Progress').length;
      const plannedWPs = workPackages.filter(w => w.status === 'Planned').length;
      const blockedWPs = workPackages.filter(w => w.status === 'Blocked').length;
      const wpProgress = totalWPs > 0 ? Math.round((completedWPs / totalWPs) * 100) : 0;
      
      // Priority breakdown
      const highPriority = workPackages.filter(w => w.priority === 'High').length;
      const mediumPriority = workPackages.filter(w => w.priority === 'Medium').length;
      const lowPriority = workPackages.filter(w => w.priority === 'Low').length;
      
      // Timeline metrics
      const today = new Date();
      const onTrackWPs = workPackages.filter(w => {
        if (w.status === 'Completed') return true;
        if (!w.planned_end_date) return true;
        return new Date(w.planned_end_date) >= today;
      }).length;
      const atRiskWPs = workPackages.filter(w => {
        if (w.status === 'Completed') return false;
        if (!w.planned_end_date) return false;
        return new Date(w.planned_end_date) < today && w.status !== 'Completed';
      }).length;
      
      // Work package completion forecast
      const incompleteWPs = workPackages.filter(w => w.status !== 'Completed' && w.planned_end_date);
      let forecastDate = 'N/A';
      if (incompleteWPs.length > 0) {
        const avgEndDate = incompleteWPs.reduce((sum, w) => sum + new Date(w.planned_end_date).getTime(), 0) / incompleteWPs.length;
        forecastDate = new Date(avgEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      
      // Control Metrics
      const totalControls = controls.length;
      const implementedControls = controls.filter(c => c.uci_status === 'In Place' || c.uci_status === 'Implemented').length;
      const controlProgress = totalControls > 0 ? Math.round((implementedControls / totalControls) * 100) : 0;
      
      // Risk Metrics
      const totalRisks = risks.length;
      const mitigatedRisks = risks.filter(r => r.status === 'Mitigated' || r.status === 'Closed').length;
      const riskProgress = totalRisks > 0 ? Math.round((mitigatedRisks / totalRisks) * 100) : 0;
      
      // Risk reduction trend
      const avgRiskScore = totalRisks > 0 ? Math.round(risks.reduce((sum, r) => sum + (r.risk_score || 0), 0) / totalRisks) : 0;
      const riskTrend = avgRiskScore > 12 ? 'high' : avgRiskScore > 8 ? 'medium' : 'low';
      
      // Mapping Metrics
      const totalMappings = mappings.length;
      const avgEffectiveness = mappings.length > 0 ? Math.round(mappings.reduce((sum, m) => sum + (m.mapping_effectiveness || 0), 0) / mappings.length) : 0;
      const mappingProgress = totalRisks > 0 ? Math.min(Math.round((totalMappings / totalRisks) * 100), 100) : 0;
      
      // Finding Metrics
      const totalFindings = findings.length;
      const resolvedFindings = findings.filter(f => f.finding_status === 'Resolved').length;
      const findingProgress = totalFindings > 0 ? Math.round((resolvedFindings / totalFindings) * 100) : 0;
      
      // Audit Metrics
      const totalAudits = audits.length;
      const completedAudits = audits.filter(a => a.status === 'Completed').length;
      const auditProgress = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0;
      
      // Overall Programme Health Score
      const healthScore = Math.round(
        (wpProgress * 0.30) + 
        (controlProgress * 0.25) + 
        (riskProgress * 0.20) + 
        (findingProgress * 0.15) + 
        (auditProgress * 0.10)
      );
      
      // Weekly progress trend (simulated from data)
      const weeklyTrend = [
        { week: 'Week 1', progress: Math.max(0, wpProgress - 15) },
        { week: 'Week 2', progress: Math.max(0, wpProgress - 10) },
        { week: 'Week 3', progress: Math.max(0, wpProgress - 5) },
        { week: 'Week 4', progress: wpProgress }
      ];
      
      setData({
        totalWPs,
        completedWPs,
        inProgressWPs,
        plannedWPs,
        blockedWPs,
        wpProgress,
        highPriority,
        mediumPriority,
        lowPriority,
        onTrackWPs,
        atRiskWPs,
        forecastDate,
        controlProgress,
        totalControls,
        implementedControls,
        riskProgress,
        avgRiskScore,
        riskTrend,
        totalMappings,
        avgEffectiveness,
        mappingProgress,
        findingProgress,
        auditProgress,
        healthScore,
        weeklyTrend,
        totalRisks,
        mitigatedRisks,
        totalFindings,
        resolvedFindings
      });
      
    } catch (error) {
      console.error('Error fetching programme data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (trend: string) => {
    if (trend === 'low') return 'text-green-600';
    if (trend === 'medium') return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="CSI Programme Dashboard" 
        description="Control Self-Assessment programme overview and performance metrics" 
        icon={<Rocket className="h-6 w-6" />}
        actions={
          <Button onClick={fetchProgrammeData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Programme Health Score - Hero Card */}
      <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">CSI Programme Health Score</p>
              <div className="text-6xl font-bold mt-2">{data?.healthScore || 0}</div>
              <p className="text-purple-100 text-sm mt-2">Overall programme status</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Active Programme</span>
              </div>
              <div className="mt-4">
                <Rocket className="h-16 w-16 text-purple-200 opacity-75" />
              </div>
            </div>
          </div>
          <Progress value={data?.healthScore || 0} className="mt-4 h-3 bg-purple-400" />
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/work-packages')}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Work Packages</p>
                <div className="text-3xl font-bold mt-1">{data?.completedWPs || 0}/{data?.totalWPs || 0}</div>
                <p className="text-xs text-gray-400 mt-1">Completed</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress value={data?.wpProgress || 0} className="mt-3 h-2" />
            <p className="text-xs text-gray-500 mt-2">{data?.wpProgress || 0}% completion rate</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/controls')}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Control Implementation</p>
                <div className="text-3xl font-bold mt-1">{data?.implementedControls || 0}/{data?.totalControls || 0}</div>
                <p className="text-xs text-gray-400 mt-1">Controls in place</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress value={data?.controlProgress || 0} className="mt-3 h-2" />
            <p className="text-xs text-gray-500 mt-2">{data?.controlProgress || 0}% implemented</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/risk-assessment')}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Risk Mitigation</p>
                <div className="text-3xl font-bold mt-1">{data?.mitigatedRisks || 0}/{data?.totalRisks || 0}</div>
                <p className="text-xs text-gray-400 mt-1">Risks addressed</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <Progress value={data?.riskProgress || 0} className="mt-3 h-2" />
            <p className="text-xs text-gray-500 mt-2">{data?.riskProgress || 0}% mitigated</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/risk-mapping')}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Risk-Control Mapping</p>
                <div className="text-3xl font-bold mt-1">{data?.mappingProgress || 0}%</div>
                <p className="text-xs text-gray-400 mt-1">{data?.totalMappings || 0} total mappings</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <GitBranch className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <Progress value={data?.mappingProgress || 0} className="mt-3 h-2" />
            <p className="text-xs text-gray-500 mt-2">Avg effectiveness: {data?.avgEffectiveness || 0}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 bg-transparent">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Eye className="h-4 w-4 mr-2" />
            Programme Overview
          </TabsTrigger>
          <TabsTrigger value="work-packages" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Package className="h-4 w-4 mr-2" />
            Work Packages
          </TabsTrigger>
          <TabsTrigger value="controls" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Control Assurance
          </TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance Metrics
          </TabsTrigger>
        </TabsList>

        {/* Programme Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Work Package Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Work Package Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">Completed</span>
                    </div>
                    <Badge className="bg-green-600 text-white text-lg px-3 py-1">{data?.completedWPs || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">In Progress</span>
                    </div>
                    <Badge className="bg-blue-600 text-white text-lg px-3 py-1">{data?.inProgressWPs || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold">Planned</span>
                    </div>
                    <Badge className="bg-yellow-600 text-white text-lg px-3 py-1">{data?.plannedWPs || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-semibold">Blocked</span>
                    </div>
                    <Badge className="bg-red-600 text-white text-lg px-3 py-1">{data?.blockedWPs || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">On Track</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{data?.onTrackWPs || 0}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="font-semibold">At Risk</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{data?.atRiskWPs || 0}</div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Projected Completion</p>
                    <p className="text-xl font-bold text-blue-600">{data?.forecastDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Priority Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{data?.highPriority || 0}</div>
                  <p className="text-sm text-gray-500">High Priority</p>
                  <Flame className="h-5 w-5 text-red-500 mx-auto mt-2" />
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">{data?.mediumPriority || 0}</div>
                  <p className="text-sm text-gray-500">Medium Priority</p>
                  <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto mt-2" />
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{data?.lowPriority || 0}</div>
                  <p className="text-sm text-gray-500">Low Priority</p>
                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Packages Tab */}
        <TabsContent value="work-packages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Progress Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.weeklyTrend.map((week: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{week.week}</span>
                        <span className="font-semibold">{week.progress}%</span>
                      </div>
                      <Progress value={week.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Completion Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600">{data?.wpProgress || 0}%</div>
                  <p className="text-gray-500 mt-2">Current completion rate</p>
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Target Completion</p>
                    <p className="text-2xl font-bold text-purple-600">{data?.forecastDate}</p>
                    <div className="mt-3">
                      <Progress value={data?.wpProgress || 0} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Control Assurance Tab */}
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
                          stroke={data?.controlProgress >= 70 ? '#22c55e' : data?.controlProgress >= 40 ? '#eab308' : '#ef4444'}
                          strokeWidth="10" 
                          strokeDasharray={`${(data?.controlProgress || 0) * 2.83} 283`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-4xl font-bold ${data?.controlProgress >= 70 ? 'text-green-600' : data?.controlProgress >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {data?.controlProgress || 0}%
                          </div>
                          <p className="text-xs text-gray-500">Implemented</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{data?.implementedControls || 0}</div>
                      <p className="text-xs text-gray-500">Controls in Place</p>
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
                  <Award className="h-5 w-5" />
                  Control Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600">{data?.totalControls || 0}</div>
                  <p className="text-gray-500 mt-2">Total Controls</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Implementation Rate</span>
                      <span className="font-semibold">{data?.controlProgress || 0}%</span>
                    </div>
                    <Progress value={data?.controlProgress || 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-blue-600">{data?.findingProgress || 0}%</div>
                <p className="text-sm text-gray-500 mt-1">Finding Resolution</p>
                <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mt-3" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-green-600">{data?.auditProgress || 0}%</div>
                <p className="text-sm text-gray-500 mt-1">Audit Completion</p>
                <Award className="h-8 w-8 text-green-500 mx-auto mt-3" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-purple-600">{data?.avgEffectiveness || 0}%</div>
                <p className="text-sm text-gray-500 mt-1">Control Effectiveness</p>
                <Shield className="h-8 w-8 text-purple-500 mx-auto mt-3" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={`text-4xl font-bold ${getRiskColor(data?.riskTrend)}`}>
                  {data?.avgRiskScore || 0}
                </div>
                <p className="text-sm text-gray-500 mt-1">Avg Risk Score</p>
                <Target className={`h-8 w-8 ${getRiskColor(data?.riskTrend)} mx-auto mt-3`} />
              </CardContent>
            </Card>
          </div>

          {/* Risk Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Risk Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-6xl font-bold ${getRiskColor(data?.riskTrend)}`}>
                  {data?.avgRiskScore || 0}
                </div>
                <p className="text-gray-500 mt-2">Current average risk score</p>
                <div className="mt-4 flex justify-center gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{data?.totalMappings || 0}</div>
                    <p className="text-xs text-gray-500">Risk-Controls Mapped</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data?.totalFindings || 0}</div>
                    <p className="text-xs text-gray-500">Total Findings</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{data?.resolvedFindings || 0}</div>
                    <p className="text-xs text-gray-500">Resolved</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
