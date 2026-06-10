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
import { Loader2, ClipboardCheck, Plus, Trash2, Edit, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const EMPTY_FORM = {
  control_id: '',
  test_name: '',
  test_objective: '',
  tester: '',
  test_date: new Date().toISOString().split('T')[0],
  sample_size: '',
  result: 'not_tested',
  evidence: '',
  findings: '',
  next_test_date: '',
};

export default function ControlTesting() {
  const { organizationId, loading: authLoading } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [controls, setControls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) { fetchAll(); }
  }, [organizationId, authLoading]);

  const fetchAll = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const [testsRes, controlsRes] = await Promise.all([
        supabase
          .from('control_test_records')
          .select('*, framework_controls(control_id, control_title, framework)')
          .eq('organization_id', organizationId)
          .order('test_date', { ascending: false }),
        supabase
          .from('framework_controls')
          .select('id, control_id, control_title, framework')
          .eq('organization_id', organizationId)
          .order('control_id'),
      ]);
      if (testsRes.error) throw testsRes.error;
      if (controlsRes.error) throw controlsRes.error;
      setTests(testsRes.data || []);
      setControls(controlsRes.data || []);
    } catch (err) {
      console.error('Error fetching control tests:', err);
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
        sample_size: formData.sample_size ? parseInt(formData.sample_size as string) : null,
        next_test_date: formData.next_test_date || null,
        control_id: formData.control_id || null,
      };
      if (editing) {
        const { error } = await supabase.from('control_test_records').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('control_test_records').insert([payload]);
        if (error) throw error;
      }
      await fetchAll();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving test:', err);
    }
  };

  const deleteTest = async (id: string) => {
    if (!confirm('Delete this test?')) return;
    try {
      const { error } = await supabase.from('control_test_records').delete().eq('id', id);
      if (error) throw error;
      await fetchAll();
    } catch (err) {
      console.error('Error deleting test:', err);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setFormData({
      control_id: t.control_id || '',
      test_name: t.test_name || '',
      test_objective: t.test_objective || '',
      tester: t.tester || '',
      test_date: t.test_date || '',
      sample_size: t.sample_size ?? '',
      result: t.result || 'not_tested',
      evidence: t.evidence || '',
      findings: t.findings || '',
      next_test_date: t.next_test_date || '',
    });
    setModalOpen(true);
  };

  const resultConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    pass:       { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
    fail:       { color: 'bg-red-100 text-red-800',   icon: <XCircle className="h-3 w-3" /> },
    partial:    { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-3 w-3" /> },
    not_tested: { color: 'bg-gray-100 text-gray-600',  icon: null },
  };

  const passRate = tests.length
    ? Math.round((tests.filter(t => t.result === 'pass').length / tests.filter(t => t.result !== 'not_tested').length) * 100) || 0
    : 0;

  const filtered = tests.filter(t => {
    const matchSearch =
      t.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.framework_controls?.control_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchResult = filterResult === 'all' || t.result === filterResult;
    return matchSearch && matchResult;
  });

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
          <PageHeader title="Control Testing" description="Test and evidence control effectiveness" icon={<ClipboardCheck className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Sample-based testing to verify controls are operating as designed</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{tests.length} Tests Recorded</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Total Tests</p>
            <p className="text-xl font-bold text-[#0D2240]">{tests.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Pass Rate</p>
            <p className="text-xl font-bold text-green-600">{passRate}%</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Failed</p>
            <p className="text-xl font-bold text-red-600">{tests.filter(t => t.result === 'fail').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Partial / Not Tested</p>
            <p className="text-xl font-bold text-yellow-600">
              {tests.filter(t => t.result === 'partial' || t.result === 'not_tested').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Add */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search tests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white border-gray-300" />
          </div>
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-36 bg-white border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="pass">Pass</SelectItem>
              <SelectItem value="fail">Fail</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="not_tested">Not Tested</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-[#0057B8] hover:bg-[#003D82]">
          <Plus className="h-4 w-4 mr-2" />
          Add Test
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Test</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Control</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Tester</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Date</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Sample</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Result</th>
                <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Next Test</th>
                <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-gray-500">
                    No tests found. Click "Add Test" to record a control test.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const rc = resultConfig[t.result] || resultConfig.not_tested;
                  const isOverdue = t.next_test_date && new Date(t.next_test_date) < new Date();
                  return (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <p className="text-sm font-medium text-[#0D2240]">{t.test_name}</p>
                        {t.test_objective && <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{t.test_objective}</p>}
                      </td>
                      <td className="p-3">
                        {t.framework_controls ? (
                          <div>
                            <p className="text-xs font-medium text-[#0D2240]">{t.framework_controls.control_id}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">{t.framework_controls.control_title}</p>
                          </div>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="p-3 text-sm text-[#0D2240]">{t.tester || '—'}</td>
                      <td className="p-3 text-sm text-[#0D2240]">{t.test_date || '—'}</td>
                      <td className="p-3 text-center text-sm text-gray-600">{t.sample_size ?? '—'}</td>
                      <td className="p-3">
                        <Badge className={`${rc.color} flex items-center gap-1 w-fit`}>
                          {rc.icon}
                          {t.result?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">
                        {t.next_test_date ? (
                          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                            {isOverdue ? '⚠ ' : ''}{t.next_test_date}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(t)} className="text-[#0057B8] hover:text-[#003D82]">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteTest(t.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0D2240] text-lg font-semibold">
              {editing ? 'Edit Control Test' : 'Record Control Test'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#0D2240] font-medium">Test Name *</Label>
              <Input value={formData.test_name} onChange={(e) => setFormData({ ...formData, test_name: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" required placeholder="e.g., Access Review — Sample 25 Users" />
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Control Tested</Label>
              <Select value={formData.control_id} onValueChange={(v) => setFormData({ ...formData, control_id: v })}>
                <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Select a control (optional)" /></SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg max-h-60">
                  {controls.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      [{c.framework}] {c.control_id} — {c.control_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Test Objective</Label>
              <Textarea value={formData.test_objective} onChange={(e) => setFormData({ ...formData, test_objective: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="What was tested and how" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Tester</Label>
                <Input value={formData.tester} onChange={(e) => setFormData({ ...formData, tester: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="Name" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Test Date</Label>
                <Input type="date" value={formData.test_date} onChange={(e) => setFormData({ ...formData, test_date: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Sample Size</Label>
                <Input type="number" value={formData.sample_size} onChange={(e) => setFormData({ ...formData, sample_size: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" placeholder="e.g., 25" min={1} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#0D2240] font-medium">Result</Label>
                <Select value={formData.result} onValueChange={(v) => setFormData({ ...formData, result: v })}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="not_tested">Not Tested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#0D2240] font-medium">Next Test Date</Label>
                <Input type="date" value={formData.next_test_date} onChange={(e) => setFormData({ ...formData, next_test_date: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8]" />
              </div>
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Evidence</Label>
              <Textarea value={formData.evidence} onChange={(e) => setFormData({ ...formData, evidence: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="Evidence reference, document links, or description" />
            </div>

            <div>
              <Label className="text-[#0D2240] font-medium">Findings / Exceptions Noted</Label>
              <Textarea value={formData.findings} onChange={(e) => setFormData({ ...formData, findings: e.target.value })} className="bg-white border-gray-300 focus:border-[#0057B8] resize-none" rows={2} placeholder="Any issues, exceptions, or observations noted during testing" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-[#0057B8] hover:bg-[#003D82]">{editing ? 'Save Changes' : 'Record Test'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
