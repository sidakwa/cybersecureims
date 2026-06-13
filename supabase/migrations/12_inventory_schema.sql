-- ================================================================
-- Migration 12 — Inventory Schema (STRAT-PORTAL-008 v1.1)
-- ================================================================
-- Idempotent throughout: IF NOT EXISTS / ON CONFLICT DO NOTHING.
-- Run in Supabase SQL editor as a single block.
-- ================================================================

-- ================================================================
-- SECTION 0: Rename third_party_vendors → vendors (Q7)
-- Creates backward-compat view so existing queries keep working.
-- ================================================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'third_party_vendors'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendors'
  ) THEN
    EXECUTE 'ALTER TABLE third_party_vendors RENAME TO vendors';
  END IF;
END $$;

-- Backward compat view (idempotent via OR REPLACE)
CREATE OR REPLACE VIEW third_party_vendors AS SELECT * FROM vendors;

-- ================================================================
-- SECTION 1: Lookup tables
-- ================================================================

CREATE TABLE IF NOT EXISTS lkp_lifecycle_phase (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_asset_type (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_data_classification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_application_category (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_process_category (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_obligation_type (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_obligation_source (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lkp_vendor_category (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0
);

-- ================================================================
-- SECTION 2: Seeds
-- ================================================================

INSERT INTO lkp_lifecycle_phase (code, name, description, sort_order) VALUES
  ('proposed',    'Proposed',    'In design or onboarding; not yet operational.',          1),
  ('active',      'Active',      'In operation.',                                           2),
  ('deprecated',  'Deprecated',  'Still running; planned for retirement.',                  3),
  ('retired',     'Retired',     'No longer in operation. Retained for history.',           4),
  ('unknown',     'Unknown',     'Phase not determined; flagged for review.',               5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_asset_type (code, name, sort_order) VALUES
  ('physical_server',  'Physical Server',  1),
  ('virtual_server',   'Virtual Server',   2),
  ('network_device',   'Network Device',   3),
  ('storage',          'Storage',          4),
  ('endpoint',         'Endpoint',         5),
  ('mobile_device',    'Mobile Device',    6),
  ('cloud_resource',   'Cloud Resource',   7),
  ('iot_device',       'IoT Device',       8),
  ('other',            'Other',            9)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_data_classification (code, name, description, sort_order) VALUES
  ('public',       'Public',       'Approved for public release.',                                                                          1),
  ('internal',     'Internal',     'Seacom internal use; default for unclassified business data.',                                          2),
  ('confidential', 'Confidential', 'Sensitive business or customer data; restricted distribution.',                                         3),
  ('restricted',   'Restricted',   'Special personal information under POPIA, payment data, or contractually protected data.',              4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_application_category (code, name, sort_order) VALUES
  ('customer_facing',   'Customer Facing',       1),
  ('internal_business', 'Internal Business',     2),
  ('infrastructure',    'Infrastructure Service',3),
  ('vendor_managed',    'Vendor Managed',        4),
  ('legacy',            'Legacy',                5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_process_category (code, name, sort_order) VALUES
  ('core',             'Core (Revenue or Customer)',       1),
  ('support',          'Support (Internal Operations)',    2),
  ('governance',       'Governance',                       3),
  ('external_facing',  'External Facing (Regulatory, Public)', 4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_obligation_type (code, name, sort_order) VALUES
  ('regulatory',           'Regulatory',              1),
  ('contractual_customer', 'Contractual (Customer)',  2),
  ('contractual_vendor',   'Contractual (Vendor)',    3),
  ('insurance',            'Insurance',               4),
  ('internal_policy',      'Internal Policy',         5),
  ('industry_standard',    'Industry Standard',       6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_obligation_source (code, name, sort_order) VALUES
  ('popia',      'POPIA',                    1),
  ('gdpr',       'GDPR',                     2),
  ('msa',        'Customer MSA',             3),
  ('rfp',        'RFP Commitments',          4),
  ('iso_27001',  'ISO 27001',               5),
  ('nist_csf',   'NIST CSF',               6),
  ('cis_controls','CIS Controls',           7),
  ('itoo_cyber', 'iTOO Cyber Insurance',    8)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lkp_vendor_category (code, name, sort_order) VALUES
  ('infrastructure',       'Infrastructure',         1),
  ('application',          'Application or SaaS',    2),
  ('professional_services','Professional Services',  3),
  ('managed_security',     'Managed Security',       4),
  ('connectivity',         'Connectivity',           5),
  ('other',                'Other',                  6)
ON CONFLICT (code) DO NOTHING;

-- ================================================================
-- SECTION 3: Add common columns to existing tables
-- All ADD COLUMN IF NOT EXISTS — safe to re-run.
-- Old column names are kept; new standard names are added alongside.
-- ================================================================

-- 3a: assets
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS name                TEXT,
  ADD COLUMN IF NOT EXISTS short_code          TEXT,
  ADD COLUMN IF NOT EXISTS owner_role_id       UUID,                  -- FK to lkp_roles when that table ships
  ADD COLUMN IF NOT EXISTS lifecycle_phase_id  UUID REFERENCES lkp_lifecycle_phase(id),
  ADD COLUMN IF NOT EXISTS asset_type_id       UUID REFERENCES lkp_asset_type(id),
  ADD COLUMN IF NOT EXISTS classification_id   UUID REFERENCES lkp_data_classification(id),
  ADD COLUMN IF NOT EXISTS criticality_score   SMALLINT CHECK (criticality_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS vendor_id           UUID REFERENCES vendors(id),
  ADD COLUMN IF NOT EXISTS commissioned_on     DATE,
  ADD COLUMN IF NOT EXISTS decommissioned_on   DATE;

-- Backfill: simple safe defaults only; live schema lacks status/asset_type/criticality columns
UPDATE assets SET
  name               = COALESCE(name, asset_name),
  lifecycle_phase_id = COALESCE(lifecycle_phase_id,
    (SELECT id FROM lkp_lifecycle_phase WHERE code = 'active' LIMIT 1))
WHERE name IS NULL OR lifecycle_phase_id IS NULL;

-- 3b: framework_controls
ALTER TABLE framework_controls
  ADD COLUMN IF NOT EXISTS name               TEXT,
  ADD COLUMN IF NOT EXISTS short_code         TEXT,
  ADD COLUMN IF NOT EXISTS owner_role_id      UUID,
  ADD COLUMN IF NOT EXISTS lifecycle_phase_id UUID REFERENCES lkp_lifecycle_phase(id);

UPDATE framework_controls SET
  name               = COALESCE(name, control_title),
  lifecycle_phase_id = COALESCE(lifecycle_phase_id,
    (SELECT id FROM lkp_lifecycle_phase WHERE code = 'active' LIMIT 1))
WHERE name IS NULL;

-- 3c: vendors (was third_party_vendors)
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS name                      TEXT,
  ADD COLUMN IF NOT EXISTS short_code                TEXT,
  ADD COLUMN IF NOT EXISTS owner_role_id             UUID,
  ADD COLUMN IF NOT EXISTS lifecycle_phase_id        UUID REFERENCES lkp_lifecycle_phase(id),
  ADD COLUMN IF NOT EXISTS category_id               UUID REFERENCES lkp_vendor_category(id),
  ADD COLUMN IF NOT EXISTS criticality_score         SMALLINT CHECK (criticality_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS contract_status           TEXT CHECK (contract_status IN ('active','pending','expired','terminated')),
  ADD COLUMN IF NOT EXISTS contract_renewal_date     DATE,
  ADD COLUMN IF NOT EXISTS primary_contact_name      TEXT,
  ADD COLUMN IF NOT EXISTS primary_contact_email     TEXT,
  ADD COLUMN IF NOT EXISTS processes_personal_information BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS country                   TEXT,
  ADD COLUMN IF NOT EXISTS data_residency_countries  TEXT[] DEFAULT ARRAY[]::text[];

-- Backfill vendor name from vendor_name column
UPDATE vendors SET
  name               = COALESCE(name, vendor_name),
  lifecycle_phase_id = COALESCE(lifecycle_phase_id, (
    SELECT id FROM lkp_lifecycle_phase WHERE code = 'active' LIMIT 1
  ))
WHERE name IS NULL;

-- 3d: applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS name                          TEXT,
  ADD COLUMN IF NOT EXISTS short_code                    TEXT,
  ADD COLUMN IF NOT EXISTS owner_role_id                 UUID,
  ADD COLUMN IF NOT EXISTS lifecycle_phase_id            UUID REFERENCES lkp_lifecycle_phase(id),
  ADD COLUMN IF NOT EXISTS category_id                   UUID REFERENCES lkp_application_category(id),
  ADD COLUMN IF NOT EXISTS business_function             TEXT,
  ADD COLUMN IF NOT EXISTS technical_stack               TEXT,
  ADD COLUMN IF NOT EXISTS hosting_model                 TEXT,
  ADD COLUMN IF NOT EXISTS internet_facing               BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vpn_required                  BOOLEAN,
  ADD COLUMN IF NOT EXISTS production_url                TEXT,
  ADD COLUMN IF NOT EXISTS data_classification_id        UUID REFERENCES lkp_data_classification(id),
  ADD COLUMN IF NOT EXISTS recovery_objectives_rto_hours SMALLINT,
  ADD COLUMN IF NOT EXISTS recovery_objectives_rpo_hours SMALLINT;

UPDATE applications SET
  name               = COALESCE(name, application_name),
  production_url     = COALESCE(production_url, url),
  lifecycle_phase_id = COALESCE(lifecycle_phase_id,
    (SELECT id FROM lkp_lifecycle_phase WHERE code = 'active' LIMIT 1))
WHERE name IS NULL;

-- 3e: data_assets
ALTER TABLE data_assets
  ADD COLUMN IF NOT EXISTS name                              TEXT,
  ADD COLUMN IF NOT EXISTS short_code                        TEXT,
  ADD COLUMN IF NOT EXISTS owner_role_id                     UUID,
  ADD COLUMN IF NOT EXISTS lifecycle_phase_id                UUID REFERENCES lkp_lifecycle_phase(id),
  ADD COLUMN IF NOT EXISTS classification_id                 UUID REFERENCES lkp_data_classification(id),
  ADD COLUMN IF NOT EXISTS contains_personal_information     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contains_special_personal_information BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contains_payment_data             BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_subject_categories          TEXT[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS purposes                         TEXT[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS retention_period_months          SMALLINT,
  ADD COLUMN IF NOT EXISTS retention_basis                  TEXT,
  ADD COLUMN IF NOT EXISTS cross_border_transfer            BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cross_border_destinations        TEXT[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS processor_vendor_id              UUID REFERENCES vendors(id);

UPDATE data_assets SET
  name               = COALESCE(name, asset_name),
  lifecycle_phase_id = COALESCE(lifecycle_phase_id,
    (SELECT id FROM lkp_lifecycle_phase WHERE code = 'active' LIMIT 1))
WHERE name IS NULL;

-- 3f: business_processes
ALTER TABLE business_processes
  ADD COLUMN IF NOT EXISTS name               TEXT,
  ADD COLUMN IF NOT EXISTS short_code         TEXT,
  ADD COLUMN IF NOT EXISTS owner_role_id      UUID,
  ADD COLUMN IF NOT EXISTS lifecycle_phase_id UUID REFERENCES lkp_lifecycle_phase(id),
  ADD COLUMN IF NOT EXISTS category_id        UUID REFERENCES lkp_process_category(id),
  ADD COLUMN IF NOT EXISTS parent_process_id  UUID REFERENCES business_processes(id),
  ADD COLUMN IF NOT EXISTS criticality_score  SMALLINT CHECK (criticality_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rto_hours          SMALLINT,
  ADD COLUMN IF NOT EXISTS rpo_hours          SMALLINT,
  ADD COLUMN IF NOT EXISTS mtpd_hours         SMALLINT,
  ADD COLUMN IF NOT EXISTS frequency          TEXT,
  ADD COLUMN IF NOT EXISTS inputs             TEXT[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS outputs            TEXT[] DEFAULT ARRAY[]::text[];

UPDATE business_processes SET
  name               = COALESCE(name, process_name),
  lifecycle_phase_id = COALESCE(lifecycle_phase_id,
    (SELECT id FROM lkp_lifecycle_phase WHERE code = 'active' LIMIT 1))
WHERE name IS NULL;

-- ================================================================
-- SECTION 4: New table — compliance_obligations
-- ================================================================

CREATE TABLE IF NOT EXISTS compliance_obligations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- common columns
  name TEXT NOT NULL,
  short_code TEXT,
  description TEXT,
  owner_role_id UUID,                              -- FK to lkp_roles when that table ships
  lifecycle_phase_id UUID REFERENCES lkp_lifecycle_phase(id),
  -- type-specific columns
  obligation_code TEXT NOT NULL,
  type_id UUID NOT NULL REFERENCES lkp_obligation_type(id),
  source_id UUID NOT NULL REFERENCES lkp_obligation_source(id),
  source_reference TEXT NOT NULL,
  obligation_text TEXT NOT NULL,
  evidence_required TEXT NOT NULL DEFAULT '',
  assurance_frequency TEXT CHECK (assurance_frequency IN ('continuous','annual','on_request')),
  responsible_role TEXT,                           -- free-text until lkp_roles ships
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, obligation_code)
);

ALTER TABLE compliance_obligations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='compliance_obligations' AND policyname='compliance_obligations_read') THEN
    CREATE POLICY "compliance_obligations_read" ON compliance_obligations FOR SELECT USING (organization_id = get_current_org_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='compliance_obligations' AND policyname='compliance_obligations_write') THEN
    CREATE POLICY "compliance_obligations_write" ON compliance_obligations FOR ALL
      USING (organization_id = get_current_org_id() AND get_current_role() IN ('admin','security_manager','quality_manager'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_compliance_obligations_updated_at') THEN
    CREATE TRIGGER trg_compliance_obligations_updated_at
    BEFORE UPDATE ON compliance_obligations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ================================================================
-- SECTION 5: Polymorphic tag tables
-- ================================================================

CREATE TABLE IF NOT EXISTS inventory_controls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN
    ('asset','application','data_asset','business_process','vendor','policy','obligation')),
  item_id UUID NOT NULL,
  control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,
  applicability_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_type, item_id, control_id)
);

CREATE TABLE IF NOT EXISTS inventory_obligations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN
    ('asset','application','data_asset','business_process','vendor','policy','obligation')),
  item_id UUID NOT NULL,
  obligation_id UUID NOT NULL REFERENCES compliance_obligations(id) ON DELETE CASCADE,
  applicability_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_type, item_id, obligation_id)
);

ALTER TABLE inventory_controls  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_obligations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inventory_controls' AND policyname='inventory_controls_read') THEN
    CREATE POLICY "inventory_controls_read" ON inventory_controls FOR SELECT USING (organization_id = get_current_org_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inventory_controls' AND policyname='inventory_controls_write') THEN
    CREATE POLICY "inventory_controls_write" ON inventory_controls FOR ALL
      USING (organization_id = get_current_org_id() AND get_current_role() IN ('admin','security_manager','quality_manager'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inventory_obligations' AND policyname='inventory_obligations_read') THEN
    CREATE POLICY "inventory_obligations_read" ON inventory_obligations FOR SELECT USING (organization_id = get_current_org_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inventory_obligations' AND policyname='inventory_obligations_write') THEN
    CREATE POLICY "inventory_obligations_write" ON inventory_obligations FOR ALL
      USING (organization_id = get_current_org_id() AND get_current_role() IN ('admin','security_manager','quality_manager'));
  END IF;
END $$;

-- ================================================================
-- SECTION 6: Strong join tables
-- ================================================================

CREATE TABLE IF NOT EXISTS application_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(application_id, asset_id)
);

CREATE TABLE IF NOT EXISTS application_data_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  data_asset_id UUID NOT NULL REFERENCES data_assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(application_id, data_asset_id)
);

CREATE TABLE IF NOT EXISTS application_processes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES business_processes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(application_id, process_id)
);

CREATE TABLE IF NOT EXISTS process_data_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES business_processes(id) ON DELETE CASCADE,
  data_asset_id UUID NOT NULL REFERENCES data_assets(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'produces_or_uses',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(process_id, data_asset_id)
);

CREATE TABLE IF NOT EXISTS vendor_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, application_id)
);

CREATE TABLE IF NOT EXISTS vendor_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, asset_id)
);

-- RLS on join tables (tenant scope via parent)
ALTER TABLE application_assets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_data_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_processes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_data_assets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_assets           ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='application_assets' AND policyname='application_assets_read') THEN
    CREATE POLICY "application_assets_read" ON application_assets FOR SELECT
      USING (application_id IN (SELECT id FROM applications WHERE organization_id = get_current_org_id()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='application_data_assets' AND policyname='application_data_assets_read') THEN
    CREATE POLICY "application_data_assets_read" ON application_data_assets FOR SELECT
      USING (application_id IN (SELECT id FROM applications WHERE organization_id = get_current_org_id()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='application_processes' AND policyname='application_processes_read') THEN
    CREATE POLICY "application_processes_read" ON application_processes FOR SELECT
      USING (application_id IN (SELECT id FROM applications WHERE organization_id = get_current_org_id()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='process_data_assets' AND policyname='process_data_assets_read') THEN
    CREATE POLICY "process_data_assets_read" ON process_data_assets FOR SELECT
      USING (process_id IN (SELECT id FROM business_processes WHERE organization_id = get_current_org_id()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_applications' AND policyname='vendor_applications_read') THEN
    CREATE POLICY "vendor_applications_read" ON vendor_applications FOR SELECT
      USING (vendor_id IN (SELECT id FROM vendors WHERE organization_id = get_current_org_id()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_assets' AND policyname='vendor_assets_read') THEN
    CREATE POLICY "vendor_assets_read" ON vendor_assets FOR SELECT
      USING (vendor_id IN (SELECT id FROM vendors WHERE organization_id = get_current_org_id()));
  END IF;
END $$;

-- ================================================================
-- SECTION 7: Indexes
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_compliance_obligations_org    ON compliance_obligations(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_obligations_source ON compliance_obligations(source_id);
CREATE INDEX IF NOT EXISTS idx_compliance_obligations_type   ON compliance_obligations(type_id);
CREATE INDEX IF NOT EXISTS idx_inventory_controls_item       ON inventory_controls(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_controls_control    ON inventory_controls(control_id);
CREATE INDEX IF NOT EXISTS idx_inventory_obligations_item    ON inventory_obligations(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_obligations_oblg    ON inventory_obligations(obligation_id);
CREATE INDEX IF NOT EXISTS idx_application_assets_app        ON application_assets(application_id);
CREATE INDEX IF NOT EXISTS idx_application_assets_asset      ON application_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_application_data_assets_app   ON application_data_assets(application_id);
CREATE INDEX IF NOT EXISTS idx_application_processes_app     ON application_processes(application_id);
CREATE INDEX IF NOT EXISTS idx_process_data_assets_proc      ON process_data_assets(process_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_vendor    ON vendor_applications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_assets_vendor          ON vendor_assets(vendor_id);
CREATE INDEX IF NOT EXISTS idx_assets_lifecycle              ON assets(lifecycle_phase_id);
CREATE INDEX IF NOT EXISTS idx_applications_lifecycle        ON applications(lifecycle_phase_id);
CREATE INDEX IF NOT EXISTS idx_data_assets_classification    ON data_assets(classification_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category              ON vendors(category_id);
