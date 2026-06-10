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
import { Loader2, Inbox, Plus, Trash2, Edit, Search, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const EMPTY_FORM = {
  request_title: '',
  audit_ref: '',
  description: '',
  requested_from: '',
  reviewer: '',
  due_date: '',
  status: 'pending',
  evidence_provided: '',
  notes: '',
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function EvidenceRequests() {
  const { organizationId, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) fetchRequests();
  }, [organizationId, authLoading]);

  const fetchRequests = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evidence_requests')
        .select('*')
        .eq('organization_id', organizationId)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching evidence requests:', err);
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
        due_date: formData.due_date || null,
        audit_ref: formData.audit_ref || null,
        reviewer: formData.reviewer || null,
        evidence_provided: formData.evidence_provided || null,
        notes: formData.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from('evidence_requests').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('evidence_requests').insert([payload]);
        if (error) throw error;
      }
      await fetchRequests();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving evidence request:', err);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Delete this evidence request?')) return;
    try {
      const { error } = await supabase.from('evidence_requests').delete().eq('id', id);
      if (error) throw error;
      await fetchRequests();
    } catch (err) {
      console.error('Error deleting evidence request:', err);
    }
  };

  const resetForm = () => { setEditing(null); setFormData(EMPTY_FORM); };

  const openEdit = (r: any) => {
    setEditing(r);
    setFormData({
      request_title:    r.request_title || '',
      audit_ref:        r.audit_ref || '',
      description:      r.description || '',
      requested_from:   r.requested_from || '',
      reviewer:         r.reviewer || '',
      due_date:         r.due_date || '',
      status:           r.status || 'pending',
      evidence_provided: r.evidence_provided || '',
      notes:            r.notes || '',
    });
    setModalOpen(true);
  };

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    pending:    { color: 'bg-gray-100 text-gray-700',     icon: <Clock className="h-3 w-3" /> },
    in_review:  { color: 'bg-blue-100 text-blue-800',     icon: <Search className="h-3 w-3" /> },
    received:   { color: 'bg-yellow-100 text-yellow-800', icon: <Inbox className="h-3 w-3" /> },
    accepted:   { color: 'bg-green-100 text-green-800',   icon: <CheckCircle2 className="h-3 w-3" /> },
    overdue:    { color: 'bg-red-100 text-red-800',       icon: <AlertTriangle className="h-3 w-3" /> },
    waived:     { color: 'bg-purple-100 text-purple-800', icon: null },
  };

  const pending  = requests.filter(r => r.status === 'pending').length;
  const received = requests.filter(r => r.status === 'received').length;
  const accepted = requests.filter(r => r.status === 'accepted').length;
  const overdue  = requests.filter(r => r.due_date && daysUntil(r.due_date) < 0 && !['accepted','waived'].includes(r.status)).length;

  const filtered = requests.filter(r => {
    const matchSearch =
      r.request_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requested_from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.audit_ref?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
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
          <PageHeader title="Audit Evidence Requests" description="Request and track evidence submissions from teams" icon={<Inbox className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Manage evidence collection workflows tied to audits, assessments and compliance reviews</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{requests.length} Requests</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Pending</p>
          <p className="text-xl font-bold text-gray-700">{pending}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Received</p>
          <p className="text-xl font-bold text-yellow-600">{received}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Accepted</p>
          <p className="text-xl font-bold text-green-600">{accepted}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Overdue</p>
          <p className="text-xl font-bold text-red-600">{overdue}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search requests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />New Request
        </Button>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Request</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Audit Ref</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Requested From</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Reviewer</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Due</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Status</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-8 text-gray-500">No evidence requests found.</td></tr>
              ) : filtered.map((r) => {
                const days = r.due_date ? daysUntil(r.due_date) : null;
                const cfg = statusConfig[r.status] || { color: 'bg-gray-100 text-gray-600', icon: null };
                return (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <p className="text-sm font-medium text-[#0D2240]">{r.request_title}</p>
                      {r.description && <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{r.description}</p>}
                    </td>
                    <td className="p-3 text-sm text-gray-600">{r.audit_ref || '—'}</td>
                    <td className="p-3 text-sm text-[#0D2240]">{r.requested_from || '—'}</td>
                    <td className="p-3 text-sm text-gray-600">{r.reviewer || '—'}</td>
                    <td className="p-3 text-sm">
                      {r.due_date ? (
                        <span className={days !== null && days < 0 && !['accepted','waived'].includes(r.status) ? 'text-red-600 font-medium' : days !== null && days <= 3 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                          {r.due_date}
                          {days !== null && !['accepted','waived'].includes(r.status) && (
                            <span className="block text-xs">{days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}</span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3">
                      <Badge className={`${cfg.color} flex items-center gap-1 w-fit`}>
                        {cfg.icon}{r.status?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)} className="text-[#0057B8] hover:text-[#003D82]"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteRequest(r.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">{editing ? 'Edit Request' : 'New Evidence Request'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Request Title *</Label>
              <Input value={formData.request_title} onChange={(e) => setFormData({ ...formData, request_title: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., Access control logs for ISO Audit" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Audit Reference</Label>
                <Input value={formData.audit_ref} onChange={(e) => setFormData({ ...formData, audit_ref: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., ISO-2026-01" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="What evidence is needed and why" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Requested From *</Label>
                <Input value={formData.requested_from} onChange={(e) => setFormData({ ...formData, requested_from: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="Team or person" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Reviewer</Label>
                <Input value={formData.reviewer} onChange={(e) => setFormData({ ...formData, reviewer: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Who will review it" />
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Due Date</Label>
              <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Evidence Provided</Label>
              <Input value={formData.evidence_provided} onChange={(e) => setFormData({ ...formData, evidence_provided: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Link, file name or reference" />
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="Reviewer notes or follow-up items" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Create Request'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
