import PageHeader from '@/components/PageHeader';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Monitor, Plus, Trash2, Edit, Search } from 'lucide-react';

interface Application {
  id: string;
  application_name: string;
  owner: string;
  business_unit: string;
  criticality: string;
  hosting: string;
  status: string;
  vendor: string;
  url: string;
  description: string;
}

const EMPTY_FORM = {
  application_name: '',
  owner: '',
  business_unit: '',
  criticality: 'medium',
  hosting: '',
  status: 'active',
  vendor: '',
  url: '',
  description: '',
};

export default function ApplicationRegister() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const { user } = useAuth();

  useEffect(() => { fetchApps(); }, [user]);

  const fetchApps = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApps(data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const { error } = await supabase.from('applications').update(formData).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('applications').insert([formData]);
        if (error) throw error;
      }
      await fetchApps();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving application:', err);
    }
  };

  const deleteApp = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    try {
      const { error } = await supabase.from('applications').delete().eq('id', id);
      if (error) throw error;
      await fetchApps();
    } catch (err) {
      console.error('Error deleting application:', err);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
  };

  const openEdit = (app: Application) => {
    setEditing(app);
    setFormData({
      application_name: app.application_name,
      owner: app.owner || '',
      business_unit: app.business_unit || '',
      criticality: app.criticality || 'medium',
      hosting: app.hosting || '',
      status: app.status || 'active',
      vendor: app.vendor || '',
      url: app.url || '',
      description: app.description || '',
    });
    setModalOpen(true);
  };

  const criticalityColor: Record<string, string> = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-black',
    low: 'bg-green-500 text-white',
  };

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    planned: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    decommissioned: 'bg-gray-100 text-gray-600',
  };

  const filtered = apps.filter(a =>
    a.application_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.business_unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#0057B8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0057B8] -mt-6 -mx-6 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader title="Application Register" description="Track all business applications, their owners and risk posture" icon={<Monitor className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Maintain a complete inventory of applications across the organisation</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{apps.length} Applications</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Total</p>
            <p className="text-xl font-bold text-[#0D2240]">{apps.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Critical / High</p>
            <p className="text-xl font-bold text-red-600">
              {apps.filter(a => a.criticality === 'critical' || a.criticality === 'high').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Cloud / SaaS</p>
            <p className="text-xl font-bold text-[#0057B8]">
              {apps.filter(a => a.hosting === 'cloud' || a.hosting === 'saas').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Active</p>
            <p className="text-xl font-bold text-green-600">
              {apps.filter(a => a.status === 'active').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Add */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-gray-300"
          />
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />
          Add Application
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Application</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Business Unit</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Criticality</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Hosting</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Owner</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Status</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    No applications found. Click "Add Application" to get started.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div>
                        <p className="text-sm font-medium text-[#0D2240]">{app.application_name}</p>
                        {app.vendor && <p className="text-xs text-gray-500 mt-0.5">Vendor: {app.vendor}</p>}
                        {app.url && (
                          <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0057B8] hover:underline mt-0.5 block truncate max-w-xs">
                            {app.url}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-[#0D2240]">{app.business_unit || '—'}</td>
                    <td className="p-3">
                      {app.criticality ? (
                        <Badge className={criticalityColor[app.criticality] || 'bg-gray-500 text-white'}>
                          {app.criticality.toUpperCase()}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs capitalize">{app.hosting?.replace('-', ' ') || '—'}</Badge>
                    </td>
                    <td className="p-3 text-sm text-[#0D2240]">{app.owner || 'Unassigned'}</td>
                    <td className="p-3">
                      <Badge className={statusColor[app.status] || 'bg-gray-100 text-gray-600'}>
                        {app.status?.replace('_', ' ') || 'unknown'}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(app)} className="text-[#0057B8] hover:text-[#003D82]">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteApp(app.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">
              {editing ? 'Edit Application' : 'Add Application'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Application Name *</Label>
              <Input
                value={formData.application_name}
                onChange={(e) => setFormData({ ...formData, application_name: e.target.value })}
                className="bg-white border-gray-300 focus:border-[#0057B8]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Owner</Label>
                <Input
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="bg-white border-gray-300 focus:border-[#0057B8]"
                  placeholder="Application owner"
                />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Business Unit</Label>
                <Input
                  value={formData.business_unit}
                  onChange={(e) => setFormData({ ...formData, business_unit: e.target.value })}
                  className="bg-white border-gray-300 focus:border-[#0057B8]"
                  placeholder="e.g., Finance, NOC"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Criticality</Label>
                <Select value={formData.criticality} onValueChange={(v) => setFormData({ ...formData, criticality: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="critical" className="text-red-600">Critical</SelectItem>
                    <SelectItem value="high" className="text-orange-600">High</SelectItem>
                    <SelectItem value="medium" className="text-yellow-600">Medium</SelectItem>
                    <SelectItem value="low" className="text-green-600">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Hosting</Label>
                <Select value={formData.hosting} onValueChange={(v) => setFormData({ ...formData, hosting: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Select hosting" /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="on-premise">On-Premise</SelectItem>
                    <SelectItem value="cloud">Cloud (IaaS/PaaS)</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Vendor</Label>
                <Input
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="bg-white border-gray-300 focus:border-[#0057B8]"
                  placeholder="e.g., Microsoft, AWS"
                />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="decommissioned">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">URL</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="bg-white border-gray-300 focus:border-[#0057B8]"
                placeholder="https://"
                type="url"
              />
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white border-gray-300 focus:border-[#0057B8]"
                placeholder="Brief description of the application"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">
                {editing ? 'Save Changes' : 'Add Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
