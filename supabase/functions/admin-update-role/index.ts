import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
  },
});

const ALLOWED_ROLES = ['admin', 'quality_manager', 'auditor', 'viewer'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const {
    data: { user: callerUser },
    error: callerError,
  } = await supabase.auth.getUser(token);

  if (callerError || !callerUser) {
    return new Response(JSON.stringify({ error: 'Invalid auth token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { data: callerProfile, error: callerProfileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', callerUser.id)
    .maybeSingle();

  if (callerProfileError) {
    console.error('Caller profile error:', callerProfileError);
    return new Response(JSON.stringify({ error: 'Failed to validate caller' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (callerProfile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const payload = await req.json();
  const userId = payload?.userId;
  const newRole = payload?.newRole;

  if (!userId || !newRole || !ALLOWED_ROLES.includes(newRole)) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (callerUser.id === userId && newRole !== 'admin') {
    return new Response(JSON.stringify({ error: 'Admins cannot remove their own admin role' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfileError) {
    console.error('Existing profile error:', existingProfileError);
    return new Response(JSON.stringify({ error: 'Failed to validate target user' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const updatePayload = {
    id: userId,
    role: newRole,
    updated_at: new Date().toISOString(),
  };

  const result = existingProfile
    ? await supabase.from('profiles').update(updatePayload).eq('id', userId)
    : await supabase.from('profiles').insert(updatePayload);

  if (result.error) {
    console.error('Role update error:', result.error);
    return new Response(JSON.stringify({ error: 'Failed to update role' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
