import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Edit, Trash2, Calendar, User, CheckCircle, AlertCircle, 
  Loader2, Clock, Flag, Filter, Search, X, TrendingUp,
  FileText, MessageSquare, Send, MoreVertical, Eye,
  Target, Heart, Shield, Award
} from 'lucide-react';

interface Action {
  id: string;
  finding_id: string;
  action_title: string;
  description: string;
  assigned_to: string;
  due_date: string;
  status: string;
  priority: string;
  completion_notes: string;
  finding?: { finding_title: string };
}

export default function ActionTracker() {
  const { organizationId, loading: authLoading } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
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
    const actionData = { 
      organization_id: organizationId, 
      finding_id: formData.finding_id || null,
      action_title: formData.action_title,
      description: formData.description || null,
      assigned_to: formData.assigned_to || null,
      due_date: formData.due_date || null,
      status: formData.status,
      priority: formData.priority,
      completion_notes: formData.completion_notes || null
    };
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
      alert('Error saving action. Please check the form.');
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
      case 'completed': return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'in_progress': return { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'overdue': return { label: 'Overdue', color: 'bg-red-100 text-red-800', icon: AlertCircle };
      default: return { label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return { label: 'High', color: 'bg-red-100 text-red-800', icon: Flag };
      case 'medium': return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: Flag };
      default: return { label: 'Low', color: 'bg-green-100 text-green-800', icon: Flag };
    }
  };

  // Filter actions
  const filteredActions = actions.filter(action => {
    const matchesSearch = action.action_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (action.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || action.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || action.priority === priorityFilter;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'pending' && action.status === 'pending') ||
                      (activeTab === 'in_progress' && action.status === 'in_progress') ||
                      (activeTab === 'completed' && action.status === 'completed') ||
                      (activeTab === 'overdue' && action.status === 'overdue');
    return matchesSearch && matchesStatus && matchesPriority && matchesTab;
  });

  // Statistics
  const stats = {
    total: actions.length,
    pending: actions.filter(a => a.status === 'pending').length,
    inProgress: actions.filter(a => a.status === 'in_progress').length,
    completed: actions.filter(a => a.status === 'completed').length,
    overdue: actions.filter(a => a.status === 'overdue').length,
    highPriority: actions.filter(a => a.priority === 'high').length,
    completionRate: actions.length > 0 ? Math.round((actions.filter(a => a.status === 'completed').length / actions.length) * 100) : 0
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Actions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={stats.completionRate} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search actions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Action
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap gap-2 bg-transparent">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            All Actions ({filteredActions.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            In Progress ({stats.inProgress})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Completed ({stats.completed})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Overdue ({stats.overdue})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredActions.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No actions found</p>
                <Button variant="link" onClick={() => { resetForm(); setModalOpen(true); }} className="mt-2">
                  Create your first action
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredActions.map((action) => {
                const status = getStatusBadge(action.status);
                const priority = getPriorityBadge(action.priority);
                const StatusIcon = status.icon;
                const PriorityIcon = priority.icon;
                const isOverdue = action.status === 'overdue' || (action.due_date && new Date(action.due_date) < new Date() && action.status !== 'completed');
                
                return (
                  <Card key={action.id} className="hover:shadow-lg transition-all duration-200 overflow-hidden">
                    {/* Priority Banner */}
                    <div className={`h-1 ${action.priority === 'high' ? 'bg-red-500' : action.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{action.action_title}</h3>
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                            <Badge className={priority.color}>
                              <PriorityIcon className="h-3 w-3 mr-1" />
                              {priority.label}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{action.description}</p>
                          
                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">Assigned to:</span>
                              <span className="font-medium">{action.assigned_to || 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">Due:</span>
                              <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                {action.due_date ? new Date(action.due_date).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            {action.finding?.finding_title && (
                              <div className="flex items-center gap-2 col-span-2">
                                <FileText className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">Finding:</span>
                                <span className="text-blue-600 truncate">{action.finding.finding_title}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Progress indicator for in-progress actions */}
                          {action.status === 'in_progress' && (
                            <div className="mb-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>50%</span>
                              </div>
                              <Progress value={50} className="h-1" />
                            </div>
                          )}
                          
                          {/* Completion notes */}
                          {action.completion_notes && action.status === 'completed' && (
                            <div className="mt-2 p-2 bg-green-50 rounded-lg">
                              <p className="text-xs text-green-700">{action.completion_notes}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedAction(action);
                              setDetailsOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
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
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteAction(action.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Status Update Dropdown */}
                      <div className="mt-3 pt-3 border-t flex justify-end">
                        <Select value={action.status} onValueChange={(v) => updateStatus(action.id, v)}>
                          <SelectTrigger className="w-36 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Mark Pending</SelectItem>
                            <SelectItem value="in_progress">Mark In Progress</SelectItem>
                            <SelectItem value="completed">Mark Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {editingAction ? 'Edit Action' : 'Create New Action'}
            </DialogTitle>
            <DialogDescription>
              {editingAction ? 'Update the action details below.' : 'Fill in the details to create a new remediation action.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Finding (Optional)
                </Label>
                <Select value={formData.finding_id || 'none'} onValueChange={(v) => setFormData({...formData, finding_id: v === 'none' ? '' : v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select finding" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {findings.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.finding_title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Action Title *
                </Label>
                <Input value={formData.action_title} onChange={(e) => setFormData({...formData, action_title: e.target.value})} placeholder="Enter action title" />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Description
              </Label>
              <Textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Describe the action..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Assigned To
                </Label>
                <Input value={formData.assigned_to} onChange={(e) => setFormData({...formData, assigned_to: e.target.value})} placeholder="Assignee name or email" />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due Date
                </Label>
                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Status
                </Label>
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
                <Label className="flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  Priority
                </Label>
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
              <Label className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Completion Notes
              </Label>
              <Textarea rows={2} value={formData.completion_notes} onChange={(e) => setFormData({...formData, completion_notes: e.target.value})} placeholder="Add notes when completing the action..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveAction} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              {editingAction ? 'Update Action' : 'Create Action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAction?.action_title}</DialogTitle>
            <DialogDescription>Action details and status</DialogDescription>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium capitalize">{selectedAction.status}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Priority</p>
                  <p className="font-medium capitalize">{selectedAction.priority}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Assigned To</p>
                  <p className="font-medium">{selectedAction.assigned_to || 'Unassigned'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium">{selectedAction.due_date ? new Date(selectedAction.due_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              {selectedAction.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-gray-600">{selectedAction.description}</p>
                </div>
              )}
              {selectedAction.completion_notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Completion Notes</p>
                  <p className="text-sm text-gray-600">{selectedAction.completion_notes}</p>
                </div>
              )}
              {selectedAction.finding?.finding_title && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500">Related Finding</p>
                  <p className="text-sm font-medium text-blue-700">{selectedAction.finding.finding_title}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
