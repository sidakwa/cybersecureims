import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Shield, CheckCircle, Clock, XCircle, Edit, Save, X, Plus, Trash2, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function ControlLibrary() {
  const { profile, loading: authLoading } = useAuth();
  const [controls, setControls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingControl, setEditingControl] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    status: 'not_started',
    owner: '',
    implementation_notes: '',
    due_date: '',
    evidence_links: ''
  });

  const organizationId = profile?.organization_id;

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchControls();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading, selectedFramework]);

  const fetchControls = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      let query = supabase.from('framework_controls').select('*');

      if (selectedFramework !== 'all') {
        query = query.eq('framework', selectedFramework);
      }

      const { data, error } = await query.order('control_id', { ascending: true });

      if (error) throw error;
      setControls(data || []);
    } catch (err) {
      console.error('Error fetching controls:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateControl = async () => {
    if (!editingControl) return;

    try {
      const updates = {
        status: formData.status,
        owner: formData.owner,
        implementation_notes: formData.implementation_notes,
        due_date: formData.due_date || null,
        evidence_links: formData.evidence_links ? [formData.evidence_links] : [],
        last_reviewed: new Date().toISOString()
      };

      const { error } = await supabase
        .from('framework_controls')
        .update(updates)
        .eq('id', editingControl.id);

      if (error) throw error;

      await fetchControls();
      setModalOpen(false);
      setEditingControl(null);
      resetForm();
    } catch (err) {
      console.error('Error updating control:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      status: 'not_started',
      owner: '',
      implementation_notes: '',
      due_date: '',
      evidence_links: ''
    });
  };

  const editControl = (control: any) => {
    setEditingControl(control);
    setFormData({
      status: control.status || 'not_started',
      owner: control.owner || '',
      implementation_notes: control.implementation_notes || '',
      due_date: control.due_date || '',
      evidence_links: control.evidence_links?.[0] || ''
    });
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      implemented: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      not_started: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status?.replace('_', ' ')}</Badge>;
  };

  const filteredControls = controls.filter(c => 
    c.control_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.control_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <PageHeader title="Control Library" description="Framework controls and implementation status" icon={<Shield className="h-6 w-6" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          {['all', 'ISO27001', 'SOC2', 'NIST_CSF'].map((fw) => (
            <Button
              key={fw}
              variant={selectedFramework === fw ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFramework(fw)}
            >
              {fw === 'all' ? 'All Frameworks' : fw}
            </Button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search controls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Controls Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">Control ID</th>
                  <th className="text-left p-3">Control Title</th>
                  <th className="text-left p-3">Framework</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Owner</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredControls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">No controls found. </td>
                  </tr>
                ) : (
                  filteredControls.map((control) => (
                    <tr key={control.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs">{control.control_id}</td>
                      <td className="p-3">{control.control_title}</td>
                      <td className="p-3"><Badge variant="outline">{control.framework}</Badge></td>
                      <td className="p-3">{getStatusBadge(control.status)}</td>
                      <td className="p-3">{control.owner || '-'}</td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="sm" onClick={() => editControl(control)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Control: {editingControl?.control_id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="implemented">Implemented</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Owner</Label>
              <Input value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})} />
            </div>
            <div>
              <Label>Implementation Notes</Label>
              <Textarea value={formData.implementation_notes} onChange={(e) => setFormData({...formData, implementation_notes: e.target.value})} rows={3} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
            </div>
            <div>
              <Label>Evidence Links</Label>
              <Input value={formData.evidence_links} onChange={(e) => setFormData({...formData, evidence_links: e.target.value})} placeholder="SharePoint link or file path" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={updateControl}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
