import { ClipboardList } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ClipboardCheck, Plus, Trash2, Edit, Calendar, User, CheckCircle, XCircle } from 'lucide-react';

interface Audit {
  id: string;
  title: string;
  assessment_date: string;
  assessor: string;
  standard: string;
  audit_type: string;
  framework_scope: string[];
  status: string;
  score: number;
  findings: string;
}

export default function AuditMaster() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    assessment_date: new Date().toISOString().split('T')[0],
    assessor: '',
    standard: 'ISO27001',
    audit_type: 'internal',
    framework_scope: [] as string[],
    status: 'planned',
    score: '',
    findings: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchAudits();
  }, [user]);

  const fetchAudits = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_assessments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAudits(data || []);
    } catch (err) {
      console.error('Error fetching audits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        score: formData.score ? parseFloat(formData.score) : null
      };
      
      if (editingAudit) {
        const { error } = await supabase
          .from('security_assessments')
          .update(payload)
          .eq('id', editingAudit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('security_assessments').insert([payload]);
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
    if (!confirm('Are you sure you want to delete this audit?')) return;
    try {
      const { error } = await supabase.from('security_assessments').delete().eq('id', id);
      if (error) throw error;
      await fetchAudits();
    } catch (err) {
      console.error('Error deleting audit:', err);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('security_assessments').update({ status }).eq('id', id);
      if (error) throw error;
      await fetchAudits();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const resetForm = () => {
    setEditingAudit(null);
    setFormData({
      title: '',
      assessment_date: new Date().toISOString().split('T')[0],
      assessor: '',
      standard: 'ISO27001',
      audit_type: 'internal',
      framework_scope: [],
      status: 'planned',
      score: '',
      findings: ''
    });
  };

  const editAudit = (audit: Audit) => {
    setEditingAudit(audit);
    setFormData({
      title: audit.title,
      assessment_date: audit.assessment_date || new Date().toISOString().split('T')[0],
      assessor: audit.assessor || '',
      standard: audit.standard || 'ISO27001',
      audit_type: audit.audit_type || 'internal',
      framework_scope: audit.framework_scope || [],
      status: audit.status || 'planned',
      score: audit.score?.toString() || '',
      findings: audit.findings || ''
    });
    setModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-500',
      in_progress: 'bg-yellow-500',
      planned: 'bg-blue-500',
      cancelled: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader title="Audit Manager" description="Audit workpaper engine with findings tracking" icon={<ClipboardList className="h-6 w-6" />} />
          <p className="text-gray-500 mt-1">Manage security audits and assessments</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Audit
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total Audits</p>
                <p className="text-2xl font-bold text-[#0D2240]">{audits.length}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-500">{audits.filter(a => a.status === 'completed').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-yellow-500">{audits.filter(a => a.status === 'in_progress').length}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Planned</p>
                <p className="text-2xl font-bold text-blue-500">{audits.filter(a => a.status === 'planned').length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {audits.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No audits found. Click "Schedule Audit" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          audits.map((audit) => (
            <Card key={audit.id} className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardCheck className="h-4 w-4 text-blue-500" />
                      <h3 className="font-semibold text-[#0D2240]">{audit.title}</h3>
                      <Badge className={getStatusColor(audit.status)}>
                        {audit.status?.replace('_', ' ')}
                      </Badge>
                      {audit.score !== null && audit.score !== undefined && (
                        <Badge variant="outline" className={getScoreColor(audit.score)}>
                          Score: {audit.score}%
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-500">Date:</span>
                        <span className="text-gray-600">{audit.assessment_date || 'Not scheduled'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-500">Assessor:</span>
                        <span className="text-gray-600">{audit.assessor || 'Not assigned'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Standard:</span>
                        <span className="text-gray-600 ml-1">{audit.standard}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="text-gray-600 ml-1 capitalize">{audit.audit_type}</span>
                      </div>
                    </div>
                    {audit.findings && (
                      <p className="text-sm text-gray-500 mt-2">Findings: {audit.findings.substring(0, 150)}...</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Select value={audit.status} onValueChange={(v) => updateStatus(audit.id, v)}>
                      <SelectTrigger className="w-28 bg-gray-50 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => editAudit(audit)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteAudit(audit.id)} className="text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Audit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white text-[#0D2240] border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAudit ? 'Edit Audit' : 'Schedule New Audit'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Audit Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                  required
                />
              </div>
              <div>
                <Label>Assessment Date</Label>
                <Input
                  type="date"
                  value={formData.assessment_date}
                  onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div>
                <Label>Assessor</Label>
                <Input
                  value={formData.assessor}
                  onChange={(e) => setFormData({ ...formData, assessor: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div>
                <Label>Standard</Label>
                <Select value={formData.standard} onValueChange={(v) => setFormData({ ...formData, standard: v })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISO27001">ISO 27001</SelectItem>
                    <SelectItem value="SOC2">SOC 2</SelectItem>
                    <SelectItem value="NIST_CSF">NIST CSF</SelectItem>
                    <SelectItem value="PCI_DSS">PCI DSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audit Type</Label>
                <Select value={formData.audit_type} onValueChange={(v) => setFormData({ ...formData, audit_type: v })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="surveillance">Surveillance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Score (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="col-span-2">
                <Label>Findings / Recommendations</Label>
                <Textarea
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                  rows={4}
                  placeholder="Audit findings, non-conformities, and recommendations..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
