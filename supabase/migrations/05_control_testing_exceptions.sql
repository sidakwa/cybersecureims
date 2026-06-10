-- ============================================================
-- CyberSecureIMS - Control Testing & Exception Register
-- Note: control_tests and exceptions already exist with different schemas.
--       Using control_test_records and security_exceptions instead.
-- ============================================================

-- Control Test Records
CREATE TABLE IF NOT EXISTS control_test_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  control_id UUID,
  test_name TEXT NOT NULL,
  test_objective TEXT,
  tester TEXT,
  test_date DATE,
  sample_size INT,
  result TEXT DEFAULT 'not_tested' CHECK (result IN ('pass','fail','partial','not_tested')),
  evidence TEXT,
  findings TEXT,
  next_test_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE control_test_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_control_test_records" ON control_test_records
  USING (organization_id = get_current_org_id());

CREATE POLICY "org_insert_control_test_records" ON control_test_records
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "org_update_control_test_records" ON control_test_records
  FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "org_delete_control_test_records" ON control_test_records
  FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_control_test_records_updated_at
  BEFORE UPDATE ON control_test_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================

-- Security Exceptions
CREATE TABLE IF NOT EXISTS security_exceptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exception_type TEXT DEFAULT 'other' CHECK (exception_type IN ('firewall','mfa','password','patch','access','encryption','other')),
  description TEXT,
  requested_by TEXT,
  approved_by TEXT,
  approval_date DATE,
  expiry_date DATE,
  risk_justification TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE security_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_security_exceptions" ON security_exceptions
  USING (organization_id = get_current_org_id());

CREATE POLICY "org_insert_security_exceptions" ON security_exceptions
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "org_update_security_exceptions" ON security_exceptions
  FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "org_delete_security_exceptions" ON security_exceptions
  FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_security_exceptions_updated_at
  BEFORE UPDATE ON security_exceptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
