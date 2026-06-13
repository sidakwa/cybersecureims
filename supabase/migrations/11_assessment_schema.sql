-- Migration 11: Assessment Schema — STRAT-PORTAL-005 v1.2
-- Implements the unified assessment pattern across 6 assessment types:
-- Audit Portfolio, Pen Tests, Vulnerability Scans, Risk Assessments,
-- TPRM Questionnaires, and Assessment Calendar (view-based).
--
-- Decisions implemented:
--   Q1  Calendar forward-looking by default (view filter)
--   Q2  Pen test findings share the findings table (polymorphic FK)
--   Q3  Vuln scan vulnerabilities stay in tracker; promote-to-finding manual
--   Q4  Scheduled-only DefectDojo pull (schema ready; Edge Function in Phase 2)
--   Q5  cyber_risks gets polymorphic source columns
--   Q6  TPRM inbound → SARE, outbound → questionnaire row
--   Q7  audit_frameworks join table (not single FK)
--   Q9  Unmatched DefectDojo targets surface in tile; no auto-asset creation
--   Q11 No "deferred" status; cancelled only
--   Q12 Five risk methodologies seeded
--   Q13 TPRM templates: opaque references only (Sprint 1)
--   Q14 Status transitions: application-level enforcement; DB captures history

-- ============================================================
-- SECTION 0 — PREREQUISITE: lkp_regulatory_reference
-- This table may not exist if prior migrations didn't create it.
-- Safe to run even if it already exists (IF NOT EXISTS + ON CONFLICT).
-- ============================================================

CREATE TABLE IF NOT EXISTS lkp_regulatory_reference (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT     NOT NULL DEFAULT 0
);

INSERT INTO lkp_regulatory_reference (code, name, sort_order) VALUES
  ('iso_27001',  'ISO 27001',          1),
  ('soc2',       'SOC 2',              2),
  ('nist_csf',   'NIST CSF',           3),
  ('nist_800_53','NIST SP 800-53',     4),
  ('pci_dss',    'PCI DSS',            5),
  ('popia',      'POPIA',              6),
  ('hipaa',      'HIPAA',              7),
  ('cis',        'CIS Controls',       8),
  ('gdpr',       'GDPR',               9)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SECTION 1 — GLOBAL LOOKUP TABLES
-- These are system-wide reference tables with no organization_id.
-- Platform Admin manages them.
-- ============================================================

