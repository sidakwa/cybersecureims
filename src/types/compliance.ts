export interface ComplianceFramework {
  id: string;
  organization_id: string;
  name: string;
  version: string;
  description: string | null;
  standard_body: string | null;
  region: string | null;
  controls: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface FrameworkControl {
  id: string;
  framework_id: string;
  control_id: string;
  control_name: string;
  control_description: string | null;
  clause_number: string | null;
  requirement_text: string | null;
  evidence_required: string | null;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  parent_control_id: string | null;
  created_at: string;
}

export interface EvidenceSubmission {
  id: string;
  client_organization_id: string;
  framework_id: string;
  control_id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'needs_changes';
  submission_date: string | null;
  due_date: string | null;
  client_notes: string | null;
  auditor_feedback: string | null;
  score: number | null;
  evidence_document_ids: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ControlVerification {
  id: string;
  evidence_submission_id: string;
  auditor_id: string;
  verification_status: 'pending' | 'in_progress' | 'verified' | 'failed' | 'partial';
  findings: string | null;
  recommendations: string | null;
  verification_score: number | null;
  verification_date: string | null;
  verified_at: string;
  next_review_date: string | null;
  attachments: string[];
}

export interface EvidenceRequest {
  id: string;
  audit_id: string | null;
  client_organization_id: string;
  auditor_id: string;
  request_title: string;
  request_description: string | null;
  status: 'open' | 'responded' | 'closed' | 'overdue';
  requested_date: string;
  due_date: string | null;
  response_text: string | null;
  response_document_ids: string[];
  responded_at: string | null;
  closed_at: string | null;
  created_at: string;
}
