import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, ExternalLink, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AuditNavigation } from '../../components/audit/AuditNavigation';

export default function EvidenceLibrary() {
  const { profile, loading: authLoading } = useAuth();
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    evidence_name: '',
    evidence_type: 'Document',
    file_url: '',
    expiry_date: '',
    evidence_status: 'valid'
  });

  const { organizationId } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchEvidence();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchEvidence = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_evidence')
        .select('*')
        .eq('organization_id', organizationId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setEvidence(data || []);
    } catch (err) {
      console.error('Error fetching evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveEvidence = async () => {
    if (!organizationId) return;

    const payload = {
      organization_id: organizationId,
      evidence_name: formData.evidence_name,
      evidence_type: formData.evidence_type,
      file_url: formData.file_url,
      expiry_date: formData.expiry_date || null,
      evidence_status: formData.evidence_status,
      uploaded_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('audit_evidence').insert([payload]);
      if (error) throw error;
      await fetchEvidence();
      setModalOpen(false);
      setFormData({ evidence_name: '', evidence_type: 'Document', file_url: '', expiry_date: '', evidence_status: 'valid' });
    } catch (error) {
      console.error('Error saving evidence:', error);
    }
  };

  const deleteEvidence = async (id: string) => {
    if (!confirm('Delete this evidence?')) return;
    try {
      const { error } = await supabase.from('audit_evidence').delete().eq('id', id);
      if (error) throw error;
      await fetchEvidence();
    } catch (error) {
      console.error('Error deleting evidence:', error);
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'document': return <FileText className="h-8 w-8 text-blue-500" />;
      case 'report': return <FileText className="h-8 w-8 text-green-500" />;
      case 'certificate': return <FileText className="h-8 w-8 text-yellow-500" />;
      default: return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Expires in {daysUntilExpiry} days</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Evidence Library</h1>
        <p className="text-gray-500 mt-1">Manage audit evidence and supporting documentation</p>
      </div>

      <AuditNavigation />

      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Add Evidence
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidence.length === 0 ? (
          <div className="col-span-full">
            <Card><CardContent className="pt-6 text-center text-gray-500">No evidence records found.</CardContent></Card>
          </div>
        ) : (
          evidence.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getEvidenceIcon(item.evidence_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.evidence_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.evidence_type}
                      </Badge>
                      {getExpiryStatus(item.expiry_date)}
                    </div>
                    {item.uploaded_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        Uploaded: {new Date(item.uploaded_at).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View →
                          </Button>
                        </a>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteEvidence(item.id)} 
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Evidence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Evidence Name *</Label>
              <Input 
                value={formData.evidence_name} 
                onChange={(e) => setFormData({...formData, evidence_name: e.target.value})} 
                placeholder="e.g., ISMS Policy Framework v2.0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Evidence Type</Label>
                <Select value={formData.evidence_type} onValueChange={(v) => setFormData({...formData, evidence_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="Report">Report</SelectItem>
                    <SelectItem value="Certificate">Certificate</SelectItem>
                    <SelectItem value="Screenshot">Screenshot</SelectItem>
                    <SelectItem value="Log">Log</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.evidence_status} onValueChange={(v) => setFormData({...formData, evidence_status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="valid">Valid</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="review_required">Review Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>File URL / Link</Label>
              <Input 
                value={formData.file_url} 
                onChange={(e) => setFormData({...formData, file_url: e.target.value})} 
                placeholder="https://sharepoint.com/document"
              />
            </div>
            <div>
              <Label>Expiry Date (Optional)</Label>
              <Input 
                type="date"
                value={formData.expiry_date} 
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveEvidence}>Add Evidence</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
