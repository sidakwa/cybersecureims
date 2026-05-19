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
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2, Calendar, Users, FileText, Award, Eye, TrendingUp, ClipboardCheck } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { AuditNavigation } from '../../components/audit/AuditNavigation';

interface Audit {
  id: string;
  audit_ref: string;
  title: string;
  audit_type: string;
  standard: string;
  scope: string;
  status: string;
  overall_score: number;
  assessor: string;
  start_date: string;
  end_date: string;
  report_link: string;
}

export default function AuditPortfolio() {
  const { organizationId, loading: authLoading } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
  const [viewingAudit, setViewingAudit] = useState<Audit | null>(null);
  const [formData, setFormData] = useState({
    audit_ref: '',
    title: '',
    audit_type: 'Internal',
    standard: 'ISO27001',
    scope: '',
    status: 'Planned',
    overall_score: '',
    assessor: '',
    start_date: '',
    end_date: '',
    report_link: ''
  });

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
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAudit = async () => {
    if (!organizationId) return;
    const payload = {
      organization_id: organizationId,
      ...formData,
      overall_score: formData.overall_score ? parseFloat(formData.overall_score) : null
    };
    try {
      if (editingAudit) {
        const { error } = await supabase.from('audit_engagements').update(payload).eq('id', editingAudit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('audit_engagements').insert([payload]);
        if (error) throw error;
      }
      await fetchAudits();
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving audit:', error);
    }
  };

  const deleteAudit = async (id: string) => {
    if (!confirm('Delete this audit?')) return;
    try {
      const { error } = await supabase.from('audit_engagements').delete().eq('id', id);
      if (error) throw error;
      await fetchAudits();
    } catch (error) {
      console.error('Error deleting audit:', error);
    }
  };

  const resetForm = () => {
    setEditingAudit(null);
    setFormData({
      audit_ref: '',
      title: '',
      audit_type: 'Internal',
      standard: 'ISO27001',
      scope: '',
      status: 'Planned',
      overall_score: '',
      assessor: '',
      start_date: '',
      end_date: '',
      report_link: ''
    });
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
    ? Math.round(audits.filter(a => a.overall_score).reduce((sum, a) => sum + parseFloat(String(a.overall_score)), 0) / audits.filter(a => a.overall_score).length)
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
          <h1 className="text-2xl font-bold text-gray-900">Audit Engagements</h1>
          <p className="text-gray-500 mt-1">Manage your audit portfolio</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Audit
        </Button>
      </div>

      <AuditNavigation />

      {/* Stats Cards */}
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
              <ClipboardCheck className="h-8 w-8 text-green-500" />
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
            <Progress value={avgScore} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Audit List */}
      <div className="space-y-3">
        {audits.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No audits found. Click "New Audit" to create one.</CardContent></Card>
        ) : (
          audits.map((audit) => (
            <Card key={audit.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      {audit.audit_ref && <span className="font-mono text-xs text-gray-500">{audit.audit_ref}</span>}
                      <h3 className="font-semibold text-lg">{audit.title}</h3>
                      {getStatusBadge(audit.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span>{audit.audit_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-gray-400" />
                        <span>{audit.standard}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{audit.start_date ? new Date(audit.start_date).getFullYear() : 'N/A'}</span>
                      </div>
                      {audit.overall_score != null && (
                        <div className={getScoreColor(parseFloat(String(audit.overall_score)))}>
                          {parseFloat(String(audit.overall_score)).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setViewingAudit(audit); setViewModalOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditingAudit(audit);
                      setFormData({
                        audit_ref: audit.audit_ref || '',
                        title: audit.title || '',
                        audit_type: audit.audit_type || 'Internal',
                        standard: audit.standard || 'ISO27001',
                        scope: audit.scope || '',
                        status: audit.status || 'Planned',
                        overall_score: audit.overall_score?.toString() || '',
                        assessor: audit.assessor || '',
                        start_date: audit.start_date || '',
                        end_date: audit.end_date || '',
                        report_link: audit.report_link || ''
                      });
                      setModalOpen(true);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteAudit(audit.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAudit ? 'Edit Audit' : 'New Audit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Audit Reference</Label>
                <Input value={formData.audit_ref} onChange={(e) => setFormData({...formData, audit_ref: e.target.value})} placeholder="e.g., AUD-2026-001" />
              </div>
              <div>
                <Label>Title *</Label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Audit Type</Label>
                <Select value={formData.audit_type} onValueChange={(v) => setFormData({...formData, audit_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internal">Internal</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Standard</Label>
                <Select value={formData.standard} onValueChange={(v) => setFormData({...formData, standard: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISO27001">ISO 27001</SelectItem>
                    <SelectItem value="SOC2">SOC 2</SelectItem>
                    <SelectItem value="PCI-DSS">PCI-DSS</SelectItem>
                    <SelectItem value="NIST">NIST</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Scope / Description</Label>
              <Textarea rows={2} value={formData.scope} onChange={(e) => setFormData({...formData, scope: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label>Overall Score (%)</Label>
                <Input type="number" min="0" max="100" value={formData.overall_score} onChange={(e) => setFormData({...formData, overall_score: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assessor</Label>
                <Input value={formData.assessor} onChange={(e) => setFormData({...formData, assessor: e.target.value})} />
              </div>
              <div>
                <Label>Report Link</Label>
                <Input value={formData.report_link} onChange={(e) => setFormData({...formData, report_link: e.target.value})} placeholder="SharePoint URL" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} /></div>
              <div><Label>End Date</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveAudit}>{editingAudit ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingAudit?.title}</DialogTitle>
            {viewingAudit?.audit_ref && <p className="text-sm text-gray-500 font-mono">{viewingAudit.audit_ref}</p>}
          </DialogHeader>
          {viewingAudit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Status:</span><div className="mt-1">{getStatusBadge(viewingAudit.status)}</div></div>
                <div><span className="text-gray-500">Score:</span><div className={`mt-1 font-semibold ${viewingAudit.overall_score ? getScoreColor(parseFloat(String(viewingAudit.overall_score))) : ''}`}>{viewingAudit.overall_score ? `${parseFloat(String(viewingAudit.overall_score)).toFixed(0)}%` : '—'}</div></div>
                <div><span className="text-gray-500">Assessor:</span><div className="mt-1">{viewingAudit.assessor || '—'}</div></div>
                <div><span className="text-gray-500">Standard:</span><div className="mt-1">{viewingAudit.standard}</div></div>
                <div><span className="text-gray-500">Start Date:</span><div className="mt-1">{viewingAudit.start_date || '—'}</div></div>
                <div><span className="text-gray-500">End Date:</span><div className="mt-1">{viewingAudit.end_date || '—'}</div></div>
              </div>
              {viewingAudit.scope && (
                <div><span className="text-gray-500 text-sm">Scope:</span><p className="text-sm mt-1">{viewingAudit.scope}</p></div>
              )}
              {viewingAudit.report_link && (
                <div>
                  <a href={viewingAudit.report_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    Open Report →
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
