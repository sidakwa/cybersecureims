import { supabase } from './supabase';

// This file is deprecated. Use supabase directly with organizationId from useAuth.
// All functions below require organizationId parameter.

export async function getWorkPackages(organizationId: string) {
  if (!organizationId) return { data: [], error: null };
  return supabase.from('work_package_register').select('*').eq('organization_id', organizationId);
}

export async function getUciControls(organizationId: string) {
  if (!organizationId) return { data: [], error: null };
  return supabase.from('uci_controls').select('*').eq('organization_id', organizationId);
}

export async function getRisks(organizationId: string) {
  if (!organizationId) return { data: [], error: null };
  return supabase.from('cyber_risks').select('*').eq('organization_id', organizationId);
}

export async function getCSIItems(organizationId: string) {
  if (!organizationId) return { data: [], error: null };
  return supabase.from('csi_items').select('*').eq('organization_id', organizationId);
}

export async function getControlTests(organizationId: string) {
  if (!organizationId) return { data: [], error: null };
  return supabase.from('control_tests').select('*').eq('organization_id', organizationId);
}

export async function getFrameworkControls(organizationId: string) {
  if (!organizationId) return { data: [], error: null };
  return supabase.from('framework_controls').select('*').eq('organization_id', organizationId);
}
