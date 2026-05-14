import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Asset } from '@/lib/cybersecure-types';

export function useAssets() {
  const { organizationId } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    if (!organizationId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('organization_id', organizationId)
      .order('criticality')
      .order('asset_name');
    if (!error && data) setAssets(data);
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, [organizationId]);

  const addAsset = async (asset: Partial<Asset>) => {
    const { error } = await supabase.from('assets').insert({ ...asset, organization_id: organizationId });
    if (!error) await fetchAssets();
    return !error;
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    const { error } = await supabase.from('assets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', organizationId);
    if (!error) await fetchAssets();
    return !error;
  };

  const deleteAsset = async (id: string) => {
    const { error } = await supabase.from('assets').delete().eq('id', id).eq('organization_id', organizationId);
    if (!error) await fetchAssets();
    return !error;
  };

  return { assets, loading, addAsset, updateAsset, deleteAsset, refetch: fetchAssets };
}
