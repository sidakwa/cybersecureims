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
import { Loader2, Skull, Plus, Trash2, Edit, Search } from 'lucide-react';

const EMPTY_FORM = {
  threat_name: '',
  threat_category: 'other',
  description: '',
  likelihood: 'medium',
  potential_impact: 'high',
  threat_source: 'external',
  status: 'active',
  mitigation_notes: '',
  owner: '',
};

const CATEGORIES: Record<string, string> = {
  ransomware:          'Ransomware',
  phishing:            'Phishing',
  supply_chain:        'Supply Chain',
  insider_threat:      'Insider Threat',
  ddos:                'DDoS',
  data_breach:         'Data Breach',
  social_engineering:  'Social Engineering',
  malware:             'Malware',
  other:               'Other',
};

const SOURCES: Record<string, string> = {
  external:     'External',
  internal:     'Internal',
  third_party:  'Third Party',
  nation_state: 'Nation State',
};

export default function ThreatRegister() {
  const { organizationId, loading: authLoading } = useAuth();
  const [threats, setThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) fetchThreats();
  }, [organizationId, authLoading]);

  const fetchThreats = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('threat_register')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setThreats(data || []);
    } catch (err) {
      console.error('Error fetching threats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, organization_id: organizationId };
      if (editing) {
        const { error } = await supabase.from('threat_register').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('threat_register').insert([payload]);
        if (error) throw error;
      }
      await fetchThreats();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving threat:', err);
    }
  };

  const deleteThreat = async (id: string) => {
    if (!confirm('Delete this threat?')) return;
    try {
      const { error } = await supabase.from('threat_register').delete().eq('id', id);
      if (error) throw error;
      await fetchThreats();
    } catch (err) {
      console.error('Error deleting threat:', err);
    }
  };

  const resetForm = () => { setEditing(null); setFormData(EMPTY_FORM); };

  const openEdit = (t: any) => {
    setEditing(t);
    setFormData({
      threat_name:      t.threat_name || '',
      threat_category:  t.threat_category || 'other',
      description:      t.description || '',
      likelihood:       t.likelihood || 'medium',
      potential_impact: t.potential_impact || 'high',
      threat_source:    t.threat_source || 'external',
      status:           t.status || 'active',
      mitigation_notes: t.mitigation_notes || '',
      owner:            t.owner || '',
    });
    setModalOpen(true);
  };

  const impactColor: Record<string, string> = {
    critical: 'bg-red-600 text-white',
    high:     'bg-orange-500 text-white',
    medium:   'bg-yellow-500 text-black',
    low:      'bg-green-500 text-white',
  };

  const likelihoodColor: Record<string, string> = {
    high:   'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low:    'bg-green-100 text-green-800',
  };

  const statusColor: Record<string, string> = {
    active:     'bg-red-100 text-red-800',
    monitoring: 'bg-yellow-100 text-yellow-800',
    mitigated:  'bg-green-100 text-green-800',
    retired:    'bg-gray-100 text-gray-600',
  };

  const active    = threats.filter(t => t.status === 'active').length;
  const critical  = threats.filter(t => t.potential_impact === 'critical').length;
  const mitigated = threats.filter(t => t.status === 'mitigated').length;

  const filtered = threats.filter(t => {
    const matchSearch =
      t.threat_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.owner?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'all' || t.threat_category === filterCategory;
    return matchSearch && matchCat;
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
          <PageHeader title="Threat Register" description="Identify and track threats to the organisation" icon={<Skull className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Catalogue threat actors, vectors and scenarios linked to your risk landscape</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{threats.length} Threats</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Total Threats</p>
          <p className="text-xl font-bold text-[#0D2240]">{threats.length}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Active</p>
          <p className="text-xl font-bold text-red-600">{active}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Critical Impact</p>
          <p className="text-xl font-bold text-orange-600">{critical}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Mitigated</p>
          <p className="text-xl font-bold text-green-600">{mitigated}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search threats..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />Add Threat
        </Button>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Threat</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Category</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Source</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Likelihood</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Impact</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Owner</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Status</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-8 text-gray-500">No threats found. Click "Add Threat" to register one.</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <p className="text-sm font-medium text-[#0D2240]">{t.threat_name}</p>
                    {t.description && <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{t.description}</p>}
                  </td>
                  <td className="p-3"><Badge variant="outline" className="text-xs">{CATEGORIES[t.threat_category] || t.threat_category}</Badge></td>
                  <td className="p-3 text-sm text-gray-600">{SOURCES[t.threat_source] || t.threat_source}</td>
                  <td className="p-3"><Badge className={likelihoodColor[t.likelihood] || 'bg-gray-100 text-gray-600'}>{t.likelihood}</Badge></td>
                  <td className="p-3"><Badge className={impactColor[t.potential_impact] || 'bg-gray-500 text-white'}>{t.potential_impact}</Badge></td>
                  <td className="p-3 text-sm text-[#0D2240]">{t.owner || '—'}</td>
                  <td className="p-3"><Badge className={statusColor[t.status] || 'bg-gray-100 text-gray-600'}>{t.status}</Badge></td>
                  <td className="p-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)} className="text-[#0057B8] hover:text-[#003D82]"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteThreat(t.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">{editing ? 'Edit Threat' : 'Register Threat'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Threat Name *</Label>
              <Input value={formData.threat_name} onChange={(e) => setFormData({ ...formData, threat_name: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., Ransomware via phishing email" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Category</Label>
                <Select value={formData.threat_category} onValueChange={(v) => setFormData({ ...formData, threat_category: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Threat Source</Label>
                <Select value={formData.threat_source} onValueChange={(v) => setFormData({ ...formData, threat_source: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {Object.entries(SOURCES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="How this threat manifests, attack vectors, indicators" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Likelihood</Label>
                <Select value={formData.likelihood} onValueChange={(v) => setFormData({ ...formData, likelihood: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Potential Impact</Label>
                <Select value={formData.potential_impact} onValueChange={(v) => setFormData({ ...formData, potential_impact: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Owner</Label>
              <Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Threat owner / responsible team" />
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Mitigation Notes</Label>
              <Textarea value={formData.mitigation_notes} onChange={(e) => setFormData({ ...formData, mitigation_notes: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="Controls in place, compensating measures, or remediation plan" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Register Threat'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
