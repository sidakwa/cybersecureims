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
  CheckCircle, Clock, Flag, Search, Eye, Filter, X,
  TrendingUp, Target, AlertCircle, DollarSign,
  Save, RefreshCw, ArrowRight
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
  const [filteredCount, setFilteredCount] = useState(0);

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
    } catch (error) {
      console.error('Error fetching work packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkPackages();
  }, [organizationId]);

  const saveWorkPackage = async () => {
    if (!organizationId || !formData.wp_code.trim() || !formData.wp_name.trim()) {
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
    try {
      if (editingPackage) {
        const { error } = await supabase.from('work_package_register').update(packageData).eq('wp_id', editingPackage.wp_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('work_package_register').insert([packageData]);
        if (error) throw error;
      }
      await fetchWorkPackages();
      setModalOpen(false);
      resetForm();
      alert(editingPackage ? 'Work package updated!' : 'Work package created!');
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkPackage = async (wp_id: string) => {
    if (!confirm('Delete this work package?')) return;
    await supabase.from('work_package_register').delete().eq('wp_id', wp_id);
    fetchWorkPackages();
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Completed: 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      Blocked: 'bg-red-100 text-red-800',
      Planned: 'bg-yellow-100 text-yellow-800',
      Open: 'bg-yellow-100 text-yellow-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800'
    };
    return <Badge className={colors[priority as keyof typeof colors] || 'bg-gray-100'}>{priority}</Badge>;
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
    const matchesSearch = wp.wp_name?.toLowerCase().includes(searchTerm.toLowerCase()) || wp.wp_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wp.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || wp.priority === priorityFilter;
    const matchesTab = activeTab === 'all' || wp.status === activeTab;
    return matchesSearch && matchesStatus && matchesPriority && matchesTab;
  });

  useEffect(() => {
    setFilteredCount(filteredPackages.length);
  }, [filteredPackages]);

  const stats = {
    total: workPackages.length,
    completed: workPackages.filter(w => w.status === 'Completed').length,
    inProgress: workPackages.filter(w => w.status === 'In Progress').length,
    planned: workPackages.filter(w => w.status === 'Planned').length,
    blocked: workPackages.filter(w => w.status === 'Blocked').length,
    highPriority: workPackages.filter(w => w.priority === 'High').length,
    totalBudget: workPackages.reduce((sum, w) => sum + (Number(w.budget_allocated) || 0), 0),
    consumedBudget: workPackages.reduce((sum, w) => sum + (Number(w.budget_consumed) || 0), 0),
    completionRate: workPackages.length ? Math.round((workPackages.filter(w => w.status === 'Completed').length / workPackages.length) * 100) : 0
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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

      {/* Gradient Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white"><CardContent className="pt-4"><p className="text-blue-100 text-sm">Total</p><p className="text-3xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white"><CardContent className="pt-4"><p className="text-green-100 text-sm">Completed</p><p className="text-3xl font-bold text-green-100">{stats.completed}</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white"><CardContent className="pt-4"><p className="text-blue-100 text-sm">In Progress</p><p className="text-3xl font-bold">{stats.inProgress}</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"><CardContent className="pt-4"><p className="text-yellow-100 text-sm">Planned</p><p className="text-3xl font-bold">{stats.planned}</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white"><CardContent className="pt-4"><p className="text-red-100 text-sm">Blocked</p><p className="text-3xl font-bold">{stats.blocked}</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white"><CardContent className="pt-4"><p className="text-orange-100 text-sm">High Priority</p><p className="text-3xl font-bold">{stats.highPriority}</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white"><CardContent className="pt-4"><p className="text-purple-100 text-sm">Completion Rate</p><p className="text-3xl font-bold">{stats.completionRate}%</p><Progress value={stats.completionRate} className="mt-2 h-1 bg-purple-400" /></CardContent></Card>
      </div>

      {/* Budget Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center"><p className="text-sm text-gray-500">Total Budget</p><p className="text-2xl font-bold text-blue-600">${stats.totalBudget.toLocaleString()}</p></div>
            <div className="text-center"><p className="text-sm text-gray-500">Consumed</p><p className="text-2xl font-bold text-orange-600">${stats.consumedBudget.toLocaleString()}</p></div>
            <div className="text-center"><p className="text-sm text-gray-500">Remaining</p><p className="text-2xl font-bold text-green-600">${(stats.totalBudget - stats.consumedBudget).toLocaleString()}</p></div>
          </div>
          <Progress value={stats.totalBudget ? (stats.consumedBudget / stats.totalBudget) * 100 : 0} className="mt-3 h-2" />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search by code or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Planned">Planned</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Blocked">Blocked</SelectItem></SelectContent></Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent><SelectItem value="all">All Priority</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select>
        {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (<Button variant="ghost" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setPriorityFilter('all'); }} className="gap-1"><X className="h-4 w-4" /> Clear</Button>)}
      </div>

      {/* Table Layout */}
      <div className="border rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50 px-4 py-3 border-b text-sm font-medium text-gray-600">
          <div className="col-span-4">Work Package</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-1">Progress</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>
        <div className="divide-y">
          {filteredPackages.map((wp) => (
            <div key={wp.wp_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-gray-50 transition-colors items-start md:items-center">
              <div className="col-span-4 flex gap-3">
                <div className="p-2 rounded-lg bg-blue-100"><Package className="h-4 w-4 text-blue-600" /></div>
                <div><p className="font-medium text-gray-900">{wp.wp_name}</p><p className="text-xs text-gray-500 mt-0.5">{wp.wp_code}</p></div>
              </div>
              <div className="col-span-2">{getStatusBadge(wp.status)}</div>
              <div className="col-span-2">{getPriorityBadge(wp.priority)}</div>
              <div className="col-span-2"><div className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3 text-gray-400" /><span>{wp.planned_end_date ? new Date(wp.planned_end_date).toLocaleDateString() : 'N/A'}</span></div></div>
              <div className="col-span-1"><div className="flex items-center gap-1"><Progress value={calculateProgress(wp)} className="h-2 w-16" /><span className="text-xs">{calculateProgress(wp)}%</span></div></div>
              <div className="col-span-1 text-center"><Button variant="ghost" size="sm" onClick={() => { setEditingPackage(wp); setFormData({ wp_code: wp.wp_code, wp_name: wp.wp_name, status: wp.status, owner: wp.owner || '', priority: wp.priority, planned_start_date: wp.planned_start_date || '', planned_end_date: wp.planned_end_date || '', actual_start_date: wp.actual_start_date || '', actual_end_date: wp.actual_end_date || '', blocked_reason: wp.blocked_reason || '', estimated_hours: wp.estimated_hours || 0, actual_hours: wp.actual_hours || 0, budget_allocated: wp.budget_allocated || 0, budget_consumed: wp.budget_consumed || 0 }); setModalOpen(true); }}><Edit className="h-4 w-4" /></Button></div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals remain the same */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPackage ? 'Edit Work Package' : 'Add Work Package'}</DialogTitle><DialogDescription>{editingPackage ? 'Update the details below.' : 'Fill in the details to create a new work package.'}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><div><Label>WP Code *</Label><Input value={formData.wp_code} onChange={(e) => setFormData({...formData, wp_code: e.target.value})} /></div><div><Label>WP Name *</Label><Input value={formData.wp_name} onChange={(e) => setFormData({...formData, wp_name: e.target.value})} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Planned">Planned</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Blocked">Blocked</SelectItem></SelectContent></Select></div><div><Label>Priority</Label><Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select></div></div>
            <div><Label>Owner</Label><Input value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Planned Start Date</Label><Input type="date" value={formData.planned_start_date} onChange={(e) => setFormData({...formData, planned_start_date: e.target.value})} /></div><div><Label>Planned End Date (Due Date)</Label><Input type="date" value={formData.planned_end_date} onChange={(e) => setFormData({...formData, planned_end_date: e.target.value})} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Actual Start Date</Label><Input type="date" value={formData.actual_start_date} onChange={(e) => setFormData({...formData, actual_start_date: e.target.value})} /></div><div><Label>Actual End Date</Label><Input type="date" value={formData.actual_end_date} onChange={(e) => setFormData({...formData, actual_end_date: e.target.value})} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Estimated Hours</Label><Input type="number" value={formData.estimated_hours} onChange={(e) => setFormData({...formData, estimated_hours: Number(e.target.value) || 0})} /></div><div><Label>Actual Hours</Label><Input type="number" value={formData.actual_hours} onChange={(e) => setFormData({...formData, actual_hours: Number(e.target.value) || 0})} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Budget Allocated ($)</Label><Input type="number" value={formData.budget_allocated} onChange={(e) => setFormData({...formData, budget_allocated: Number(e.target.value) || 0})} /></div><div><Label>Budget Consumed ($)</Label><Input type="number" value={formData.budget_consumed} onChange={(e) => setFormData({...formData, budget_consumed: Number(e.target.value) || 0})} /></div></div>
            <div><Label>Blocked Reason</Label><Textarea rows={2} value={formData.blocked_reason} onChange={(e) => setFormData({...formData, blocked_reason: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={saveWorkPackage} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{editingPackage ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
