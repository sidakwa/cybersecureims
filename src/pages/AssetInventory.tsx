import PageHeader from '@/components/PageHeader';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Server, Plus, Trash2, Edit, Search } from 'lucide-react';

interface Asset {
  id: string;
  asset_name: string;
  asset_type: string;
  criticality: string;
  owner: string;
  data_classification: string;
  location: string;
  description: string;
}

export default function AssetInventory() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_type: '',
    criticality: '',
    owner: '',
    data_classification: '',
    location: '',
    description: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchAssets();
  }, [user]);

  const fetchAssets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        const { error } = await supabase
          .from('assets')
          .update(formData)
          .eq('id', editingAsset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('assets')
          .insert([formData]);
        if (error) throw error;
      }
      await fetchAssets();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving asset:', err);
    }
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      await fetchAssets();
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  const resetForm = () => {
    setEditingAsset(null);
    setFormData({
      asset_name: '',
      asset_type: '',
      criticality: '',
      owner: '',
      data_classification: '',
      location: '',
      description: ''
    });
  };

  const editAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      asset_name: asset.asset_name,
      asset_type: asset.asset_type || '',
      criticality: asset.criticality || '',
      owner: asset.owner || '',
      data_classification: asset.data_classification || '',
      location: asset.location || '',
      description: asset.description || ''
    });
    setModalOpen(true);
  };

  const getCriticalityColor = (criticality: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-black',
      low: 'bg-green-500 text-white'
    };
    return colors[criticality?.toLowerCase()] || 'bg-gray-500 text-white';
  };

  const filteredAssets = assets.filter(asset =>
    asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#0057B8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0057B8] -mt-6 -mx-6 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader title="Asset Inventory" description="Manage and track organisational assets" icon={<Server className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Manage your digital assets and their classifications</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{assets.length} Total Assets</Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Total Assets</p>
            <p className="text-xl font-bold text-[#0D2240]">{assets.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Critical/High</p>
            <p className="text-xl font-bold text-red-600">{assets.filter(a => a.criticality === 'critical' || a.criticality === 'high').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Cloud Assets</p>
            <p className="text-xl font-bold text-[#0057B8]">{assets.filter(a => a.asset_type === 'cloud').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Servers</p>
            <p className="text-xl font-bold text-green-600">{assets.filter(a => a.asset_type === 'server').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-gray-300"
          />
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Assets Table */}
      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Asset Name</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Type</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Criticality</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Classification</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Owner</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Location</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    No assets found. Click "Add Asset" to get started.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div>
                        <p className="text-sm font-medium text-[#0D2240]">{asset.asset_name}</p>
                        {asset.description && (
                          <p className="text-xs text-gray-500 mt-1">{asset.description.substring(0, 50)}...</p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs capitalize">{asset.asset_type || 'Not specified'}</Badge>
                    </td>
                    <td className="p-3">
                      {asset.criticality ? (
                        <Badge className={getCriticalityColor(asset.criticality)}>
                          {asset.criticality.toUpperCase()}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs capitalize">{asset.data_classification || 'Not classified'}</Badge>
                    </td>
                    <td className="p-3 text-sm text-[#0D2240]">{asset.owner || 'Unassigned'}</td>
                    <td className="p-3 text-sm text-[#0D2240]">{asset.location || 'Not specified'}</td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="sm" onClick={() => editAsset(asset)} className="text-[#0057B8] hover:text-[#003D82]">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteAsset(asset.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Asset Modal with styled dropdowns */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">
              {editingAsset ? 'Edit Asset' : 'Add New Asset'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Asset Name *</Label>
              <Input
                value={formData.asset_name}
                onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                className="bg-white border-gray-300 focus:border-[#0057B8] focus:ring-[#0057B8]"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Asset Type</Label>
                <Select value={formData.asset_type} onValueChange={(v) => setFormData({ ...formData, asset_type: v })}>
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#0057B8] focus:ring-[#0057B8]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="server" className="hover:bg-gray-100 cursor-pointer">Server</SelectItem>
                    <SelectItem value="endpoint" className="hover:bg-gray-100 cursor-pointer">Endpoint</SelectItem>
                    <SelectItem value="application" className="hover:bg-gray-100 cursor-pointer">Application</SelectItem>
                    <SelectItem value="data" className="hover:bg-gray-100 cursor-pointer">Data</SelectItem>
                    <SelectItem value="network" className="hover:bg-gray-100 cursor-pointer">Network</SelectItem>
                    <SelectItem value="cloud" className="hover:bg-gray-100 cursor-pointer">Cloud</SelectItem>
                    <SelectItem value="database" className="hover:bg-gray-100 cursor-pointer">Database</SelectItem>
                    <SelectItem value="storage" className="hover:bg-gray-100 cursor-pointer">Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Criticality</Label>
                <Select value={formData.criticality} onValueChange={(v) => setFormData({ ...formData, criticality: v })}>
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#0057B8] focus:ring-[#0057B8]">
                    <SelectValue placeholder="Select criticality" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="critical" className="text-red-600 hover:bg-red-50 cursor-pointer">Critical</SelectItem>
                    <SelectItem value="high" className="text-orange-600 hover:bg-orange-50 cursor-pointer">High</SelectItem>
                    <SelectItem value="medium" className="text-yellow-600 hover:bg-yellow-50 cursor-pointer">Medium</SelectItem>
                    <SelectItem value="low" className="text-green-600 hover:bg-green-50 cursor-pointer">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Data Classification</Label>
                <Select value={formData.data_classification} onValueChange={(v) => setFormData({ ...formData, data_classification: v })}>
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#0057B8] focus:ring-[#0057B8]">
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="public" className="hover:bg-gray-100 cursor-pointer">Public</SelectItem>
                    <SelectItem value="internal" className="hover:bg-gray-100 cursor-pointer">Internal</SelectItem>
                    <SelectItem value="confidential" className="hover:bg-gray-100 cursor-pointer">Confidential</SelectItem>
                    <SelectItem value="restricted" className="hover:bg-gray-100 cursor-pointer">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Owner</Label>
                <Input
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="bg-white border-gray-300 focus:border-[#0057B8] focus:ring-[#0057B8]"
                  placeholder="Asset owner"
                />
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-white border-gray-300 focus:border-[#0057B8] focus:ring-[#0057B8]"
                placeholder="e.g., AWS us-east-1, On-prem DC1"
              />
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white border-gray-300 focus:border-[#0057B8] focus:ring-[#0057B8]"
                placeholder="Brief description of the asset"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">Save Asset</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
