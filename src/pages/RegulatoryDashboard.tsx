import PageHeader from '@/components/PageHeader';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, Scale, Plus, Trash2, Edit, Search } from 'lucide-react';

const EMPTY_FORM = {
  regulation_name: '',
  regulatory_body: '',
  jurisdiction: '',
  requirement_area: '',
  compliance_status: 'not_assessed',
  priority: 'high',
  owner: '',
  last_assessed: '',
  next_review: '',
  gap_description: '',
  notes: '',
};

const REGULATIONS = ['POPIA','PCI DSS','ISO 27001','ISO 27002','NIST CSF','NIST 800-53','CIS Controls','SOC 2','GDPR','HIPAA','King IV','JSE Listing Requirements','Other'];

const statusColor: Record<string, string> = {
  compliant:     'bg-green-100 text-green-800',
  partial:       'bg-yellow-100 text-yellow-800',
  non_compliant: 'bg-red-100 text-red-800',
  not_assessed:  'bg-gray-100 text-gray-600',
};

const statusScore: Record<string, number> = {
  compliant: 100, partial: 50, non_compliant: 0, not_assessed: 0,
};

// Normalise regulation names to match framework aliases used in control_framework_mappings
const FRAMEWORK_ALIASES: Record<string, string[]> = {
  'ISO 27001':    ['ISO27001','ISO 27001','ISO27001:2022'],
  'ISO 27002':    ['ISO27002','ISO 27002'],
  'NIST CSF':     ['NIST_CSF','NIST CSF','NIST-CSF'],
  'NIST 800-53':  ['NIST_800_53','NIST 800-53','NIST800-53'],
  'PCI DSS':      ['PCI_DSS','PCI DSS','PCI-DSS'],
  'CIS Controls': ['CIS_Controls','CIS Controls','CIS'],
  'SOC 2':        ['SOC2','SOC 2','SOC-2'],
  'POPIA':        ['POPIA'],
  'GDPR':         ['GDPR'],
  'HIPAA':        ['HIPAA'],
  'King IV':      ['King IV','KingIV'],
};
function normFramework(name: string): string[] {
  for (const [key, aliases] of Object.entries(FRAMEWORK_ALIASES)) {
    if (key === name || aliases.includes(name)) return aliases;
  }
  return [name];
}

