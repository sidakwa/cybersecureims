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
import { Loader2, Plug, Plus, Trash2, Edit, Search, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const EMPTY_FORM = {
  connector_name: '',
  connector_type: 'other',
  vendor: '',
  status: 'inactive',
  api_endpoint: '',
  sync_frequency: 'manual',
  last_sync: '',
  config_notes: '',
  owner: '',
};

const CONNECTOR_TYPES: Record<string, string> = {
  siem:                'SIEM',
  vulnerability_scanner: 'Vulnerability Scanner',
  cloud_provider:      'Cloud Provider',
  ticketing:           'Ticketing / ITSM',
  identity:            'Identity & Access',
  endpoint:            'Endpoint Security',
  email_security:      'Email Security',
  firewall:            'Firewall / NGFW',
  other:               'Other',
};

const SYNC_FREQUENCIES: Record<string, string> = {
  real_time: 'Real-time',
  hourly:    'Hourly',
  daily:     'Daily',
  weekly:    'Weekly',
  manual:    'Manual',
};

export default function IntegrationManager() {
  const { organizationId, loading: authLoading } = useAuth();
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) fetchConnectors();
  }, [organizationId, authLoading]);

  const fetchConnectors = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integration_connectors')
        .select('*')
        .eq('organization_id', organizationId)
        .order('connector_name', { ascending: true });
      if (error) throw error;
      setConnectors(data || []);
    } catch (err) {
      console.error('Error fetching connectors:', err);
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
        api_endpoint: formData.api_endpoint || null,
        last_sync: formData.last_sync || null,
        config_notes: formData.config_notes || null,
        owner: formData.owner || null,
      };
      if (editing) {
        const { error } = await supabase.from('integration_connectors').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('integration_connectors').insert([payload]);
        if (error) throw error;
      }
      await fetchConnectors();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving connector:', err);
    }
  };

  const deleteConnector = async (id: string) => {
    if (!confirm('Delete this integration?')) return;
    try {
      const { error } = await supabase.from('integration_connectors').delete().eq('id', id);
      if (error) throw error;
      await fetchConnectors();
    } catch (err) {
      console.error('Error deleting connector:', err);
    }
  };

  const resetForm = () => { setEditing(null); setFormData(EMPTY_FORM); };

  const openEdit = (c: any) => {
    setEditing(c);
    setFormData({
      connector_name:   c.connector_name || '',
      connector_type:   c.connector_type || 'other',
      vendor:           c.vendor || '',
      status:           c.status || 'inactive',
      api_endpoint:     c.api_endpoint || '',
      sync_frequency:   c.sync_frequency || 'manual',
      last_sync:        c.last_sync ? c.last_sync.substring(0, 16) : '',
      config_notes:     c.config_notes || '',
      owner:            c.owner || '',
    });
    setModalOpen(true);
  };

  const statusIcon: Record<string, React.ReactNode> = {
    active:  <CheckCircle2 className="h-4 w-4 text-green-500" />,
    inactive: <XCircle className="h-4 w-4 text-gray-400" />,
    error:   <AlertCircle className="h-4 w-4 text-red-500" />,
    syncing: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
    testing: <RefreshCw className="h-4 w-4 text-yellow-500" />,
  };

  const statusBadge: Record<string, string> = {
    active:   'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    error:    'bg-red-100 text-red-800',
    syncing:  'bg-blue-100 text-blue-800',
    testing:  'bg-yellow-100 text-yellow-800',
  };

  const active   = connectors.filter(c => c.status === 'active').length;
  const errored  = connectors.filter(c => c.status === 'error').length;
  const inactive = connectors.filter(c => c.status === 'inactive').length;

  const filtered = connectors.filter(c => {
    const matchSearch =
      c.connector_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || c.connector_type === filterType;
    return matchSearch && matchType;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-[#0057B8]" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#0057B8] -mt-6 -mx-6 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader title="Integration Manager" description="Data source connectors and integration health" icon={<Plug className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Manage connections to SIEMs, scanners, cloud providers and security tooling</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{connectors.length} Connectors</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Total</p>
          <p className="text-xl font-bold text-[#0D2240]">{connectors.length}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Active</p>
          <p className="text-xl font-bold text-green-600">{active}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Errors</p>
          <p className="text-xl font-bold text-red-600">{errored}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Inactive</p>
          <p className="text-xl font-bold text-gray-500">{inactive}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search integrations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-52 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(CONNECTOR_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />Add Integration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-8 text-center text-gray-500">No integrations found. Click "Add Integration" to register one.</CardContent>
            </Card>
          </div>
        ) : filtered.map((c) => (
          <Card key={c.id} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {statusIcon[c.status] || <XCircle className="h-4 w-4 text-gray-400" />}
                  <div>
                    <h3 className="font-semibold text-[#0D2240] text-sm">{c.connector_name}</h3>
                    {c.vendor && <p className="text-xs text-gray-500">{c.vendor}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="text-[#0057B8] hover:text-[#003D82] h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteConnector(c.id)} className="text-red-500 hover:text-red-700 h-7 w-7 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge className={statusBadge[c.status] || 'bg-gray-100 text-gray-600'}>{c.status}</Badge>
                <Badge variant="outline" className="text-xs">{CONNECTOR_TYPES[c.connector_type] || c.connector_type}</Badge>
                {c.sync_frequency !== 'manual' && (
                  <Badge variant="outline" className="text-xs text-blue-600">{SYNC_FREQUENCIES[c.sync_frequency]}</Badge>
                )}
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                {c.api_endpoint && (
                  <div className="flex items-center gap-1 truncate">
                    <span className="font-medium text-gray-600 shrink-0">Endpoint:</span>
                    <span className="truncate font-mono text-xs">{c.api_endpoint}</span>
                  </div>
                )}
                {c.last_sync && (
                  <div><span className="font-medium text-gray-600">Last sync:</span> {new Date(c.last_sync).toLocaleString()}</div>
                )}
                {c.owner && (
                  <div><span className="font-medium text-gray-600">Owner:</span> {c.owner}</div>
                )}
                {c.config_notes && (
                  <p className="text-gray-400 mt-1 line-clamp-2">{c.config_notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">{editing ? 'Edit Integration' : 'Add Integration'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Connector Name *</Label>
              <Input value={formData.connector_name} onChange={(e) => setFormData({ ...formData, connector_name: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., Splunk SIEM Production" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Type</Label>
                <Select value={formData.connector_type} onValueChange={(v) => setFormData({ ...formData, connector_type: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {Object.entries(CONNECTOR_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Vendor</Label>
                <Input value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., Splunk, Tenable" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="syncing">Syncing</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Sync Frequency</Label>
                <Select value={formData.sync_frequency} onValueChange={(v) => setFormData({ ...formData, sync_frequency: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {Object.entries(SYNC_FREQUENCIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">API Endpoint / URL</Label>
              <Input value={formData.api_endpoint} onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Last Sync</Label>
                <Input type="datetime-local" value={formData.last_sync} onChange={(e) => setFormData({ ...formData, last_sync: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Owner</Label>
                <Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Responsible team" />
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Config Notes</Label>
              <Textarea value={formData.config_notes} onChange={(e) => setFormData({ ...formData, config_notes: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="Auth method, known issues, setup notes" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Add Integration'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
