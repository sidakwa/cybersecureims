import PageHeader from '@/components/PageHeader';
import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Users, Globe, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function OrganizationManagementPage() {
  const { isAdmin, organization } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    status: 'active',
    subscription_tier: 'basic'
  });

  useEffect(() => {
    if (isAdmin) {
      fetchOrganizations();
    }
  }, [isAdmin]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingOrg) {
        const { error } = await supabase
          .from('organizations')
          .update({
            name: formData.name,
            subdomain: formData.subdomain,
            status: formData.status,
            subscription_tier: formData.subscription_tier,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingOrg.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organizations')
          .insert([{
            name: formData.name,
            subdomain: formData.subdomain,
            status: formData.status,
            subscription_tier: formData.subscription_tier
          }]);
        
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingOrg(null);
      setFormData({ name: '', subdomain: '', status: 'active', subscription_tier: 'basic' });
      await fetchOrganizations();
    } catch (error) {
      console.error('Error saving organization:', error);
      alert('Failed to save organization');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this organization? This will also delete all associated data.')) return;
    
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchOrganizations();
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Failed to delete organization');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      trial: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100';
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-800',
      professional: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100';
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <Building2 className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">Only system administrators can manage organizations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <PageHeader title="Organization Management" description="Manage organisations and tenant settings" icon={<Building className="h-6 w-6" />} />
            <p className="text-sm text-muted-foreground">Manage multi-tenant organizations</p>
          </div>
        </div>
        <Button onClick={() => { setEditingOrg(null); setFormData({ name: '', subdomain: '', status: 'active', subscription_tier: 'basic' }); setIsModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Create Organization
        </Button>
      </div>

      <div className="grid gap-4">
        {/* Current Organization Card */}
        {organization && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Current Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">{organization.name}</p>
                  <p className="text-sm text-gray-600">Subdomain: {organization.subdomain || 'N/A'}</p>
                  <Badge className={getStatusBadge(organization.status)}>{organization.status}</Badge>
                  <Badge className={getTierBadge(organization.subscription_tier)} className="ml-2">{organization.subscription_tier}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Organizations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              All Organizations ({organizations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading organizations...</div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No organizations created yet</div>
            ) : (
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div key={org.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-5 w-5 text-gray-500" />
                          <span className="font-semibold text-lg">{org.name}</span>
                          <Badge className={getStatusBadge(org.status)}>{org.status}</Badge>
                          <Badge className={getTierBadge(org.subscription_tier)}>{org.subscription_tier}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="text-gray-500">Subdomain:</span> {org.subdomain || 'N/A'}</div>
                          <div><span className="text-gray-500">Created:</span> {new Date(org.created_at).toLocaleDateString()}</div>
                          <div><span className="text-gray-500">Organization ID:</span> <code className="text-xs">{org.id}</code></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => { 
                            setEditingOrg(org); 
                            setFormData({
                              name: org.name,
                              subdomain: org.subdomain || '',
                              status: org.status,
                              subscription_tier: org.subscription_tier
                            }); 
                            setIsModalOpen(true); 
                          }}
                        >
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        {org.id !== organization?.id && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(org.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Organization Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingOrg ? 'Edit Organization' : 'Create New Organization'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Foods"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input
                id="subdomain"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                placeholder="acme"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Used for custom URLs (e.g., acme.yourapp.com)</p>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <Label htmlFor="subscription_tier">Subscription Tier</Label>
              <select
                id="subscription_tier"
                value={formData.subscription_tier}
                onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              >
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} className="flex-1">{editingOrg ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
