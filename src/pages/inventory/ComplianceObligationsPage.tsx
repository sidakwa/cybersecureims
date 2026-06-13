/**
 * Compliance Obligations — /inventory/obligations
 * STRAT-PORTAL-008 §4.9
 *
 * Per-clause catalogue of every external or internal requirement.
 * Source: compliance_obligations table joined with lkp_obligation_type
 * and lkp_obligation_source.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Pencil, Trash2, Loader2, AlertTriangle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ComplianceObligation, InventoryLookupRow } from '@/lib/cybersecure-types';

const SOURCE_COLOURS: Record<string, string> = {
  popia:       'bg-green-100 text-green-800',
  gdpr:        'bg-blue-100 text-blue-800',
  msa:         'bg-purple-100 text-purple-800',
  rfp:         'bg-indigo-100 text-indigo-800',
  iso_27001:   'bg-yellow-100 text-yellow-800',
  nist_csf:    'bg-orange-100 text-orange-800',
  cis_controls:'bg-red-100 text-red-800',
  itoo_cyber:  'bg-pink-100 text-pink-800',
};

const FREQUENCY_LABELS: Record<string, string> = {
  continuous: 'Continuous',
  annual:     'Annual',
  on_request: 'On Request',
};

const EMPTY: Partial<ComplianceObligation> = {
  obligation_code: '',
  name: '',
  obligation_text: '',
  evidence_required: '',
  source_reference: '',
  responsible_role: '',
  assurance_frequency: 'annual',
};

interface ExpandedRow {
  [id: string]: boolean;
}

export default function ComplianceObligationsPage() {
  const { organizationId } = useAuth();

  const [items, setItems]           = useState<ComplianceObligation[]>([]);
  const [types, setTypes]           = useState<InventoryLookupRow[]>([]);
  const [sources, setSources]       = useState<InventoryLookupRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expanded, setExpanded]     = useState<ExpandedRow>({});
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<ComplianceObligation | null>(null);
  const [form, setForm]             = useState<Partial<ComplianceObligation>>(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    const fetchAll = async () => {
      setLoading(true);
      const [oblg, typ, src] = await Promise.all([
        supabase
          .from('compliance_obligations')
          .select(`
            *,
            lkp_obligation_type ( id, code, name ),
            lkp_obligation_source ( id, code, name ),
            lkp_lifecycle_phase ( id, code, name )
          `)
          .eq('organization_id', organizationId)
          .order('obligation_code'),
        supabase.from('lkp_obligation_type').select('*').order('sort_order'),
        supabase.from('lkp_obligation_source').select('*').order('sort_order'),
      ]);
      if (oblg.error) { setError(oblg.error.message); }
      else {
        setItems((oblg.data || []).map((row: any) => ({
          ...row,
          type_name:   row.lkp_obligation_type?.name,
          type_code:   row.lkp_obligation_type?.code,
          source_name: row.lkp_obligation_source?.name,
          source_code: row.lkp_obligation_source?.code,
          lifecycle_phase_name: row.lkp_lifecycle_phase?.name,
          lifecycle_phase_code: row.lkp_lifecycle_phase?.code,
        })));
      }
      setTypes(typ.data || []);
      setSources(src.data || []);
      setLoading(false);
    };
    fetchAll();
  }, [organizationId]);

  const filtered = useMemo(() => items.filter(o => {
    const matchSearch = !search ||
      o.obligation_code.toLowerCase().includes(search.toLowerCase()) ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.obligation_text || '').toLowerCase().includes(search.toLowerCase());
    const matchSource = sourceFilter === 'all' || o.source_code === sourceFilter;
    const matchType   = typeFilter   === 'all' || o.type_code   === typeFilter;
    return matchSearch && matchSource && matchType;
  }), [items, search, sourceFilter, typeFilter]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }
  function openEdit(o: ComplianceObligation) {
    setEditing(o);
    setForm({
      obligation_code:    o.obligation_code,
      name:               o.name,
      type_id:            o.type_id,
      source_id:          o.source_id,
      source_reference:   o.source_reference,
      obligation_text:    o.obligation_text,
      evidence_required:  o.evidence_required,
      assurance_frequency: o.assurance_frequency,
      responsible_role:   o.responsible_role,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!organizationId) return;
    if (!form.obligation_code?.trim() || !form.name?.trim() || !form.type_id || !form.source_id || !form.source_reference?.trim() || !form.obligation_text?.trim()) {
      alert('Code, name, type, source, source reference, and obligation text are required.');
      return;
    }
    setSaving(true);
    const payload = {
      organization_id:    organizationId,
      obligation_code:    form.obligation_code!.trim(),
      name:               form.name!.trim(),
      type_id:            form.type_id!,
      source_id:          form.source_id!,
      source_reference:   form.source_reference!.trim(),
      obligation_text:    form.obligation_text!.trim(),
      evidence_required:  form.evidence_required?.trim() || '',
      assurance_frequency: form.assurance_frequency || null,
      responsible_role:   form.responsible_role?.trim() || null,
    };
    let err: any;
    if (editing) {
      ({ error: err } = await supabase.from('compliance_obligations').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('compliance_obligations').insert(payload));
    }
    setSaving(false);
    if (err) { alert(err.message); return; }
    setModalOpen(false);
    // Re-fetch
    const { data } = await supabase
      .from('compliance_obligations')
      .select('*, lkp_obligation_type(id,code,name), lkp_obligation_source(id,code,name), lkp_lifecycle_phase(id,code,name)')
      .eq('organization_id', organizationId)
      .order('obligation_code');
    setItems((data || []).map((row: any) => ({
      ...row,
      type_name: row.lkp_obligation_type?.name,
      type_code: row.lkp_obligation_type?.code,
      source_name: row.lkp_obligation_source?.name,
      source_code: row.lkp_obligation_source?.code,
      lifecycle_phase_name: row.lkp_lifecycle_phase?.name,
      lifecycle_phase_code: row.lkp_lifecycle_phase?.code,
    })));
  }

  async function handleDelete(id: string) {
    const { error: err } = await supabase.from('compliance_obligations').delete().eq('id', id);
    if (err) { alert(err.message); return; }
    setItems(prev => prev.filter(o => o.id !== id));
    setDeleteTarget(null);
  }

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-600 flex items-center gap-2">
      <AlertTriangle className="h-5 w-5" />
      <span>Failed to load obligations: {error}</span>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader title="Compliance Obligations" />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',       value: items.length },
          { label: 'Regulatory',  value: items.filter(o => o.type_code === 'regulatory').length },
          { label: 'Contractual', value: items.filter(o => o.type_code?.startsWith('contractual')).length },
          { label: 'Annual review', value: items.filter(o => o.assurance_frequency === 'annual').length },
        ].map(t => (
          <Card key={t.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{t.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search code, name, or obligation text…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px] text-sm">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px] text-sm">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map(t => <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="ml-auto">
          <Plus className="h-4 w-4 mr-1" /> Add Obligation
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No obligations found. Add one or adjust your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(o => {
            const srcColour = SOURCE_COLOURS[o.source_code || ''] || 'bg-gray-100 text-gray-700';
            const isOpen = expanded[o.id];
            return (
              <Card key={o.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Header row */}
                  <div
                    className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(o.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-gray-500">{o.obligation_code}</span>
                        <Badge className={`text-xs px-1.5 py-0 ${srcColour}`}>{o.source_name || o.source_code}</Badge>
                        {o.type_name && <Badge variant="outline" className="text-xs px-1.5 py-0">{o.type_name}</Badge>}
                        {o.assurance_frequency && (
                          <span className="text-xs text-gray-400">{FREQUENCY_LABELS[o.assurance_frequency] || o.assurance_frequency}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-900 truncate">{o.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{o.source_reference}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEdit(o); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setDeleteTarget(o.id); }}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="border-t bg-gray-50 px-4 py-3 space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Obligation</p>
                        <p className="text-gray-700 leading-relaxed">{o.obligation_text}</p>
                      </div>
                      {o.evidence_required && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Evidence Required</p>
                          <p className="text-gray-700">{o.evidence_required}</p>
                        </div>
                      )}
                      {o.responsible_role && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Responsible Role</p>
                          <p className="text-gray-700">{o.responsible_role}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Obligation' : 'Add Compliance Obligation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Obligation Code *</Label>
                <Input
                  placeholder="POPIA-S19"
                  value={form.obligation_code || ''}
                  onChange={e => setForm(f => ({ ...f, obligation_code: e.target.value }))}
                />
              </div>
              <div>
                <Label>Short Title *</Label>
                <Input
                  placeholder="Obligation name"
                  value={form.name || ''}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select value={form.type_id || ''} onValueChange={v => setForm(f => ({ ...f, type_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source *</Label>
                <Select value={form.source_id || ''} onValueChange={v => setForm(f => ({ ...f, source_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source Reference *</Label>
                <Input
                  placeholder="Section 19 / Annex A.5.1 / Clause 12"
                  value={form.source_reference || ''}
                  onChange={e => setForm(f => ({ ...f, source_reference: e.target.value }))}
                />
              </div>
              <div>
                <Label>Assurance Frequency</Label>
                <Select value={form.assurance_frequency || ''} onValueChange={v => setForm(f => ({ ...f, assurance_frequency: v as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="continuous">Continuous</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="on_request">On Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Obligation Text *</Label>
              <Textarea
                rows={4}
                placeholder="Full text of the obligation…"
                value={form.obligation_text || ''}
                onChange={e => setForm(f => ({ ...f, obligation_text: e.target.value }))}
              />
            </div>
            <div>
              <Label>Evidence Required *</Label>
              <Textarea
                rows={3}
                placeholder="What evidence demonstrates compliance…"
                value={form.evidence_required || ''}
                onChange={e => setForm(f => ({ ...f, evidence_required: e.target.value }))}
              />
            </div>
            <div>
              <Label>Responsible Role</Label>
              <Input
                placeholder="CISO / Security Manager / Legal Counsel"
                value={form.responsible_role || ''}
                onChange={e => setForm(f => ({ ...f, responsible_role: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editing ? 'Save Changes' : 'Add Obligation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Obligation</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">This will permanently remove the obligation and all its inventory links. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