export default function RegulatoryDashboard() {
  const { organizationId, loading: authLoading } = useAuth();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [autoScores, setAutoScores] = useState<Record<string, { score: number; implemented: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) fetchAll();
  }, [organizationId, authLoading]);

  const fetchAll = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const [{ data: reqData }, { data: ctrlData }, { data: mappingData }] = await Promise.all([
        supabase.from('regulatory_requirements').select('*').eq('organization_id', organizationId).order('regulation_name'),
        supabase.from('framework_controls').select('id, framework, status').eq('organization_id', organizationId),
        supabase.from('control_framework_mappings').select('source_control_id, target_framework').eq('organization_id', organizationId),
      ]);
      setRequirements(reqData || []);

      // Auto-score: for each unique regulation_name, find controls and their implementation status
      const scores: Record<string, { score: number; implemented: number; total: number }> = {};
      const regulations = [...new Set((reqData || []).map((r: any) => r.regulation_name))];

      for (const regName of regulations) {
        const aliases = normFramework(regName as string);
        // Controls native to this framework
        const nativeControls = (ctrlData || []).filter((c: any) => aliases.includes(c.framework));
        // Controls mapped TO this framework from another
        const mappedControlIds = new Set(
          (mappingData || [])
            .filter((m: any) => aliases.includes(m.target_framework))
            .map((m: any) => m.source_control_id)
        );
        const mappedControls = (ctrlData || []).filter((c: any) => mappedControlIds.has(c.id) && !aliases.includes(c.framework));
        const allControls = [...nativeControls, ...mappedControls];

        if (allControls.length > 0) {
          const implemented = allControls.filter((c: any) => c.status === 'implemented').length;
          scores[regName as string] = {
            score: Math.round((implemented / allControls.length) * 100),
            implemented,
            total: allControls.length,
          };
        }
      }
      setAutoScores(scores);
    } catch (err) {
      console.error('Error fetching regulatory requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        organization_id: organizationId,
        last_assessed: formData.last_assessed || null,
        next_review: formData.next_review || null,
        gap_description: formData.gap_description || null,
        notes: formData.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from('regulatory_requirements').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('regulatory_requirements').insert([payload]);
        if (error) throw error;
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving requirement:', err);
    }
  };

  const deleteReq = async (id: string) => {
    if (!confirm('Delete this regulatory requirement?')) return;
    await supabase.from('regulatory_requirements').delete().eq('id', id);
    await fetchAll();
  };

  const resetForm = () => { setEditing(null); setFormData(EMPTY_FORM); };

  const openEdit = (r: any) => {
    setEditing(r);
    setFormData({
      regulation_name:    r.regulation_name || '',
      regulatory_body:    r.regulatory_body || '',
      jurisdiction:       r.jurisdiction || '',
      requirement_area:   r.requirement_area || '',
      compliance_status:  r.compliance_status || 'not_assessed',
      priority:           r.priority || 'high',
      owner:              r.owner || '',
      last_assessed:      r.last_assessed || '',
      next_review:        r.next_review || '',
      gap_description:    r.gap_description || '',
      notes:              r.notes || '',
    });
    setModalOpen(true);
  };

  const assessed = requirements.filter(r => requirements.filter(r => r.compliance_status !== 'not_assessed'));
  const compliant    = requirements.filter(r => r.compliance_status === 'compliant').length;
  const nonCompliant = requirements.filter(r => r.compliance_status === 'non_compliant').length;
  const partial      = requirements.filter(r => r.compliance_status === 'partial').length;
  const overallScore = requirements.length
    ? Math.round(requirements.reduce((s, r) => s + (statusScore[r.compliance_status] || 0), 0) / requirements.length)
    : 0;

  // Group by regulation for the overview cards
  const byRegulation: Record<string, any[]> = {};
  requirements.forEach(r => {
    if (!byRegulation[r.regulation_name]) byRegulation[r.regulation_name] = [];
    byRegulation[r.regulation_name].push(r);
  });

  const filtered = requirements.filter(r => {
    const matchSearch =
      r.regulation_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requirement_area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.owner?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.compliance_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const priorityColor: Record<string, string> = {
    critical: 'bg-red-600 text-white',
    high:     'bg-orange-500 text-white',
    medium:   'bg-yellow-500 text-black',
    low:      'bg-green-500 text-white',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-[#0057B8]" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#0057B8] -mt-6 -mx-6 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader title="Regulatory Dashboard" description="Compliance status across regulations and frameworks" icon={<Scale className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Track POPIA, PCI DSS, ISO 27001 and other regulatory obligations with gap management</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{overallScore}% Overall Compliance</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Overall Score</p>
          <div className="flex items-end gap-2">
            <p className="text-xl font-bold text-[#0057B8]">{overallScore}%</p>
          </div>
          <Progress value={overallScore} className="h-1.5 mt-1" />
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Compliant</p>
          <p className="text-xl font-bold text-green-600">{compliant}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Partial</p>
          <p className="text-xl font-bold text-yellow-600">{partial}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Non-Compliant</p>
          <p className="text-xl font-bold text-red-600">{nonCompliant}</p>
        </CardContent></Card>
      </div>

      {/* Per-regulation breakdown */}
      {Object.keys(byRegulation).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(byRegulation).map(([reg, items]) => {
            const manualScore = Math.round(items.reduce((s, r) => s + (statusScore[r.compliance_status] || 0), 0) / items.length);
            const auto = autoScores[reg];
            return (
              <Card key={reg} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <p className="font-semibold text-[#0D2240] text-sm mb-1">{reg}</p>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{items.length} requirements</span>
                    <span>Manual: {manualScore}%</span>
                  </div>
                  <Progress value={manualScore} className="h-1.5 mb-2" />
                  {auto ? (
                    <>
                      <div className="flex justify-between text-xs text-purple-600 mb-1">
                        <span>Auto ({auto.implemented}/{auto.total} controls)</span>
                        <span>{auto.score}%</span>
                      </div>
                      <Progress value={auto.score} className="h-1.5 [&>div]:bg-purple-500" />
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">No control mappings yet</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search requirements..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="compliant">Compliant</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="non_compliant">Non-Compliant</SelectItem>
              <SelectItem value="not_assessed">Not Assessed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />Add Requirement
        </Button>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Regulation</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Requirement Area</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Jurisdiction</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Owner</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Priority</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Status</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Next Review</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-8 text-gray-500">No regulatory requirements found.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <p className="text-sm font-medium text-[#0D2240]">{r.regulation_name}</p>
                    {r.regulatory_body && <p className="text-xs text-gray-500">{r.regulatory_body}</p>}
                  </td>
                  <td className="p-3">
                    <p className="text-sm text-gray-700">{r.requirement_area || '—'}</p>
                    {r.gap_description && <p className="text-xs text-red-500 mt-0.5 max-w-xs truncate">{r.gap_description}</p>}
                  </td>
                  <td className="p-3 text-sm text-gray-600">{r.jurisdiction || '—'}</td>
                  <td className="p-3 text-sm text-[#0D2240]">{r.owner || '—'}</td>
                  <td className="p-3"><Badge className={priorityColor[r.priority] || 'bg-gray-500 text-white'}>{r.priority}</Badge></td>
                  <td className="p-3"><Badge className={statusColor[r.compliance_status] || 'bg-gray-100 text-gray-600'}>{r.compliance_status?.replace('_', ' ')}</Badge></td>
                  <td className="p-3 text-sm text-gray-600">{r.next_review || '—'}</td>
                  <td className="p-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)} className="text-[#0057B8] hover:text-[#003D82]"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteReq(r.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">{editing ? 'Edit Requirement' : 'Add Regulatory Requirement'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Regulation *</Label>
                <Select value={formData.regulation_name} onValueChange={(v) => setFormData({ ...formData, regulation_name: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {REGULATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Regulatory Body</Label>
                <Input value={formData.regulatory_body} onChange={(e) => setFormData({ ...formData, regulatory_body: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., SARB, Information Regulator" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Jurisdiction</Label>
                <Input value={formData.jurisdiction} onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., South Africa, Global" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Requirement Area *</Label>
              <Input value={formData.requirement_area} onChange={(e) => setFormData({ ...formData, requirement_area: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., Data Subject Rights, Access Control" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Compliance Status</Label>
                <Select value={formData.compliance_status} onValueChange={(v) => setFormData({ ...formData, compliance_status: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                    <SelectItem value="not_assessed">Not Assessed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Owner</Label>
                <Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Compliance owner" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Last Assessed</Label>
                <Input type="date" value={formData.last_assessed} onChange={(e) => setFormData({ ...formData, last_assessed: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Next Review</Label>
                <Input type="date" value={formData.next_review} onChange={(e) => setFormData({ ...formData, next_review: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
            </div>
            <div>
              <Label className="text-[#0D2240] font-medium">Gap Description</Label>
              <Textarea value={formData.gap_description} onChange={(e) => setFormData({ ...formData, gap_description: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="What is missing or not yet implemented?" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Add Requirement'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
