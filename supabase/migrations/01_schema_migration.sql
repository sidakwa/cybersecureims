-- ============================================================
-- CyberSecureIMS - Database Schema Migration
-- Phase 2: Full cybersecurity schema
-- Run in order in your Supabase SQL editor
-- ============================================================

-- ============================================================
-- 1. RENAME / REPURPOSE EXISTING TABLES (via ALTER TABLE)
-- ============================================================

-- Rename complaints → security_incidents
ALTER TABLE IF EXISTS complaints RENAME TO security_incidents;
ALTER TABLE IF EXISTS security_incidents
  ADD COLUMN IF NOT EXISTS incident_type TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS affected_systems TEXT[],
  ADD COLUMN IF NOT EXISTS containment_actions TEXT,
  ADD COLUMN IF NOT EXISTS eradication_steps TEXT,
  ADD COLUMN IF NOT EXISTS lessons_learned TEXT,
  ADD COLUMN IF NOT EXISTS regulatory_notification_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_deadline DATE,
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mean_time_to_detect_hours INT,
  ADD COLUMN IF NOT EXISTS mean_time_to_respond_hours INT;

-- Rename suppliers → third_party_vendors
ALTER TABLE IF EXISTS suppliers RENAME TO third_party_vendors;
ALTER TABLE IF EXISTS third_party_vendors
  ADD COLUMN IF NOT EXISTS vendor_type TEXT,
  ADD COLUMN IF NOT EXISTS data_access_level TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS contract_review_date DATE,
  ADD COLUMN IF NOT EXISTS iso27001_certified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS soc2_report_available BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_security_review_date DATE,
  ADD COLUMN IF NOT EXISTS security_questionnaire_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS questionnaire_response_date DATE;

-- ============================================================
-- 2. NEW TABLE: FRAMEWORK CONTROLS LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS framework_controls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL CHECK (framework IN ('ISO27001','SOC2','NIST_CSF','NIST_800_53','CIS_Controls','PCI_DSS','HIPAA','Custom')),
  control_id TEXT NOT NULL,
  control_domain TEXT NOT NULL,
  control_title TEXT NOT NULL,
  control_description TEXT,
  control_type TEXT CHECK (control_type IN ('preventive','detective','corrective','compensating')),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','implemented','not_applicable','deferred')),
  implementation_notes TEXT,
  owner TEXT,
  evidence_document_ids UUID[],
  due_date DATE,
  last_reviewed DATE,
  review_frequency_days INT DEFAULT 365,
  maturity_level INT DEFAULT 0 CHECK (maturity_level BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, framework, control_id)
);

-- ============================================================
-- 3. NEW TABLE: CONTROL ↔ RISK MAPPINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS control_risk_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  control_id UUID REFERENCES framework_controls(id) ON DELETE CASCADE,
  risk_id UUID REFERENCES risks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(control_id, risk_id)
);

-- ============================================================
-- 4. NEW TABLE: STATEMENT OF APPLICABILITY (ISO 27001 SoA)
-- ============================================================
CREATE TABLE IF NOT EXISTS statement_of_applicability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  control_id UUID REFERENCES framework_controls(id) ON DELETE CASCADE,
  applicable BOOLEAN DEFAULT true,
  justification_for_inclusion TEXT,
  justification_for_exclusion TEXT,
  implementation_status TEXT DEFAULT 'not_started',
  approved_by TEXT,
  approved_date DATE,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. NEW TABLE: ASSET INVENTORY (replaces Production)
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type TEXT CHECK (asset_type IN ('server','endpoint','application','database','network_device','cloud_service','data_store','mobile_device','iot_device','people','process','other')),
  asset_tag TEXT,
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('critical','high','medium','low')),
  owner TEXT,
  custodian TEXT,
  department TEXT,
  location TEXT,
  environment TEXT CHECK (environment IN ('production','staging','development','dr','other')),
  data_classification TEXT DEFAULT 'internal' CHECK (data_classification IN ('public','internal','confidential','restricted','top_secret')),
  ip_address TEXT,
  operating_system TEXT,
  vendor TEXT,
  purchase_date DATE,
  end_of_life_date DATE,
  associated_risk_ids UUID[],
  associated_control_ids UUID[],
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','decommissioned','under_review','disposed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. NEW TABLE: VULNERABILITY TRACKER
-- ============================================================
CREATE TABLE IF NOT EXISTS vulnerabilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  cve_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('critical','high','medium','low','informational')),
  cvss_score NUMERIC(4,1),
  cvss_vector TEXT,
  affected_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  affected_asset_name TEXT,
  vulnerability_type TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_remediation','resolved','accepted','false_positive')),
  remediation_plan TEXT,
  remediation_owner TEXT,
  sla_days INT,
  due_date DATE,
  discovered_date DATE DEFAULT CURRENT_DATE,
  resolved_date DATE,
  accepted_risk_reason TEXT,
  source TEXT CHECK (source IN ('pen_test','vulnerability_scan','bug_bounty','manual','threat_intel','vendor_advisory','other')),
  pen_test_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. NEW TABLE: PENETRATION TEST TRACKER
