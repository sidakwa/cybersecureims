import { ClipboardList, ClipboardCheck, Plus, Trash2, Edit, TrendingUp, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { AuditNavigation } from '../../components/audit/AuditNavigation';

export default function AuditPortfolio() {
  const { profile, loading: authLoading } = useAuth();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<any>(null);
  const [formData, setFormData] = useState({
    audit_ref: '',
    title: '',
    audit_type: 'Internal',
    standard: 'ISO27001',
    assessor: '',
    start_date: '',
    end_date: '',
    status: 'In Progress',
    overall_score: '',
    scope: ''
  });

  const organizationId = profile?.organization_id;

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchAudits();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchAudits = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_engagements')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setAudits(data || []);
    } catch (err) {
      console.error('Error fetching audits:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveAudit = async () => {
    if (!organizationId) return;

    const payload = {
      organization_id: organizationId,
      audit_ref: formData.audit_ref,
      title: formData.title,
      audit_type: formData.audit_type,
      standard: formData.standard,
      assessor: formData.assessor,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status,
      overall_score: formData.overall_score ? parseFloat(formData.overall_score) : null,
      scope: formData.scope
    };

    try {
      if (editingAudit) {
        const { error } = await supabase
          .from('audit_engagements')
          .update(payload)
          .eq('id', editingAudit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('audit_engagements').insert([payload]);
        if (error) throw error;
      }
      await fetchAudits();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving audit:', err);
    }
  };

  const deleteAudit = async (id: string) => {
    if (!confirm('Delete this audit?')) return;
    try {
      const { error } = await supabase.from('audit_engagements').delete().eq('id', id);
      if (error) throw error;
      await fetchAudits();
    } catch (err) {
      console.error('Error deleting audit:', err);
    }
  };

  const resetForm = () => {
    setEditingAudit(null);
    setFormData({
      audit_ref: '',
      title: '',
      audit_type: 'Internal',
      standard: 'ISO27001',
      assessor: '',
      start_date: '',
      end_date: '',
      status: 'In Progress',
      overall_score: '',
      scope: ''
    });
  };

  const editAudit = (audit: any) => {
    setEditingAudit(audit);
    setFormData({
      audit_ref: audit.audit_ref || '',
      title: audit.title || '',
      audit_type: audit.audit_type || 'Internal',
      standard: audit.standard || 'ISO27001',
      assessor: audit.assessor || '',
      start_date: audit.start_date || '',
      end_date: audit.end_date || '',
      status: audit.status || 'In Progress',
      overall_score: audit.overall_score?.toString() || '',
      scope: audit.scope || ''
    });
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Completed: 'bg-green-100 text-green-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      Planned: 'bg-blue-100 text-blue-800',
      Planning: 'bg-blue-100 text-blue-800',
      Cancelled: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const totalAudits = audits.length;
  const completedAudits = audits.filter(a => a.status === 'Completed').length;
  const inProgressAudits = audits.filter(a => a.status === 'In Progress').length;
  const avgScore = audits.filter(a => a.overall_score).length > 0 
    ? Math.round(audits.filter(a => a.overall_score).reduce((sum, a) => sum + parseFloat(a.overall_score), 0) / audits.filter(a => a.overall_score).length)
    : 0;

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <PageHeader title="Audit Portfolio" description="Audit workpaper engine with findings and evidence tracking" icon={<ClipboardList className="h-6 w-6" />} />
          <p className="text-gray-500 mt-1">Audit workpaper engine with SharePoint integration</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Audit
        </Button>
      </div>

      <AuditNavigation />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total Audits</p>
                <p className="text-2xl font-bold">{totalAudits}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedAudits}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{inProgressAudits}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Avg Score</p>
                <p className="text-2xl font-bold text-blue-600">{avgScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">Ref</th>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Standard</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Score</th>
                  <th className="text-left p-3">Assessor</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500">
                      No audits found. Click "New Audit" to create one.
                    </td>
                  </tr>
                ) : (
                  audits.map((audit) => (
                    <tr key={audit.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs">{audit.audit_ref}</td>
                      <td className="p-3 font-medium">{audit.title}</td>
                      <td className="p-3">{audit.audit_type}</td>
                      <td className="p-3">{audit.standard}</td>
                      <td className="p-3">{getStatusBadge(audit.status)}</td>
                      <td className={`p-3 ${audit.overall_score ? getScoreColor(parseFloat(audit.overall_score)) : ''}`}>
                        {audit.overall_score ? `${parseFloat(audit.overall_score).toFixed(0)}%` : '-'}
                      </td>
                      <td className="p-3">{audit.assessor || '-'}</td>
                      <td className="p-3">{audit.start_date ? new Date(audit.start_date).getFullYear() : '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button variant="ghost" size="sm" onClick={() => editAudit(audit)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteAudit(audit.id)} className="text-red-500">
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
        </CardContent>
      </Card>

      {/* Audit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAudit ? 'Edit Audit' : 'New Audit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Audit Reference</Label>
                <Input
                  value={formData.audit_ref}
                  onChange={(e) => setFormData({...formData, audit_ref: e.target.value})}
                  placeholder="e.g., AUD-2026-001"
                />
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Audit Type</Label>
                <Input
                  value={formData.audit_type}
                  onChange={(e) => setFormData({...formData, audit_type: e.target.value})}
                  placeholder="Internal, External, etc."
                />
              </div>
              <div>
                <Label>Standard</Label>
                <Input
                  value={formData.standard}
                  onChange={(e) => setFormData({...formData, standard: e.target.value})}
                  placeholder="ISO27001, SOC2, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assessor</Label>
                <Input
                  value={formData.assessor}
                  onChange={(e) => setFormData({...formData, assessor: e.target.value})}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Overall Score (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.overall_score}
                  onChange={(e) => setFormData({...formData, overall_score: e.target.value})}
                />
              </div>
              <div>
                <Label>Year</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Scope / Description</Label>
              <Textarea
                value={formData.scope}
                onChange={(e) => setFormData({...formData, scope: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveAudit}>{editingAudit ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
