// Supabase Edge Function: seed-org-controls
// Triggered after a new organization is created to auto-populate all framework controls
// Deploy: supabase functions deploy seed-org-controls

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { organization_id, frameworks } = await req.json();
  if (!organization_id) return new Response(JSON.stringify({ error: 'organization_id required' }), { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Execute the seed SQL with the organization_id substituted
  // This calls the migration SQL seeded with :org_id replaced
  const { error } = await supabase.rpc('seed_org_controls', {
    p_organization_id: organization_id,
    p_frameworks: frameworks || ['ISO27001', 'SOC2', 'NIST_CSF'],
  });

  if (error) {
    console.error('Seed error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({
    success: true,
    message: `Controls seeded for organization ${organization_id}`,
  }), { headers: { 'Content-Type': 'application/json' } });
});
