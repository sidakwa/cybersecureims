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
import { Loader2, ShieldAlert, Plus, Trash2, Edit, Search, Clock } from 'lucide-react';

const EMPTY_FORM = {
  title: '',
  exception_type: 'other',
  description: '',
  requested_by: '',
  approved_by: '',
  approval_date: '',
  expiry_date: '',
  risk_justification: '',
  status: 'pending',
};

export default function ExceptionRegister() {
  const { organizationId, loading: authLoading } = useAuth();
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) { fetchExceptions(); }
  }, [organizationId, authLoading]);

  const fetchExceptions = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_exceptions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setExceptions(data || []);
    } catch (err) {
      console.error('Error fetching exceptions:', err);
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
        approval_date: formData.approval_date || null,
        expiry_date: formData.expiry_date || null,
      };
      if (editing) {
        const { error } = await supabase.from('security_exceptions').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('security_exceptions').insert([payload]);
        if (error) throw error;
      }
      await fetchExceptions();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving exception:', err);
    }
  };

  const deleteException = async (id: string) => {
    if (!confirm('Delete this exception?')) return;
    try {
      const { error } = await supabase.from('security_exceptions').delete().eq('id', id);
      if (error) throw error;
      await fetchExceptions();
    } catch (err) {
      console.error('Error deleting exception:', err);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
  };

  const openEdit = (ex: any) => {
    setEditing(ex);
    setFormData({
      title: ex.title || '',
      exception_type: ex.exception_type || 'other',
      description: ex.description || '',
      requested_by: ex.requested_by || '',
      approved_by: ex.approved_by || '',
      approval_date: ex.approval_date || '',
      expiry_date: ex.expiry_date || '',
      risk_justification: ex.risk_justification || '',
      status: ex.status || 'pending',
    });
    setModalOpen(true);
  };

  const getDaysUntilExpiry = (expiry: string) => {
    if (!expiry) return null;
    return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  };

  const expiryBadge = (expiry: string) => {
    const days = getDaysUntilExpiry(expiry);
    if (days === null) return null;
    if (days < 0) return <Badge className="bg-red-100 text-red-800 ml-1">Expired</Badge>;
    if (days <= 30) return <Badge className="bg-orange-100 text-orange-800 ml-1">Expires in {days}d</Badge>;
    return <Badge className="bg-gray-100 text-gray-600 ml-1">{days}d remaining</Badge>;
  };

  const statusColor: Record<string, string> = {
    pending:  'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired:  'bg-gray-100 text-gray-600',
  };

  const typeLabel: Record<string, string> = {
    firewall:   'Firewall',
    mfa:        'MFA',
    password:   'Password',
    patch:      'Patch',
    access:     'Access',
    encryption: 'Encryption',
    other:      'Other',
  };

  const now = new Date();
  const active    = exceptions.filter(e => e.status === 'approved' && (!e.expiry_date || new Date(e.expiry_date) >= now)).length;
  const expiring  = exceptions.filter(e => { const d = getDaysUntilExpiry(e.expiry_date); return d !== null && d >= 0 && d <= 30; }).length;
  const expired   = exceptions.filter(e => e.expiry_date && new Date(e.expiry_date) < now).length;
  const pending   = exceptions.filter(e => e.status === 'pending').length;

  const filtered = exceptions.filter(e => {
    const matchSearch =
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.requested_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.approved_by?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

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
          <PageHeader title="Exception Register" description="Track approved security exceptions and policy deviations" icon={<ShieldAlert className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Formally document and manage risk-accepted exceptions with expiry tracking</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{exceptions.length} Exceptions</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Active Approved</p>
            <p className="text-xl font-bold text-green-600">{active}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Pending Approval</p>
            <p className="text-xl font-bold text-yellow-600">{pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Expiring (30 days)</p>
            <p className="text-xl font-bold text-orange-600">{expiring}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Expired</p>
            <p className="text-xl font-bold text-red-600">{expired}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Add */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search exceptions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />
          Add Exception
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Exception</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Type</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Requested By</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Approved By</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Expiry</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Status</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    No exceptions found. Click "Add Exception" to register one.
                  </td>
                </tr>
              ) : (
                filtered.map((ex) => (
                  <tr key={ex.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <p className="text-sm font-medium text-[#0D2240]">{ex.title}</p>
                      {ex.description && <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{ex.description}</p>}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">{typeLabel[ex.exception_type] || ex.exception_type}</Badge>
                    </td>
                    <td className="p-3 text-sm text-[#0D2240]">{ex.requested_by || '—'}</td>
                    <td className="p-3 text-sm text-[#0D2240]">{ex.approved_by || '—'}</td>
                    <td className="p-3 text-sm">
                      {ex.expiry_date ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{ex.expiry_date}</span>
                          {expiryBadge(ex.expiry_date)}
                        </div>
                      ) : <span className="text-gray-400">No expiry</span>}
                    </td>
                    <td className="p-3">
                      <Badge className={statusColor[ex.status] || 'bg-gray-100 text-gray-600'}>
                        {ex.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(ex)} className="text-[#0057B8] hover:text-[#003D82]">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteException(ex.id)} className="text-red-500 hover:text-red-700">
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

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">
              {editing ? 'Edit Exception' : 'Register Exception'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., MFA exception for legacy system X" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Exception Type</Label>
                <Select value={formData.exception_type} onValueChange={(v) => setFormData({ ...formData, exception_type: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="firewall">Firewall</SelectItem>
                    <SelectItem value="mfa">MFA</SelectItem>
                    <SelectItem value="password">Password</SelectItem>
                    <SelectItem value="patch">Patch</SelectItem>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="encryption">Encryption</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="What security control or policy is being excepted, and why" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Requested By</Label>
                <Input value={formData.requested_by} onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Name / team" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Approved By</Label>
                <Input value={formData.approved_by} onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., CISO" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Approval Date</Label>
                <Input type="date" value={formData.approval_date} onChange={(e) => setFormData({ ...formData, approval_date: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Expiry Date</Label>
                <Input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Risk Justification</Label>
              <Textarea value={formData.risk_justification} onChange={(e) => setFormData({ ...formData, risk_justification: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="Why the risk is accepted and any compensating controls in place" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Register Exception'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
