import React, { useEffect, useState } from 'react';
import { useFrameworks, useEvidenceSubmissions } from '../hooks/useCompliance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle2, Clock, AlertCircle, FileUp, TrendingUp } from 'lucide-react';

export default function ClientDashboard() {
  const { frameworks } = useFrameworks();
  const { submissions } = useEvidenceSubmissions();
  
  const [complianceScore, setComplianceScore] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    if (submissions) {
      const newStats = {
        total: submissions.length,
        submitted: submissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length,
        approved: submissions.filter(s => s.status === 'approved').length,
        pending: submissions.filter(s => s.status === 'draft').length,
        rejected: submissions.filter(s => s.status === 'rejected' || s.status === 'needs_changes').length
      };
      setStats(newStats);
      
      // Calculate compliance score (approved / total * 100)
      const score = newStats.total > 0 ? (newStats.approved / newStats.total) * 100 : 0;
      setComplianceScore(Math.round(score));
    }
  }, [submissions]);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-[#0D2240]">
        <h1 className="text-2xl font-bold">Welcome to Compliance Portal</h1>
        <p className="mt-2 opacity-90">
          Track your compliance evidence and audit readiness
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceScore}%</div>
            <Progress value={complianceScore} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved Evidence</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Out of {stats.total} total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">Waiting for auditor review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Require resubmission</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Frameworks */}
      <Card>
        <CardHeader>
          <CardTitle>Active Compliance Frameworks</CardTitle>
          <CardDescription>Frameworks you need to comply with</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {frameworks.map((framework) => (
              <div key={framework.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{framework.name}</h3>
                  <p className="text-sm text-muted-foreground">{framework.version}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">In Progress</div>
                  <Progress value={65} className="w-32 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Evidence Submissions</CardTitle>
          <CardDescription>Your latest compliance evidence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {submissions.slice(0, 5).map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-2 border-b">
                <div>
                  <p className="font-medium">{submission.title}</p>
                  <p className="text-sm text-muted-foreground">Control: {submission.control_id}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                  submission.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                  submission.status === 'needs_changes' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {submission.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
