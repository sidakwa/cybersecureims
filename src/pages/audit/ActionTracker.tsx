import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Plus, Edit, Trash2, AlertCircle, Calendar, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AuditNavigation } from '../../components/audit/AuditNavigation';

export default function ActionTracker() {
  const { profile, loading: authLoading } = useAuth();
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    finding_id: ''
  });

  const { organizationId } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchActions();
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
        .select('*')
        .eq('organization_id', organizationId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setActions(data || []);
    } catch (err) {
      console.error('Error fetching actions:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveAction = async () => {
    if (!organizationId) return;

    const payload = {
      ...formData,
      organization_id: organizationId
    };

    try {
      if (editingAction) {
        const { error } = await supabase
          .from('audit_actions')
          .update(payload)
          .eq('id', editingAction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('audit_actions').insert([payload]);
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
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      assigned_to: '',
      due_date: '',
      finding_id: ''
    });
  };

  const editAction = (action: any) => {
    setEditingAction(action);
    setFormData({
      title: action.title || '',
      description: action.description || '',
      status: action.status || 'pending',
      priority: action.priority || 'medium',
      assigned_to: action.assigned_to || '',
      due_date: action.due_date || '',
      finding_id: action.finding_id || ''
    });
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress': return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'pending': return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high': return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low': return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
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
          <Plus className="h-4 w-4 mr-2" />
          Add Action
        </Button>
      </div>

      <div className="space-y-3">
        {actions.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No actions created.</CardContent></Card>
        ) : (
          actions.map((action) => (
            <Card key={action.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {action.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      <h3 className="font-semibold text-lg">{action.title}</h3>
                      {getStatusBadge(action.status)}
                      {getPriorityBadge(action.priority)}
                    </div>
                    <p className="text-sm text-gray-600">{action.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {action.assigned_to && <span className="flex items-center gap-1"><User className="h-3 w-3" />{action.assigned_to}</span>}
                      {action.due_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due: {new Date(action.due_date).toLocaleDateString()}</span>}
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
                    <Button variant="ghost" size="sm" onClick={() => editAction(action)}>
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
            <div>
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assigned To</Label>
                <Input value={formData.assigned_to} onChange={(e) => setFormData({...formData, assigned_to: e.target.value})} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
              </div>
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
