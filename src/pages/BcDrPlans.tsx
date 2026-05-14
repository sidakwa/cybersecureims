import { ShieldAlert } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, RefreshCw, Plus, Trash2, Edit, Clock, Target } from 'lucide-react';

interface BcDrPlan {
  id: string;
  plan_name: string;
  plan_type: string;
  description: string;
  rto_hours: number;
  rpo_hours: number;
  last_tested: string;
  next_test_date: string;
  status: string;
  key_contacts: string;
  recovery_procedures: string;
}

export default function BcDrPlans() {
  const [plans, setPlans] = useState<BcDrPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BcDrPlan | null>(null);
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_type: 'bcp',
    description: '',
    rto_hours: '',
    rpo_hours: '',
    last_tested: '',
    next_test_date: '',
    status: 'draft',
    key_contacts: '',
    recovery_procedures: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bc_dr_plans')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching BC/DR plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        rto_hours: formData.rto_hours ? parseInt(formData.rto_hours) : null,
        rpo_hours: formData.rpo_hours ? parseInt(formData.rpo_hours) : null
      };
      
      if (editingPlan) {
        const { error } = await supabase
          .from('bc_dr_plans')
          .update(payload)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bc_dr_plans').insert([payload]);
        if (error) throw error;
      }
      await fetchPlans();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving BC/DR plan:', err);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this BC/DR plan?')) return;
    try {
      const { error } = await supabase.from('bc_dr_plans').delete().eq('id', id);
      if (error) throw error;
      await fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('bc_dr_plans').update({ status }).eq('id', id);
      if (error) throw error;
      await fetchPlans();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      plan_name: '',
      plan_type: 'bcp',
      description: '',
      rto_hours: '',
      rpo_hours: '',
      last_tested: '',
      next_test_date: '',
      status: 'draft',
      key_contacts: '',
      recovery_procedures: ''
    });
  };

  const editPlan = (plan: BcDrPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      description: plan.description || '',
      rto_hours: plan.rto_hours?.toString() || '',
      rpo_hours: plan.rpo_hours?.toString() || '',
      last_tested: plan.last_tested || '',
      next_test_date: plan.next_test_date || '',
      status: plan.status,
      key_contacts: plan.key_contacts || '',
      recovery_procedures: plan.recovery_procedures || ''
    });
    setModalOpen(true);
  };

  const getPlanTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      bcp: 'Business Continuity Plan',
      drp: 'Disaster Recovery Plan',
      irp: 'Incident Response Plan'
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      approved: 'bg-green-500',
      draft: 'bg-gray-500',
      review: 'bg-yellow-500',
      archived: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader title="BC/DR Plans" description="Business continuity and disaster recovery plans" icon={<ShieldAlert className="h-6 w-6" />} />
          <p className="text-gray-500 mt-1">Business Continuity and Disaster Recovery Plans</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      <div className="space-y-3">
        {plans.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No BC/DR plans found. Click "Add Plan" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4 text-blue-500" />
                      <h3 className="font-semibold text-[#0D2240]">{plan.plan_name}</h3>
                      <Badge variant="outline">{getPlanTypeLabel(plan.plan_type)}</Badge>
                      <Badge className={getStatusColor(plan.status)}>
                        {plan.status}
                      </Badge>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-500">RTO:</span>{' '}
                        <span className="text-gray-600">{plan.rto_hours ? `${plan.rto_hours}h` : 'Not set'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-500">RPO:</span>{' '}
                        <span className="text-gray-600">{plan.rpo_hours ? `${plan.rpo_hours}h` : 'Not set'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Tested:</span>{' '}
                        <span className="text-gray-600">{plan.last_tested || 'Never'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Next Test:</span>{' '}
                        <span className="text-gray-600">{plan.next_test_date || 'Not scheduled'}</span>
                      </div>
                    </div>
                    {plan.key_contacts && (
                      <p className="text-sm text-gray-500 mt-2">Key Contacts: {plan.key_contacts}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Select value={plan.status} onValueChange={(v) => updateStatus(plan.id, v)}>
                      <SelectTrigger className="w-28 bg-gray-50 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => editPlan(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deletePlan(plan.id)} className="text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* BC/DR Plan Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white text-[#0D2240] border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit BC/DR Plan' : 'Add New BC/DR Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Plan Name *</Label>
                <Input
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                  required
                />
              </div>
              <div>
                <Label>Plan Type</Label>
                <Select value={formData.plan_type} onValueChange={(v) => setFormData({ ...formData, plan_type: v })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bcp">Business Continuity Plan (BCP)</SelectItem>
                    <SelectItem value="drp">Disaster Recovery Plan (DRP)</SelectItem>
                    <SelectItem value="irp">Incident Response Plan (IRP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>RTO (hours)</Label>
                <Input
                  type="number"
                  value={formData.rto_hours}
                  onChange={(e) => setFormData({ ...formData, rto_hours: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                  placeholder="Recovery Time Objective"
                />
              </div>
              <div>
                <Label>RPO (hours)</Label>
                <Input
                  type="number"
                  value={formData.rpo_hours}
                  onChange={(e) => setFormData({ ...formData, rpo_hours: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                  placeholder="Recovery Point Objective"
                />
              </div>
              <div>
                <Label>Last Tested</Label>
                <Input
                  type="date"
                  value={formData.last_tested}
                  onChange={(e) => setFormData({ ...formData, last_tested: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div>
                <Label>Next Test Date</Label>
                <Input
                  type="date"
                  value={formData.next_test_date}
                  onChange={(e) => setFormData({ ...formData, next_test_date: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <Label>Key Contacts</Label>
                <Textarea
                  value={formData.key_contacts}
                  onChange={(e) => setFormData({ ...formData, key_contacts: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                  rows={2}
                  placeholder="Names, roles, and contact information of key personnel"
                />
              </div>
              <div className="col-span-2">
                <Label>Recovery Procedures</Label>
                <Textarea
                  value={formData.recovery_procedures}
                  onChange={(e) => setFormData({ ...formData, recovery_procedures: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                  rows={3}
                  placeholder="Step-by-step recovery procedures..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
