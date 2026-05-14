import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, FileText, ExternalLink, Calendar, Plus, Trash2 } from 'lucide-react';

export default function EvidenceManagement() {
  const { profile, loading: authLoading } = useAuth();
  const { organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    evidence_name: '',
    evidence_type: 'Document',
    file_url: '',
    expiry_date: ''
  });

  useEffect(() => {
      if (authLoading) return;
    if (organizationId) {
      fetchEvidence();
    }
  }, [organizationId, authLoading]);

  const fetchEvidence = async () => {
    if (!organizationId) return;
    
    try {
      // Use uploaded_at instead of created_at
      const { data, error } = await supabase
        .from('audit_evidence')
        .select('*')
        .eq('organization_id', organizationId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      setEvidence(data || []);
    } catch (error) {
      console.error('Error fetching evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadEvidence = async () => {
    if (!organizationId) return;
    
    const { error } = await supabase.from('audit_evidence').insert({
      organization_id: organizationId,
      evidence_name: formData.evidence_name,
      evidence_type: formData.evidence_type,
      file_url: formData.file_url,
      expiry_date: formData.expiry_date || null,
      uploaded_at: new Date().toISOString()
    });
    
    if (!error) {
      await fetchEvidence();
      setModalOpen(false);
      setFormData({ evidence_name: '', evidence_type: 'Document', file_url: '', expiry_date: '' });
    } else {
      console.error('Upload error:', error);
    }
  };

  const deleteEvidence = async (id: string) => {
    if (confirm('Delete this evidence?')) {
      const { error } = await supabase.from('audit_evidence').delete().eq('id', id);
      if (!error) fetchEvidence();
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return { label: 'No Expiry', color: 'bg-gray-500' };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilExpiry < 0) return { label: 'Expired', color: 'bg-red-500' };
    if (daysUntilExpiry < 30) return { label: 'Expiring Soon', color: 'bg-yellow-500' };
    return { label: 'Valid', color: 'bg-green-500' };
  };

  if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <PageHeader title="Evidence Management" description="Track and manage audit evidence" icon={<FolderOpen className="h-6 w-6" />} />
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Evidence</Button>
      </div>

      {evidence.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-gray-500">No evidence uploaded yet. Click "Add Evidence" to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {evidence.map((item) => {
            const expiryStatus = getExpiryStatus(item.expiry_date);
            return (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold">{item.evidence_name}</h3>
                        <Badge className={expiryStatus.color}>{expiryStatus.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Type: {item.evidence_type}</p>
                      {item.expiry_date && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          Expires: {new Date(item.expiry_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 p-2">
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                      <button onClick={() => deleteEvidence(item.id)} className="text-red-500 hover:text-red-700 p-2">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Evidence</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Evidence Name *</Label><Input value={formData.evidence_name} onChange={(e) => setFormData({...formData, evidence_name: e.target.value})} placeholder="e.g., ISMS Policy v2.0" /></div>
            <div><Label>Type</Label><select className="w-full border rounded-md p-2" value={formData.evidence_type} onChange={(e) => setFormData({...formData, evidence_type: e.target.value})}><option>Document</option><option>Screenshot</option><option>Configuration</option><option>Log</option><option>Interview</option></select></div>
            <div><Label>File URL / SharePoint Link</Label><Input value={formData.file_url} onChange={(e) => setFormData({...formData, file_url: e.target.value})} placeholder="https://seacomsa.sharepoint.com/..." /></div>
            <div><Label>Expiry Date (Optional)</Label><Input type="date" value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={uploadEvidence}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
