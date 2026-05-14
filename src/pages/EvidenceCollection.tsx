import { FolderSearch } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, Clock, AlertCircle, Calendar, 
  Users, ClipboardList, Award, TrendingUp, Upload,
  Plus, Edit2, Trash2, Eye, Download, Filter, Search,
  Mic, Camera, FileCheck, Stamp, Link, RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { generateEvidenceReport } from '../lib/evidenceReportGenerator';

export default function EvidenceCollectionPage() {
  const { organization, user, isAdmin , loading: authLoading} = useAuth();
  const [activeTab, setActiveTab] = useState('evidence');
  const [evidence, setEvidence] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    record_type: 'evidence',
    title: '',
    description: '',
    reference_number: '',
    created_date: new Date().toISOString().split('T')[0],
    created_by: user?.email || '',
    evidence_for: [],
    tags: []
  });

  useEffect(() => {
      if (authLoading) return;
    if (organization) {
      fetchAllData();
    }
  }, [organization, authLoading]);

  const fetchAllData = async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }
    
    
    try {
      // Fetch from evidence_records table
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence_records')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_date', { ascending: false });
      
      if (evidenceError) throw evidenceError;
      setEvidence(evidenceData || []);
      
      // Fetch from main audits table
      const { data: auditsData, error: auditsError } = await supabase
        .from('audits')
        .select('*')
        .eq('organization_id', organization.id)
        .order('date', { ascending: false });
      
      if (auditsError) throw auditsError;
      
      const transformedAudits = (auditsData || []).map(audit => ({
        id: audit.id,
        audit_number: `AUD-${audit.id.slice(0, 8)}`,
        audit_title: audit.name,
        audit_date: audit.date,
        auditor_name: audit.auditor,
        department_audited: audit.standard || 'N/A',
        status: audit.status,
        findings: audit.findings,
        score: audit.score
      }));
      
      setAudits(transformedAudits);
      
      // Fetch management reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('management_reviews')
        .select('*')
        .eq('organization_id', organization.id)
        .order('review_date', { ascending: false });
      
      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);
      
      // Fetch batch records
      const { data: batchesData, error: batchesError } = await supabase
        .from('batch_records')
        .select('*')
        .eq('organization_id', organization.id)
        .order('production_date', { ascending: false });
      
      if (batchesError) throw batchesError;
      setBatches(batchesData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // PDF Report Generation
  const handleGenerateReport = () => {
    const userEmail = user?.email || 'Unknown User';
    const orgName = organization?.name || 'Unknown Organization';
    generateEvidenceReport(evidence, audits, reviews, batches, orgName, userEmail);
  };

  const syncAuditsToEvidence = async () => {
    if (!organization?.id) {
      alert('No organization selected.');
      return;
    }
    
    setSyncing(true);
    let syncedCount = 0;
    let errorCount = 0;
    
    try {
      const { data: completedAudits, error: auditError } = await supabase
        .from('audits')
        .select('*')
        .eq('organization_id', organization.id);
      
      if (auditError) throw auditError;
      
      for (const audit of completedAudits || []) {
        const { data: existingEvidence, error: checkError } = await supabase
          .from('evidence_records')
          .select('id')
          .eq('reference_number', audit.name)
          .eq('organization_id', organization.id)
          .maybeSingle();
        
        if (!existingEvidence) {
          const { error: insertError } = await supabase
            .from('evidence_records')
            .insert({
              record_type: 'audit',
              title: audit.name,
              description: `Audit ${audit.status} for standard ${audit.standard || 'N/A'}. Auditor: ${audit.auditor || 'Unknown'}. Score: ${audit.score || 0}%.`,
              reference_number: audit.name,
              created_date: audit.date || new Date().toISOString().split('T')[0],
              created_by: audit.auditor || 'System',
              organization_id: organization.id,
              created_by_user: user?.id,
              status: 'completed',
              evidence_for: audit.status === 'passed' ? ['8.6 Release of products'] : ['8.7 Nonconforming outputs'],
              tags: ['audit', audit.status],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            errorCount++;
          } else {
            syncedCount++;
          }
        }
      }
      
      alert(`Sync complete!\n\n✓ Synced: ${syncedCount} audits\n✗ Errors: ${errorCount}`);
      await fetchAllData();
      
    } catch (error) {
      console.error('Sync error:', error);
      alert('Error syncing audits: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveEvidence = async () => {
    if (!organization?.id) return;
    
    const insertData = {
      record_type: formData.record_type,
      title: formData.title,
      description: formData.description,
      reference_number: formData.reference_number,
      created_date: formData.created_date,
      created_by: formData.created_by,
      evidence_for: formData.evidence_for,
      tags: formData.tags,
      organization_id: organization.id,
      created_by_user: user?.id,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('evidence_records').insert([insertData]);
    
    if (error) {
      console.error('Save error:', error);
      alert('Error saving: ' + error.message);
    } else {
      setIsModalOpen(false);
      fetchAllData();
      setFormData({ 
        record_type: 'evidence',
        title: '', 
        description: '', 
        reference_number: '', 
        created_date: new Date().toISOString().split('T')[0], 
        created_by: user?.email || '', 
        evidence_for: [], 
        tags: [] 
      });
      alert('Evidence record created successfully!');
    }
  };

  const handleAddSampleAudit = async () => {
    if (!organization?.id) return;
    
    const auditData = {
      name: `Sample Audit ${new Date().toLocaleDateString()}`,
      status: 'passed',
      standard: 'ISO 9001',
      auditor: user?.email?.split('@')[0] || 'Quality Team',
      date: new Date().toISOString().split('T')[0],
      findings: 0,
      score: 85,
      organization_id: organization.id,
      created_by: user?.id
    };
    
    const { error } = await supabase.from('audits').insert([auditData]);
    if (error) {
      alert('Error adding sample audit: ' + error.message);
    } else {
      alert('Sample audit added successfully! Click "Sync Audits" to add to evidence.');
      await fetchAllData();
    }
  };

  const getEvidenceSourceBadge = (item: any) => {
    if (item.record_type === 'audit') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">From Audit Master</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-50">Manual Entry</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!organization) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-yellow-800">No Organization Selected</h1>
          <p className="mt-2 text-gray-600">Please select an organization from the organization switcher to view evidence collection.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-6 flex justify-center">Loading evidence collection...</div>;

  const ISO_REQUIREMENTS = [
    '4.1 Context of organization', '4.2 Interested parties', '4.3 QMS Scope', '4.4 Processes',
    '5.1 Leadership commitment', '5.2 Quality policy', '5.3 Roles and responsibilities',
    '6.1 Risk and opportunities', '6.2 Quality objectives', '6.3 Change planning',
    '7.1 Resources', '7.2 Competence', '7.3 Awareness', '7.4 Communication',
    '7.5 Documented information', '8.1 Operational planning', '8.2 Customer requirements',
    '8.3 Design and development', '8.4 External providers', '8.5 Production and service',
    '8.6 Release of products', '8.7 Nonconforming outputs', '9.1 Monitoring and measurement',
    '9.2 Internal audit', '9.3 Management review', '10.1 Nonconformity and corrective action',
    '10.2 Continual improvement'
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <PageHeader title="Evidence Collection & Audit Trail" description="Collect and manage audit evidence" icon={<FolderSearch className="h-6 w-6" />} />
            <p className="text-sm text-muted-foreground">
              Complete documentation for ISO 9001 & FSSC 22000 certification
            </p>
            {organization && <p className="text-xs text-muted-foreground mt-1">Organization: {organization.name}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateReport} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Export PDF Report
          </Button>
          <Button onClick={handleAddSampleAudit} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add Sample Audit
          </Button>
          <Button onClick={syncAuditsToEvidence} variant="outline" className="gap-2" disabled={syncing}>
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Audits'}
          </Button>
          <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Evidence
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-[#0D2240]">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center"><p className="text-sm opacity-80">Evidence Records</p><p className="text-4xl font-bold">{evidence.length}</p></div>
            <div className="text-center"><p className="text-sm opacity-80">Audits</p><p className="text-4xl font-bold">{audits.length}</p></div>
            <div className="text-center"><p className="text-sm opacity-80">Reviews</p><p className="text-4xl font-bold">{reviews.length}</p></div>
            <div className="text-center"><p className="text-sm opacity-80">Batch Records</p><p className="text-4xl font-bold">{batches.length}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="evidence">📄 Evidence Records</TabsTrigger>
          <TabsTrigger value="audits">🔍 Audits</TabsTrigger>
          <TabsTrigger value="reviews">📋 Reviews</TabsTrigger>
          <TabsTrigger value="batches">🏭 Batch Records</TabsTrigger>
          <TabsTrigger value="iso-map">🗺️ ISO Clause Map</TabsTrigger>
        </TabsList>

        <TabsContent value="evidence" className="space-y-4">
          <div className="grid gap-4">
            {evidence.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-gray-500">No evidence records yet.</CardContent></Card>
            ) : (
              evidence.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {getStatusIcon(item.status)}
                          <span className="font-semibold">{item.title}</span>
                          <Badge variant="outline">{item.reference_number || 'N/A'}</Badge>
                          {getEvidenceSourceBadge(item)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>Created: {item.created_date}</span>
                          <span>By: {item.created_by}</span>
                          <span>Type: {item.record_type}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <div className="grid gap-4">
            {audits.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-gray-500">No audits found.</CardContent></Card>
            ) : (
              audits.map((audit) => (
                <Card key={audit.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <ClipboardList className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold">{audit.audit_title}</span>
                          <Badge>{audit.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Auditor: {audit.auditor_name} | Standard: {audit.department_audited}</p>
                        <p className="text-xs text-gray-500">Date: {audit.audit_date} | Score: {audit.score}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="grid gap-4">
            {reviews.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-gray-500">No management reviews yet.</CardContent></Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span className="font-semibold">Review {review.review_number}</span>
                      </div>
                      <p className="text-sm text-gray-600">Chair: {review.chairperson} | Date: {review.review_date}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <div className="grid gap-4">
            {batches.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-gray-500">No batch records yet.</CardContent></Card>
            ) : (
              batches.map((batch) => (
                <Card key={batch.id}>
                  <CardContent className="p-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-green-500" />
                        <span className="font-semibold">{batch.batch_number}</span>
                      </div>
                      <p className="text-sm text-gray-600">Product: {batch.product_name} | Quantity: {batch.quantity_produced}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="iso-map" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>ISO 9001:2015 Clause Requirements Map</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ISO_REQUIREMENTS.map((clause, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border-b">
                    <span className="text-sm">{clause}</span>
                    <Badge variant="outline" className="bg-green-50">Evidence Ready</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Evidence Record</DialogTitle>
            <DialogDescription>Create a new evidence record for ISO certification tracking</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Record Type *</Label>
              <Select value={formData.record_type} onValueChange={(v) => setFormData({ ...formData, record_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select record type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="evidence">Evidence Record</SelectItem>
                  <SelectItem value="calibration">Calibration Record</SelectItem>
                  <SelectItem value="training">Training Record</SelectItem>
                  <SelectItem value="audit">Audit Record</SelectItem>
                  <SelectItem value="ncr">Non-Conformance Report</SelectItem>
                  <SelectItem value="batch">Batch Record</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
            <div><Label>Reference Number</Label><Input value={formData.reference_number} onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} /></div>
            <div><Label>Created Date</Label><Input type="date" value={formData.created_date} onChange={(e) => setFormData({ ...formData, created_date: e.target.value })} /></div>
            <div><Label>Created By</Label><Input value={formData.created_by} onChange={(e) => setFormData({ ...formData, created_by: e.target.value })} /></div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveEvidence} className="flex-1">Create Record</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
