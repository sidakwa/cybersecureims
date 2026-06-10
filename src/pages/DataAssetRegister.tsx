import PageHeader from '@/components/PageHeader';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Database, Plus, Trash2, Edit, Search, CheckCircle2, XCircle } from 'lucide-react';

const EMPTY_FORM = {
  asset_name: '',
  data_type: 'operational',
  classification: 'internal',
  owner: '',
  custodian: '',
  location: 'on_prem',
  storage_system: '',
  retention_period: '',
  legal_basis: '',
  encryption_at_rest: false,
  encryption_in_transit: false,
  linked_asset_ref: '',
  status: 'active',
  notes: '',
};

const DATA_TYPES: Record<string, string> = {
  pii:                  'PII',
  financial:            'Financial',
  health:               'Health',
  intellectual_property:'Intellectual Property',
  operational:          'Operational',
  public:               'Public',
  credential:           'Credentials / Auth',
  other:                'Other',
};

const LOCATIONS: Record<string, string> = {
  on_prem:    'On-Premises',
  cloud:      'Cloud',
  hybrid:     'Hybrid',
  third_party:'Third Party',
  saas:       'SaaS',
};

const classColor: Record<string, string> = {
  public:       'bg-green-100 text-green-800',
  internal:     'bg-blue-100 text-blue-800',
  confidential: 'bg-yellow-100 text-yellow-800',
  restricted:   'bg-orange-500 text-white',
  top_secret:   'bg-red-600 text-white',
};

export default function DataAssetRegister() {
  const { organizationId, loading: authLoading } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [formData, setFormData] = useState<any>(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) fetchAssets();
  }, [organizationId, authLoading]);

  const fetchAssets = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('data_assets')
        .select('*')
        .eq('organization_id', organizationId)
        .order('asset_name', { ascending: true });
      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('Error fetching data assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        organization_id: organizationId,
        retention_period: formData.retention_period || null,
        legal_basis: formData.legal_basis || null,
        storage_system: formData.storage_system || null,
        linked_asset_ref: formData.linked_asset_ref || null,
        notes: formData.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from('data_assets').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('data_assets').insert([payload]);
        if (error) throw error;
      }
      await fetchAssets();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving data asset:', err);
    }
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('Delete this data asset?')) return;
    try {
      await supabase.from('data_assets').delete().eq('id', id);
      await fetchAssets();
    } catch (err) {
      console.error('Error deleting data asset:', err);
    }
  };

  const resetForm = () => { setEditing(null); setFormData(EMPTY_FORM); };

  const openEdit = (a: any) => {
    setEditing(a);
    setFormData({
      asset_name:            a.asset_name || '',
      data_type:             a.data_type || 'operational',
      classification:        a.classification || 'internal',
      owner:                 a.owner || '',
      custodian:             a.custodian || '',
      location:              a.location || 'on_prem',
      storage_system:        a.storage_system || '',
      retention_period:      a.retention_period || '',
      legal_basis:           a.legal_basis || '',
      encryption_at_rest:    a.encryption_at_rest ?? false,
      encryption_in_transit: a.encryption_in_transit ?? false,
      linked_asset_ref:      a.linked_asset_ref || '',
      status:                a.status || 'active',
      notes:                 a.notes || '',
    });
    setModalOpen(true);
  };

  const restricted = assets.filter(a => ['confidential','restricted','top_secret'].includes(a.classification)).length;
  const noEncryption = assets.filter(a => !a.encryption_at_rest).length;
  const active = assets.filter(a => a.status === 'active').length;

  const filtered = assets.filter(a => {
    const matchSearch =
      a.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.storage_system?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = filterClass === 'all' || a.classification === filterClass;
    return matchSearch && matchClass;
  });

  const BoolIcon = ({ val }: { val: boolean }) =>
    val ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-300" />;

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-[#0057B8]" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#0057B8] -mt-6 -mx-6 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader title="Data Asset Register" description="Catalogue of data assets, classification and protection controls" icon={<Database className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Track where personal and sensitive data lives, its legal basis and encryption status (POPIA Article 18)</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{assets.length} Data Assets</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Total Assets</p>
          <p className="text-xl font-bold text-[#0D2240]">{assets.length}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Active</p>
          <p className="text-xl font-bold text-blue-600">{active}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Restricted / Above</p>
          <p className="text-xl font-bold text-orange-600">{restricted}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">No Encryption at Rest</p>
          <p className="text-xl font-bold text-red-600">{noEncryption}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search data assets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-44 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Classifications</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="confidential">Confidential</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
              <SelectItem value="top_secret">Top Secret</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />Add Data Asset
        </Button>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Asset Name</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Type</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Classification</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Location</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Owner</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Enc. Rest</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Enc. Transit</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Retention</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center p-8 text-gray-500">No data assets found.</td></tr>
              ) : filtered.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <p className="text-sm font-medium text-[#0D2240]">{a.asset_name}</p>
                    {a.storage_system && <p className="text-xs text-gray-500">{a.storage_system}</p>}
                  </td>
                  <td className="p-3"><Badge variant="outline" className="text-xs">{DATA_TYPES[a.data_type] || a.data_type}</Badge></td>
                  <td className="p-3"><Badge className={classColor[a.classification] || 'bg-gray-100 text-gray-600'}>{a.classification}</Badge></td>
                  <td className="p-3 text-sm text-gray-600">{LOCATIONS[a.location] || a.location}</td>
                  <td className="p-3 text-sm text-[#0D2240]">{a.owner || '—'}</td>
                  <td className="p-3 text-center"><BoolIcon val={a.encryption_at_rest} /></td>
                  <td className="p-3 text-center"><BoolIcon val={a.encryption_in_transit} /></td>
                  <td className="p-3 text-sm text-gray-600">{a.retention_period || '—'}</td>
                  <td className="p-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(a)} className="text-[#0057B8] hover:text-[#003D82]"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteAsset(a.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">{editing ? 'Edit Data Asset' : 'Add Data Asset'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Asset Name *</Label>
              <Input value={formData.asset_name} onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., Customer PII Database" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Data Type</Label>
                <Select value={formData.data_type} onValueChange={(v) => setFormData({ ...formData, data_type: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {Object.entries(DATA_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Classification</Label>
                <Select value={formData.classification} onValueChange={(v) => setFormData({ ...formData, classification: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="top_secret">Top Secret</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Owner</Label>
                <Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Data owner" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Custodian</Label>
                <Input value={formData.custodian} onChange={(e) => setFormData({ ...formData, custodian: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Technical custodian" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Location</Label>
                <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {Object.entries(LOCATIONS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Storage System</Label>
                <Input value={formData.storage_system} onChange={(e) => setFormData({ ...formData, storage_system: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., PostgreSQL, S3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Retention Period</Label>
                <Input value={formData.retention_period} onChange={(e) => setFormData({ ...formData, retention_period: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., 5 years, 7 years" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Legal Basis (POPIA)</Label>
                <Input value={formData.legal_basis} onChange={(e) => setFormData({ ...formData, legal_basis: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., Consent, Contract" />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.encryption_at_rest} onChange={(e) => setFormData({ ...formData, encryption_at_rest: e.target.checked })} className="accent-[#0057B8]" />
                <span className="text-sm text-[#0D2240]">Encrypted at Rest</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.encryption_in_transit} onChange={(e) => setFormData({ ...formData, encryption_in_transit: e.target.checked })} className="accent-[#0057B8]" />
                <span className="text-sm text-[#0D2240]">Encrypted in Transit</span>
              </label>
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-white border-gray-300 w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Add Asset'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
