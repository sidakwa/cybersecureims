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
  source_assessment_type?: AssessmentType;
  source_assessment_id?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ASSESSMENT SECTION — STRAT-PORTAL-005 v1.2
// ============================================================

export type AssessmentType = 'audit' | 'pen_test' | 'vuln_scan' | 'risk_assessment' | 'tprm_questionnaire';
export type AssessmentStatusCode = 'planned' | 'scheduled' | 'in_progress' | 'reporting' | 'closed' | 'cancelled';
export type FindingStatusCode = 'open' | 'in_remediation' | 'remediated' | 'risk_accepted' | 'false_positive' | 'closed_not_remediated';
export type TprmDirection = 'inbound' | 'outbound';

export interface LookupRow {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface AssessmentCommon {
  id: string;
  organization_id: string;
  name: string;
  scope_description: string;
  status_id: string;
  source_id?: string;
  lead_assessor_role?: string;
  lead_assessor_name?: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  closed_on?: string;
  created_at: string;
  updated_at: string;
  status_code?: AssessmentStatusCode;
  status_name?: string;
  source_code?: string;
  source_name?: string;
}

export interface AssessmentView extends AssessmentCommon {
  assessment_type: AssessmentType;
}

export interface AssessmentCalendarEntry extends AssessmentView {
  start_date: string;
  end_date: string;
}

export interface AuditEngagement extends AssessmentCommon {
  title?: string;
  audit_ref?: string;
  audit_type?: string;
  standard?: string;
  scope?: string;
  status?: string;
  overall_score?: number;
  assessor?: string;
  start_date?: string;
  end_date?: string;
  report_link?: string;
  auditor_firm?: string;
  engagement_letter_ref?: string;
  final_report_ref?: string;
  frameworks?: LookupRow[];
}

export interface PenTestEngagement extends AssessmentCommon {
  test_name?: string;
  scope?: string;
  vendor?: string;
  methodology?: string;
  start_date?: string;
  end_date?: string;
  critical_findings?: number;
  high_findings?: number;
  medium_findings?: number;
  low_findings?: number;
  informational_findings?: number;
  total_findings?: number;
  executive_summary?: string;
  test_type_id?: string;
  test_type_name?: string;
  target_assets?: string[];
  target_url_or_ip?: string;
  rules_of_engagement_ref?: string;
  final_report_ref?: string;
}

export interface VulnScan extends AssessmentCommon {
  scanner_id?: string;
  scanner_name?: string;
  target_assets?: string[];
  target_scope_text?: string;
  scan_run_ref?: string;
  total_findings?: number;
  critical_count?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
  imported_at?: string;
}

export interface RiskAssessmentEngagement extends AssessmentCommon {
  assessment_type_id?: string;
  assessment_type_name?: string;
  methodology_id?: string;
  methodology_name?: string;
  scope_assets?: string[];
  scope_business_processes?: string[];
  facilitator_role?: string;
  participants?: string[];
  workshop_dates?: string[];
  report_ref?: string;
}

export interface TprmQuestionnaire extends AssessmentCommon {
  direction: TprmDirection;
  vendor_id?: string;
  vendor_name?: string;
  customer_name?: string;
  questionnaire_template_id?: string;
  template_name?: string;
  responses_received_on?: string;
  resulting_risk_rating_id?: string;
  risk_rating_name?: string;
  report_ref?: string;
}

export interface AssessmentStatusHistory {
  id: string;
  assessment_type: AssessmentType;
  assessment_id: string;
  from_status_id?: string;
  from_status_name?: string;
  to_status_id: string;
  to_status_name?: string;
  changed_by?: string;
  changed_on: string;
  reason?: string;
}

export interface AssessmentFindingSummary {
  id: string;
  title: string;
  severity: string;
  status: string;
  created_at: string;
}

export interface AssessmentRemediationSummary {
  total_work_packages: number;
  completed_work_packages: number;
  total_csi_items: number;
  completion_pct: number;
}

// ============================================================
// INVENTORY TYPES — STRAT-PORTAL-008 v1.1
// ============================================================

export type LifecyclePhaseCode = 'proposed' | 'active' | 'deprecated' | 'retired' | 'unknown';
export type ObligationTypeCode  = 'regulatory' | 'contractual_customer' | 'contractual_vendor' | 'insurance' | 'internal_policy' | 'industry_standard';
export type AssuranceFrequency  = 'continuous' | 'annual' | 'on_request';
export type InventoryItemType   = 'asset' | 'application' | 'data_asset' | 'business_process' | 'vendor' | 'policy' | 'obligation';

export interface InventoryLookupRow {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface InventoryCommon {
  id: string;
  organization_id: string;
  name: string;
  short_code?: string;
  description?: string;
  owner_role_id?: string;
  lifecycle_phase_id?: string;
  lifecycle_phase_code?: LifecyclePhaseCode;
  lifecycle_phase_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceObligation extends InventoryCommon {
  obligation_code: string;
  type_id: string;
  type_name?: string;
  type_code?: string;
  source_id: string;
  source_name?: string;
  source_code?: string;
  source_reference: string;
  obligation_text: string;
  evidence_required: string;
  assurance_frequency?: AssuranceFrequency;
  responsible_role?: string;
}

export interface InventoryControlLink {
  id: string;
  item_type: InventoryItemType;
  item_id: string;
  control_id: string;
  control_title?: string;
  applicability_note?: string;
}

export interface InventoryObligationLink {
  id: string;
  item_type: InventoryItemType;
  item_id: string;
  obligation_id: string;
  obligation_name?: string;
  obligation_code?: string;
  applicability_note?: string;
}

export interface ApplicationAssetLink   { id: string; application_id: string; asset_id: string; asset_name?: string; }
export interface VendorApplicationLink  { id: string; vendor_id: string; application_id: string; application_name?: string; }
export interface ProcessDataAssetLink   { id: string; process_id: string; data_asset_id: string; data_asset_name?: string; relationship?: string; }