CREATE TABLE IF NOT EXISTS lkp_assessment_status (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_assessment_source (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_assessment_type (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_finding_severity (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_finding_status (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_pentest_type (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_scanner (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_risk_assessment_type (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_risk_methodology (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_tprm_template (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code             TEXT    NOT NULL UNIQUE,
  name             TEXT    NOT NULL,
  source_reference TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  sort_order       INT     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_risk_rating (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT     NOT NULL DEFAULT 0
);

-- ============================================================
-- SECTION 2 — SEED LOOKUP TABLES
-- ============================================================

INSERT INTO lkp_assessment_status (code, name, description, sort_order) VALUES
  ('planned',    'Planned',    'Scope agreed, dates pending.',                  1),
  ('scheduled',  'Scheduled',  'Dates fixed, not yet started.',                 2),
  ('in_progress','In Progress','Assessor actively working.',                    3),
  ('reporting',  'Reporting',  'Findings being written up.',                    4),
  ('closed',     'Closed',     'Closed out, no further work.',                  5),
  ('cancelled',  'Cancelled',  'Did not run; cancelled before completion.',     6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_assessment_source (code, name, description, sort_order) VALUES
  ('internal_audit',   'Internal Audit',    'Run by internal audit team.',                               1),
  ('external_auditor', 'External Auditor',  'Run by an external firm.',                                  2),
  ('customer_audit',   'Customer Audit',    'A customer auditing Seacom under their TPRM programme.',    3),
  ('certification',    'Certification Body','ISO 27001 surveillance, SOC 2, etc.',                       4),
  ('regulatory',       'Regulatory',        'Triggered by a regulatory obligation.',                     5),
  ('internal_team',    'Internal Team',     'Run by Seacom security or IT team.',                        6),
  ('external_vendor',  'External Vendor',   'Pen test or scan run by a contracted vendor.',              7),
  ('tprm_inbound',     'TPRM Inbound',      'A questionnaire received from a customer''s TPRM programme.',8)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_assessment_type (code, name, sort_order) VALUES
  ('audit',              'Audit',                1),
  ('pen_test',           'Pen Test',             2),
  ('vuln_scan',          'Vulnerability Scan',   3),
  ('risk_assessment',    'Risk Assessment',      4),
  ('tprm_questionnaire', 'TPRM Questionnaire',   5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_finding_severity (code, name, sort_order) VALUES
  ('critical',      'Critical',      1),
  ('high',          'High',          2),
  ('medium',        'Medium',        3),
  ('low',           'Low',           4),
  ('informational', 'Informational', 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_finding_status (code, name, sort_order) VALUES
  ('open',                   'Open',                    1),
  ('in_remediation',         'In Remediation',          2),
  ('remediated',             'Remediated',              3),
  ('risk_accepted',          'Risk Accepted',           4),
  ('false_positive',         'False Positive',          5),
  ('closed_not_remediated',  'Closed: Not Remediated',  6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_pentest_type (code, name, sort_order) VALUES
  ('black_box',  'Black Box',   1),
  ('grey_box',   'Grey Box',    2),
  ('white_box',  'White Box',   3),
  ('red_team',   'Red Team',    4),
  ('purple_team','Purple Team', 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_scanner (code, name, sort_order) VALUES
  ('defectdojo',  'DefectDojo',         1),
  ('nessus',      'Nessus',             2),
  ('nuclei',      'Nuclei',             3),
  ('qualys',      'Qualys',             4),
  ('cybersplice', 'Cybersplice (external)', 5),
  ('custom',      'Custom',             6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_risk_assessment_type (code, name, sort_order) VALUES
  ('annual_isms',        'Annual ISMS Risk Assessment',  1),
  ('project',            'Project Risk Assessment',      2),
  ('m_and_a',            'M&A Due Diligence',            3),
  ('regulatory',         'Regulatory-Driven',            4),
  ('change',             'Change Risk Assessment',       5),
  ('vendor',             'Vendor Risk Assessment',       6),
  ('incident_post_mortem','Incident Post-Mortem Risk Review', 7)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_risk_methodology (code, name, sort_order) VALUES
  ('iso_27005',       'ISO 27005',                              1),
  ('nist_800_30',     'NIST SP 800-30',                         2),
  ('octave',          'OCTAVE Allegro',                         3),
  ('fair',            'FAIR (Factor Analysis of Information Risk)', 4),
  ('seacom_standard', 'Seacom Standard',                        5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_tprm_template (code, name, sort_order) VALUES
  ('seacom_standard',       'Seacom Standard',           1),
  ('seacom_critical_vendor','Seacom Critical Vendor',    2),
  ('iso_27001_aligned',     'ISO 27001-Aligned',         3),
  ('customer_driven',       'Customer-Driven',           4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_risk_rating (code, name, sort_order) VALUES
  ('tier_1_critical','Tier 1 (Critical)', 1),
  ('tier_2_high',    'Tier 2 (High)',     2),
  ('tier_3_medium',  'Tier 3 (Medium)',   3),
  ('tier_4_low',     'Tier 4 (Low)',      4)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SECTION 3 — STANDARDISE EXISTING TABLES
-- Add common columns alongside existing ones for backward compat.
-- New pages use new columns; legacy pages keep using old columns.
-- ============================================================

-- 3a. audit_engagements — add common columns (title/scope stay for legacy)
ALTER TABLE audit_engagements
  ADD COLUMN IF NOT EXISTS name               TEXT,
  ADD COLUMN IF NOT EXISTS scope_description  TEXT,
  ADD COLUMN IF NOT EXISTS status_id          UUID REFERENCES lkp_assessment_status(id),
  ADD COLUMN IF NOT EXISTS source_id          UUID REFERENCES lkp_assessment_source(id),
  ADD COLUMN IF NOT EXISTS lead_assessor_role TEXT,
  ADD COLUMN IF NOT EXISTS lead_assessor_name TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_start    DATE,
  ADD COLUMN IF NOT EXISTS scheduled_end      DATE,
  ADD COLUMN IF NOT EXISTS actual_start       DATE,
  ADD COLUMN IF NOT EXISTS actual_end         DATE,
  ADD COLUMN IF NOT EXISTS closed_on          DATE,
  ADD COLUMN IF NOT EXISTS auditor_firm       TEXT,
  ADD COLUMN IF NOT EXISTS engagement_letter_ref TEXT,
  ADD COLUMN IF NOT EXISTS final_report_ref   TEXT;

-- Backfill standard columns from legacy columns
UPDATE audit_engagements SET
  name             = COALESCE(name, title),
  scope_description= COALESCE(scope_description, scope),
  scheduled_start  = COALESCE(scheduled_start, start_date),
  scheduled_end    = COALESCE(scheduled_end, end_date),
  status_id        = COALESCE(status_id, (
    SELECT id FROM lkp_assessment_status
    WHERE code = CASE
      WHEN status IN ('Planned','planned')       THEN 'planned'
      WHEN status IN ('Scheduled','scheduled')   THEN 'scheduled'
      WHEN status IN ('In Progress','in_progress','Active','active') THEN 'in_progress'
      WHEN status IN ('Reporting','reporting')   THEN 'reporting'
      WHEN status IN ('Closed','closed','Completed','completed') THEN 'closed'
      WHEN status IN ('Cancelled','cancelled')   THEN 'cancelled'
      ELSE 'planned'
    END
    LIMIT 1
  ))
WHERE name IS NULL OR status_id IS NULL OR scheduled_start IS NULL;

-- 3b. pen_tests — add common columns (test_name/start_date etc. stay for legacy)
ALTER TABLE pen_tests
  ADD COLUMN IF NOT EXISTS name               TEXT,
  ADD COLUMN IF NOT EXISTS scope_description  TEXT,
  ADD COLUMN IF NOT EXISTS status_id          UUID REFERENCES lkp_assessment_status(id),
  ADD COLUMN IF NOT EXISTS source_id          UUID REFERENCES lkp_assessment_source(id),
  ADD COLUMN IF NOT EXISTS lead_assessor_role TEXT,
  ADD COLUMN IF NOT EXISTS lead_assessor_name TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_start    DATE,
  ADD COLUMN IF NOT EXISTS scheduled_end      DATE,
  ADD COLUMN IF NOT EXISTS actual_start       DATE,
  ADD COLUMN IF NOT EXISTS actual_end         DATE,
  ADD COLUMN IF NOT EXISTS closed_on          DATE,
  ADD COLUMN IF NOT EXISTS test_type_id       UUID REFERENCES lkp_pentest_type(id),
  ADD COLUMN IF NOT EXISTS target_assets      UUID[] DEFAULT ARRAY[]::uuid[],
  ADD COLUMN IF NOT EXISTS target_url_or_ip   TEXT,
  ADD COLUMN IF NOT EXISTS rules_of_engagement_ref TEXT,
  ADD COLUMN IF NOT EXISTS final_report_ref   TEXT;

-- Backfill from legacy columns
-- Note: live pen_tests table uses test_date (not start_date/end_date) — ComplyIMS origin schema
UPDATE pen_tests SET
  scope_description= COALESCE(scope_description, scope),
  scheduled_start  = COALESCE(scheduled_start, test_date),
  scheduled_end    = COALESCE(scheduled_end,   test_date),
  status_id        = COALESCE(status_id, (
    SELECT id FROM lkp_assessment_status
    WHERE code = CASE
      WHEN status IN ('planned','Planned')                              THEN 'planned'
      WHEN status IN ('in_progress','In Progress')                      THEN 'in_progress'
      WHEN status IN ('completed','remediation_in_progress','Completed') THEN 'reporting'
      WHEN status IN ('closed','Closed')                               THEN 'closed'
      ELSE 'planned'
    END
    LIMIT 1
  ))
WHERE status_id IS NULL;

-- ============================================================
-- SECTION 4 — NEW ASSESSMENT TABLES
-- ============================================================

-- 4a. Vulnerability Scans
CREATE TABLE IF NOT EXISTS vuln_scans (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id      UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- common columns
  name                 TEXT    NOT NULL,
  scope_description    TEXT    NOT NULL DEFAULT '',
  status_id            UUID    NOT NULL REFERENCES lkp_assessment_status(id),
  source_id            UUID    REFERENCES lkp_assessment_source(id),
  lead_assessor_role   TEXT,
  lead_assessor_name   TEXT,
  scheduled_start      DATE    NOT NULL,
  scheduled_end        DATE    NOT NULL,
  actual_start         DATE,
  actual_end           DATE,
  closed_on            DATE,
  -- vuln-scan-specific
  scanner_id           UUID    REFERENCES lkp_scanner(id),
  target_assets        UUID[]  DEFAULT ARRAY[]::uuid[],
  target_scope_text    TEXT,
  scan_run_ref         TEXT,                    -- DefectDojo engagement id or external ref
  total_findings       INT     DEFAULT 0,
  critical_count       INT     DEFAULT 0,
  high_count           INT     DEFAULT 0,
  medium_count         INT     DEFAULT 0,
  low_count            INT     DEFAULT 0,
  imported_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- 4b. Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
  id                      UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id         UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- common columns
  name                    TEXT    NOT NULL,
  scope_description       TEXT    NOT NULL DEFAULT '',
  status_id               UUID    NOT NULL REFERENCES lkp_assessment_status(id),
  source_id               UUID    REFERENCES lkp_assessment_source(id),
  lead_assessor_role      TEXT,
  lead_assessor_name      TEXT,
  scheduled_start         DATE    NOT NULL,
  scheduled_end           DATE    NOT NULL,
  actual_start            DATE,
  actual_end              DATE,
  closed_on               DATE,
  -- risk-assessment-specific
  assessment_type_id      UUID    REFERENCES lkp_risk_assessment_type(id),
  methodology_id          UUID    REFERENCES lkp_risk_methodology(id),
  scope_assets            UUID[]  DEFAULT ARRAY[]::uuid[],
  scope_business_processes TEXT[] DEFAULT ARRAY[]::text[],
  facilitator_role        TEXT,
  participants            TEXT[]  DEFAULT ARRAY[]::text[],
  workshop_dates          DATE[]  DEFAULT ARRAY[]::date[],
  report_ref              TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- 4c. TPRM Questionnaires
CREATE TABLE IF NOT EXISTS tprm_questionnaires (
  id                        UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id           UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- common columns
  name                      TEXT    NOT NULL,
  scope_description         TEXT    NOT NULL DEFAULT '',
  status_id                 UUID    NOT NULL REFERENCES lkp_assessment_status(id),
  source_id                 UUID    REFERENCES lkp_assessment_source(id),
  lead_assessor_role        TEXT,
  lead_assessor_name        TEXT,
  scheduled_start           DATE    NOT NULL,
  scheduled_end             DATE    NOT NULL,
  actual_start              DATE,
  actual_end                DATE,
  closed_on                 DATE,
  -- tprm-specific
  direction                 TEXT    NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound','outbound')),
  vendor_id                 UUID    REFERENCES third_party_vendors(id),
  customer_name             TEXT,
  questionnaire_template_id UUID    REFERENCES lkp_tprm_template(id),
  responses_received_on     DATE,
  resulting_risk_rating_id  UUID    REFERENCES lkp_risk_rating(id),
  report_ref                TEXT,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 5 — CROSS-TABLE EXTENSIONS
-- ============================================================

-- 5a. audit_frameworks join table (Q7 — multi-select, not single FK)
CREATE TABLE IF NOT EXISTS audit_frameworks (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id     UUID NOT NULL REFERENCES audit_engagements(id) ON DELETE CASCADE,
  framework_id UUID NOT NULL REFERENCES lkp_regulatory_reference(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(audit_id, framework_id)
);

-- 5b. Polymorphic FK on audit_findings — links finding to any assessment type
ALTER TABLE audit_findings
  ADD COLUMN IF NOT EXISTS assessment_type TEXT CHECK (assessment_type IN
    ('audit','pen_test','vuln_scan','risk_assessment','tprm_questionnaire')),
  ADD COLUMN IF NOT EXISTS assessment_id   UUID;

-- Backfill existing findings to assessment_type='audit'
-- live table has audit_id, not engagement_id
UPDATE audit_findings
SET assessment_type = 'audit',
    assessment_id   = COALESCE(assessment_id, audit_id)
WHERE assessment_type IS NULL
  AND audit_id IS NOT NULL;

-- 5c. Polymorphic source on cyber_risks (Q5)
ALTER TABLE cyber_risks
  ADD COLUMN IF NOT EXISTS source_assessment_type TEXT CHECK (source_assessment_type IN
    ('audit','pen_test','vuln_scan','risk_assessment','tprm_questionnaire')),
  ADD COLUMN IF NOT EXISTS source_assessment_id   UUID;

-- 5d. scan_id on vulnerabilities — links a CVE finding to its originating scan
ALTER TABLE vulnerabilities
  ADD COLUMN IF NOT EXISTS scan_id     UUID REFERENCES vuln_scans(id),
  ADD COLUMN IF NOT EXISTS external_id TEXT;   -- DefectDojo dedup hash

-- 5e. latest_assessment_id on third_party_vendors
ALTER TABLE third_party_vendors
  ADD COLUMN IF NOT EXISTS latest_assessment_id UUID REFERENCES tprm_questionnaires(id);

-- ============================================================
-- SECTION 6 — STATUS HISTORY TABLE (Section 5.8)
-- Captures every status transition for ISO 27001 evidence.
-- Populated by triggers below.
-- ============================================================

CREATE TABLE IF NOT EXISTS assessment_status_history (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_type  TEXT    NOT NULL CHECK (assessment_type IN
    ('audit','pen_test','vuln_scan','risk_assessment','tprm_questionnaire')),
  assessment_id    UUID    NOT NULL,
  from_status_id   UUID    REFERENCES lkp_assessment_status(id),
  to_status_id     UUID    NOT NULL REFERENCES lkp_assessment_status(id),
  changed_by       UUID    REFERENCES auth.users(id),
  changed_on       TIMESTAMPTZ DEFAULT now(),
  reason           TEXT
);

-- Trigger function that writes to assessment_status_history on status change
CREATE OR REPLACE FUNCTION fn_record_assessment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status_id IS DISTINCT FROM NEW.status_id) THEN
    INSERT INTO assessment_status_history
      (assessment_type, assessment_id, from_status_id, to_status_id, changed_by)
    VALUES
      (TG_ARGV[0], NEW.id, OLD.status_id, NEW.status_id, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to every assessment table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_status_history') THEN
    CREATE TRIGGER trg_audit_status_history
      AFTER UPDATE ON audit_engagements FOR EACH ROW
      EXECUTE FUNCTION fn_record_assessment_status_change('audit');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pentest_status_history') THEN
    CREATE TRIGGER trg_pentest_status_history
      AFTER UPDATE ON pen_tests FOR EACH ROW
      EXECUTE FUNCTION fn_record_assessment_status_change('pen_test');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vulnscan_status_history') THEN
    CREATE TRIGGER trg_vulnscan_status_history
      AFTER UPDATE ON vuln_scans FOR EACH ROW
      EXECUTE FUNCTION fn_record_assessment_status_change('vuln_scan');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_riskassessment_status_history') THEN
    CREATE TRIGGER trg_riskassessment_status_history
      AFTER UPDATE ON risk_assessments FOR EACH ROW
      EXECUTE FUNCTION fn_record_assessment_status_change('risk_assessment');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tprm_status_history') THEN
    CREATE TRIGGER trg_tprm_status_history
      AFTER UPDATE ON tprm_questionnaires FOR EACH ROW
      EXECUTE FUNCTION fn_record_assessment_status_change('tprm_questionnaire');
  END IF;
END $$;

-- updated_at triggers for new tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vuln_scans_updated_at') THEN
    CREATE TRIGGER trg_vuln_scans_updated_at
      BEFORE UPDATE ON vuln_scans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_risk_assessments_updated_at') THEN
    CREATE TRIGGER trg_risk_assessments_updated_at
      BEFORE UPDATE ON risk_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tprm_questionnaires_updated_at') THEN
    CREATE TRIGGER trg_tprm_questionnaires_updated_at
      BEFORE UPDATE ON tprm_questionnaires FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ============================================================
-- SECTION 7 — CROSS-TYPE VIEWS
-- ============================================================

-- v_assessments: union of all assessment types for calendar and reporting
CREATE OR REPLACE VIEW v_assessments AS
  SELECT
    id, organization_id,
    'audit'::text        AS assessment_type,
    name,
    scope_description,
    status_id, source_id,
    lead_assessor_role,
    lead_assessor_name,
    scheduled_start, scheduled_end,
    actual_start, actual_end,
    closed_on, created_at, updated_at
  FROM audit_engagements
  WHERE name IS NOT NULL
UNION ALL
  SELECT
    id, organization_id,
    'pen_test'::text,
    name, scope_description,
    status_id, source_id,
    lead_assessor_role, lead_assessor_name,
    scheduled_start, scheduled_end,
    actual_start, actual_end,
    closed_on, created_at, updated_at
  FROM pen_tests
  WHERE name IS NOT NULL
UNION ALL
  SELECT
    id, organization_id,
    'vuln_scan'::text,
    name, scope_description,
    status_id, source_id,
    lead_assessor_role, lead_assessor_name,
    scheduled_start, scheduled_end,
    actual_start, actual_end,
    closed_on, created_at, updated_at
  FROM vuln_scans
UNION ALL
  SELECT
    id, organization_id,
    'risk_assessment'::text,
    name, scope_description,
    status_id, source_id,
    lead_assessor_role, lead_assessor_name,
    scheduled_start, scheduled_end,
    actual_start, actual_end,
    closed_on, created_at, updated_at
  FROM risk_assessments
UNION ALL
  SELECT
    id, organization_id,
    'tprm_questionnaire'::text,
    name, scope_description,
    status_id, source_id,
    lead_assessor_role, lead_assessor_name,
    scheduled_start, scheduled_end,
    actual_start, actual_end,
    closed_on, created_at, updated_at
  FROM tprm_questionnaires;

-- v_assessment_calendar: active assessments for the calendar view (Q1)
-- Defaults to forward-looking; "show closed" toggle controlled at app layer.
CREATE OR REPLACE VIEW v_assessment_calendar AS
  SELECT
    va.id,
    va.organization_id,
    va.assessment_type,
    va.name,
    va.status_id,
    las.code  AS status_code,
    las.name  AS status_name,
    va.source_id,
    laso.code AS source_code,
    laso.name AS source_name,
    va.lead_assessor_role,
    va.lead_assessor_name,
    COALESCE(va.actual_start, va.scheduled_start) AS start_date,
    COALESCE(va.actual_end,   va.scheduled_end)   AS end_date
  FROM v_assessments va
  JOIN lkp_assessment_status las  ON las.id = va.status_id
  LEFT JOIN lkp_assessment_source laso ON laso.id = va.source_id
  WHERE las.code IN ('planned','scheduled','in_progress','reporting');

-- ============================================================
-- SECTION 8 — ROW-LEVEL SECURITY
-- Pattern mirrors existing assessment tables: org isolation + role gate.
-- ============================================================

ALTER TABLE vuln_scans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tprm_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_frameworks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_status_history ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: user can see rows belonging to their org
CREATE POLICY "vuln_scans_tenant_isolation" ON vuln_scans
  USING (organization_id = get_current_org_id());

CREATE POLICY "risk_assessments_tenant_isolation" ON risk_assessments
  USING (organization_id = get_current_org_id());

CREATE POLICY "tprm_tenant_isolation" ON tprm_questionnaires
  USING (organization_id = get_current_org_id());

-- audit_frameworks: isolation via the parent engagement's org
CREATE POLICY "audit_frameworks_tenant_isolation" ON audit_frameworks
  USING (
    audit_id IN (
      SELECT id FROM audit_engagements
      WHERE organization_id = get_current_org_id()
    )
  );

-- Status history: readable by org members; written only by trigger (SECURITY DEFINER)
CREATE POLICY "status_history_read" ON assessment_status_history
  FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM v_assessments WHERE organization_id = get_current_org_id()
    )
  );

-- Write policies: manager roles can insert/update on new tables
CREATE POLICY "vuln_scans_write" ON vuln_scans FOR ALL
  USING (
    organization_id = get_current_org_id()
    AND get_current_role() IN ('admin','security_manager','quality_manager')
  );

CREATE POLICY "risk_assessments_write" ON risk_assessments FOR ALL
  USING (
    organization_id = get_current_org_id()
    AND get_current_role() IN ('admin','security_manager','quality_manager')
  );

CREATE POLICY "tprm_write" ON tprm_questionnaires FOR ALL
  USING (
    organization_id = get_current_org_id()
    AND get_current_role() IN ('admin','security_manager','quality_manager')
  );

-- Index: org_id on new tables for PostgREST filter performance
CREATE INDEX IF NOT EXISTS idx_vuln_scans_org     ON vuln_scans(organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_assess_org    ON risk_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_tprm_org           ON tprm_questionnaires(organization_id);
CREATE INDEX IF NOT EXISTS idx_vuln_scans_status  ON vuln_scans(status_id);
CREATE INDEX IF NOT EXISTS idx_risk_assess_status ON risk_assessments(status_id);
CREATE INDEX IF NOT EXISTS idx_tprm_status        ON tprm_questionnaires(status_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_assess_id ON audit_findings(assessment_id, assessment_type);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_scan ON vulnerabilities(scan_id);
