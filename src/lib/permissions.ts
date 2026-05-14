import { supabase } from './supabase';

export async function isDefaultOrgAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization:organization_id(name)')
    .eq('id', user.id)
    .single();
  
  return profile?.role === 'admin' && profile?.organization?.name === 'Default Organization';
}

export async function canCreateUsers(): Promise<boolean> {
  return await isDefaultOrgAdmin();
}

export async function canManageAllOrgs(): Promise<boolean> {
  return await isDefaultOrgAdmin();
}
