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
import { Loader2, UserCheck, Plus, Trash2, Edit, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';

const EMPTY_FORM = {
  attestation_title: '',
  attestation_type: 'annual_review',
  attester_name: '',
  attester_role: '',
  department: '',
  attestation_date: '',
  expiry_date: '',
  status: 'pending',
  linked_control: '',
  linked_policy: '',
  comments: '',
};

const ATTEST_TYPES: Record<string, string> = {
  policy_acknowledgement: 'Policy Acknowledgement',
  control_effectiveness:  'Control Effectiveness',
  risk_acceptance:        'Risk Acceptance',
  soa_review:             'SoA Review',
  annual_review:          'Annual Review',
  access_review:          'Access Review',
  other:                  'Other',
};

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function ManagementAttestations() {
  const { organizationId, loading: authLoading } = useAuth();
  const [attestations, setAttestations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) fetchAttestations();
  }, [organizationId, authLoading]);

  const fetchAttestations = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('management_attestations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('expiry_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      setAttestations(data || []);
    } catch (err) {
      console.error('Error fetching attestations:', err);
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
        attestation_date: formData.attestation_date || null,
        expiry_date: formData.expiry_date || null,
        linked_control: formData.linked_control || null,
        linked_policy: formData.linked_policy || null,
        comments: formData.comments || null,
      };
      if (editing) {
        const { error } = await supabase.from('management_attestations').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('management_attestations').insert([payload]);
        if (error) throw error;
      }
      await fetchAttestations();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving attestation:', err);
    }
  };

  const deleteAttestation = async (id: string) => {
    if (!confirm('Delete this attestation?')) return;
    await supabase.from('management_attestations').delete().eq('id', id);
    await fetchAttestations();
  };

  const resetForm = () => { setEditing(null); setFormData(EMPTY_FORM); };

  const openEdit = (a: any) => {
    setEditing(a);
    setFormData({
      attestation_title: a.attestation_title || '',
      attestation_type:  a.attestation_type || 'annual_review',
      attester_name:     a.attester_name || '',
      attester_role:     a.attester_role || '',
      department:        a.department || '',
      attestation_date:  a.attestation_date || '',
      expiry_date:       a.expiry_date || '',
      status:            a.status || 'pending',
      linked_control:    a.linked_control || '',
      linked_policy:     a.linked_policy || '',
      comments:          a.comments || '',
    });
    setModalOpen(true);
  };

  const statusColor: Record<string, string> = {
    pending:   'bg-gray-100 text-gray-700',
    completed: 'bg-green-100 text-green-800',
    overdue:   'bg-red-100 text-red-800',
    waived:    'bg-purple-100 text-purple-800',
  };

  const completed = attestations.filter(a => a.status === 'completed').length;
  const pending   = attestations.filter(a => a.status === 'pending').length;
  const overdue   = attestations.filter(a => a.expiry_date && daysUntil(a.expiry_date) < 0 && a.status !== 'completed').length;
  const expiringSoon = attestations.filter(a => {
    if (!a.expiry_date || a.status === 'completed') return false;
    const d = daysUntil(a.expiry_date);
    return d >= 0 && d <= 30;
  }).length;

  const completionPct = attestations.length
    ? Math.round((completed / attestations.length) * 100)
    : 0;

  const filtered = attestations.filter(a => {
    const matchSearch =
      a.attestation_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.attester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
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
          <PageHeader title="Management Attestations" description="Periodic sign-offs on controls, policies and risk acceptance" icon={<UserCheck className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Track management accountability for control effectiveness, policy acknowledgement and risk ownership</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{completionPct}% Complete</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Completed</p>
          <p className="text-xl font-bold text-green-600">{completed}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Pending</p>
          <p className="text-xl font-bold text-gray-700">{pending}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Overdue</p>
          <p className="text-xl font-bold text-red-600">{overdue}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Expiring in 30d</p>
          <p className="text-xl font-bold text-orange-600">{expiringSoon}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search attestations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />New Attestation
        </Button>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Attestation</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Type</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Attester</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Department</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Attested</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Expiry</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Status</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-8 text-gray-500">No attestations found.</td></tr>
              ) : filtered.map((a) => {
                const daysLeft = a.expiry_date ? daysUntil(a.expiry_date) : null;
                const isExpired = daysLeft !== null && daysLeft < 0 && a.status !== 'completed';
                const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && a.status !== 'completed';
                return (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <p className="text-sm font-medium text-[#0D2240]">{a.attestation_title}</p>
                      {(a.linked_control || a.linked_policy) && (
                        <p className="text-xs text-gray-400 mt-0.5">{[a.linked_control, a.linked_policy].filter(Boolean).join(' · ')}</p>
                      )}
                    </td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{ATTEST_TYPES[a.attestation_type] || a.attestation_type}</Badge></td>
                    <td className="p-3">
                      <p className="text-sm text-[#0D2240]">{a.attester_name || '—'}</p>
                      {a.attester_role && <p className="text-xs text-gray-500">{a.attester_role}</p>}
                    </td>
                    <td className="p-3 text-sm text-gray-600">{a.department || '—'}</td>
                    <td className="p-3 text-sm text-gray-600">{a.attestation_date || '—'}</td>
                    <td className="p-3 text-sm">
                      {a.expiry_date ? (
                        <span className={isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                          {a.expiry_date}
                          {daysLeft !== null && a.status !== 'completed' && (
                            <span className="block text-xs">
                              {isExpired ? <><AlertTriangle className="inline h-3 w-3 mr-0.5" />{Math.abs(daysLeft)}d overdue</> : `${daysLeft}d left`}
                            </span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3">
                      <Badge className={`${statusColor[a.status] || 'bg-gray-100 text-gray-600'} flex items-center gap-1 w-fit`}>
                        {a.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                        {a.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)} className="text-[#0057B8] hover:text-[#003D82]"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteAttestation(a.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">{editing ? 'Edit Attestation' : 'New Attestation'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Title *</Label>
              <Input value={formData.attestation_title} onChange={(e) => setFormData({ ...formData, attestation_title: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., Annual ISMS Policy Acknowledgement" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Type</Label>
                <Select value={formData.attestation_type} onValueChange={(v) => setFormData({ ...formData, attestation_type: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {Object.entries(ATTEST_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Attester Name *</Label>
                <Input value={formData.attester_name} onChange={(e) => setFormData({ ...formData, attester_name: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Role / Title</Label>
                <Input value={formData.attester_role} onChange={(e) => setFormData({ ...formData, attester_role: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., CISO, Head of Finance" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Department</Label>
                <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Attestation Date</Label>
                <Input type="date" value={formData.attestation_date} onChange={(e) => setFormData({ ...formData, attestation_date: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Expiry Date</Label>
              <Input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Linked Control</Label>
                <Input value={formData.linked_control} onChange={(e) => setFormData({ ...formData, linked_control: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., ISO A.5.1.1" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Linked Policy</Label>
                <Input value={formData.linked_policy} onChange={(e) => setFormData({ ...formData, linked_policy: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., IS-POL-001" />
              </div>
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Comments</Label>
              <Textarea value={formData.comments} onChange={(e) => setFormData({ ...formData, comments: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Create Attestation'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
