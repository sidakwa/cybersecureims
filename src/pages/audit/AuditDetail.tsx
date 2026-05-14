import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';

export default function AuditDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const { organizationId } = useAuth();

  const [audit, setAudit] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && id && organizationId) {
      fetchAuditData();
    }

    if (!authLoading && !organizationId) {
      setLoading(false);
    }
  }, [id, organizationId, authLoading]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);

      const { data: auditData, error: auditError } = await supabase
        .from('audit_engagements')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (auditError) throw auditError;
      setAudit(auditData);

      const { data: findingsData, error: findingsError } = await supabase
        .from('audit_findings')
        .select('*')
        .eq('audit_id', id)
        .eq('organization_id', organizationId);

      if (findingsError) throw findingsError;
      setFindings(findingsData || []);

      const { data: evidenceData, error: evidenceError } = await supabase
        .from('audit_evidence')
        .select('*')
        .eq('audit_id', id)
        .eq('organization_id', organizationId);

      if (evidenceError) throw evidenceError;
      setEvidence(evidenceData || []);

      const { data: actionsData, error: actionsError } = await supabase
        .from('audit_actions')
        .select('*, audit_findings(finding_title)')
        .eq('audit_id', id)
        .eq('organization_id', organizationId);

      if (actionsError) throw actionsError;
      setActions(actionsData || []);
    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <Badge className="bg-red-500">Critical</Badge>;
      case 'High':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      default:
        return <Badge className="bg-blue-500">Low</Badge>;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No organization context found.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/audits/portfolio')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Audits
        </Button>
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Audit not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/audits/portfolio')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Audits
      </Button>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{audit?.title}</h1>
            <p className="text-gray-500 mt-1">
              {audit?.audit_ref} | {audit?.standard}
            </p>
          </div>
          <Badge className={audit?.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}>
            {audit?.status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="findings">Findings ({findings.length})</TabsTrigger>
          <TabsTrigger value="evidence">Evidence ({evidence.length})</TabsTrigger>
          <TabsTrigger value="actions">Actions ({actions.length})</TabsTrigger>
          <TabsTrigger value="systems">Systems Tested</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500">Assessor:</span> {audit?.assessor}</div>
                <div><span className="text-gray-500">Period:</span> {audit?.start_date} to {audit?.end_date}</div>
                <div><span className="text-gray-500">Overall Score:</span> <span className="font-bold">{audit?.overall_score}%</span></div>
                <div><span className="text-gray-500">Framework:</span> {audit?.standard}</div>
              </div>
              {audit?.scope && (
                <div className="mt-4">
                  <span className="text-gray-500">Scope:</span>
                  <p className="mt-1">{audit.scope}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings">
          <Card>
            <CardContent className="pt-6">
              {findings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No findings recorded for this audit</div>
              ) : (
                <div className="space-y-4">
                  {findings.map((finding) => (
                    <div key={finding.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{finding.finding_title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{finding.observation}</p>
                        </div>
                        {getSeverityBadge(finding.severity)}
                      </div>
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Owner:</span> {finding.owner} |
                        <span className="text-gray-500 ml-2"> Due:</span> {finding.due_date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence">
          <Card>
            <CardContent className="pt-6">
              {evidence.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No evidence uploaded</div>
              ) : (
                <div className="grid gap-4">
                  {evidence.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">{item.evidence_name}</div>
                          <div className="text-xs text-gray-500">{item.evidence_type}</div>
                        </div>
                      </div>
                      {item.sharepoint_link && (
                        <a href={item.sharepoint_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm">
                          Open in SharePoint
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardContent className="pt-6">
              {actions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No remediation actions defined</div>
              ) : (
                <div className="space-y-4">
                  {actions.map((action) => (
                    <div key={action.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{action.action_title}</h3>
                        <Badge className={action.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                          {action.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{action.action_description}</p>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Assigned to:</span> {action.assigned_to} |
                        <span className="text-gray-500 ml-2"> Due:</span> {action.due_date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="systems">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                Systems tested will appear here based on the audit scope
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
