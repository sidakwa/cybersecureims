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
import { Loader2, Workflow, Plus, Trash2, Edit, Search, ArrowRight } from 'lucide-react';

const EMPTY_FORM = {
  title: '',
  workflow_type: 'policy_approval',
  description: '',
  initiator: '',
  current_assignee: '',
  priority: 'medium',
  stage: 'submitted',
  target_completion: '',
  linked_ref: '',
  resolution_notes: '',
};

const WORKFLOW_TYPES: Record<string, string> = {
  policy_approval:     'Policy Approval',
  exception_request:   'Exception Request',
  access_request:      'Access Request',
  risk_acceptance:     'Risk Acceptance',
  change_request:      'Change Request',
  attestation_request: 'Attestation Request',
  vendor_onboarding:   'Vendor Onboarding',
  other:               'Other',
};

const STAGES = ['submitted','under_review','pending_approval','approved','rejected','completed','cancelled'];

const stageColor: Record<string, string> = {
  submitted:        'bg-gray-100 text-gray-700',
  under_review:     'bg-blue-100 text-blue-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved:         'bg-green-100 text-green-800',
  rejected:         'bg-red-100 text-red-800',
  completed:        'bg-green-600 text-white',
  cancelled:        'bg-gray-200 text-gray-500',
};

