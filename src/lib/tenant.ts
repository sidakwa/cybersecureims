import { supabase } from './supabase';

let cachedOrganizationId: string | null = null;
let cachedEmail: string | null = null;

export async function getCurrentOrganizationId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentEmail = user?.email || null;
  
  if (cachedEmail !== currentEmail) {
    cachedOrganizationId = null;
    cachedEmail = currentEmail;
  }
  
  if (cachedOrganizationId) return cachedOrganizationId;
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();
  
  cachedOrganizationId = profile?.organization_id || null;
  cachedEmail = currentEmail;
  return cachedOrganizationId;
}

export function clearOrganizationCache() {
  cachedOrganizationId = null;
  cachedEmail = null;
}

/**
 * Adds organization filter to a Supabase query.
 * @param query - The Supabase query builder instance
 * @param orgId - The organization ID to filter by (optional)
 * @returns The query with organization filter applied
 */
export function withOrganizationFilter<T>(query: T, orgId?: string | null): T {
  if (orgId && typeof (query as any).eq === 'function') {
    return (query as any).eq('organization_id', orgId);
  }
  return query;
}
