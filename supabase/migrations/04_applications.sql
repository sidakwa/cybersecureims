-- ============================================================
-- CyberSecureIMS - Application Register
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  application_name TEXT NOT NULL,
  owner TEXT,
  business_unit TEXT,
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('critical','high','medium','low')),
  hosting TEXT CHECK (hosting IN ('on-premise','cloud','saas','hybrid')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','planned','under_review','decommissioned')),
  vendor TEXT,
  url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_applications" ON applications
  USING (organization_id = get_current_org_id());

CREATE POLICY "org_insert_applications" ON applications
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "org_update_applications" ON applications
  FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "org_delete_applications" ON applications
  FOR DELETE USING (organization_id = get_current_org_id());

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