-- ============================================================
CREATE TABLE IF NOT EXISTS pen_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_type TEXT CHECK (test_type IN ('external','internal','web_app','api','mobile','social_engineering','red_team','purple_team','other')),
  vendor TEXT,
  scope TEXT,
  methodology TEXT,
  start_date DATE,
  end_date DATE,
  report_date DATE,
  critical_findings INT DEFAULT 0,
  high_findings INT DEFAULT 0,
  medium_findings INT DEFAULT 0,
  low_findings INT DEFAULT 0,
  informational_findings INT DEFAULT 0,
  total_findings INT GENERATED ALWAYS AS (critical_findings + high_findings + medium_findings + low_findings + informational_findings) STORED,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','remediation_in_progress','closed')),
  remediation_progress INT DEFAULT 0,
  executive_summary TEXT,
  document_id UUID,
  cost NUMERIC(10,2),
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. NEW TABLE: BUSINESS CONTINUITY / DR PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS bc_dr_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_type TEXT CHECK (plan_type IN ('BCP','DRP','IRP','COOP','Other')),
  scope TEXT,
  version TEXT DEFAULT '1.0',
  owner TEXT,
  department TEXT,
  rto_hours INT,
  rpo_hours INT,
  last_tested DATE,
  next_test_date DATE,
  last_updated DATE DEFAULT CURRENT_DATE,
  test_result TEXT CHECK (test_result IN ('passed','partial','failed','not_tested')),
  test_notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','under_review','retired')),
  document_id UUID,
  approved_by TEXT,
  approved_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. EXTEND EXISTING risks TABLE for cyber context
-- ============================================================
ALTER TABLE IF EXISTS risks
  ADD COLUMN IF NOT EXISTS threat_actor TEXT CHECK (threat_actor IN ('external','internal','nation_state','accidental','natural','third_party','unknown')),
  ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS framework_control_refs TEXT[],
  ADD COLUMN IF NOT EXISTS inherent_risk_score INT,
  ADD COLUMN IF NOT EXISTS residual_risk_score INT,
  ADD COLUMN IF NOT EXISTS treatment TEXT CHECK (treatment IN ('mitigate','accept','transfer','avoid')),
  ADD COLUMN IF NOT EXISTS treatment_plan TEXT,
  ADD COLUMN IF NOT EXISTS risk_owner TEXT;

-- ============================================================
-- 10. EXTEND EXISTING audits TABLE for cyber context
-- ============================================================
ALTER TABLE IF EXISTS audits
  ADD COLUMN IF NOT EXISTS audit_type TEXT CHECK (audit_type IN ('internal','external','certification','surveillance','follow_up','readiness')),
  ADD COLUMN IF NOT EXISTS framework_scope TEXT[],
  ADD COLUMN IF NOT EXISTS lead_auditor TEXT,
  ADD COLUMN IF NOT EXISTS corrective_actions_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observations_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_audit_date DATE;

-- ============================================================
-- 11. EXTEND hr_employees for security training
-- ============================================================
ALTER TABLE IF EXISTS hr_employees
  ADD COLUMN IF NOT EXISTS security_clearance_level TEXT,
  ADD COLUMN IF NOT EXISTS security_training_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS security_training_date DATE,
  ADD COLUMN IF NOT EXISTS phishing_simulation_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS nda_signed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_check_done BOOLEAN DEFAULT false;

-- ============================================================
-- 12. UPDATED TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_framework_controls_updated_at BEFORE UPDATE ON framework_controls FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_vulnerabilities_updated_at BEFORE UPDATE ON vulnerabilities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_pen_tests_updated_at BEFORE UPDATE ON pen_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_bc_dr_plans_updated_at BEFORE UPDATE ON bc_dr_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
