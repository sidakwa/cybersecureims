import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, ExternalLink, Calendar, FileText, Search } from 'lucide-react';

const policyTypes = ['Information Security', 'Data Protection', 'Access Control', 'Asset Management', 'Risk Management', 'Business Continuity', 'Incident Management', 'Supplier Security', 'Network Security'];

export default function DocumentManagement() {
  const { profile, loading: authLoading } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [formData, setFormData] = useState({
    policy_id: '',
    policy_name: '',
    policy_type: '',
    version: '1.0',
    status: 'Active',
    sharepoint_link: '',
    owner: '',
    approved_date: '',
    review_date: '',
    description: ''
  });

  const organizationId = profile?.organization_id;

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchPolicies();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  useEffect(() => {
    filterPolicies();
  }, [policies, searchTerm, filterStatus]);

  const fetchPolicies = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('organization_id', organizationId)
        .order('policy_id', { ascending: true });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPolicies = () => {
    let filtered = [...policies];
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.policy_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.policy_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    setFilteredPolicies(filtered);
  };

  const savePolicy = async () => {
    if (!organizationId) return;

    const policyData = {
      organization_id: organizationId,
      policy_id: formData.policy_id,
      policy_name: formData.policy_name,
      policy_type: formData.policy_type,
      version: formData.version,
      status: formData.status,
      sharepoint_link: formData.sharepoint_link || null,
      owner: formData.owner || null,
      approved_date: formData.approved_date || null,
      review_date: formData.review_date || null,
      description: formData.description || null
    };

    try {
      if (editingPolicy) {
        const { error } = await supabase
          .from('policies')
          .update(policyData)
          .eq('id', editingPolicy.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('policies')
          .insert([policyData]);
        if (error) throw error;
      }

      await fetchPolicies();
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving policy:', error);
    }
  };

  const deletePolicy = async (id: string) => {
    if (confirm('Delete this policy?')) {
      const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', id);
      if (!error) fetchPolicies();
    }
  };

  const resetForm = () => {
    setEditingPolicy(null);
    setFormData({
      policy_id: '',
      policy_name: '',
      policy_type: '',
      version: '1.0',
      status: 'Active',
      sharepoint_link: '',
      owner: '',
      approved_date: '',
      review_date: '',
      description: ''
    });
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
      <div className="flex justify-between items-center">
        <div>
          <PageHeader title="Policy & Evidence Library" description="Central policy register with SharePoint integration" icon={<FileText className="h-6 w-6" />} />
          <p className="text-gray-600 mt-1">Central policy register with SharePoint integration</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{policies.length}</div><p className="text-sm text-gray-500">Total Policies</p></CardContent></Card>
        <Card className="bg-green-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{policies.filter(p => p.status === 'Active').length}</div><p className="text-sm text-green-600">Active</p></CardContent></Card>
        <Card className="bg-yellow-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-yellow-600">{policies.filter(p => p.review_date && new Date(p.review_date) < new Date()).length}</div><p className="text-sm text-yellow-600">Needs Review</p></CardContent></Card>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search policies..."
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Under Review">Under Review</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Register</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Policy Name</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Version</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Owner</th>
                  <th className="text-left p-3">Approved</th>
                  <th className="text-left p-3">Review Date</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((policy) => (
                  <tr key={policy.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{policy.policy_id}</td>
                    <td className="p-3 font-medium">{policy.policy_name}</td>
                    <td className="p-3"><Badge variant="secondary">{policy.policy_type}</Badge></td>
                    <td className="p-3">{policy.version}</td>
                    <td className="p-3"><Badge className={policy.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}>{policy.status}</Badge></td>
                    <td className="p-3">{policy.owner || '—'}</td>
                    <td className="p-3">{policy.approved_date ? new Date(policy.approved_date).toLocaleDateString() : '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className={policy.review_date && new Date(policy.review_date) < new Date() ? 'text-red-600' : ''}>
                          {policy.review_date ? new Date(policy.review_date).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {policy.sharepoint_link && (
                          <a href={policy.sharepoint_link} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded">
                            <ExternalLink className="h-4 w-4 text-blue-500" />
                          </a>
                        )}
                        <button onClick={() => {
                          setEditingPolicy(policy);
                          setFormData({
                            policy_id: policy.policy_id || '',
                            policy_name: policy.policy_name || '',
                            policy_type: policy.policy_type || '',
                            version: policy.version || '1.0',
                            status: policy.status || 'Active',
                            sharepoint_link: policy.sharepoint_link || '',
                            owner: policy.owner || '',
                            approved_date: policy.approved_date || '',
                            review_date: policy.review_date || '',
                            description: policy.description || ''
                          });
                          setModalOpen(true);
                        }} className="p-2 hover:bg-gray-100 rounded">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => deletePolicy(policy.id)} className="p-2 hover:bg-gray-100 rounded">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'Edit Policy' : 'Add New Policy'}</DialogTitle>
            <DialogDescription>
              {editingPolicy
                ? 'Edit the policy details below. Click update when you\'re done.'
                : 'Fill in the policy information below. Click create to add it to the register.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Policy ID *</Label>
                <Input
                  value={formData.policy_id || ''}
                  onChange={(e) => setFormData({...formData, policy_id: e.target.value})}
                  placeholder="e.g., IS-01"
                />
              </div>
              <div>
                <Label>Policy Name *</Label>
                <Input
                  value={formData.policy_name || ''}
                  onChange={(e) => setFormData({...formData, policy_name: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Policy Type</Label>
                <Select value={formData.policy_type || ''} onValueChange={(v) => setFormData({...formData, policy_type: v})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {policyTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Version</Label>
                <Input
                  value={formData.version || ''}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>SharePoint Link</Label>
              <Input
                value={formData.sharepoint_link || ''}
                onChange={(e) => setFormData({...formData, sharepoint_link: e.target.value})}
                placeholder="https://seacomsa.sharepoint.com/..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Owner</Label>
                <Input
                  value={formData.owner || ''}
                  onChange={(e) => setFormData({...formData, owner: e.target.value})}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status || 'Active'} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Approved Date</Label>
                <Input
                  type="date"
                  value={formData.approved_date || ''}
                  onChange={(e) => setFormData({...formData, approved_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Review Date</Label>
                <Input
                  type="date"
                  value={formData.review_date || ''}
                  onChange={(e) => setFormData({...formData, review_date: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={savePolicy}>{editingPolicy ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
