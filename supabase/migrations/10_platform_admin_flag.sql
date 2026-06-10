-- ============================================================
-- Add is_platform_admin flag to profiles
-- Replaces fragile org-name-string check in permissions.ts
-- Set this to true only for super-admins who manage all orgs
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

-- Seed: carry over any existing admins in the default org
-- (adjust the org name if yours differs)
UPDATE profiles
SET is_platform_admin = true
WHERE role = 'admin'
  AND organization_id = (
    SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1
  );
