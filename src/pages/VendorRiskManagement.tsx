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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, Search, Save, RefreshCw, Building2, Shield, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface Vendor {
  id: string;
  vendor_name: string;
  service_type: string;
  risk_level: string;
  status: string;
  contact_name: string;
  contact_email: string;
  contract_start: string;
  contract_end: string;
  annual_spend: number;
  assessment_date: string;
  findings: string;
  remediation_plan: string;
  organization_id: string;
}

export default function VendorRiskManagement() {
  const { organizationId } = useAuth();
  const [items, setItems] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    vendor_name: '',
    service_type: '',
    risk_level: 'Medium',
    status: 'Active',
    contact_name: '',
    contact_email: '',
    contract_start: '',
    contract_end: '',
    annual_spend: 0,
    assessment_date: '',
    findings: '',
    remediation_plan: ''
  });

  const fetchData = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('third_party_vendors').select('*').eq('organization_id', organizationId).order('vendor_name');
      if (error) throw error;
      setItems(data || []);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [organizationId]);

  const saveItem = async () => {
    if (!organizationId || !formData.vendor_name.trim()) { alert('Vendor name is required'); return; }
    setSaving(true);
    try {
      const itemData = { organization_id: organizationId, ...formData, annual_spend: Number(formData.annual_spend) };
      if (editingItem) await supabase.from('third_party_vendors').update(itemData).eq('id', editingItem.id);
      else await supabase.from('third_party_vendors').insert([itemData]);
      await fetchData(); setModalOpen(false); resetForm(); alert(editingItem ? 'Updated!' : 'Created!');
    } catch (error: any) { alert(error.message); } finally { setSaving(false); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this vendor?')) return;
    await supabase.from('third_party_vendors').delete().eq('id', id);
    fetchData();
  };

  const resetForm = () => { setEditingItem(null); setFormData({ vendor_name: '', service_type: '', risk_level: 'Medium', status: 'Active', contact_name: '', contact_email: '', contract_start: '', contract_end: '', annual_spend: 0, assessment_date: '', findings: '', remediation_plan: '' }); };

  const getRiskBadge = (risk: string) => ({ High: 'bg-red-100 text-red-800', Medium: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800' }[risk] || 'bg-gray-100');

  const filteredItems = items.filter(v => v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) && (riskFilter === 'all' || v.risk_level === riskFilter));

  const stats = { total: items.length, high: items.filter(v => v.risk_level === 'High').length, medium: items.filter(v => v.risk_level === 'Medium').length, low: items.filter(v => v.risk_level === 'Low').length };

  if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Vendor Risk Management" description="Manage third-party vendor risks and assessments" icon={<Building2 className="h-6 w-6" />} actions={<Button onClick={() => { resetForm(); setModalOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Vendor</Button>} />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-gray-500">Total Vendors</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="bg-red-50"><CardContent className="pt-4"><p className="text-sm text-red-600">High Risk</p><p className="text-2xl font-bold text-red-600">{stats.high}</p></CardContent></Card>
        <Card className="bg-yellow-50"><CardContent className="pt-4"><p className="text-sm text-yellow-600">Medium Risk</p><p className="text-2xl font-bold text-yellow-600">{stats.medium}</p></CardContent></Card>
        <Card className="bg-green-50"><CardContent className="pt-4"><p className="text-sm text-green-600">Low Risk</p><p className="text-2xl font-bold text-green-600">{stats.low}</p></CardContent></Card>
      </div>

      <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search vendors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div><Select value={riskFilter} onValueChange={setRiskFilter}><SelectTrigger className="w-32"><SelectValue placeholder="Risk Level" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select></div>

      {filteredItems.length === 0 ? (<Card><CardContent className="pt-12 pb-12 text-center"><Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">No vendors found</p></CardContent></Card>) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((v) => (
            <Card key={v.id} className="hover:shadow-lg transition-all">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap"><h3 className="font-semibold text-lg">{v.vendor_name}</h3><Badge className={getRiskBadge(v.risk_level)}>{v.risk_level} Risk</Badge><Badge>{v.status}</Badge></div>
                    <p className="text-sm text-gray-600 mb-2">{v.service_type}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm"><div className="flex items-center gap-2"><User className="h-3 w-3 text-gray-400" />{v.contact_name || 'N/A'}</div><div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-gray-400" />Contract: {v.contract_start ? new Date(v.contract_start).getFullYear() : 'N/A'}</div><div className="flex items-center gap-2"><DollarSign className="h-3 w-3 text-gray-400" />${(v.annual_spend || 0).toLocaleString()}</div></div>
                  </div>
                  <div className="flex gap-1 ml-2"><Button variant="ghost" size="sm" onClick={() => { setEditingItem(v); setFormData({ vendor_name: v.vendor_name, service_type: v.service_type || '', risk_level: v.risk_level, status: v.status, contact_name: v.contact_name || '', contact_email: v.contact_email || '', contract_start: v.contract_start || '', contract_end: v.contract_end || '', annual_spend: v.annual_spend || 0, assessment_date: v.assessment_date || '', findings: v.findings || '', remediation_plan: v.remediation_plan || '' }); setModalOpen(true); }}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => deleteItem(v.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingItem ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle><DialogDescription>{editingItem ? 'Update vendor information.' : 'Register a new third-party vendor.'}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><div><Label>Vendor Name *</Label><Input value={formData.vendor_name} onChange={(e) => setFormData({...formData, vendor_name: e.target.value})} /></div><div><Label>Service Type</Label><Input value={formData.service_type} onChange={(e) => setFormData({...formData, service_type: e.target.value})} placeholder="Cloud, SaaS, Consulting..." /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Risk Level</Label><Select value={formData.risk_level} onValueChange={(v) => setFormData({...formData, risk_level: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select></div><div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Under Review">Under Review</SelectItem><SelectItem value="Terminated">Terminated</SelectItem></SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Contact Name</Label><Input value={formData.contact_name} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} /></div><div><Label>Contact Email</Label><Input type="email" value={formData.contact_email} onChange={(e) => setFormData({...formData, contact_email: e.target.value})} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Contract Start</Label><Input type="date" value={formData.contract_start} onChange={(e) => setFormData({...formData, contract_start: e.target.value})} /></div><div><Label>Contract End</Label><Input type="date" value={formData.contract_end} onChange={(e) => setFormData({...formData, contract_end: e.target.value})} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Annual Spend ($)</Label><Input type="number" value={formData.annual_spend} onChange={(e) => setFormData({...formData, annual_spend: Number(e.target.value) || 0})} /></div><div><Label>Last Assessment Date</Label><Input type="date" value={formData.assessment_date} onChange={(e) => setFormData({...formData, assessment_date: e.target.value})} /></div></div>
            <div><Label>Findings / Issues</Label><Textarea rows={2} value={formData.findings} onChange={(e) => setFormData({...formData, findings: e.target.value})} /></div>
            <div><Label>Remediation Plan</Label><Textarea rows={2} value={formData.remediation_plan} onChange={(e) => setFormData({...formData, remediation_plan: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={saveItem} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{editingItem ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
