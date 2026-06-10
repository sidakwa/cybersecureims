import { supabase } from './supabase';

export async function isPlatformAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single();

  return profile?.is_platform_admin === true;
}

export async function canCreateUsers(): Promise<boolean> {
  return await isPlatformAdmin();
}

export async function canManageAllOrgs(): Promise<boolean> {
  return await isPlatformAdmin();
}
