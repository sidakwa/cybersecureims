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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
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

  const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (authUsersError) {
    console.error('listUsers error:', authUsersError);
    return new Response(JSON.stringify({ error: 'Failed to load auth users' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
  if (profilesError) {
    console.error('profiles fetch error:', profilesError);
    return new Response(JSON.stringify({ error: 'Failed to load profiles' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const users = (authUsers?.users || [])
    .map((authUser) => {
      const profile = profileMap.get(authUser.id) || {} as any;
      const role = ALLOWED_ROLES.includes(profile.role) ? profile.role : 'viewer';
      const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || profile.full_name || authUser.email?.split('@')[0] || '';

      return {
        id: authUser.id,
        email: authUser.email,
        full_name: fullName,
        role,
        organization_id: profile.organization_id || null,
        department: profile.department || null,
        business_unit: profile.business_unit || null,
        last_sign_in_at: authUser.last_sign_in_at,
        created_at: authUser.created_at,
        has_profile: Boolean(profile.id),
      };
    })
    .sort((a, b) => {
      const aTime = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : new Date(a.created_at).getTime();
      const bTime = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : new Date(b.created_at).getTime();
      return bTime - aTime;
    });

  return new Response(JSON.stringify({ users }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
