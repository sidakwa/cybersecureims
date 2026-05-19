import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Loader2, Package, Plus, Edit, Trash2, Calendar, User,
  CheckCircle, Clock, Flag, Search, Eye,
  TrendingUp, Target, AlertCircle, DollarSign,
  Save, RefreshCw
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface WorkPackage {
  wp_id: string;
  organization_id: string;
  wp_code: string;
  wp_name: string;
  status: string;
  owner: string | null;
  priority: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  blocked_reason: string | null;
  estimated_hours: number;
  actual_hours: number;
  budget_allocated: number;
  budget_consumed: number;
  budget_remaining?: number;
}

export default function WorkPackageManagement() {
  const { organizationId } = useAuth();

  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<WorkPackage | null>(null);
  const [viewingPackage, setViewingPackage] = useState<WorkPackage | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    wp_code: '',
    wp_name: '',
    status: 'Planned',
    owner: '',
    priority: 'Medium',
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    blocked_reason: '',
    estimated_hours: 0,
    actual_hours: 0,
    budget_allocated: 0,
    budget_consumed: 0
  });

  const fetchWorkPackages = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      console.log('Fetching work packages...');

      const { data, error } = await supabase
        .from('work_package_register')
        .select('*')
        .eq('organization_id', organizationId)
        .order('wp_code', { ascending: true });

      if (error) throw error;

      console.log('Fetched work packages:', data?.length);
      setWorkPackages(data || []);
    } catch (error) {
      console.error('Error fetching work packages:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchWorkPackages();
  }, [fetchWorkPackages]);

  const forceRefresh = async () => {
    console.log('Manual refresh triggered');
    await fetchWorkPackages();
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      wp_code: '',
      wp_name: '',
      status: 'Planned',
      owner: '',
      priority: 'Medium',
      planned_start_date: '',
      planned_end_date: '',
      actual_start_date: '',
      actual_end_date: '',
      blocked_reason: '',
      estimated_hours: 0,
      actual_hours: 0,
      budget_allocated: 0,
      budget_consumed: 0
    });
  };

  const saveWorkPackage = async () => {
    if (!organizationId) return;

    if (!formData.wp_code.trim() || !formData.wp_name.trim()) {
      alert('WP Code and WP Name are required');
      return;
    }

    setSaving(true);

    const packageData = {
      organization_id: organizationId,
      wp_code: formData.wp_code.trim(),
      wp_name: formData.wp_name.trim(),
      status: formData.status,
      owner: formData.owner.trim() || null,
      priority: formData.priority,
      planned_start_date: formData.planned_start_date || null,
      planned_end_date: formData.planned_end_date || null,
      actual_start_date: formData.actual_start_date || null,
      actual_end_date: formData.actual_end_date || null,
      blocked_reason: formData.blocked_reason.trim() || null,
      estimated_hours: Number(formData.estimated_hours) || 0,
      actual_hours: Number(formData.actual_hours) || 0,
      budget_allocated: Number(formData.budget_allocated) || 0,
      budget_consumed: Number(formData.budget_consumed) || 0
    };

    console.log('Saving work package:', editingPackage ? 'UPDATE' : 'INSERT', packageData);

    try {
      if (editingPackage) {
        // Simple update without select
        const { error: updateError } = await supabase
          .from('work_package_register')
          .update(packageData)
          .eq('wp_id', editingPackage.wp_id);

        if (updateError) throw updateError;

        console.log('Update successful, refreshing data...');
        
        // Refresh the entire list to get updated data
        await forceRefresh();

        alert('Work package updated successfully!');
      } else {
        // Insert new package
        const { data: insertedData, error: insertError } = await supabase
          .from('work_package_register')
          .insert([packageData])
          .select()
          .single();

        if (insertError) throw insertError;

        console.log('Inserted row:', insertedData);

        setWorkPackages(prev => [insertedData, ...prev]);

        alert('Work package created successfully!');
      }

      setModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving work package:', error);
      alert(error.message || 'Failed to save work package');
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkPackage = async (wp_id: string) => {
    if (!confirm('Delete this work package? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('work_package_register')
        .delete()
        .eq('wp_id', wp_id);

      if (error) throw error;

      setWorkPackages(prev => prev.filter(wp => wp.wp_id !== wp_id));
      alert('Work package deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting work package:', error);
      alert(error.message || 'Failed to delete work package');
    }
  };

  const openEditModal = (wp: WorkPackage) => {
    setEditingPackage(wp);
    setFormData({
      wp_code: wp.wp_code || '',
      wp_name: wp.wp_name || '',
      status: wp.status || 'Planned',
      owner: wp.owner || '',
      priority: wp.priority || 'Medium',
      planned_start_date: wp.planned_start_date || '',
      planned_end_date: wp.planned_end_date || '',
      actual_start_date: wp.actual_start_date || '',
      actual_end_date: wp.actual_end_date || '',
      blocked_reason: wp.blocked_reason || '',
      estimated_hours: wp.estimated_hours || 0,
      actual_hours: wp.actual_hours || 0,
      budget_allocated: wp.budget_allocated || 0,
      budget_consumed: wp.budget_consumed || 0
    });
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'In Progress': return { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Clock };
      case 'Blocked': return { label: 'Blocked', color: 'bg-red-100 text-red-800', icon: AlertCircle };
      default: return { label: 'Planned', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High': return { label: 'High', color: 'bg-red-100 text-red-800', icon: Flag };
      case 'Medium': return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: Flag };
      default: return { label: 'Low', color: 'bg-green-100 text-green-800', icon: Flag };
    }
  };

  const calculateProgress = (wp: WorkPackage) => {
    if (wp.status === 'Completed') return 100;
    if (wp.status === 'Planned') return 0;
    if (wp.status === 'Blocked') return 25;

    if (wp.planned_start_date && wp.planned_end_date) {
      const start = new Date(wp.planned_start_date);
      const end = new Date(wp.planned_end_date);
      const today = new Date();

      if (today < start) return 0;
      if (today > end) return 95;

      const total = end.getTime() - start.getTime();
      const elapsed = today.getTime() - start.getTime();

      return Math.min(Math.round((elapsed / total) * 100), 95);
    }

    return 50;
  };

  const filteredPackages = workPackages.filter(wp => {
    const matchesSearch =
      wp.wp_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wp.wp_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || wp.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || wp.priority === priorityFilter;
    const matchesTab = activeTab === 'all' || wp.status === activeTab;

    return matchesSearch && matchesStatus && matchesPriority && matchesTab;
  });

  const stats = {
    total: workPackages.length,
    completed: workPackages.filter(w => w.status === 'Completed').length,
    inProgress: workPackages.filter(w => w.status === 'In Progress').length,
    planned: workPackages.filter(w => w.status === 'Planned').length,
    blocked: workPackages.filter(w => w.status === 'Blocked').length,
    highPriority: workPackages.filter(w => w.priority === 'High').length,
    totalBudget: workPackages.reduce((sum, w) => sum + (Number(w.budget_allocated) || 0), 0),
    consumedBudget: workPackages.reduce((sum, w) => sum + (Number(w.budget_consumed) || 0), 0),
    completionRate: workPackages.length > 0
      ? Math.round((workPackages.filter(w => w.status === 'Completed').length / workPackages.length) * 100)
      : 0
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Package Management"
        description="Track and manage programme work packages"
        icon={<Package className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button onClick={forceRefresh} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => { resetForm(); setModalOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Work Package
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-green-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-blue-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-yellow-600">Planned</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.planned}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-red-600">Blocked</p>
            <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-gray-500">High Priority</p>
            <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-gray-500">Completion Rate</p>
            <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
            <Progress value={stats.completionRate} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold text-blue-600">${stats.totalBudget.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Consumed</p>
              <p className="text-2xl font-bold text-orange-600">${stats.consumedBudget.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-2xl font-bold text-green-600">
                ${(stats.totalBudget - stats.consumedBudget).toLocaleString()}
              </p>
            </div>
          </div>
          <Progress
            value={stats.totalBudget > 0 ? (stats.consumedBudget / stats.totalBudget) * 100 : 0}
            className="mt-3 h-2"
          />
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap gap-2 bg-transparent">
          <TabsTrigger value="all">All ({workPackages.length})</TabsTrigger>
          <TabsTrigger value="Planned">Planned ({stats.planned})</TabsTrigger>
          <TabsTrigger value="In Progress">In Progress ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="Completed">Completed ({stats.completed})</TabsTrigger>
          <TabsTrigger value="Blocked">Blocked ({stats.blocked})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredPackages.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No work packages found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPackages.map((wp) => {
                const progress = calculateProgress(wp);
                const status = getStatusBadge(wp.status);
                const priority = getPriorityBadge(wp.priority);
                const StatusIcon = status.icon;
                const PriorityIcon = priority.icon;

                return (
                  <Card key={wp.wp_id} className="hover:shadow-lg transition-all duration-200 overflow-hidden">
                    <div className={`h-1 ${wp.priority === 'High' ? 'bg-red-500' : wp.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />

                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-mono text-xs text-gray-500">{wp.wp_code}</span>
                            <h3 className="font-semibold text-lg">{wp.wp_name}</h3>

                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>

                            <Badge className={priority.color}>
                              <PriorityIcon className="h-3 w-3 mr-1" />
                              {priority.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">Owner:</span>
                              <span className="font-medium">{wp.owner || 'Unassigned'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">Due:</span>
                              <span className="font-medium">
                                {wp.planned_end_date ? new Date(wp.planned_end_date).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">Est. Hours:</span>
                              <span className="font-medium">{wp.estimated_hours || 0}h</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">Budget:</span>
                              <span className="font-medium">${(wp.budget_allocated || 0).toLocaleString()}</span>
                            </div>
                          </div>

                          {wp.blocked_reason && (
                            <div className="mt-2 p-2 bg-red-50 rounded-lg mb-3">
                              <p className="text-xs text-red-700 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Blocked: {wp.blocked_reason}
                              </p>
                            </div>
                          )}

                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>

                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewingPackage(wp);
                              setDetailsOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(wp)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWorkPackage(wp.wp_id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Edit Work Package' : 'Add Work Package'}</DialogTitle>
            <DialogDescription>
              {editingPackage ? 'Update the work package details below.' : 'Fill in the details to create a new work package.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>WP Code *</Label>
                <Input value={formData.wp_code} onChange={(e) => setFormData({ ...formData, wp_code: e.target.value })} />
              </div>
              <div>
                <Label>WP Name *</Label>
                <Input value={formData.wp_name} onChange={(e) => setFormData({ ...formData, wp_name: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Owner</Label>
              <Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Planned Start Date</Label>
                <Input type="date" value={formData.planned_start_date} onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })} />
              </div>
              <div>
                <Label>Planned End Date</Label>
                <Input type="date" value={formData.planned_end_date} onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Actual Start Date</Label>
                <Input type="date" value={formData.actual_start_date} onChange={(e) => setFormData({ ...formData, actual_start_date: e.target.value })} />
              </div>
              <div>
                <Label>Actual End Date</Label>
                <Input type="date" value={formData.actual_end_date} onChange={(e) => setFormData({ ...formData, actual_end_date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estimated Hours</Label>
                <Input type="number" value={formData.estimated_hours} onChange={(e) => setFormData({ ...formData, estimated_hours: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Actual Hours</Label>
                <Input type="number" value={formData.actual_hours} onChange={(e) => setFormData({ ...formData, actual_hours: Number(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget Allocated</Label>
                <Input type="number" value={formData.budget_allocated} onChange={(e) => setFormData({ ...formData, budget_allocated: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Budget Consumed</Label>
                <Input type="number" value={formData.budget_consumed} onChange={(e) => setFormData({ ...formData, budget_consumed: Number(e.target.value) || 0 })} />
              </div>
            </div>

            <div>
              <Label>Blocked Reason</Label>
              <Textarea rows={2} value={formData.blocked_reason} onChange={(e) => setFormData({ ...formData, blocked_reason: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveWorkPackage} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingPackage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingPackage?.wp_name}</DialogTitle>
            <DialogDescription>Work package details and status</DialogDescription>
          </DialogHeader>

          {viewingPackage && (
            <div className="space-y-4">
              <p><strong>WP Code:</strong> {viewingPackage.wp_code}</p>
              <p><strong>Status:</strong> {viewingPackage.status}</p>
              <p><strong>Priority:</strong> {viewingPackage.priority}</p>
              <p><strong>Owner:</strong> {viewingPackage.owner || 'Unassigned'}</p>
              <p><strong>Budget Allocated:</strong> ${(viewingPackage.budget_allocated || 0).toLocaleString()}</p>
              <p><strong>Budget Consumed:</strong> ${(viewingPackage.budget_consumed || 0).toLocaleString()}</p>
              {viewingPackage.blocked_reason && (
                <p><strong>Blocked Reason:</strong> {viewingPackage.blocked_reason}</p>
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
