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
import { Loader2, Target, Plus, Trash2, Edit, Search } from 'lucide-react';

const EMPTY_FORM = {
  objective_title: '',
  description: '',
  kpi: '',
  owner: '',
  target_date: '',
  priority: 'high',
  status: 'not_started',
  progress_pct: '0',
  linked_framework: '',
};

const FRAMEWORKS = ['ISO27001','NIST CSF','PCI DSS','POPIA','SOC2','CIS Controls','Internal'];

export default function SecurityObjectives() {
  const { organizationId, loading: authLoading } = useAuth();
  const [objectives, setObjectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) fetchObjectives();
  }, [organizationId, authLoading]);

  const fetchObjectives = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_objectives')
        .select('*')
        .eq('organization_id', organizationId)
        .order('priority', { ascending: true });
      if (error) throw error;
      setObjectives(data || []);
    } catch (err) {
      console.error('Error fetching objectives:', err);
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
        progress_pct: parseInt(formData.progress_pct as string) || 0,
        target_date: formData.target_date || null,
        linked_framework: formData.linked_framework || null,
      };
      if (editing) {
        const { error } = await supabase.from('security_objectives').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('security_objectives').insert([payload]);
        if (error) throw error;
      }
      await fetchObjectives();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving objective:', err);
    }
  };

  const deleteObjective = async (id: string) => {
    if (!confirm('Delete this objective?')) return;
    try {
      const { error } = await supabase.from('security_objectives').delete().eq('id', id);
      if (error) throw error;
      await fetchObjectives();
    } catch (err) {
      console.error('Error deleting objective:', err);
    }
  };

  const resetForm = () => { setEditing(null); setFormData(EMPTY_FORM); };

  const openEdit = (o: any) => {
    setEditing(o);
    setFormData({
      objective_title:  o.objective_title || '',
      description:      o.description || '',
      kpi:              o.kpi || '',
      owner:            o.owner || '',
      target_date:      o.target_date || '',
      priority:         o.priority || 'high',
      status:           o.status || 'not_started',
      progress_pct:     String(o.progress_pct ?? 0),
      linked_framework: o.linked_framework || '',
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
    not_started: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-800',
    achieved:    'bg-green-100 text-green-800',
    deferred:    'bg-yellow-100 text-yellow-800',
    cancelled:   'bg-red-100 text-red-800',
  };

  const progressColor = (pct: number) =>
    pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : pct >= 25 ? 'bg-yellow-500' : 'bg-gray-300';

  const achieved   = objectives.filter(o => o.status === 'achieved').length;
  const inProgress = objectives.filter(o => o.status === 'in_progress').length;
  const overdue    = objectives.filter(o => o.target_date && new Date(o.target_date) < new Date() && o.status !== 'achieved').length;
  const avgProgress = objectives.length
    ? Math.round(objectives.reduce((sum, o) => sum + (o.progress_pct || 0), 0) / objectives.length)
    : 0;

  const filtered = objectives.filter(o => {
    const matchSearch =
      o.objective_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.kpi?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
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
          <PageHeader title="Security Objectives" description="Strategic security goals linked to frameworks and owners" icon={<Target className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Track progress against measurable security outcomes aligned to ISO 27001, NIST and POPIA</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{objectives.length} Objectives</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Avg Progress</p>
          <p className="text-xl font-bold text-[#0057B8]">{avgProgress}%</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">In Progress</p>
          <p className="text-xl font-bold text-blue-600">{inProgress}</p>
        </CardContent></Card>
        <Card className="bg-white border-gray-200 shadow-sm"><CardContent className="p-3">
          <p className="text-gray-500 text-xs">Achieved</p>
          <p className="text-xl font-bold text-green-600">{achieved}</p>
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
            <Input placeholder="Search objectives..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="achieved">Achieved</SelectItem>
              <SelectItem value="deferred">Deferred</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />Add Objective
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-8 text-center text-gray-500">No objectives found. Click "Add Objective" to get started.</CardContent>
          </Card>
        ) : filtered.map((o) => {
          const pct = o.progress_pct || 0;
          const isOverdue = o.target_date && new Date(o.target_date) < new Date() && o.status !== 'achieved';
          return (
            <Card key={o.id} className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-[#0D2240] text-sm">{o.objective_title}</h3>
                      <Badge className={priorityColor[o.priority] || 'bg-gray-500 text-white'}>{o.priority}</Badge>
                      <Badge className={statusColor[o.status] || 'bg-gray-100 text-gray-600'}>{o.status?.replace('_', ' ')}</Badge>
                      {o.linked_framework && <Badge variant="outline" className="text-xs">{o.linked_framework}</Badge>}
                    </div>
                    {o.description && <p className="text-xs text-gray-500 mb-2">{o.description}</p>}
                    {o.kpi && <p className="text-xs text-gray-600 mb-2"><span className="font-medium">KPI:</span> {o.kpi}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 max-w-xs">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span><span>{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        {o.owner && <span>Owner: <span className="text-[#0D2240] font-medium">{o.owner}</span></span>}
                        {o.target_date && (
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {isOverdue ? '⚠ Overdue: ' : 'Target: '}{o.target_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(o)} className="text-[#0057B8] hover:text-[#003D82]"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteObjective(o.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">{editing ? 'Edit Objective' : 'Add Security Objective'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Objective Title *</Label>
              <Input value={formData.objective_title} onChange={(e) => setFormData({ ...formData, objective_title: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., Reduce critical vulnerabilities by 50%" />
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="What does success look like?" />
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">KPI / Success Measure</Label>
              <Input value={formData.kpi} onChange={(e) => setFormData({ ...formData, kpi: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., Zero critical vulns open > 30 days" />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label className="text-[#0D2240] font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="achieved">Achieved</SelectItem>
                    <SelectItem value="deferred">Deferred</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Owner</Label>
                <Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Responsible person" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Target Date</Label>
                <Input type="date" value={formData.target_date} onChange={(e) => setFormData({ ...formData, target_date: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Progress ({formData.progress_pct}%)</Label>
                <input type="range" min={0} max={100} step={5} value={formData.progress_pct} onChange={(e) => setFormData({ ...formData, progress_pct: e.target.value })} className="w-full mt-2 accent-[#0057B8]" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Linked Framework</Label>
                <Select value={formData.linked_framework} onValueChange={(v) => setFormData({ ...formData, linked_framework: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {FRAMEWORKS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Add Objective'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
