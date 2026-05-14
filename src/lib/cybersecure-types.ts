// ============================================================
// src/lib/supabase.ts  (keep existing — only added for reference)
// src/lib/cybersecure-types.ts — All TypeScript types for CyberSecureIMS
// ============================================================

export type Framework = 'ISO27001' | 'SOC2' | 'NIST_CSF' | 'NIST_800_53' | 'CIS_Controls' | 'PCI_DSS' | 'HIPAA' | 'Custom';
export type ControlStatus = 'not_started' | 'in_progress' | 'implemented' | 'not_applicable' | 'deferred';
export type ControlType = 'preventive' | 'detective' | 'corrective' | 'compensating';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type AssetType = 'server' | 'endpoint' | 'application' | 'database' | 'network_device' | 'cloud_service' | 'data_store' | 'mobile_device' | 'iot_device' | 'people' | 'process' | 'other';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';
export type VulnSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type VulnStatus = 'open' | 'in_remediation' | 'resolved' | 'accepted' | 'false_positive';
export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4';

export interface FrameworkControl {
  id: string;
  organization_id: string;
  framework: Framework;
  control_id: string;
  control_domain: string;
  control_title: string;
  control_description?: string;
  control_type?: ControlType;
  status: ControlStatus;
  implementation_notes?: string;
  owner?: string;
  evidence_document_ids?: string[];
  due_date?: string;
  last_reviewed?: string;
  review_frequency_days?: number;
  maturity_level?: number;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  organization_id: string;
  asset_name: string;
  asset_type?: AssetType;
  asset_tag?: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  owner?: string;
  custodian?: string;
  department?: string;
  location?: string;
  environment?: 'production' | 'staging' | 'development' | 'dr' | 'other';
  data_classification: DataClassification;
  ip_address?: string;
  operating_system?: string;
  vendor?: string;
  purchase_date?: string;
  end_of_life_date?: string;
  associated_risk_ids?: string[];
  associated_control_ids?: string[];
  notes?: string;
  status: 'active' | 'decommissioned' | 'under_review' | 'disposed';
  created_at: string;
  updated_at: string;
}

export interface Vulnerability {
  id: string;
  organization_id: string;
  cve_id?: string;
  title: string;
  description?: string;
  severity?: VulnSeverity;
  cvss_score?: number;
  cvss_vector?: string;
  affected_asset_id?: string;
  affected_asset_name?: string;
  vulnerability_type?: string;
  status: VulnStatus;
  remediation_plan?: string;
  remediation_owner?: string;
  sla_days?: number;
  due_date?: string;
  discovered_date?: string;
  resolved_date?: string;
  accepted_risk_reason?: string;
  source?: string;
  pen_test_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PenTest {
  id: string;
  organization_id: string;
  test_name: string;
  test_type?: string;
  vendor?: string;
  scope?: string;
  methodology?: string;
  start_date?: string;
  end_date?: string;
  report_date?: string;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  informational_findings: number;
  total_findings: number;
  status: string;
  remediation_progress?: number;
  executive_summary?: string;
  document_id?: string;
  cost?: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface BcDrPlan {
  id: string;
  organization_id: string;
  plan_name: string;
  plan_type?: 'BCP' | 'DRP' | 'IRP' | 'COOP' | 'Other';
  scope?: string;
  version?: string;
  owner?: string;
  department?: string;
  rto_hours?: number;
  rpo_hours?: number;
  last_tested?: string;
  next_test_date?: string;
  last_updated?: string;
  test_result?: 'passed' | 'partial' | 'failed' | 'not_tested';
  test_notes?: string;
  status: 'draft' | 'active' | 'under_review' | 'retired';
  document_id?: string;
  approved_by?: string;
  approved_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityIncident {
  id: string;
  organization_id: string;
  title: string;
  incident_type?: string;
  severity?: IncidentSeverity;
  description?: string;
  status?: string;
  affected_systems?: string[];
  containment_actions?: string;
  eradication_steps?: string;
  lessons_learned?: string;
  regulatory_notification_required?: boolean;
  notification_deadline?: string;
  notified_at?: string;
  mean_time_to_detect_hours?: number;
  mean_time_to_respond_hours?: number;
  assigned_to?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorRisk {
  id: string;
  organization_id: string;
  name: string;
  vendor_type?: string;
  contact?: string;
  email?: string;
  status?: string;
  risk_rating?: RiskLevel;
  data_access_level?: 'none' | 'read' | 'write' | 'admin';
  contract_review_date?: string;
  iso27001_certified?: boolean;
  soc2_report_available?: boolean;
  last_security_review_date?: string;
  security_questionnaire_sent?: boolean;
  questionnaire_response_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CyberRisk {
  id: string;
  organization_id: string;
  hazard: string;
  category: string;
  threat_actor?: string;
  likelihood: number;
  severity: number;
  risk_score: number;
  inherent_risk_score?: number;
  residual_risk_score?: number;
  risk_level: RiskLevel;
  status: 'active' | 'in_progress' | 'mitigated' | 'review';
  mitigation?: string;
  treatment?: 'mitigate' | 'accept' | 'transfer' | 'avoid';
  treatment_plan?: string;
  asset_id?: string;
  framework_control_refs?: string[];
  risk_owner?: string;
  assigned_to?: string;
  review_date?: string;
  created_at: string;
  updated_at: string;
}
