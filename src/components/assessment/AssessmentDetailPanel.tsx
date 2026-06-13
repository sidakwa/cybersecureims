/**
 * Embedded blocks for assessment detail pages — STRAT-PORTAL-005 §5.2
 *
 * Renders three right-pane blocks:
 *   1. Findings (top 10, severity-ordered)
 *   2. Evidence (top 10, recency-ordered)
 *   3. Remediation status summary
 *
 * Deep links carry filter parameters in the URL so findings/evidence tabs
 * open pre-filtered to this assessment.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, FileText, Wrench, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { AssessmentType, AssessmentFindingSummary } from '@/lib/cybersecure-types';

const SEVERITY_COLOURS: Record<string, string> = {
  critical:      'bg-red-100 text-red-700',
  high:          'bg-orange-100 text-orange-700',
  medium:        'bg-yellow-100 text-yellow-700',
  low:           'bg-blue-100 text-blue-700',
  informational: 'bg-gray-100 text-gray-600',
};

const FINDING_STATUS_COLOURS: Record<string, string> = {
  open:                  'bg-red-100 text-red-700',
  in_remediation:        'bg-amber-100 text-amber-700',
  remediated:            'bg-green-100 text-green-700',
  risk_accepted:         'bg-purple-100 text-purple-700',
  false_positive:        'bg-gray-100 text-gray-600',
  closed_not_remediated: 'bg-gray-100 text-gray-500',
};

interface EvidenceSummary {
  id: string;
  title: string;
  evidence_type?: string;
  created_at: string;
}

interface RemediationSummary {
  total: number;
  complete: number;
}

interface Props {
  assessmentType: AssessmentType;
  assessmentId: string;
}

export function AssessmentDetailPanel({ assessmentType, assessmentId }: Props) {
  const [findings, setFindings] = useState<AssessmentFindingSummary[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSummary[]>([]);
  const [remediation, setRemediation] = useState<RemediationSummary>({ total: 0, complete: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assessmentId) return;
    setLoading(true);

    Promise.all([
      // Findings: ordered by severity (critical first)
      supabase
        .from('audit_findings')
        .select('id, title, severity, status, created_at')
        .eq('assessment_type', assessmentType)
        .eq('assessment_id', assessmentId)
        .order('created_at', { ascending: false })
        .limit(10),

      // Evidence: via findings chain — simplified to engagement-level join if available
      supabase
        .from('audit_evidence')
        .select('id, title, evidence_type, created_at')
        .eq('engagement_id', assessmentId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]).then(([findRes, evRes]) => {
      const rawFindings = (findRes.data || []) as AssessmentFindingSummary[];
      // Sort by severity priority
      const severityOrder = ['critical','high','medium','low','informational'];
      rawFindings.sort((a, b) =>
        severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
      );
      setFindings(rawFindings);
      setEvidence((evRes.data || []) as EvidenceSummary[]);
      setLoading(false);
    });
  }, [assessmentType, assessmentId]);

  const findingsFilterLink = `/audits/findings?assessment_type=${assessmentType}&assessment_id=${assessmentId}`;
  const evidenceFilterLink = `/evidence?assessment_type=${assessmentType}&assessment_id=${assessmentId}`;

  const completionPct = findings.length
    ? Math.round(
        (findings.filter(f => ['remediated','closed_not_remediated','risk_accepted'].includes(f.status)).length /
         findings.length) * 100
      )
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Findings block */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Findings ({findings.length})
            </CardTitle>
            <Link
              to={findingsFilterLink}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {findings.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No findings yet.</p>
          ) : (
            <ul className="space-y-1">
              {findings.map(f => (
                <li key={f.id} className="flex items-start justify-between gap-2 text-sm py-1 border-b last:border-0">
                  <span className="text-gray-800 truncate flex-1">{f.title}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge className={`text-xs px-1.5 py-0 ${SEVERITY_COLOURS[f.severity] || 'bg-gray-100 text-gray-600'}`}>
                      {f.severity}
                    </Badge>
                    <Badge className={`text-xs px-1.5 py-0 ${FINDING_STATUS_COLOURS[f.status] || 'bg-gray-100 text-gray-600'}`}>
                      {f.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Evidence block */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Evidence ({evidence.length})
            </CardTitle>
            <Link
              to={evidenceFilterLink}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {evidence.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No evidence collected yet.</p>
          ) : (
            <ul className="space-y-1">
              {evidence.map(e => (
                <li key={e.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span className="text-gray-800 truncate">{e.title}</span>
                  {e.evidence_type && (
                    <Badge className="text-xs bg-blue-50 text-blue-700 ml-2 flex-shrink-0">{e.evidence_type}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Remediation summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wrench className="h-4 w-4 text-green-600" />
            Remediation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {findings.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No findings to remediate.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Findings closed / total</span>
                <span className="font-medium">
                  {findings.filter(f => ['remediated','closed_not_remediated','risk_accepted'].includes(f.status)).length}
                  {' / '}{findings.length}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right">{completionPct}% complete</p>
              <Link
                to={`/remediation-programmes?assessment_type=${assessmentType}&assessment_id=${assessmentId}`}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
              >
                View remediation programmes <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AssessmentDetailPanel;
