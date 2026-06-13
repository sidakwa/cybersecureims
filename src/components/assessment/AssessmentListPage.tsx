/**
 * Generic assessment list page — STRAT-PORTAL-005 §7.1
 *
 * Every assessment tab (Audit Portfolio, Pen Tests, Vuln Scans,
 * Risk Assessments, TPRM) renders through this component.
 * Each tab passes a `config` object; the component renders the
 * shared filter bar, summary tiles, grid, and create/edit modal.
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronRight, Loader2, AlertTriangle, Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/PageHeader';
import type { AssessmentRecord, AssessmentType } from '@/lib/cybersecure-types';
import type { LookupRow } from '@/lib/cybersecure-types';
import { useAssessmentList } from '@/hooks/useAssessmentData';

// ---------------------------------------------------------------
// Config shape (per §7.1 config-object pattern)
// ---------------------------------------------------------------

export interface AssessmentTileConfig {
  label: string;
  value: number;
  icon?: React.ReactNode;
  colorClass?: string;
}

export interface AssessmentColumnConfig {
  key: string;
  header: string;
  render?: (row: any) => React.ReactNode;
}

export interface AssessmentTypeFilterConfig {
  field: string;
  label: string;
  options: LookupRow[];
}

export interface AssessmentFormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface AssessmentListConfig {
  title: string;
  type: AssessmentType;
  detailRoute: string;                         // e.g. /assessment/audits/:id
  typeSpecificFilter?: AssessmentTypeFilterConfig;
  typeSpecificFields?: AssessmentFormField[];  // fields added after the common fields
}

// ---------------------------------------------------------------
// Status badge colours
// ---------------------------------------------------------------

const STATUS_COLOURS: Record<string, string> = {
  planned:     'bg-gray-100 text-gray-700',
  scheduled:   'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  reporting:   'bg-purple-100 text-purple-700',
  closed:      'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-700',
};

const TYPE_COLOURS: Record<string, string> = {
  audit:               'bg-blue-500',
  pen_test:            'bg-red-500',
  vuln_scan:           'bg-orange-500',
  risk_assessment:     'bg-purple-500',
  tprm_questionnaire:  'bg-teal-500',
};

// ---------------------------------------------------------------
// Common form fields (all assessment types share these)
// ---------------------------------------------------------------

const COMMON_FIELDS: AssessmentFormField[] = [
  { key: 'name',             label: 'Name',             type: 'text',     required: true,  placeholder: 'e.g. Q3 2026 Internal Audit' },
  { key: 'scope_description',label: 'Scope',            type: 'textarea', required: true,  placeholder: 'What is in scope' },
  { key: 'lead_assessor_role',label: 'Lead Assessor Role', type: 'select', options: [
      { value: 'admin',            label: 'Admin' },
      { value: 'security_manager', label: 'Security Manager' },
      { value: 'quality_manager',  label: 'Quality Manager' },
      { value: 'auditor',          label: 'Auditor' },
    ]},
  { key: 'lead_assessor_name', label: 'Lead Assessor Name (external)', type: 'text', placeholder: 'e.g. Mari Singh, Cybersplice' },
  { key: 'scheduled_start', label: 'Scheduled Start', type: 'date', required: true },
  { key: 'scheduled_end',   label: 'Scheduled End',   type: 'date', required: true },
  { key: 'actual_start',    label: 'Actual Start',    type: 'date' },
  { key: 'actual_end',      label: 'Actual End',      type: 'date' },
];

// ---------------------------------------------------------------
// Main component
// ---------------------------------------------------------------

interface Props {
  config: AssessmentListConfig;
}

export function AssessmentListPage({ config }: Props) {
  const navigate = useNavigate();
  const { items, loading, error, statuses, sources, create, update, remove } =
    useAssessmentList<AssessmentRecord>(config.type);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [typeSpecificFilter, setTypeSpecificFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AssessmentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // ---- filter + search ----
  const filtered = useMemo(() => {
    return items.filter(item => {
      const row = item as any;
      if (search && !row.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && row.status_id !== statusFilter) return false;
      if (sourceFilter !== 'all' && row.source_id !== sourceFilter) return false;
      if (yearFilter !== 'all') {
        const yr = row.scheduled_start?.slice(0, 4);
        if (yr !== yearFilter) return false;
      }
      if (typeSpecificFilter !== 'all' && config.typeSpecificFilter) {
        const val = row[config.typeSpecificFilter.field];
        if (val !== typeSpecificFilter) return false;
      }
      return true;
    });
  }, [items, search, statusFilter, sourceFilter, yearFilter, typeSpecificFilter, config.typeSpecificFilter]);

  // ---- summary tile counts ----
  const active     = items.filter(i => ['in_progress','scheduled'].includes((i as any).status_code || '')).length;
  const thisQtr    = useMemo(() => {
    const now = new Date();
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
    const qEnd   = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0).toISOString().split('T')[0];
    return items.filter(i => {
      const s = (i as any).scheduled_start || '';
      return s >= qStart && s <= qEnd;
    }).length;
  }, [items]);

  const years = [...new Set(items.map(i => (i as any).scheduled_start?.slice(0, 4)).filter(Boolean))].sort().reverse();

  // ---- modal helpers ----
  function openCreate() {
    setEditing(null);
    setFormData({});
    setModalOpen(true);
  }

  function openEdit(item: AssessmentRecord) {
    setEditing(item);
    setFormData({ ...item });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Resolve status_id from 'planned' default if not set
      if (!formData.status_id && statuses.length) {
        const planned = statuses.find(s => s.code === 'planned');
        if (planned) formData.status_id = planned.id;
      }
      if (editing) {
        await update(editing.id, formData as Partial<AssessmentRecord>);
      } else {
        await create(formData as Partial<AssessmentRecord>);
      }
      setModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this assessment? This cannot be undone.')) return;
    await remove(id);
  }

  // ---- field setter ----
  function setField(key: string, value: string) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  // ---- render field ----
  function renderField(field: AssessmentFormField) {
    const value = formData[field.key] ?? '';
    if (field.type === 'textarea') {
      return (
        <Textarea
          id={field.key}
          value={value}
          onChange={e => setField(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={3}
        />
      );
    }
    if (field.type === 'select' && field.options) {
      return (
        <Select value={value} onValueChange={v => setField(field.key, v)}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {field.options.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        id={field.key}
        type={field.type === 'date' ? 'date' : 'text'}
        value={value}
        onChange={e => setField(field.key, e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <span>Failed to load: {error}</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title={config.title} />
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: active, color: 'text-blue-600' },
          { label: 'This Quarter', value: thisQtr, color: 'text-purple-600' },
          { label: 'Total', value: items.length, color: 'text-gray-700' },
          { label: 'Closed', value: items.filter(i => (i as any).status_code === 'closed').length, color: 'text-green-600' },
        ].map(tile => (
          <Card key={tile.label}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">{tile.label}</p>
              <p className={`text-3xl font-bold ${tile.color}`}>{tile.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar — §5.6: status, source, year + type-specific */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status: All</SelectItem>
            {statuses.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Source: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Source: All</SelectItem>
            {sources.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {config.typeSpecificFilter && (
          <Select value={typeSpecificFilter} onValueChange={setTypeSpecificFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={`${config.typeSpecificFilter.label}: All`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{config.typeSpecificFilter.label}: All</SelectItem>
              {config.typeSpecificFilter.options.map(o => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            No assessments found. Click <strong>New</strong> to create one.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Lead</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Dates</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(item => {
                  const row = item as any;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(config.detailRoute.replace(':id', item.id))}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_COLOURS[config.type] || 'bg-gray-400'}`} />
                          <span className="font-medium text-gray-900 truncate max-w-[280px]">
                            {row.name || row.title || row.test_name || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {row.source_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{row.lead_assessor_role || row.assessor || row.assigned_to || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {row.scheduled_start?.slice(0, 7) || row.start_date?.slice(0, 7) || '—'}
                            {(row.scheduled_end || row.end_date) && ` → ${(row.scheduled_end || row.end_date).slice(0, 7)}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${STATUS_COLOURS[row.status_code || ''] || 'bg-gray-100 text-gray-600'}`}>
                          {row.status_name || row.status || '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-gray-300" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${config.title.replace(/s$/, '')}` : `New ${config.title.replace(/s$/, '')}`}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status selector */}
            <div>
              <Label htmlFor="status_id">Status</Label>
              <Select value={formData.status_id || ''} onValueChange={v => setField('status_id', v)}>
                <SelectTrigger><SelectValue placeholder="Planned" /></SelectTrigger>
                <SelectContent>
                  {statuses.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source selector */}
            <div>
              <Label htmlFor="source_id">Source</Label>
              <Select value={formData.source_id || ''} onValueChange={v => setField('source_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select source…" /></SelectTrigger>
                <SelectContent>
                  {sources.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Common fields */}
            {COMMON_FIELDS.map(field => (
              <div key={field.key}>
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}

            {/* Type-specific fields */}
            {config.typeSpecificFields?.map(field => (
              <div key={field.key}>
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AssessmentListPage;
