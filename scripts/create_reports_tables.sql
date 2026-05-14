-- Create saved reports table
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'compliance', 'risk', 'controls', 'audit', 'executive'
  report_config JSONB,
  schedule TEXT, -- 'daily', 'weekly', 'monthly', 'quarterly'
  last_generated TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  recipients TEXT[], -- email addresses
  format TEXT DEFAULT 'csv',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Create report metrics table
CREATE TABLE IF NOT EXISTS report_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES saved_reports(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_time_ms INTEGER,
  record_count INTEGER,
  status TEXT -- 'success', 'failed', 'pending'
);

-- Enable RLS
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their reports" ON saved_reports FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert reports" ON saved_reports FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update reports" ON saved_reports FOR UPDATE USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete reports" ON saved_reports FOR DELETE USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

SELECT '✅ Report tables created' as status;
