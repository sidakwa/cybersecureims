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
import { Loader2, Wrench, Plus, Trash2, Edit, Search, AlertTriangle } from 'lucide-react';

const EMPTY_FORM = {
  programme_name: '',
  description: '',
  programme_type: 'security_improvement',
  owner: '',
  start_date: '',
  target_completion: '',
  priority: 'high',
  status: 'planning',
  progress_pct: '0',
  linked_findings: '',
  linked_risks: '',
  budget_allocated: '',
  budget_spent: '',
};

const TYPES: Record<string, string> = {
  security_improvement: 'Security Improvement',
  compliance:           'Compliance',
  vulnerability_fix:    'Vulnerability Fix',
  architecture:         'Architecture',
  process_improvement:  'Process Improvement',
  other:                'Other',
};

export default function RemediationProgrammes() {
  const { organizationId, loading: authLoading } = useAuth();
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) fetchProgrammes();
  }, [organizationId, authLoading]);

  const fetchProgrammes = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('remediation_programmes')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProgrammes(data || []);
    } catch (err) {
      console.error('Error fetching programmes:', err);
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
        progress_pct: parseInt(formData.progress_pct) || 0,
        start_date: formData.start_date || null,
        target_completion: formData.target_completion || null,
        budget_allocated: formData.budget_allocated ? parseFloat(formData.budget_allocated) : null,
        budget_spent: formData.budget_spent ? parseFloat(formData.budget_spent) : null,
        linked_findings: formData.linked_findings || null,
        linked_risks: formData.linked_risks || null,
      };
      if (editing) {
        const { error } = await supabase.from('remediation_programmes').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('remediation_programmes').insert([payload]);
        if (error) throw error;
      }
      await fetchProgrammes();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving programme:', err);
    }
  };

  const deleteProgramme = async (id: string) => {
    if (!confirm('Delete this remediation programme?')) return;
    try {
      const { error } = await supabase.from('remediation_programmes').delete().eq('id', id);
      if (error) throw error;
      await fetchProgrammes();
    } catch (err) {
      console.error('Error deleting programme:', err);
    }
  };

  const resetForm = () => { setEditing(null); setFormData(EMPTY_FORM); };

  const openEdit = (p: any) => {
    setEditing(p);
    setFormData({
      programme_name:   p.programme_name || '',
      description:      p.description || '',
      programme_type:   p.programme_type || 'security_improvement',
      owner:            p.owner || '',
      start_date:       p.start_date || '',
      target_completion: p.target_completion || '',
      priority:         p.priority || 'high',
      status:           p.status || 'planning',
      progress_pct:     String(p.progress_pct ?? 0),
      linked_findings:  p.linked_findings || '',
      linked_risks:     p.linked_risks || '',
      budget_allocated: p.budget_allocated != null ? String(p.budget_allocated) : '',
      budget_spent:     p.budget_spent != null ? String(p.budget_spent) : '',
    });
    setModalOpen(true);
  };

  const priorityColor: Record<string, string> = {
    critical: 'bg-red-600 text-white',
    high:     'bg-orange-500 text-white',
    medium:   'bg-yellow-500 text-black',
    low:      'bg-green-500 text-white',
  };

  const statusColor: Record<string, string> = {
    planning:    'bg-gray-100 text-gray-600',
    active:      'bg-blue-100 text-blue-800',
    on_hold:     'bg-yellow-100 text-yellow-800',
    completed:   'bg-green-100 text-green-800',
    cancelled:   'bg-red-100 text-red-800',
  };

  const active    = programmes.filter(p => p.status === 'active').length;
  const completed = programmes.filter(p => p.status === 'completed').length;
  const overdue   = programmes.filter(p => p.target_completion && new Date(p.target_completion) < new Date() && p.status !== 'completed').length;
  const avgPct    = programmes.length
    ? Math.round(programmes.reduce((s, p) => s + (p.progress_pct || 0), 0) / programmes.length)
    : 0;

  const filtered = programmes.filter(p => {
    const matchSearch =
      p.programme_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-[#0057B8]" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#0057B8] -mt-6 -mx-6 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader title="Remediation Programmes" description="Structured programmes to address findings, risks and vulnerabilities" icon={<Wrench className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Track workstreams from identification through to closure with milestones and owners</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{programmes.length} Programmes</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Avg Progress</p>
          <p className="text-xl font-bold text-[#0057B8]">{avgPct}%</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Active</p>
          <p className="text-xl font-bold text-blue-600">{active}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Completed</p>
          <p className="text-xl font-bold text-green-600">{completed}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Overdue</p>
          <p className="text-xl font-bold text-red-600">{overdue}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search programmes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />New Programme
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-8 text-center text-gray-500">No programmes found. Click "New Programme" to get started.</CardContent>
          </Card>
        ) : filtered.map((p) => {
          const pct = p.progress_pct || 0;
          const isOverdue = p.target_completion && new Date(p.target_completion) < new Date() && p.status !== 'completed';
          return (
            <Card key={p.id} className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-[#0D2240] text-sm">{p.programme_name}</h3>
                      <Badge className={priorityColor[p.priority] || 'bg-gray-500 text-white'}>{p.priority}</Badge>
                      <Badge className={statusColor[p.status] || 'bg-gray-100 text-gray-600'}>{p.status?.replace('_', ' ')}</Badge>
                      <Badge variant="outline" className="text-xs">{TYPES[p.programme_type] || p.programme_type}</Badge>
                    </div>
                    {p.description && <p className="text-xs text-gray-500 mb-2">{p.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 max-w-xs">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span><span>{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                        {p.owner && <span>Owner: <span className="text-[#0D2240] font-medium">{p.owner}</span></span>}
                        {p.start_date && <span>Start: {p.start_date}</span>}
                        {p.target_completion && (
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {isOverdue ? <><AlertTriangle className="inline h-3 w-3 mr-0.5" />Overdue: </> : 'Target: '}{p.target_completion}
                          </span>
                        )}
                        {p.budget_allocated != null && (
                          <span>Budget: <span className="text-[#0D2240] font-medium">
                            {p.budget_spent != null ? `${p.budget_spent?.toLocaleString()} / ` : ''}{p.budget_allocated?.toLocaleString()}
                          </span></span>
                        )}
                      </div>
                    </div>
                    {(p.linked_findings || p.linked_risks) && (
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        {p.linked_findings && <span>Findings: {p.linked_findings}</span>}
                        {p.linked_risks && <span>Risks: {p.linked_risks}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="text-[#0057B8] hover:text-[#003D82]"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteProgramme(p.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">{editing ? 'Edit Programme' : 'New Remediation Programme'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Programme Name *</Label>
              <Input value={formData.programme_name} onChange={(e) => setFormData({ ...formData, programme_name: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., Critical Vulnerability Remediation Q3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Type</Label>
                <Select value={formData.programme_type} onValueChange={(v) => setFormData({ ...formData, programme_type: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {Object.entries(TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
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
              <Label className="text-[#0D2240] font-medium">Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="Scope and objectives of this programme" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Owner</Label>
                <Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Programme owner" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Target Completion</Label>
                <Input type="date" value={formData.target_completion} onChange={(e) => setFormData({ ...formData, target_completion: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Progress ({formData.progress_pct}%)</Label>
              <input type="range" min={0} max={100} step={5} value={formData.progress_pct} onChange={(e) => setFormData({ ...formData, progress_pct: e.target.value })} className="w-full mt-2 accent-[#0057B8]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Budget Allocated</Label>
                <Input type="number" value={formData.budget_allocated} onChange={(e) => setFormData({ ...formData, budget_allocated: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="0.00" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Budget Spent</Label>
                <Input type="number" value={formData.budget_spent} onChange={(e) => setFormData({ ...formData, budget_spent: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Linked Findings</Label>
                <Input value={formData.linked_findings} onChange={(e) => setFormData({ ...formData, linked_findings: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., FIND-001, FIND-002" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Linked Risks</Label>
                <Input value={formData.linked_risks} onChange={(e) => setFormData({ ...formData, linked_risks: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., RISK-004" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Create Programme'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
