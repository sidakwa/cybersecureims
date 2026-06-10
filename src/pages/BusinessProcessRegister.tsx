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
import { Loader2, Network, Plus, Trash2, Edit, Search } from 'lucide-react';

const EMPTY_FORM = {
  process_name: '',
  process_type: 'core',
  business_unit: '',
  process_owner: '',
  criticality: 'medium',
  description: '',
  supporting_assets: '',
  linked_risks: '',
  data_classification: 'internal',
  status: 'active',
  last_reviewed: '',
  notes: '',
};

const critColor: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high:     'bg-orange-500 text-white',
  medium:   'bg-yellow-500 text-black',
  low:      'bg-green-500 text-white',
};

const classColor: Record<string, string> = {
  public:       'bg-green-100 text-green-800',
  internal:     'bg-blue-100 text-blue-800',
  confidential: 'bg-yellow-100 text-yellow-800',
  restricted:   'bg-orange-500 text-white',
};

export default function BusinessProcessRegister() {
  const { organizationId, loading: authLoading } = useAuth();
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCrit, setFilterCrit] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) fetchProcesses();
  }, [organizationId, authLoading]);

  const fetchProcesses = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_processes')
        .select('*')
        .eq('organization_id', organizationId)
        .order('criticality', { ascending: true });
      if (error) throw error;
      setProcesses(data || []);
    } catch (err) {
      console.error('Error fetching processes:', err);
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
        supporting_assets: formData.supporting_assets || null,
        linked_risks: formData.linked_risks || null,
        last_reviewed: formData.last_reviewed || null,
        notes: formData.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from('business_processes').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('business_processes').insert([payload]);
        if (error) throw error;
      }
      await fetchProcesses();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving process:', err);
    }
  };

  const deleteProcess = async (id: string) => {
    if (!confirm('Delete this business process?')) return;
    await supabase.from('business_processes').delete().eq('id', id);
    await fetchProcesses();
  };

  const resetForm = () => { setEditing(null); setFormData(EMPTY_FORM); };

  const openEdit = (p: any) => {
    setEditing(p);
    setFormData({
      process_name:        p.process_name || '',
      process_type:        p.process_type || 'core',
      business_unit:       p.business_unit || '',
      process_owner:       p.process_owner || '',
      criticality:         p.criticality || 'medium',
      description:         p.description || '',
      supporting_assets:   p.supporting_assets || '',
      linked_risks:        p.linked_risks || '',
      data_classification: p.data_classification || 'internal',
      status:              p.status || 'active',
      last_reviewed:       p.last_reviewed || '',
      notes:               p.notes || '',
    });
    setModalOpen(true);
  };

  const critical    = processes.filter(p => p.criticality === 'critical').length;
  const underReview = processes.filter(p => p.status === 'under_review').length;
  const active      = processes.filter(p => p.status === 'active').length;

  const filtered = processes.filter(p => {
    const matchSearch =
      p.process_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.process_owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.business_unit?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCrit = filterCrit === 'all' || p.criticality === filterCrit;
    return matchSearch && matchCrit;
  });

  const statusColor: Record<string, string> = {
    active:       'bg-green-100 text-green-800',
    inactive:     'bg-gray-100 text-gray-600',
    under_review: 'bg-yellow-100 text-yellow-800',
    deprecated:   'bg-red-100 text-red-800',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-[#0057B8]" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#0057B8] -mt-6 -mx-6 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader title="Business Process Register" description="Inventory of business processes and their security relevance" icon={<Network className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Map processes to supporting assets, risks and data classification for BIA and continuity planning</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{processes.length} Processes</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Total</p>
          <p className="text-xl font-bold text-[#0D2240]">{processes.length}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Active</p>
          <p className="text-xl font-bold text-green-600">{active}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Critical</p>
          <p className="text-xl font-bold text-red-600">{critical}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Under Review</p>
          <p className="text-xl font-bold text-yellow-600">{underReview}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search processes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterCrit} onValueChange={setFilterCrit}>
            <SelectTrigger className="w-40 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Criticality</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />Add Process
        </Button>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Process</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Type</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Business Unit</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Owner</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Criticality</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Data Class</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Status</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-8 text-gray-500">No business processes found.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <p className="text-sm font-medium text-[#0D2240]">{p.process_name}</p>
                    {p.description && <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{p.description}</p>}
                  </td>
                  <td className="p-3"><Badge variant="outline" className="text-xs capitalize">{p.process_type?.replace('_', ' ')}</Badge></td>
                  <td className="p-3 text-sm text-gray-600">{p.business_unit || '—'}</td>
                  <td className="p-3 text-sm text-[#0D2240]">{p.process_owner || '—'}</td>
                  <td className="p-3"><Badge className={critColor[p.criticality] || 'bg-gray-500 text-white'}>{p.criticality}</Badge></td>
                  <td className="p-3"><Badge className={classColor[p.data_classification] || 'bg-gray-100 text-gray-600'}>{p.data_classification}</Badge></td>
                  <td className="p-3"><Badge className={statusColor[p.status] || 'bg-gray-100 text-gray-600'}>{p.status?.replace('_', ' ')}</Badge></td>
                  <td className="p-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="text-[#0057B8] hover:text-[#003D82]"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteProcess(p.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">{editing ? 'Edit Process' : 'Add Business Process'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Process Name *</Label>
              <Input value={formData.process_name} onChange={(e) => setFormData({ ...formData, process_name: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., Customer Onboarding" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Process Type</Label>
                <Select value={formData.process_type} onValueChange={(v) => setFormData({ ...formData, process_type: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="supporting">Supporting</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Criticality</Label>
                <Select value={formData.criticality} onValueChange={(v) => setFormData({ ...formData, criticality: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Business Unit</Label>
                <Input value={formData.business_unit} onChange={(e) => setFormData({ ...formData, business_unit: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., Finance, IT" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Process Owner</Label>
                <Input value={formData.process_owner} onChange={(e) => setFormData({ ...formData, process_owner: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Owner name" />
              </div>
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Data Classification</Label>
                <Select value={formData.data_classification} onValueChange={(v) => setFormData({ ...formData, data_classification: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Supporting Assets</Label>
              <Input value={formData.supporting_assets} onChange={(e) => setFormData({ ...formData, supporting_assets: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., CRM, Payment Gateway, SQL DB" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Linked Risks</Label>
                <Input value={formData.linked_risks} onChange={(e) => setFormData({ ...formData, linked_risks: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., RISK-001" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Last Reviewed</Label>
                <Input type="date" value={formData.last_reviewed} onChange={(e) => setFormData({ ...formData, last_reviewed: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Add Process'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
