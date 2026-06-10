-- ============================================================
-- CyberSecureIMS - Tier 2: Remediation Programmes, Evidence Requests, Integration Connectors
-- ============================================================

-- Remediation Programmes
CREATE TABLE IF NOT EXISTS remediation_programmes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  programme_name TEXT NOT NULL,
  description TEXT,
  programme_type TEXT DEFAULT 'security_improvement' CHECK (programme_type IN ('security_improvement','compliance','vulnerability_fix','architecture','process_improvement','other')),
  owner TEXT,
  start_date DATE,
  target_completion DATE,
  priority TEXT DEFAULT 'high' CHECK (priority IN ('critical','high','medium','low')),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
  progress_pct INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  linked_findings TEXT,
  linked_risks TEXT,
  budget_allocated NUMERIC(15,2),
  budget_spent NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE remediation_programmes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_remediation_programmes" ON remediation_programmes
  USING (organization_id = get_current_org_id());
CREATE POLICY "org_insert_remediation_programmes" ON remediation_programmes
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());
CREATE POLICY "org_update_remediation_programmes" ON remediation_programmes
  FOR UPDATE USING (organization_id = get_current_org_id());
CREATE POLICY "org_delete_remediation_programmes" ON remediation_programmes
  FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_remediation_programmes_updated_at
  BEFORE UPDATE ON remediation_programmes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================

-- Audit Evidence Requests
CREATE TABLE IF NOT EXISTS evidence_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  request_title TEXT NOT NULL,
  audit_ref TEXT,
  description TEXT,
  requested_from TEXT NOT NULL,
  reviewer TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_review','received','accepted','overdue','waived')),
  evidence_provided TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE evidence_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_evidence_requests" ON evidence_requests
  USING (organization_id = get_current_org_id());
CREATE POLICY "org_insert_evidence_requests" ON evidence_requests
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());
CREATE POLICY "org_update_evidence_requests" ON evidence_requests
  FOR UPDATE USING (organization_id = get_current_org_id());
CREATE POLICY "org_delete_evidence_requests" ON evidence_requests
  FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_evidence_requests_updated_at
  BEFORE UPDATE ON evidence_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================

-- Integration Connectors
CREATE TABLE IF NOT EXISTS integration_connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  connector_name TEXT NOT NULL,
  connector_type TEXT DEFAULT 'other' CHECK (connector_type IN ('siem','vulnerability_scanner','cloud_provider','ticketing','identity','endpoint','email_security','firewall','other')),
  vendor TEXT,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active','inactive','testing','syncing','error')),
  api_endpoint TEXT,
  sync_frequency TEXT DEFAULT 'manual' CHECK (sync_frequency IN ('real_time','hourly','daily','weekly','manual')),
  last_sync TIMESTAMPTZ,
  config_notes TEXT,
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE integration_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_integration_connectors" ON integration_connectors
  USING (organization_id = get_current_org_id());
CREATE POLICY "org_insert_integration_connectors" ON integration_connectors
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());
CREATE POLICY "org_update_integration_connectors" ON integration_connectors
  FOR UPDATE USING (organization_id = get_current_org_id());
CREATE POLICY "org_delete_integration_connectors" ON integration_connectors
  FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_integration_connectors_updated_at
  BEFORE UPDATE ON integration_connectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
