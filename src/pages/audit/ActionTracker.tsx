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
import { Plus, Edit, Trash2, Calendar, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { AuditNavigation } from '../../components/audit/AuditNavigation';

interface Action {
  id: string;
  finding_id: string;
  action_title: string;
  description: string;
  assigned_to: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  completion_notes: string;
  finding: { finding_title: string };
}

export default function ActionTracker() {
  const { organizationId, loading: authLoading } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [formData, setFormData] = useState({
    finding_id: '',
    action_title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    status: 'pending',
    priority: 'medium',
    completion_notes: ''
  });

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchActions();
      fetchFindings();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchActions = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_actions')
        .select('*, finding:audit_findings(finding_title)')
        .eq('organization_id', organizationId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      setActions(data || []);
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFindings = async () => {
    if (!organizationId) return;
    const { data } = await supabase
      .from('audit_findings')
      .select('id, finding_title')
      .eq('organization_id', organizationId);
    setFindings(data || []);
  };

  const saveAction = async () => {
    if (!organizationId) return;
    const actionData = { organization_id: organizationId, ...formData };
    try {
      if (editingAction) {
        const { error } = await supabase.from('audit_actions').update(actionData).eq('id', editingAction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('audit_actions').insert([actionData]);
        if (error) throw error;
      }
      await fetchActions();
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving action:', error);
    }
  };

  const deleteAction = async (id: string) => {
    if (!confirm('Delete this action?')) return;
    try {
      const { error } = await supabase.from('audit_actions').delete().eq('id', id);
      if (error) throw error;
      await fetchActions();
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('audit_actions').update({ status }).eq('id', id);
      if (error) throw error;
      await fetchActions();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setEditingAction(null);
    setFormData({
      finding_id: '',
      action_title: '',
      description: '',
      assigned_to: '',
      due_date: '',
      status: 'pending',
      priority: 'medium',
      completion_notes: ''
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress': return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'overdue': return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default: return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Action Tracker</h1>
        <p className="text-gray-500 mt-1">Track remediation actions and follow-up tasks</p>
      </div>

      <AuditNavigation />

      <div className="flex justify-end">
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Action
        </Button>
      </div>

      <div className="space-y-3">
        {actions.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No actions created.</CardContent></Card>
        ) : (
          actions.map((action) => (
            <Card key={action.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {action.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      <h3 className="font-semibold text-lg">{action.action_title}</h3>
                      {getStatusBadge(action.status)}
                      {getPriorityBadge(action.priority)}
                    </div>
                    <p className="text-sm text-gray-600">{action.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {action.assigned_to && (
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{action.assigned_to}</span>
                      )}
                      {action.due_date && (
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due: {new Date(action.due_date).toLocaleDateString()}</span>
                      )}
                      {action.finding?.finding_title && (
                        <span className="flex items-center gap-1 text-blue-600">Finding: {action.finding.finding_title}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={action.status} onValueChange={(v) => updateStatus(action.id, v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditingAction(action);
                      setFormData({
                        finding_id: action.finding_id || '',
                        action_title: action.action_title,
                        description: action.description || '',
                        assigned_to: action.assigned_to || '',
                        due_date: action.due_date || '',
                        status: action.status,
                        priority: action.priority,
                        completion_notes: action.completion_notes || ''
                      });
                      setModalOpen(true);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteAction(action.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAction ? 'Edit Action' : 'Add Action'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Finding</Label>
                <Select value={formData.finding_id} onValueChange={(v) => setFormData({...formData, finding_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select finding" /></SelectTrigger>
                  <SelectContent>
                    {findings.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.finding_title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Action Title</Label>
                <Input value={formData.action_title} onChange={(e) => setFormData({...formData, action_title: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Assigned To</Label><Input value={formData.assigned_to} onChange={(e) => setFormData({...formData, assigned_to: e.target.value})} /></div>
              <div><Label>Due Date</Label><Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Completion Notes</Label>
              <Textarea rows={2} value={formData.completion_notes} onChange={(e) => setFormData({...formData, completion_notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveAction}>{editingAction ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
