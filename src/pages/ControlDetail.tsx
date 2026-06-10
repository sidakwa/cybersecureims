import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Loader2, ArrowLeft, Shield, ClipboardCheck, FolderOpen,
  AlertTriangle, TrendingUp, ArrowRight, Plus, Trash2, CheckCircle2,
  XCircle, MinusCircle, GitBranch,
} from 'lucide-react';

const FRAMEWORKS = ['ISO27001','NIST CSF','NIST 800-53','PCI DSS','POPIA','SOC 2','CIS Controls','King IV','HIPAA'];

const testResultColor: Record<string, string> = {
  pass:       'bg-green-100 text-green-800',
  fail:       'bg-red-100 text-red-800',
  partial:    'bg-yellow-100 text-yellow-800',
  not_tested: 'bg-gray-100 text-gray-600',
};

const statusColor: Record<string, string> = {
  implemented:     'bg-green-100 text-green-800',
  in_progress:     'bg-yellow-100 text-yellow-800',
  not_started:     'bg-gray-100 text-gray-600',
  not_applicable:  'bg-blue-100 text-blue-700',
  deferred:        'bg-orange-100 text-orange-700',
};

const severityColor: Record<string, string> = {
  Critical: 'bg-red-600 text-white',
  Major:    'bg-orange-500 text-white',
  High:     'bg-orange-500 text-white',
  Medium:   'bg-yellow-500 text-black',
  Low:      'bg-blue-100 text-blue-800',
};

const mappingTypeColor: Record<string, string> = {
  direct:        'bg-green-100 text-green-800',
  partial:       'bg-yellow-100 text-yellow-800',
  compensating:  'bg-purple-100 text-purple-800',
};

