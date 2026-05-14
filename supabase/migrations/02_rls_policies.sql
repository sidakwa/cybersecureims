-- ============================================================
-- CyberSecureIMS - Row Level Security Policies
-- Phase 2: RLS for all new tables
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE framework_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_risk_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_of_applicability ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pen_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bc_dr_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get current user's organization_id
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- Helper function: get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- FRAMEWORK CONTROLS
-- ============================================================
CREATE POLICY "Users can view their org controls"
  ON framework_controls FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "Managers and admins can insert controls"
  ON framework_controls FOR INSERT
  WITH CHECK (
    organization_id = get_current_org_id() AND
    get_current_role() IN ('admin','quality_manager','security_manager')
  );

CREATE POLICY "Managers and admins can update controls"
  ON framework_controls FOR UPDATE
  USING (organization_id = get_current_org_id())
  WITH CHECK (get_current_role() IN ('admin','quality_manager','security_manager'));

CREATE POLICY "Admins can delete controls"
  ON framework_controls FOR DELETE
  USING (
    organization_id = get_current_org_id() AND
    get_current_role() = 'admin'
  );

-- ============================================================
-- CONTROL RISK MAPPINGS
-- ============================================================
CREATE POLICY "Users can view their org control-risk mappings"
  ON control_risk_mappings FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "Managers can manage control-risk mappings"
  ON control_risk_mappings FOR ALL
  USING (organization_id = get_current_org_id())
  WITH CHECK (
    organization_id = get_current_org_id() AND
    get_current_role() IN ('admin','quality_manager','security_manager')
  );

-- ============================================================
-- STATEMENT OF APPLICABILITY
-- ============================================================
CREATE POLICY "Users can view their org SoA"
  ON statement_of_applicability FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "Managers can manage SoA"
  ON statement_of_applicability FOR ALL
  USING (organization_id = get_current_org_id())
  WITH CHECK (
    organization_id = get_current_org_id() AND
    get_current_role() IN ('admin','quality_manager','security_manager')
  );

-- ============================================================
-- ASSETS
-- ============================================================
CREATE POLICY "Users can view their org assets"
  ON assets FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "Managers can insert assets"
  ON assets FOR INSERT
  WITH CHECK (
    organization_id = get_current_org_id() AND
    get_current_role() IN ('admin','quality_manager','security_manager','auditor')
  );

CREATE POLICY "Managers can update assets"
  ON assets FOR UPDATE
  USING (organization_id = get_current_org_id())
  WITH CHECK (get_current_role() IN ('admin','quality_manager','security_manager'));

CREATE POLICY "Admins can delete assets"
  ON assets FOR DELETE
  USING (
    organization_id = get_current_org_id() AND
    get_current_role() = 'admin'
  );

-- ============================================================
-- VULNERABILITIES
-- ============================================================
CREATE POLICY "Users can view their org vulnerabilities"
  ON vulnerabilities FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "Managers can manage vulnerabilities"
  ON vulnerabilities FOR INSERT
  WITH CHECK (
    organization_id = get_current_org_id() AND
    get_current_role() IN ('admin','quality_manager','security_manager','auditor')
  );

CREATE POLICY "Managers can update vulnerabilities"
  ON vulnerabilities FOR UPDATE
  USING (organization_id = get_current_org_id())
  WITH CHECK (get_current_role() IN ('admin','quality_manager','security_manager'));

CREATE POLICY "Admins can delete vulnerabilities"
  ON vulnerabilities FOR DELETE
  USING (
    organization_id = get_current_org_id() AND
    get_current_role() = 'admin'
  );

-- ============================================================
-- PEN TESTS
-- ============================================================
CREATE POLICY "Users can view their org pen tests"
  ON pen_tests FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "Managers can manage pen tests"
  ON pen_tests FOR ALL
  USING (organization_id = get_current_org_id())
  WITH CHECK (
    organization_id = get_current_org_id() AND
    get_current_role() IN ('admin','quality_manager','security_manager')
  );

-- ============================================================
-- BC/DR PLANS
-- ============================================================
CREATE POLICY "Users can view their org BC/DR plans"
  ON bc_dr_plans FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "Managers can manage BC/DR plans"
  ON bc_dr_plans FOR ALL
  USING (organization_id = get_current_org_id())
  WITH CHECK (
    organization_id = get_current_org_id() AND
    get_current_role() IN ('admin','quality_manager','security_manager')
  );
