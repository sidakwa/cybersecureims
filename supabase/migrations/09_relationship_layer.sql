-- ============================================================
-- CyberSecureIMS - Relationship Layer
-- Adds FK links between key tables and cross-mapping tables
-- All columns are nullable so existing data is unaffected
-- ============================================================

-- Link findings to controls and risks
ALTER TABLE audit_findings
  ADD COLUMN IF NOT EXISTS linked_control_id UUID REFERENCES framework_controls(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_risk_id    UUID REFERENCES cyber_risks(id)        ON DELETE SET NULL;

-- Link evidence to controls and findings
ALTER TABLE audit_evidence
  ADD COLUMN IF NOT EXISTS linked_control_id UUID REFERENCES framework_controls(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_finding_id UUID REFERENCES audit_findings(id)     ON DELETE SET NULL;

-- Link a test record to a finding it surfaced
ALTER TABLE control_test_records
  ADD COLUMN IF NOT EXISTS linked_finding_id UUID REFERENCES audit_findings(id) ON DELETE SET NULL;

-- Link evidence requests to controls
ALTER TABLE evidence_requests
  ADD COLUMN IF NOT EXISTS linked_control_id UUID REFERENCES framework_controls(id) ON DELETE SET NULL;

-- Link exceptions to the control they deviate from and the risk they accept
ALTER TABLE security_exceptions
  ADD COLUMN IF NOT EXISTS linked_control_id UUID REFERENCES framework_controls(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_risk_id    UUID REFERENCES cyber_risks(id)        ON DELETE SET NULL;

-- Link threats to the risk they materialise into
ALTER TABLE threat_register
  ADD COLUMN IF NOT EXISTS linked_risk_id UUID REFERENCES cyber_risks(id) ON DELETE SET NULL;

-- ============================================================
-- Framework Cross-Mapping
-- One control can satisfy multiple frameworks
-- ============================================================
CREATE TABLE IF NOT EXISTS control_framework_mappings (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source_control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,
  target_framework  TEXT NOT NULL,    -- e.g. 'NIST CSF', 'PCI DSS', 'POPIA'
  target_control_ref TEXT NOT NULL,  -- e.g. 'PR.AA-01', '8.4', 'Security Safeguards'
  mapping_type      TEXT DEFAULT 'direct' CHECK (mapping_type IN ('direct','partial','compensating')),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE control_framework_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_cfm" ON control_framework_mappings
  USING (organization_id = get_current_org_id());
CREATE POLICY "org_insert_cfm" ON control_framework_mappings
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());
CREATE POLICY "org_delete_cfm" ON control_framework_mappings
  FOR DELETE USING (organization_id = get_current_org_id());
