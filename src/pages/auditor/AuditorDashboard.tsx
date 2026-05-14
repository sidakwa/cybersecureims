import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ClipboardCheck, Clock, CheckCircle2, AlertTriangle, Users, FileText } from 'lucide-react';

export default function AuditorDashboard() {
  const [stats, setStats] = useState({
    pendingReviews: 12,
    completedAudits: 45,
    openFindings: 8,
    clientsActive: 6
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-6 text-[#0D2240]">
        <h1 className="text-2xl font-bold">Auditor Dashboard</h1>
        <p className="mt-2 opacity-90">
          Review and verify client compliance evidence
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">Evidence awaiting verification</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Audits</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAudits}</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Findings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openFindings}</div>
            <p className="text-xs text-muted-foreground">Require follow-up</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientsActive}</div>
            <p className="text-xs text-muted-foreground">Under compliance review</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common auditor tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Review Pending Evidence Submissions
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Create New Audit Checklist
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Review Open Findings
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          3 clients have submitted evidence for review. Please check the Control Verification section.
        </AlertDescription>
      </Alert>
    </div>
  );
}
