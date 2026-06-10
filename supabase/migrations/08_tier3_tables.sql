-- ============================================================
-- CyberSecureIMS - Tier 3: Data Assets, Business Processes,
-- Management Attestations, Regulatory Requirements, Workflow Tasks
-- ============================================================

-- Data Asset Register
CREATE TABLE IF NOT EXISTS data_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  data_type TEXT DEFAULT 'operational' CHECK (data_type IN ('pii','financial','health','intellectual_property','operational','public','credential','other')),
  classification TEXT DEFAULT 'internal' CHECK (classification IN ('public','internal','confidential','restricted','top_secret')),
  owner TEXT,
  custodian TEXT,
  location TEXT DEFAULT 'on_prem' CHECK (location IN ('on_prem','cloud','hybrid','third_party','saas')),
  storage_system TEXT,
  retention_period TEXT,
  legal_basis TEXT,
  encryption_at_rest BOOLEAN DEFAULT false,
  encryption_in_transit BOOLEAN DEFAULT false,
  linked_asset_ref TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','archived','decommissioned')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE data_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_data_assets" ON data_assets USING (organization_id = get_current_org_id());
CREATE POLICY "org_insert_data_assets" ON data_assets FOR INSERT WITH CHECK (organization_id = get_current_org_id());
CREATE POLICY "org_update_data_assets" ON data_assets FOR UPDATE USING (organization_id = get_current_org_id());
CREATE POLICY "org_delete_data_assets" ON data_assets FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_data_assets_updated_at
  BEFORE UPDATE ON data_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================

-- Business Process Register
CREATE TABLE IF NOT EXISTS business_processes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  process_name TEXT NOT NULL,
  process_type TEXT DEFAULT 'core' CHECK (process_type IN ('core','supporting','management')),
  business_unit TEXT,
  process_owner TEXT,
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('critical','high','medium','low')),
  description TEXT,
  supporting_assets TEXT,
  linked_risks TEXT,
  data_classification TEXT DEFAULT 'internal' CHECK (data_classification IN ('public','internal','confidential','restricted')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','under_review','deprecated')),
  last_reviewed DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE business_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_business_processes" ON business_processes USING (organization_id = get_current_org_id());
CREATE POLICY "org_insert_business_processes" ON business_processes FOR INSERT WITH CHECK (organization_id = get_current_org_id());
CREATE POLICY "org_update_business_processes" ON business_processes FOR UPDATE USING (organization_id = get_current_org_id());
CREATE POLICY "org_delete_business_processes" ON business_processes FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_business_processes_updated_at
  BEFORE UPDATE ON business_processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================

-- Management Attestations
CREATE TABLE IF NOT EXISTS management_attestations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  attestation_title TEXT NOT NULL,
  attestation_type TEXT DEFAULT 'annual_review' CHECK (attestation_type IN ('policy_acknowledgement','control_effectiveness','risk_acceptance','soa_review','annual_review','access_review','other')),
  attester_name TEXT NOT NULL,
  attester_role TEXT,
  department TEXT,
  attestation_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','overdue','waived')),
  linked_control TEXT,
  linked_policy TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE management_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_management_attestations" ON management_attestations USING (organization_id = get_current_org_id());
CREATE POLICY "org_insert_management_attestations" ON management_attestations FOR INSERT WITH CHECK (organization_id = get_current_org_id());
CREATE POLICY "org_update_management_attestations" ON management_attestations FOR UPDATE USING (organization_id = get_current_org_id());
CREATE POLICY "org_delete_management_attestations" ON management_attestations FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_management_attestations_updated_at
  BEFORE UPDATE ON management_attestations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================

-- Regulatory Requirements
CREATE TABLE IF NOT EXISTS regulatory_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  regulation_name TEXT NOT NULL,
  regulatory_body TEXT,
  jurisdiction TEXT,
  requirement_area TEXT NOT NULL,
  compliance_status TEXT DEFAULT 'not_assessed' CHECK (compliance_status IN ('compliant','partial','non_compliant','not_assessed')),
  priority TEXT DEFAULT 'high' CHECK (priority IN ('critical','high','medium','low')),
  owner TEXT,
  last_assessed DATE,
  next_review DATE,
  gap_description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE regulatory_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_regulatory_requirements" ON regulatory_requirements USING (organization_id = get_current_org_id());
CREATE POLICY "org_insert_regulatory_requirements" ON regulatory_requirements FOR INSERT WITH CHECK (organization_id = get_current_org_id());
CREATE POLICY "org_update_regulatory_requirements" ON regulatory_requirements FOR UPDATE USING (organization_id = get_current_org_id());
CREATE POLICY "org_delete_regulatory_requirements" ON regulatory_requirements FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_regulatory_requirements_updated_at
  BEFORE UPDATE ON regulatory_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================

-- Workflow Tasks
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  workflow_type TEXT DEFAULT 'other' CHECK (workflow_type IN ('policy_approval','exception_request','access_request','risk_acceptance','change_request','attestation_request','vendor_onboarding','other')),
  description TEXT,
  initiator TEXT NOT NULL,
  current_assignee TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  stage TEXT DEFAULT 'submitted' CHECK (stage IN ('submitted','under_review','pending_approval','approved','rejected','completed','cancelled')),
  target_completion DATE,
  linked_ref TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_workflow_tasks" ON workflow_tasks USING (organization_id = get_current_org_id());
CREATE POLICY "org_insert_workflow_tasks" ON workflow_tasks FOR INSERT WITH CHECK (organization_id = get_current_org_id());
CREATE POLICY "org_update_workflow_tasks" ON workflow_tasks FOR UPDATE USING (organization_id = get_current_org_id());
CREATE POLICY "org_delete_workflow_tasks" ON workflow_tasks FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_workflow_tasks_updated_at
  BEFORE UPDATE ON workflow_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
