-- ============================================================
-- CyberSecureIMS - Threat Register & Security Objectives
-- ============================================================

-- Threat Register
CREATE TABLE IF NOT EXISTS threat_register (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  threat_name TEXT NOT NULL,
  threat_category TEXT DEFAULT 'other' CHECK (threat_category IN ('ransomware','phishing','supply_chain','insider_threat','ddos','data_breach','social_engineering','malware','other')),
  description TEXT,
  likelihood TEXT DEFAULT 'medium' CHECK (likelihood IN ('high','medium','low')),
  potential_impact TEXT DEFAULT 'high' CHECK (potential_impact IN ('critical','high','medium','low')),
  threat_source TEXT DEFAULT 'external' CHECK (threat_source IN ('external','internal','third_party','nation_state')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','monitoring','mitigated','retired')),
  mitigation_notes TEXT,
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE threat_register ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_threat_register" ON threat_register
  USING (organization_id = get_current_org_id());

CREATE POLICY "org_insert_threat_register" ON threat_register
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "org_update_threat_register" ON threat_register
  FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "org_delete_threat_register" ON threat_register
  FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_threat_register_updated_at
  BEFORE UPDATE ON threat_register
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================

-- Security Objectives
CREATE TABLE IF NOT EXISTS security_objectives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  objective_title TEXT NOT NULL,
  description TEXT,
  kpi TEXT,
  owner TEXT,
  target_date DATE,
  priority TEXT DEFAULT 'high' CHECK (priority IN ('critical','high','medium','low')),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','achieved','deferred','cancelled')),
  progress_pct INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  linked_framework TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE security_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_security_objectives" ON security_objectives
  USING (organization_id = get_current_org_id());

CREATE POLICY "org_insert_security_objectives" ON security_objectives
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "org_update_security_objectives" ON security_objectives
  FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "org_delete_security_objectives" ON security_objectives
  FOR DELETE USING (organization_id = get_current_org_id());

CREATE TRIGGER trg_security_objectives_updated_at
  BEFORE UPDATE ON security_objectives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
