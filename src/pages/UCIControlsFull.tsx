import { Shield } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
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
import { Loader2, Edit, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default function UCIControlsFull() {
  const { profile, loading: authLoading } = useAuth();
  const [controls, setControls] = useState<any[]>([]);
  const [filteredControls, setFilteredControls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingControl, setEditingControl] = useState<any>(null);
  const [formData, setFormData] = useState({
    uci_status: '',
    current_maturity: '',
    validation_notes: '',
    evidence_date: ''
  });

  const { organizationId } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchControls();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  useEffect(() => {
    filterControls();
  }, [controls, searchTerm, statusFilter]);

  const fetchControls = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('uci_controls')
        .select('*')
        .eq('organization_id', organizationId)
        .order('control_code', { ascending: true });

      if (error) throw error;
      setControls(data || []);
    } catch (error) {
      console.error('Error fetching UCI controls:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterControls = () => {
    let filtered = [...controls];
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.control_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.control_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.uci_status === statusFilter);
    }
    setFilteredControls(filtered);
    setCurrentPage(1);
  };

  const updateControl = async () => {
    if (!editingControl) return;

    try {
      const { error } = await supabase
        .from('uci_controls')
        .update({
          uci_status: formData.uci_status,
          current_maturity: formData.current_maturity,
          validation_notes: formData.validation_notes,
          evidence_date: formData.evidence_date || null
        })
        .eq('id', editingControl.id);

      if (error) throw error;

      await fetchControls();
      setModalOpen(false);
      setEditingControl(null);
    } catch (error) {
      console.error('Error updating control:', error);
    }
  };

  const totalPages = Math.ceil(filteredControls.length / ITEMS_PER_PAGE);
  const paginatedControls = filteredControls.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
        <PageHeader title="UCI Controls Register" description="Unified Control Implementation - Full Register" icon={<Shield className="h-6 w-6" />} />
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>All</Button>
          <Button variant={statusFilter === 'In Place' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('In Place')}>In Place</Button>
          <Button variant={statusFilter === 'Partial' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('Partial')}>Partial</Button>
          <Button variant={statusFilter === 'Not Started' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('Not Started')}>Not Started</Button>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Control Name</th>
                  <th className="text-left p-3">Risk Tier</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Current → Target</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedControls.map((control) => (
                  <tr key={control.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs">{control.control_code}</td>
                    <td className="p-3">{control.control_name}</td>
                    <td className="p-3">{control.risk_tier || '-'}</td>
                    <td className="p-3"><Badge className={control.uci_status === 'In Place' ? 'bg-green-500' : control.uci_status === 'Partial' ? 'bg-yellow-500' : 'bg-gray-500'}>{control.uci_status || 'Not Started'}</Badge></td>
                    <td className="p-3">{control.current_maturity || 'L0'} → {control.target_maturity || 'L3'}</td>
                    <td className="p-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingControl(control); setFormData({ uci_status: control.uci_status || '', current_maturity: control.current_maturity || '', validation_notes: '', evidence_date: '' }); setModalOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /> Previous</Button>
              <span className="text-sm">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Control</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Status</Label><Select value={formData.uci_status} onValueChange={(v) => setFormData({...formData, uci_status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="In Place">In Place</SelectItem><SelectItem value="Partial">Partial</SelectItem><SelectItem value="Not Started">Not Started</SelectItem></SelectContent></Select></div>
            <div><Label>Current Maturity</Label><Select value={formData.current_maturity} onValueChange={(v) => setFormData({...formData, current_maturity: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="L0">L0 - None</SelectItem><SelectItem value="L1">L1 - Initial</SelectItem><SelectItem value="L2">L2 - Managed</SelectItem><SelectItem value="L3">L3 - Defined</SelectItem><SelectItem value="L4">L4 - Optimized</SelectItem></SelectContent></Select></div>
            <div><Label>Validation Notes</Label><Textarea value={formData.validation_notes} onChange={(e) => setFormData({...formData, validation_notes: e.target.value})} rows={3} /></div>
            <div><Label>Evidence Date</Label><Input type="date" value={formData.evidence_date} onChange={(e) => setFormData({...formData, evidence_date: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={updateControl}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
