import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Plus, Edit, Trash2, Calendar, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AuditNavigation } from '../../components/audit/AuditNavigation';

export default function FindingsRegister() {
  const { profile, loading: authLoading } = useAuth();
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<any>(null);
  const [formData, setFormData] = useState({
    finding_ref: '',
    finding_title: '',
    severity: 'Medium',
    finding_status: 'Open',
    owner: '',
    due_date: '',
    observation: '',
    recommendation: '',
    audit_id: ''
  });

  const { organizationId } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchFindings();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchFindings = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_findings')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFindings(data || []);
    } catch (err) {
      console.error('Error fetching findings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveFinding = async () => {
    if (!organizationId) return;

    const payload = {
      organization_id: organizationId,
      finding_ref: formData.finding_ref,
      finding_title: formData.finding_title,
      severity: formData.severity,
      finding_status: formData.finding_status,
      owner: formData.owner,
      due_date: formData.due_date || null,
      observation: formData.observation,
      recommendation: formData.recommendation,
      audit_id: formData.audit_id || null
    };

    try {
      if (editingFinding) {
        const { error } = await supabase
          .from('audit_findings')
          .update(payload)
          .eq('id', editingFinding.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('audit_findings').insert([payload]);
        if (error) throw error;
      }
      await fetchFindings();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving finding:', err);
    }
  };

  const deleteFinding = async (id: string) => {
    if (!confirm('Delete this finding?')) return;
    try {
      const { error } = await supabase.from('audit_findings').delete().eq('id', id);
      if (error) throw error;
      await fetchFindings();
    } catch (err) {
      console.error('Error deleting finding:', err);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('audit_findings').update({ finding_status: status }).eq('id', id);
      if (error) throw error;
      await fetchFindings();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const resetForm = () => {
    setEditingFinding(null);
    setFormData({
      finding_ref: '',
      finding_title: '',
      severity: 'Medium',
      finding_status: 'Open',
      owner: '',
      due_date: '',
      observation: '',
      recommendation: '',
      audit_id: ''
    });
  };

  const editFinding = (finding: any) => {
    setEditingFinding(finding);
    setFormData({
      finding_ref: finding.finding_ref || '',
      finding_title: finding.finding_title || '',
      severity: finding.severity || 'Medium',
      finding_status: finding.finding_status || 'Open',
      owner: finding.owner || '',
      due_date: finding.due_date || '',
      observation: finding.observation || '',
      recommendation: finding.recommendation || '',
      audit_id: finding.audit_id || ''
    });
    setModalOpen(true);
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      Critical: 'bg-red-100 text-red-800',
      Major: 'bg-orange-100 text-orange-800',
      High: 'bg-orange-100 text-orange-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-blue-100 text-blue-800'
    };
    return <Badge className={colors[severity] || 'bg-gray-100 text-gray-800'}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Open: 'bg-red-100 text-red-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      Closed: 'bg-green-100 text-green-800',
      Resolved: 'bg-green-100 text-green-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const getDaysOverdue = (dueDate: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays} days overdue`;
    return null;
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const openFindings = findings.filter(f => f.finding_status !== 'Closed' && f.finding_status !== 'Resolved').length;
  const criticalFindings = findings.filter(f => f.severity === 'Critical' && f.finding_status !== 'Closed').length;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Findings Register</h1>
        <p className="text-gray-500 mt-1">Track and manage audit findings and remediation actions</p>
      </div>

      <AuditNavigation />

      <div className="flex justify-end">
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Finding
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{findings.length}</div><p className="text-sm text-gray-500">Total Findings</p></CardContent></Card>
        <Card className="bg-yellow-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-yellow-600">{openFindings}</div><p className="text-sm text-yellow-600">Open Findings</p></CardContent></Card>
        <Card className="bg-red-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{criticalFindings}</div><p className="text-sm text-red-600">Critical Findings</p></CardContent></Card>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {findings.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No findings recorded.</CardContent></Card>
        ) : (
          findings.map((finding) => {
            const daysOverdue = getDaysOverdue(finding.due_date);
            return (
              <Card key={finding.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <h3 className="font-semibold text-lg">{finding.finding_title}</h3>
                        {getSeverityBadge(finding.severity)}
                        {getStatusBadge(finding.finding_status)}
                        {daysOverdue && (
                          <Badge className="bg-red-100 text-red-800">
                            <Clock className="h-3 w-3 mr-1 inline" />
                            {daysOverdue}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{finding.observation}</p>
                      {finding.recommendation && (
                        <p className="text-sm text-blue-600 mt-2">Recommendation: {finding.recommendation}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        {finding.finding_ref && <span className="font-mono text-xs">Ref: {finding.finding_ref}</span>}
                        {finding.owner && <span className="flex items-center gap-1"><User className="h-3 w-3" />Owner: {finding.owner}</span>}
                        {finding.due_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due: {new Date(finding.due_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Select value={finding.finding_status} onValueChange={(v) => updateStatus(finding.id, v)}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => editFinding(finding)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteFinding(finding.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Finding Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFinding ? 'Edit Finding' : 'Add Finding'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Finding Reference</Label>
                <Input
                  value={formData.finding_ref}
                  onChange={(e) => setFormData({...formData, finding_ref: e.target.value})}
                  placeholder="e.g., FIND-2025-001"
                />
              </div>
              <div>
                <Label>Finding Title *</Label>
                <Input
                  value={formData.finding_title}
                  onChange={(e) => setFormData({...formData, finding_title: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Severity</Label>
                <Select value={formData.severity} onValueChange={(v) => setFormData({...formData, severity: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.finding_status} onValueChange={(v) => setFormData({...formData, finding_status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Owner</Label>
                <Input
                  value={formData.owner}
                  onChange={(e) => setFormData({...formData, owner: e.target.value})}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Observation / Description</Label>
              <Textarea
                value={formData.observation}
                onChange={(e) => setFormData({...formData, observation: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <Label>Recommendation</Label>
              <Textarea
                value={formData.recommendation}
                onChange={(e) => setFormData({...formData, recommendation: e.target.value})}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveFinding}>{editingFinding ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
