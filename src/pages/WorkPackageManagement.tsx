import React, { useEffect, useState } from 'react';
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
  Clock, Search, TrendingUp, DollarSign, Save, RefreshCw
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface WorkPackage {
  wp_id: string;
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
}

// Converts empty string → null for DATE columns; Postgres rejects ""
const dateOrNull = (v: string) => (v && v.trim() !== '' ? v : null);

export default function WorkPackageManagement() {
  const { organizationId, loading: authLoading } = useAuth();
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<WorkPackage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const emptyForm = {
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
    estimated_hours: '',
    actual_hours: '',
    budget_allocated: '',
    budget_consumed: '',
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) fetchWorkPackages();
    else setLoading(false);
  }, [organizationId, authLoading]);

  const fetchWorkPackages = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_package_register')
        .select('*')
        .eq('organization_id', organizationId)
        .order('wp_code', { ascending: true });
      if (error) throw error;
      setWorkPackages(data || []);
    } catch (err) {
      console.error('Error fetching work packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveWorkPackage = async () => {
    if (!organizationId) return;
    if (!formData.wp_code.trim() || !formData.wp_name.trim()) {
      alert('WP Code and WP Name are required.');
      return;
    }

    // Always send the complete payload — never diff.
    // Empty date strings become null so Postgres DATE columns don't error.
    const payload = {
      organization_id: organizationId,
      wp_code: formData.wp_code.trim(),
      wp_name: formData.wp_name.trim(),
      status: formData.status,
      owner: formData.owner.trim() || null,
      priority: formData.priority,
      planned_start_date: dateOrNull(formData.planned_start_date),
      planned_end_date:   dateOrNull(formData.planned_end_date),
      actual_start_date:  dateOrNull(formData.actual_start_date),
      actual_end_date:    dateOrNull(formData.actual_end_date),
      blocked_reason: formData.blocked_reason.trim() || null,
      estimated_hours: formData.estimated_hours !== '' ? Number(formData.estimated_hours) : 0,
      actual_hours:    formData.actual_hours    !== '' ? Number(formData.actual_hours)    : 0,
      budget_allocated: formData.budget_allocated !== '' ? Number(formData.budget_allocated) : 0,
      budget_consumed:  formData.budget_consumed  !== '' ? Number(formData.budget_consumed)  : 0,
    };

    setSaving(true);
    try {
      if (editingPackage) {
        const { error } = await supabase
          .from('work_package_register')
          .update(payload)
          .eq('wp_id', editingPackage.wp_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('work_package_register')
          .insert([payload]);
        if (error) throw error;
      }
      await fetchWorkPackages();
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Error saving work package:', err);
      alert(err.message || 'Failed to save work package.');
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkPackage = async (wp_id: string) => {
    if (!confirm('Delete this work package?')) return;
    try {
      const { error } = await supabase.from('work_package_register').delete().eq('wp_id', wp_id);
      if (error) throw error;
      await fetchWorkPackages();
    } catch (err) {
      console.error('Error deleting work package:', err);
    }
  };

  const openEdit = (wp: WorkPackage) => {
    setEditingPackage(wp);
    setFormData({
      wp_code: wp.wp_code || '',
      wp_name: wp.wp_name || '',
      status: wp.status || 'Planned',
      owner: wp.owner || '',
      priority: wp.priority || 'Medium',
      planned_start_date: wp.planned_start_date || '',
      planned_end_date:   wp.planned_end_date   || '',
      actual_start_date:  wp.actual_start_date  || '',
      actual_end_date:    wp.actual_end_date    || '',
      blocked_reason: wp.blocked_reason || '',
      estimated_hours: wp.estimated_hours != null ? String(wp.estimated_hours) : '',
      actual_hours:    wp.actual_hours    != null ? String(wp.actual_hours)    : '',
      budget_allocated: wp.budget_allocated != null ? String(wp.budget_allocated) : '',
      budget_consumed:  wp.budget_consumed  != null ? String(wp.budget_consumed)  : '',
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData(emptyForm);
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      Completed: 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      Blocked: 'bg-red-100 text-red-800',
      Planned: 'bg-yellow-100 text-yellow-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const map: Record<string, string> = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800',
    };
    return map[priority] || 'bg-gray-100 text-gray-800';
  };

  const calculateProgress = (wp: WorkPackage) => {
    if (wp.status === 'Completed') return 100;
    if (wp.status === 'Planned') return 0;
    if (wp.status === 'Blocked') return 25;
    return 50;
  };

  const filtered = workPackages.filter(wp => {
    const q = searchTerm.toLowerCase();
    const matchSearch = wp.wp_name?.toLowerCase().includes(q) || wp.wp_code?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || wp.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || wp.priority === priorityFilter;
    const matchTab = activeTab === 'all' || wp.status === activeTab;
    return matchSearch && matchStatus && matchPriority && matchTab;
  });

  const stats = {
    total: workPackages.length,
    completed: workPackages.filter(w => w.status === 'Completed').length,
    inProgress: workPackages.filter(w => w.status === 'In Progress').length,
    planned: workPackages.filter(w => w.status === 'Planned').length,
    blocked: workPackages.filter(w => w.status === 'Blocked').length,
    highPriority: workPackages.filter(w => w.priority === 'High').length,
    totalBudget: workPackages.reduce((s, w) => s + (w.budget_allocated || 0), 0),
    consumedBudget: workPackages.reduce((s, w) => s + (w.budget_consumed || 0), 0),
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
            <Button onClick={fetchWorkPackages} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={() => { resetForm(); setModalOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Add Work Package
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="bg-green-50"><CardContent className="pt-4 pb-4"><p className="text-sm text-green-600">Completed</p><p className="text-2xl font-bold text-green-600">{stats.completed}</p></CardContent></Card>
        <Card className="bg-blue-50"><CardContent className="pt-4 pb-4"><p className="text-sm text-blue-600">In Progress</p><p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p></CardContent></Card>
        <Card className="bg-yellow-50"><CardContent className="pt-4 pb-4"><p className="text-sm text-yellow-600">Planned</p><p className="text-2xl font-bold text-yellow-600">{stats.planned}</p></CardContent></Card>
        <Card className="bg-red-50"><CardContent className="pt-4 pb-4"><p className="text-sm text-red-600">Blocked</p><p className="text-2xl font-bold text-red-600">{stats.blocked}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-gray-500">High Priority</p><p className="text-2xl font-bold text-red-600">{stats.highPriority}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-sm text-gray-500">Budget Remaining</p>
          <p className="text-xl font-bold text-green-600">${(stats.totalBudget - stats.consumedBudget).toLocaleString()}</p>
          <Progress value={stats.totalBudget ? (stats.consumedBudget / stats.totalBudget) * 100 : 0} className="mt-2 h-1" />
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by code or name…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Planned">Planned</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 bg-transparent">
          <TabsTrigger value="all">All ({workPackages.length})</TabsTrigger>
          <TabsTrigger value="Planned">Planned ({stats.planned})</TabsTrigger>
          <TabsTrigger value="In Progress">In Progress ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="Completed">Completed ({stats.completed})</TabsTrigger>
          <TabsTrigger value="Blocked">Blocked ({stats.blocked})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filtered.length === 0 ? (
            <Card><CardContent className="pt-12 pb-12 text-center text-gray-500">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              No work packages found.
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((wp) => {
                const progress = calculateProgress(wp);
                return (
                  <Card key={wp.wp_id} className="hover:shadow-lg transition-all overflow-hidden">
                    <div className={`h-1 ${wp.priority === 'High' ? 'bg-red-500' : wp.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-mono text-xs text-gray-500">{wp.wp_code}</span>
                            <h3 className="font-semibold truncate">{wp.wp_name}</h3>
                          </div>
                          <div className="flex gap-2 mb-3 flex-wrap">
                            <Badge className={getStatusColor(wp.status)}>{wp.status}</Badge>
                            <Badge className={getPriorityColor(wp.priority)}>{wp.priority}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1"><User className="h-3 w-3 text-gray-400" />{wp.owner || 'Unassigned'}</div>
                            <div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-gray-400" />Due: {wp.planned_end_date ? new Date(wp.planned_end_date).toLocaleDateString() : 'N/A'}</div>
                            <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-gray-400" />{wp.estimated_hours || 0}h est.</div>
                            <div className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-gray-400" />${(wp.budget_allocated || 0).toLocaleString()}</div>
                          </div>
                          {wp.blocked_reason && (
                            <div className="p-2 bg-red-50 rounded text-xs text-red-700 mb-3">Blocked: {wp.blocked_reason}</div>
                          )}
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span>{progress}%</span></div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(wp)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteWorkPackage(wp.wp_id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
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

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) resetForm(); setModalOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Edit Work Package' : 'Add Work Package'}</DialogTitle>
            <DialogDescription>
              {editingPackage ? 'Update the details below and click Update.' : 'Fill in the details to create a new work package.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>WP Code *</Label><Input value={formData.wp_code} onChange={(e) => setFormData({...formData, wp_code: e.target.value})} placeholder="e.g. WP1" /></div>
              <div><Label>WP Name *</Label><Input value={formData.wp_name} onChange={(e) => setFormData({...formData, wp_name: e.target.value})} /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
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
                <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div><Label>Owner</Label><Input value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})} /></div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Planned Start Date</Label><Input type="date" value={formData.planned_start_date} onChange={(e) => setFormData({...formData, planned_start_date: e.target.value})} /></div>
              <div><Label>Planned End Date</Label><Input type="date" value={formData.planned_end_date} onChange={(e) => setFormData({...formData, planned_end_date: e.target.value})} /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Actual Start Date</Label><Input type="date" value={formData.actual_start_date} onChange={(e) => setFormData({...formData, actual_start_date: e.target.value})} /></div>
              <div><Label>Actual End Date</Label><Input type="date" value={formData.actual_end_date} onChange={(e) => setFormData({...formData, actual_end_date: e.target.value})} /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Estimated Hours</Label><Input type="number" min="0" value={formData.estimated_hours} onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})} placeholder="0" /></div>
              <div><Label>Actual Hours</Label><Input type="number" min="0" value={formData.actual_hours} onChange={(e) => setFormData({...formData, actual_hours: e.target.value})} placeholder="0" /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Budget Allocated ($)</Label><Input type="number" min="0" value={formData.budget_allocated} onChange={(e) => setFormData({...formData, budget_allocated: e.target.value})} placeholder="0" /></div>
              <div><Label>Budget Consumed ($)</Label><Input type="number" min="0" value={formData.budget_consumed} onChange={(e) => setFormData({...formData, budget_consumed: e.target.value})} placeholder="0" /></div>
            </div>

            <div><Label>Blocked Reason</Label><Textarea rows={2} value={formData.blocked_reason} onChange={(e) => setFormData({...formData, blocked_reason: e.target.value})} placeholder="If blocked, describe the blocker…" /></div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={saveWorkPackage} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingPackage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
