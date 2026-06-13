/**
 * Assessment Calendar — /assessment/calendar
 * STRAT-PORTAL-005 §4.2
 *
 * Cross-type calendar view reading v_assessment_calendar.
 * Forward-looking by default (Q1); "Show closed" toggle exposes past.
 * Entries colour-coded by assessment_type.
 * Month / Quarter / Year view selector.
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/PageHeader';
import { useAssessmentCalendar } from '@/hooks/useAssessmentData';
import type { AssessmentCalendarEntry, AssessmentType } from '@/lib/cybersecure-types';

type ViewMode = 'month' | 'quarter' | 'year';

const TYPE_COLOURS: Record<AssessmentType, { bg: string; text: string; label: string }> = {
  audit:               { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Audit' },
  pen_test:            { bg: 'bg-red-100',     text: 'text-red-800',    label: 'Pen Test' },
  vuln_scan:           { bg: 'bg-orange-100',  text: 'text-orange-800', label: 'Vuln Scan' },
  risk_assessment:     { bg: 'bg-purple-100',  text: 'text-purple-800', label: 'Risk Assessment' },
  tprm_questionnaire:  { bg: 'bg-teal-100',    text: 'text-teal-800',   label: 'TPRM' },
};

const DETAIL_ROUTES: Record<AssessmentType, string> = {
  audit:               '/assessment/audits',
  pen_test:            '/assessment/pen-tests',
  vuln_scan:           '/assessment/vuln-scans',
  risk_assessment:     '/assessment/risk-assessments',
  tprm_questionnaire:  '/assessment/tprm',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const QUARTER_NAMES = ['Q1 (Jan–Mar)','Q2 (Apr–Jun)','Q3 (Jul–Sep)','Q4 (Oct–Dec)'];

function entryOverlaps(entry: AssessmentCalendarEntry, start: Date, end: Date): boolean {
  const s = new Date(entry.start_date);
  const e = new Date(entry.end_date);
  return s <= end && e >= start;
}

interface EntryCardProps {
  entry: AssessmentCalendarEntry;
  onNavigate: (entry: AssessmentCalendarEntry) => void;
}

function EntryCard({ entry, onNavigate }: EntryCardProps) {
  const colours = TYPE_COLOURS[entry.assessment_type as AssessmentType] || { bg: 'bg-gray-100', text: 'text-gray-700', label: entry.assessment_type };
  return (
    <button
      onClick={() => onNavigate(entry)}
      className={`w-full text-left rounded px-2 py-1 mb-1 text-xs font-medium truncate ${colours.bg} ${colours.text} hover:opacity-80 transition-opacity`}
      title={entry.name}
    >
      {entry.name}
    </button>
  );
}

export default function AssessmentCalendarPage() {
  const navigate = useNavigate();
  const [showClosed, setShowClosed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('quarter');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3)); // 0-based

  const { entries, loading, error } = useAssessmentCalendar(showClosed);

  function handleNavigate(entry: AssessmentCalendarEntry) {
    const base = DETAIL_ROUTES[entry.assessment_type as AssessmentType] || '/assessment/audits';
    navigate(`${base}/${entry.id}`);
  }

  function prevPeriod() {
    if (viewMode === 'month')   { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
    if (viewMode === 'quarter') { if (quarter === 0) { setQuarter(3); setYear(y => y - 1); } else setQuarter(q => q - 1); }
    if (viewMode === 'year')    setYear(y => y - 1);
  }
  function nextPeriod() {
    if (viewMode === 'month')   { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }
    if (viewMode === 'quarter') { if (quarter === 3) { setQuarter(0); setYear(y => y + 1); } else setQuarter(q => q + 1); }
    if (viewMode === 'year')    setYear(y => y + 1);
  }

  const periodLabel = useMemo(() => {
    if (viewMode === 'month')   return `${MONTH_NAMES[month]} ${year}`;
    if (viewMode === 'quarter') return `${QUARTER_NAMES[quarter]} ${year}`;
    return `${year}`;
  }, [viewMode, year, month, quarter]);

  // Build columns: months shown for the selected period
  const columns = useMemo((): { label: string; start: Date; end: Date }[] => {
    if (viewMode === 'month') {
      const s = new Date(year, month, 1);
      const e = new Date(year, month + 1, 0);
      return [{ label: MONTH_NAMES[month], start: s, end: e }];
    }
    if (viewMode === 'quarter') {
      const startMonth = quarter * 3;
      return [0, 1, 2].map(i => ({
        label: MONTH_NAMES[startMonth + i],
        start: new Date(year, startMonth + i, 1),
        end:   new Date(year, startMonth + i + 1, 0),
      }));
    }
    // year — 12 columns
    return MONTH_NAMES.map((label, i) => ({
      label,
      start: new Date(year, i, 1),
      end:   new Date(year, i + 1, 0),
    }));
  }, [viewMode, year, month, quarter]);

  const filtered = useMemo(() =>
    entries.filter(e => typeFilter === 'all' || e.assessment_type === typeFilter),
    [entries, typeFilter]
  );

  const typeOptions = Object.entries(TYPE_COLOURS).map(([code, meta]) => ({ code, label: meta.label }));

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
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader title="Assessment Calendar" />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View mode */}
        <div className="flex rounded-md border overflow-hidden">
          {(['month','quarter','year'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                viewMode === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Period navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={prevPeriod}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium min-w-[140px] text-center">{periodLabel}</span>
          <Button variant="ghost" size="sm" onClick={nextPeriod}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        {/* Type filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] text-sm">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {typeOptions.map(o => <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Show closed toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={e => setShowClosed(e.target.checked)}
            className="rounded"
          />
          Show closed
        </label>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {typeOptions.map(o => {
          const c = TYPE_COLOURS[o.code as AssessmentType];
          return (
            <span key={o.code} className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              {o.label}
            </span>
          );
        })}
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-0">
          <div
            className="grid divide-x border-b"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map(col => (
              <div key={col.label} className="p-2 bg-gray-50 text-center text-xs font-semibold text-gray-600">
                {col.label}
              </div>
            ))}
          </div>
          <div
            className="grid divide-x"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map(col => {
              const colEntries = filtered.filter(e => entryOverlaps(e, col.start, col.end));
              return (
                <div key={col.label} className="p-2 min-h-[120px] align-top">
                  {colEntries.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center mt-4">—</p>
                  ) : (
                    colEntries.map(entry => (
                      <EntryCard key={entry.id} entry={entry} onNavigate={handleNavigate} />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary: entries in this period */}
      {filtered.filter(e => columns.some(c => entryOverlaps(e, c.start, c.end))).length === 0 && (
        <p className="text-center text-gray-400 text-sm py-4">
          No assessments scheduled for this period.
        </p>
      )}
    </div>
  );
}
