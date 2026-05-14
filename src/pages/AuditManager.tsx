import PageHeader from '@/components/PageHeader';
import { ClipboardList } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Eye, ExternalLink, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import FindingsRegister from './audit/FindingsRegister';
import EvidenceLibrary from './audit/EvidenceLibrary';
import ActionTracker from './audit/ActionTracker';
import AuditCalendar from './audit/AuditCalendar';
import AuditMetrics from './audit/AuditMetrics';

interface AuditEngagement {
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

function AuditForm({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Audit Reference</Label>
          <Input
            value={formData.audit_ref}
            onChange={(e) => setFormData({ ...formData, audit_ref: e.target.value })}
            placeholder="e.g., AUD-2026-006"
            className="bg-white"
          />
        </div>
        <div>
          <Label>Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Audit title"
            className="bg-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Audit Type</Label>
          <Select value={formData.audit_type} onValueChange={(v) => setFormData({ ...formData, audit_type: v })}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Select audit type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="Internal" className="hover:bg-gray-100 cursor-pointer">Internal</SelectItem>
              <SelectItem value="External" className="hover:bg-gray-100 cursor-pointer">External</SelectItem>
              <SelectItem value="Planning" className="hover:bg-gray-100 cursor-pointer">Planning</SelectItem>
              <SelectItem value="Follow-up" className="hover:bg-gray-100 cursor-pointer">Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Standard</Label>
          <Select value={formData.standard} onValueChange={(v) => setFormData({ ...formData, standard: v })}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Select standard" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="ISO27001" className="hover:bg-gray-100 cursor-pointer">ISO 27001</SelectItem>
              <SelectItem value="SOC2" className="hover:bg-gray-100 cursor-pointer">SOC 2</SelectItem>
              <SelectItem value="NIST_CSF" className="hover:bg-gray-100 cursor-pointer">NIST CSF</SelectItem>
              <SelectItem value="CIS" className="hover:bg-gray-100 cursor-pointer">CIS</SelectItem>
              <SelectItem value="GRC" className="hover:bg-gray-100 cursor-pointer">GRC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Scope / Description</Label>
        <Textarea
          value={formData.scope}
          onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
          placeholder="Describe the audit scope..."
          rows={2}
          className="bg-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="Planned" className="hover:bg-gray-100 cursor-pointer">Planned</SelectItem>
              <SelectItem value="In Progress" className="hover:bg-gray-100 cursor-pointer">In Progress</SelectItem>
              <SelectItem value="Completed" className="hover:bg-gray-100 cursor-pointer">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Overall Score (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.overall_score}
            onChange={(e) => setFormData({ ...formData, overall_score: parseInt(e.target.value) || 0 })}
            className="bg-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Assessor</Label>
          <Input
            value={formData.assessor}
            onChange={(e) => setFormData({ ...formData, assessor: e.target.value })}
            placeholder="Name of assessor"
            className="bg-white"
          />
        </div>
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="bg-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="bg-white"
          />
        </div>
        <div>
          <Label>SharePoint Report Link (Optional)</Label>
          <Input
            value={formData.report_link}
            onChange={(e) => setFormData({ ...formData, report_link: e.target.value })}
            placeholder="https://seacomsa.sharepoint.com/..."
            className="bg-white"
          />
        </div>
      </div>
    </div>
  );
}

export default function AuditManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading: authLoading } = useAuth();
  const { organizationId } = useAuth();
  const [engagements, setEngagements] = useState<AuditEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<AuditEngagement | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<AuditEngagement | null>(null);
  const [activeTab, setActiveTab] = useState('engagements');
  const [formData, setFormData] = useState({
    audit_ref: '',
    title: '',
    audit_type: 'Internal',
    standard: 'ISO27001',
    scope: '',
    status: 'Planned',
    overall_score: 0,
    assessor: '',
    start_date: '',
    end_date: '',
    report_link: ''
  });

  // Check URL params for tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['engagements', 'findings', 'evidence', 'actions', 'calendar', 'metrics'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  useEffect(() => {
      if (authLoading) return;
    if (organizationId) {
      fetchEngagements();
    }
  }, [organizationId, authLoading]);

  const fetchEngagements = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_engagements')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setEngagements(data || []);
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAudit = async () => {
    if (!organizationId) return;
    
    try {
      const { error } = await supabase
        .from('audit_engagements')
        .insert([{
          organization_id: organizationId,
          ...formData,
          overall_score: parseInt(formData.overall_score) || 0
        }]);

      if (error) throw error;

      await fetchEngagements();
      setAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding audit:', error);
      alert('Error adding audit. Please check the form.');
    }
  };

  const updateAudit = async () => {
    if (!editingAudit) return;

    try {
      const { error } = await supabase
        .from('audit_engagements')
        .update({
          audit_ref: formData.audit_ref,
          title: formData.title,
          audit_type: formData.audit_type,
          standard: formData.standard,
          scope: formData.scope,
          status: formData.status,
          overall_score: parseInt(formData.overall_score) || 0,
          assessor: formData.assessor,
          start_date: formData.start_date,
          end_date: formData.end_date,
          report_link: formData.report_link
        })
        .eq('id', editingAudit.id);

      if (error) throw error;

      await fetchEngagements();
      setEditModalOpen(false);
      setEditingAudit(null);
      resetForm();
    } catch (error) {
      console.error('Error updating audit:', error);
      alert('Error updating audit.');
    }
  };

  const deleteAudit = async () => {
    if (!selectedAudit) return;

    try {
      const { error } = await supabase
        .from('audit_engagements')
        .delete()
        .eq('id', selectedAudit.id);

      if (error) throw error;

      await fetchEngagements();
      setDeleteConfirmOpen(false);
      setDetailsOpen(false);
      setSelectedAudit(null);
    } catch (error) {
      console.error('Error deleting audit:', error);
      alert('Error deleting audit.');
    }
  };

  const resetForm = () => {
    setFormData({
      audit_ref: '',
      title: '',
      audit_type: 'Internal',
      standard: 'ISO27001',
      scope: '',
      status: 'Planned',
      overall_score: 0,
      assessor: '',
      start_date: '',
      end_date: '',
      report_link: ''
    });
  };

  const openEditModal = (audit: AuditEngagement) => {
    setEditingAudit(audit);
    setFormData({
      audit_ref: audit.audit_ref,
      title: audit.title,
      audit_type: audit.audit_type,
      standard: audit.standard,
      scope: audit.scope || '',
      status: audit.status,
      overall_score: audit.overall_score,
      assessor: audit.assessor || '',
      start_date: audit.start_date || '',
      end_date: audit.end_date || '',
      report_link: audit.report_link || ''
    });
    setEditModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <Badge className="bg-green-500">Completed</Badge>;
      case 'In Progress': return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'Planned': return <Badge className="bg-yellow-500">Planned</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: engagements.length,
    completed: engagements.filter(e => e.status === 'Completed').length,
    inProgress: engagements.filter(e => e.status === 'In Progress').length,
    avgScore: engagements.length > 0
      ? Math.round(engagements.reduce((sum, e) => sum + (e.overall_score || 0), 0) / engagements.length)
      : 0
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#0057B8]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <PageHeader title="Audit Manager" description="Audit workpaper engine with findings and evidence tracking" icon={<ClipboardList className="h-6 w-6" />} />
          <p className="text-gray-600">Audit workpaper engine with SharePoint integration</p>
        </div>
        <Button onClick={() => { resetForm(); setAddModalOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Audit</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="engagements">Audit Engagements</TabsTrigger>
          <TabsTrigger value="findings">Findings Register</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Library</TabsTrigger>
          <TabsTrigger value="actions">Action Tracker</TabsTrigger>
          <TabsTrigger value="calendar">Audit Calendar</TabsTrigger>
          <TabsTrigger value="metrics">Metrics & Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="engagements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stats.total}</div><p className="text-sm text-gray-500">Total Audits</p></CardContent></Card>
            <Card className="bg-green-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{stats.completed}</div><p className="text-sm text-green-600">Completed</p></CardContent></Card>
            <Card className="bg-blue-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div><p className="text-sm text-blue-600">In Progress</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stats.avgScore}%</div><p className="text-sm text-gray-500">Avg Score</p><Progress value={stats.avgScore} className="mt-2" /></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Audit Engagements</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr><th className="text-left p-3">Ref</th><th className="text-left p-3">Title</th><th className="text-left p-3">Type</th><th className="text-left p-3">Standard</th><th className="text-left p-3">Status</th><th className="text-left p-3">Score</th><th className="text-left p-3">Assessor</th><th className="text-left p-3">Date</th><th className="text-center p-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {engagements.map((audit) => (
                      <tr key={audit.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{audit.audit_ref}</td>
                        <td className="p-3 font-medium">{audit.title}</td>
                        <td className="p-3">{audit.audit_type}</td>
                        <td className="p-3">{audit.standard}</td>
                        <td className="p-3">{getStatusBadge(audit.status)}</td>
                        <td className="p-3"><span className={`font-semibold ${audit.overall_score >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>{audit.overall_score}%</span></td>
                        <td className="p-3">{audit.assessor}</td>
                        <td className="p-3">{audit.start_date ? new Date(audit.start_date).getFullYear() : 'N/A'}</td>
                        <td className="p-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedAudit(audit); setDetailsOpen(true); }}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(audit)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedAudit(audit); setDeleteConfirmOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings">
          <FindingsRegister />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceLibrary />
        </TabsContent>

        <TabsContent value="actions">
          <ActionTracker />
        </TabsContent>

        <TabsContent value="calendar">
          <AuditCalendar />
        </TabsContent>

        <TabsContent value="metrics">
          <AuditMetrics />
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Audit</DialogTitle></DialogHeader>
          <AuditForm formData={formData} setFormData={setFormData} />
          <DialogFooter><Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button><Button onClick={addAudit}>Add Audit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Audit</DialogTitle></DialogHeader>
          <AuditForm formData={formData} setFormData={setFormData} />
          <DialogFooter><Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button><Button onClick={updateAudit}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent><DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader><p>Are you sure you want to delete audit <strong>{selectedAudit?.audit_ref}</strong>?</p><p className="text-sm text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button><Button variant="destructive" onClick={deleteAudit}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{selectedAudit?.title}</DialogTitle><p className="text-sm text-gray-500">{selectedAudit?.audit_ref} | {selectedAudit?.standard}</p></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Status:</span><div className="mt-1">{selectedAudit && getStatusBadge(selectedAudit.status)}</div></div>
              <div><span className="text-gray-500">Score:</span><div className="mt-1 font-semibold">{selectedAudit?.overall_score}%</div></div>
              <div><span className="text-gray-500">Assessor:</span><div className="mt-1">{selectedAudit?.assessor}</div></div>
              <div><span className="text-gray-500">Period:</span><div className="mt-1">{selectedAudit?.start_date} to {selectedAudit?.end_date}</div></div>
            </div>
            {selectedAudit?.scope && (<div><span className="text-gray-500">Scope:</span><p className="text-sm mt-1">{selectedAudit.scope}</p></div>)}
            {selectedAudit?.report_link && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">📎 Audit Documents</h3>
                <a href={selectedAudit.report_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg">
                  <FileText className="h-4 w-4" />
                  Open Audit Report in SharePoint
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