export default function ControlDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organizationId, loading: authLoading } = useAuth();

  const [control, setControl] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMappingOpen, setAddMappingOpen] = useState(false);
  const [mappingForm, setMappingForm] = useState({
    target_framework: '',
    target_control_ref: '',
    mapping_type: 'direct',
    notes: '',
  });

  useEffect(() => {
    if (authLoading || !organizationId || !id) return;
    loadAll();
  }, [organizationId, authLoading, id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        { data: ctrl },
        { data: testData },
        { data: evidenceData },
        { data: findingData },
        { data: mappingData },
      ] = await Promise.all([
        supabase.from('framework_controls').select('*').eq('id', id).single(),
        supabase.from('control_test_records').select('*').eq('control_id', id).order('test_date', { ascending: false }),
        supabase.from('audit_evidence').select('*').eq('linked_control_id', id).order('uploaded_at', { ascending: false }),
        supabase.from('audit_findings').select('*').eq('linked_control_id', id).order('created_at', { ascending: false }),
        supabase.from('control_framework_mappings').select('*').eq('source_control_id', id).order('target_framework'),
      ]);

      setControl(ctrl);
      setTests(testData || []);
      setEvidence(evidenceData || []);
      setFindings(findingData || []);
      setMappings(mappingData || []);

      // Load risks linked via findings
      const riskIds = (findingData || []).map((f: any) => f.linked_risk_id).filter(Boolean);
      if (riskIds.length > 0) {
        const { data: riskData } = await supabase.from('cyber_risks').select('*').in('id', riskIds);
        setRisks(riskData || []);
      } else {
        setRisks([]);
      }
    } catch (err) {
      console.error('Error loading control detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mappingForm.target_framework || !mappingForm.target_control_ref) return;
    try {
      const { error } = await supabase.from('control_framework_mappings').insert([{
        organization_id: organizationId,
        source_control_id: id,
        ...mappingForm,
        notes: mappingForm.notes || null,
      }]);
      if (error) throw error;
      setAddMappingOpen(false);
      setMappingForm({ target_framework: '', target_control_ref: '', mapping_type: 'direct', notes: '' });
      await loadAll();
    } catch (err) {
      console.error('Error adding mapping:', err);
    }
  };

  const deleteMapping = async (mid: string) => {
    await supabase.from('control_framework_mappings').delete().eq('id', mid);
    await loadAll();
  };

  // Derive overall control health
  const latestTest = tests[0];
  const passCount = tests.filter(t => t.result === 'pass').length;
  const openFindings = findings.filter(f => !['Closed','Resolved'].includes(f.finding_status)).length;
  const criticalFindings = findings.filter(f => f.severity === 'Critical' && !['Closed','Resolved'].includes(f.finding_status)).length;

  const ChainNode = ({ icon, label, count, color }: any) => (
    <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${color}`}>
      <div className="mb-1">{icon}</div>
      <p className="text-xs font-semibold">{label}</p>
      <p className="text-lg font-bold">{count}</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-[#0057B8]" />
    </div>
  );

  if (!control) return (
    <div className="p-6 text-center text-gray-500">Control not found.</div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0057B8] -mt-6 -mx-6 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" className="text-white/70 hover:text-white mb-3 -ml-2 h-8" onClick={() => navigate('/controls')}>
            <ArrowLeft className="h-4 w-4 mr-1" />Back to Control Library
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Shield className="h-6 w-6 text-white" />
                <h1 className="text-xl font-bold text-white">{control.control_id} — {control.control_title}</h1>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="bg-white/20 text-white">{control.framework}</Badge>
                <Badge className="bg-white/20 text-white">{control.control_domain}</Badge>
                {control.control_type && <Badge className="bg-white/20 text-white">{control.control_type}</Badge>}
              </div>
              {control.control_description && (
                <p className="text-white/70 text-sm mt-2 max-w-2xl">{control.control_description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <Badge className={`${statusColor[control.status] || 'bg-gray-100 text-gray-600'} text-sm px-3 py-1`}>
                {control.status?.replace('_', ' ')}
              </Badge>
              {control.maturity_level != null && (
                <p className="text-white/70 text-xs mt-1">Maturity: {control.maturity_level}/5</p>
              )}
              {control.owner && <p className="text-white/70 text-xs mt-0.5">Owner: {control.owner}</p>}
            </div>
          </div>
          <div className="w-32 h-1 bg-[#00D9FF] rounded-full mt-3"></div>
        </div>
      </div>

      {/* Chain Visual */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Audit Trail Chain</p>
          <div className="flex items-center gap-2 flex-wrap">
            <ChainNode icon={<Shield className="h-5 w-5" />} label="Control" count={1}
              color={control.status === 'implemented' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'} />
            <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
            <ChainNode icon={<ClipboardCheck className="h-5 w-5" />} label="Tests"
              count={tests.length} color={tests.length > 0 && passCount === tests.length ? 'bg-green-50 border-green-200 text-green-800' : tests.length > 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-gray-50 border-gray-200 text-gray-700'} />
            <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
            <ChainNode icon={<FolderOpen className="h-5 w-5" />} label="Evidence"
              count={evidence.length} color={evidence.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-700'} />
            <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
            <ChainNode icon={<AlertTriangle className="h-5 w-5" />} label="Findings"
              count={findings.length} color={criticalFindings > 0 ? 'bg-red-50 border-red-200 text-red-800' : openFindings > 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : findings.length > 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'} />
            <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
            <ChainNode icon={<TrendingUp className="h-5 w-5" />} label="Risks"
              count={risks.length} color={risks.length > 0 ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-gray-50 border-gray-200 text-gray-700'} />
            <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
            <ChainNode icon={<GitBranch className="h-5 w-5" />} label="Mappings"
              count={mappings.length} color={mappings.length > 0 ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-gray-50 border-gray-200 text-gray-700'} />
          </div>
          {/* Health summary */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            {latestTest && <span>Latest test: <Badge className={testResultColor[latestTest.result]}>{latestTest.result}</Badge> on {latestTest.test_date}</span>}
            {openFindings > 0 && <span className="text-red-600 font-medium">{openFindings} open finding{openFindings > 1 ? 's' : ''}</span>}
            {openFindings === 0 && findings.length > 0 && <span className="text-green-600">All findings resolved</span>}
            {mappings.length > 0 && <span className="text-purple-600">{mappings.length} cross-framework mapping{mappings.length > 1 ? 's' : ''}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="tests">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="tests">Test Records ({tests.length})</TabsTrigger>
          <TabsTrigger value="evidence">Evidence ({evidence.length})</TabsTrigger>
          <TabsTrigger value="findings">Findings ({findings.length})</TabsTrigger>
          <TabsTrigger value="risks">Risks ({risks.length})</TabsTrigger>
          <TabsTrigger value="mappings">Framework Mappings ({mappings.length})</TabsTrigger>
        </TabsList>

        {/* Test Records */}
        <TabsContent value="tests">
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Test Name</th>
                    <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Tester</th>
                    <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Date</th>
                    <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Result</th>
                    <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Finding Raised</th>
                    <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-8 text-gray-500">No test records linked to this control.</td></tr>
                  ) : tests.map(t => (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-[#0D2240]">{t.test_name}</td>
                      <td className="p-3 text-sm text-gray-600">{t.tester || '—'}</td>
                      <td className="p-3 text-sm text-gray-600">{t.test_date || '—'}</td>
                      <td className="p-3"><Badge className={testResultColor[t.result] || 'bg-gray-100 text-gray-600'}>{t.result}</Badge></td>
                      <td className="p-3 text-sm text-gray-500">{t.findings || '—'}</td>
                      <td className="p-3 text-sm text-gray-500 max-w-xs truncate">{t.evidence || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Evidence */}
        <TabsContent value="evidence">
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Evidence Name</th>
                    <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Type</th>
                    <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Expiry</th>
                    <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-8 text-gray-500">No evidence linked to this control. Link evidence from the Evidence Repository.</td></tr>
                  ) : evidence.map(e => (
                    <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-[#0D2240]">{e.evidence_name}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{e.evidence_type}</Badge></td>
                      <td className="p-3"><Badge className={e.evidence_status === 'valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{e.evidence_status}</Badge></td>
                      <td className="p-3 text-sm text-gray-600">{e.expiry_date || '—'}</td>
                      <td className="p-3">{e.file_url ? <a href={e.file_url} target="_blank" rel="noreferrer" className="text-[#0057B8] text-sm underline">Open</a> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Findings */}
        <TabsContent value="findings">
          <div className="space-y-3">
            {findings.length === 0 ? (
              <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-8 text-center text-gray-500">No findings linked to this control. Link findings from the Findings Register.</CardContent></Card>
            ) : findings.map(f => (
              <Card key={f.id} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {f.finding_ref && <span className="font-mono text-xs text-gray-400">{f.finding_ref}</span>}
                        <p className="font-semibold text-[#0D2240] text-sm">{f.finding_title}</p>
                        <Badge className={severityColor[f.severity] || 'bg-gray-100 text-gray-600'}>{f.severity}</Badge>
                        <Badge className={f.finding_status === 'Closed' || f.finding_status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{f.finding_status}</Badge>
                      </div>
                      {f.observation && <p className="text-xs text-gray-500 mt-1">{f.observation}</p>}
                      <div className="flex gap-3 text-xs text-gray-400 mt-1">
                        {f.owner && <span>Owner: {f.owner}</span>}
                        {f.due_date && <span>Due: {f.due_date}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Risks */}
        <TabsContent value="risks">
          <div className="space-y-3">
            {risks.length === 0 ? (
              <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-8 text-center text-gray-500">No risks derived from findings linked to this control.</CardContent></Card>
            ) : risks.map(r => (
              <Card key={r.id} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-[#0D2240] text-sm">{r.risk_title}</p>
                        <Badge className={r.risk_level === 'Critical' ? 'bg-red-600 text-white' : r.risk_level === 'High' ? 'bg-orange-500 text-white' : r.risk_level === 'Medium' ? 'bg-yellow-500 text-black' : 'bg-green-100 text-green-800'}>
                          {r.risk_level}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{r.status}</Badge>
                      </div>
                      {r.risk_description && <p className="text-xs text-gray-500">{r.risk_description}</p>}
                      <div className="flex gap-3 text-xs text-gray-400 mt-1">
                        {r.owner && <span>Owner: {r.owner}</span>}
                        <span>Score: {r.risk_score}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Framework Mappings */}
        <TabsContent value="mappings">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Map this control to equivalent controls in other frameworks so the Regulatory Dashboard can auto-calculate compliance.</p>
              <Button onClick={() => setAddMappingOpen(true)} className="bg-[#0057B8] hover:bg-[#003D82]">
                <Plus className="h-4 w-4 mr-2" />Add Mapping
              </Button>
            </div>
            <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Target Framework</th>
                      <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Control Reference</th>
                      <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Mapping Type</th>
                      <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Notes</th>
                      <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.length === 0 ? (
                      <tr><td colSpan={5} className="text-center p-8 text-gray-500">No mappings yet. Add one to link this control to other frameworks.</td></tr>
                    ) : mappings.map(m => (
                      <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3"><Badge variant="outline" className="text-xs">{m.target_framework}</Badge></td>
                        <td className="p-3 font-mono text-sm text-[#0D2240]">{m.target_control_ref}</td>
                        <td className="p-3"><Badge className={mappingTypeColor[m.mapping_type]}>{m.mapping_type}</Badge></td>
                        <td className="p-3 text-sm text-gray-500">{m.notes || '—'}</td>
                        <td className="p-3 text-center">
                          <Button variant="ghost" size="sm" onClick={() => deleteMapping(m.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Mapping Dialog */}
      <Dialog open={addMappingOpen} onOpenChange={setAddMappingOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0D2240]">Add Framework Mapping</DialogTitle>
          </DialogHeader>
          <form onSubmit={addMapping} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Target Framework *</Label>
              <Select value={mappingForm.target_framework} onValueChange={(v) => setMappingForm({ ...mappingForm, target_framework: v })}>
                <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Select framework..." /></SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  {FRAMEWORKS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Target Control Reference *</Label>
              <Input value={mappingForm.target_control_ref} onChange={(e) => setMappingForm({ ...mappingForm, target_control_ref: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., PR.AA-01, 8.4.2, Security Safeguards" />
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Mapping Type</Label>
              <Select value={mappingForm.mapping_type} onValueChange={(v) => setMappingForm({ ...mappingForm, mapping_type: v })}>
                <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  <SelectItem value="direct">Direct — fully satisfies</SelectItem>
                  <SelectItem value="partial">Partial — partially satisfies</SelectItem>
                  <SelectItem value="compensating">Compensating — mitigates but does not satisfy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Notes</Label>
              <Input value={mappingForm.notes} onChange={(e) => setMappingForm({ ...mappingForm, notes: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Optional mapping rationale" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddMappingOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">Add Mapping</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