const priorityColor: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high:     'bg-orange-500 text-white',
  medium:   'bg-yellow-500 text-black',
  low:      'bg-green-500 text-white',
};

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function WorkflowEngine() {
  const { organizationId, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('active');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) fetchTasks();
  }, [organizationId, authLoading]);

  const fetchTasks = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflow_tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching workflow tasks:', err);
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
        target_completion: formData.target_completion || null,
        linked_ref: formData.linked_ref || null,
        resolution_notes: formData.resolution_notes || null,
      };
      if (editing) {
        const { error } = await supabase.from('workflow_tasks').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('workflow_tasks').insert([payload]);
        if (error) throw error;
      }
      await fetchTasks();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving workflow task:', err);
    }
  };

  const advanceStage = async (task: any) => {
    const idx = STAGES.indexOf(task.stage);
    const terminal = ['approved','rejected','completed','cancelled'];
    if (terminal.includes(task.stage)) return;
    const next = STAGES[idx + 1];
    await supabase.from('workflow_tasks').update({ stage: next }).eq('id', task.id);
    await fetchTasks();
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this workflow task?')) return;
    await supabase.from('workflow_tasks').delete().eq('id', id);
    await fetchTasks();
  };

  const resetForm = () => { setEditing(null); setFormData(EMPTY_FORM); };

  const openEdit = (t: any) => {
    setEditing(t);
    setFormData({
      title:             t.title || '',
      workflow_type:     t.workflow_type || 'policy_approval',
      description:       t.description || '',
      initiator:         t.initiator || '',
      current_assignee:  t.current_assignee || '',
      priority:          t.priority || 'medium',
      stage:             t.stage || 'submitted',
      target_completion: t.target_completion || '',
      linked_ref:        t.linked_ref || '',
      resolution_notes:  t.resolution_notes || '',
    });
    setModalOpen(true);
  };

  const active      = tasks.filter(t => !['completed','cancelled','rejected'].includes(t.stage)).length;
  const pending     = tasks.filter(t => t.stage === 'pending_approval').length;
  const completed   = tasks.filter(t => t.stage === 'completed').length;
  const overdue     = tasks.filter(t => t.target_completion && daysUntil(t.target_completion) < 0 && !['completed','cancelled'].includes(t.stage)).length;

  const filtered = tasks.filter(t => {
    const matchSearch =
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.initiator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.current_assignee?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStage = filterStage === 'all'
      ? true
      : filterStage === 'active'
      ? !['completed','cancelled','rejected'].includes(t.stage)
      : t.stage === filterStage;
    const matchType = filterType === 'all' || t.workflow_type === filterType;
    return matchSearch && matchStage && matchType;
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
          <PageHeader title="Workflow Engine" description="Approval routing for policies, exceptions, access and risk acceptance" icon={<Workflow className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Route requests through defined approval stages with ownership tracking and SLA visibility</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{tasks.length} Total Workflows</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Active</p>
          <p className="text-xl font-bold text-blue-600">{active}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Pending Approval</p>
          <p className="text-xl font-bold text-yellow-600">{pending}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Completed</p>
          <p className="text-xl font-bold text-green-600">{completed}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Overdue</p>
          <p className="text-xl font-bold text-red-600">{overdue}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search workflows..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-44 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="active">Active (excl. closed)</SelectItem>
              {STAGES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-52 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(WORKFLOW_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />New Workflow
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-8 text-center text-gray-500">No workflows found.</CardContent>
          </Card>
        ) : filtered.map((t) => {
          const daysLeft = t.target_completion ? daysUntil(t.target_completion) : null;
          const isOverdue = daysLeft !== null && daysLeft < 0 && !['completed','cancelled'].includes(t.stage);
          const terminal = ['approved','rejected','completed','cancelled'].includes(t.stage);
          return (
            <Card key={t.id} className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-[#0D2240] text-sm">{t.title}</h3>
                      <Badge className={priorityColor[t.priority] || 'bg-gray-500 text-white'}>{t.priority}</Badge>
                      <Badge variant="outline" className="text-xs">{WORKFLOW_TYPES[t.workflow_type] || t.workflow_type}</Badge>
                    </div>
                    {t.description && <p className="text-xs text-gray-500 mb-2">{t.description}</p>}

                    {/* Stage pipeline */}
                    <div className="flex items-center gap-1 my-2 flex-wrap">
                      {STAGES.slice(0, 5).map((s, i) => {
                        const stageIdx = STAGES.indexOf(t.stage);
                        const isCurrentOrPast = i <= stageIdx;
                        const isCurrent = s === t.stage;
                        return (
                          <React.Fragment key={s}>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isCurrent ? stageColor[s] + ' font-medium ring-1 ring-offset-1 ring-current' : isCurrentOrPast ? 'bg-[#0057B8] text-white opacity-60' : 'bg-gray-100 text-gray-400'}`}>
                              {s.replace('_', ' ')}
                            </span>
                            {i < 4 && <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />}
                          </React.Fragment>
                        );
                      })}
                      {['approved','rejected','completed','cancelled'].includes(t.stage) && (
                        <Badge className={stageColor[t.stage]}>{t.stage}</Badge>
                      )}
                    </div>

                    <div className="flex gap-4 text-xs text-gray-500 flex-wrap mt-1">
                      {t.initiator && <span>Raised by: <span className="text-[#0D2240] font-medium">{t.initiator}</span></span>}
                      {t.current_assignee && <span>Assigned to: <span className="text-[#0D2240] font-medium">{t.current_assignee}</span></span>}
                      {t.linked_ref && <span>Ref: {t.linked_ref}</span>}
                      {t.target_completion && (
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {isOverdue ? `⚠ Overdue ${Math.abs(daysLeft!)}d` : `Due: ${t.target_completion}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0 items-start">
                    {!terminal && (
                      <Button size="sm" onClick={() => advanceStage(t)} className="bg-[#0057B8] hover:bg-[#003D82] text-xs h-8">
                        Advance <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)} className="text-[#0057B8] hover:text-[#003D82]"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteTask(t.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">{editing ? 'Edit Workflow' : 'New Workflow'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., Approve Remote Access Exception" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Type</Label>
                <Select value={formData.workflow_type} onValueChange={(v) => setFormData({ ...formData, workflow_type: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {Object.entries(WORKFLOW_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
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
            <div>
              <Label className="text-[#0D2240] font-medium">Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Initiator *</Label>
                <Input value={formData.initiator} onChange={(e) => setFormData({ ...formData, initiator: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="Who raised this" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Assigned To</Label>
                <Input value={formData.current_assignee} onChange={(e) => setFormData({ ...formData, current_assignee: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Current approver" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Stage</Label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {STAGES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Target Completion</Label>
                <Input type="date" value={formData.target_completion} onChange={(e) => setFormData({ ...formData, target_completion: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Linked Reference</Label>
              <Input value={formData.linked_ref} onChange={(e) => setFormData({ ...formData, linked_ref: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., RISK-003, EXC-007, POL-001" />
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Resolution Notes</Label>
              <Textarea value={formData.resolution_notes} onChange={(e) => setFormData({ ...formData, resolution_notes: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="Decision rationale or closure notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Create Workflow'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
