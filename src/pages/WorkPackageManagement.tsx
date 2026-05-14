import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Package, Plus, Edit, Trash2, Calendar, User, Clock, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function WorkPackageManagement() {
  const { profile, loading: authLoading } = useAuth();
  const [workPackages, setWorkPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    wp_code: '',
    wp_name: '',
    status: 'Open',
    owner: '',
    priority: 'Medium',
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    blocked_reason: ''
  });

  const { organizationId } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchWorkPackages();
    } else {
      setLoading(false);
    }
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
    } catch (error) {
      console.error('Error fetching work packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWorkPackage = async () => {
    if (!organizationId) return;

    const payload = {
      organization_id: organizationId,
      wp_code: formData.wp_code,
      wp_name: formData.wp_name,
      status: formData.status,
      owner: formData.owner,
      priority: formData.priority,
      planned_start_date: formData.planned_start_date || null,
      planned_end_date: formData.planned_end_date || null,
      actual_start_date: formData.actual_start_date || null,
      actual_end_date: formData.actual_end_date || null,
      blocked_reason: formData.blocked_reason || null
    };

    try {
      if (editingPackage) {
        const { error } = await supabase
          .from('work_package_register')
          .update(payload)
          .eq('wp_id', editingPackage.wp_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('work_package_register').insert([payload]);
        if (error) throw error;
      }
      await fetchWorkPackages();
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving work package:', error);
    }
  };

  const deleteWorkPackage = async (id: string) => {
    if (!confirm('Delete this work package?')) return;
    try {
      const { error } = await supabase.from('work_package_register').delete().eq('wp_id', id);
      if (error) throw error;
      await fetchWorkPackages();
    } catch (error) {
      console.error('Error deleting work package:', error);
    }
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      wp_code: '',
      wp_name: '',
      status: 'Open',
      owner: '',
      priority: 'Medium',
      planned_start_date: '',
      planned_end_date: '',
      actual_start_date: '',
      actual_end_date: '',
      blocked_reason: ''
    });
  };

  const editWorkPackage = (wp: any) => {
    setEditingPackage(wp);
    setFormData({
      wp_code: wp.wp_code || '',
      wp_name: wp.wp_name || '',
      status: wp.status || 'Open',
      owner: wp.owner || '',
      priority: wp.priority || 'Medium',
      planned_start_date: wp.planned_start_date || '',
      planned_end_date: wp.planned_end_date || '',
      actual_start_date: wp.actual_start_date || '',
      actual_end_date: wp.actual_end_date || '',
      blocked_reason: wp.blocked_reason || ''
    });
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Completed') return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    if (status === 'Open - immediate action required') return <Badge className="bg-red-100 text-red-800">Open - Immediate Action</Badge>;
    if (status === 'In Progress') return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
  };

  const filteredPackages = workPackages.filter(wp => {
    const matchesSearch = wp.wp_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          wp.wp_name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'open') return matchesSearch && wp.status !== 'Completed';
    if (statusFilter === 'completed') return matchesSearch && wp.status === 'Completed';
    return matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <PageHeader title="Work Package Management" description="Track programme work packages and deliverables" icon={<Package className="h-6 w-6" />} />
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Work Package
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>All</Button>
          <Button variant={statusFilter === 'open' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('open')}>Open</Button>
          <Button variant={statusFilter === 'completed' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('completed')}>Completed</Button>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPackages.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No work packages found.</CardContent></Card>
        ) : (
          filteredPackages.map((wp) => (
            <Card key={wp.wp_id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-semibold">{wp.wp_code}</span>
                      <h3 className="font-semibold text-lg">{wp.wp_name}</h3>
                      {getStatusBadge(wp.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm text-gray-600">
                      {wp.owner && <div className="flex items-center gap-1"><User className="h-4 w-4" />{wp.owner}</div>}
                      {wp.priority && <div>Priority: {wp.priority}</div>}
                      {wp.planned_start_date && <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />Start: {new Date(wp.planned_start_date).toLocaleDateString()}</div>}
                      {wp.planned_end_date && <div className="flex items-center gap-1"><Clock className="h-4 w-4" />End: {new Date(wp.planned_end_date).toLocaleDateString()}</div>}
                    </div>
                    {wp.blocked_reason && <p className="text-sm text-red-600 mt-2">Blocked: {wp.blocked_reason}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => editWorkPackage(wp)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteWorkPackage(wp.wp_id)} className="text-red-500">
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
            <DialogTitle>{editingPackage ? 'Edit Work Package' : 'Add Work Package'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>WP Code *</Label><Input value={formData.wp_code} onChange={(e) => setFormData({...formData, wp_code: e.target.value})} placeholder="e.g., WP1" /></div>
              <div><Label>WP Name *</Label><Input value={formData.wp_name} onChange={(e) => setFormData({...formData, wp_name: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Open">Open</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent></Select></div>
              <div><Label>Priority</Label><Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Owner</Label><Input value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})} /></div>
              <div><Label>Planned Start Date</Label><Input type="date" value={formData.planned_start_date} onChange={(e) => setFormData({...formData, planned_start_date: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Planned End Date</Label><Input type="date" value={formData.planned_end_date} onChange={(e) => setFormData({...formData, planned_end_date: e.target.value})} /></div>
              <div><Label>Blocked Reason</Label><Textarea value={formData.blocked_reason} onChange={(e) => setFormData({...formData, blocked_reason: e.target.value})} rows={2} placeholder="If blocked, explain why..." /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveWorkPackage}>{editingPackage ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
