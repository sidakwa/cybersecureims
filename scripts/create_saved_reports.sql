-- Create saved reports table
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  schedule TEXT,
  recipients TEXT[],
  format TEXT DEFAULT 'csv',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Enable RLS
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
DROP POLICY IF EXISTS "Users can manage their reports" ON saved_reports;
CREATE POLICY "Users can manage their reports" ON saved_reports
  FOR ALL
  TO authenticated
  USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Insert sample saved report for testing
INSERT INTO saved_reports (organization_id, report_name, report_type, schedule, recipients, format, created_by)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  'Weekly Compliance Report',
  'compliance',
  'weekly',
  ARRAY['admin@seacom.com'],
  'csv',
  'System'
WHERE NOT EXISTS (SELECT 1 FROM saved_reports LIMIT 1);

SELECT '✅ saved_reports table created' as status;
