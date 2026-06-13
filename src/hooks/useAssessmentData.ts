import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type {
  AssessmentType,
  AuditEngagement,
  PenTestEngagement,
  VulnScan,
  RiskAssessmentEngagement,
  TprmQuestionnaire,
  AssessmentCalendarEntry,
  LookupRow,
  AssessmentFindingSummary,
} from '../lib/cybersecure-types';

// ---------------------------------------------------------------
// Lookup data (cached at module level to avoid re-fetching)
// ---------------------------------------------------------------
let _statusCache: LookupRow[] | null = null;
let _sourceCache: LookupRow[] | null = null;
let _pentestTypeCache: LookupRow[] | null = null;
let _scannerCache: LookupRow[] | null = null;
let _raTypeCache: LookupRow[] | null = null;
let _methodologyCache: LookupRow[] | null = null;
let _tprmTemplateCache: LookupRow[] | null = null;
let _riskRatingCache: LookupRow[] | null = null;

async function fetchLookup(table: string): Promise<LookupRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return (data || []) as LookupRow[];
}

export async function getAssessmentStatuses(): Promise<LookupRow[]> {
  if (!_statusCache) _statusCache = await fetchLookup('lkp_assessment_status');
  return _statusCache;
}
export async function getAssessmentSources(): Promise<LookupRow[]> {
  if (!_sourceCache) _sourceCache = await fetchLookup('lkp_assessment_source');
  return _sourceCache;
}
export async function getPentestTypes(): Promise<LookupRow[]> {
  if (!_pentestTypeCache) _pentestTypeCache = await fetchLookup('lkp_pentest_type');
  return _pentestTypeCache;
}
export async function getScanners(): Promise<LookupRow[]> {
  if (!_scannerCache) _scannerCache = await fetchLookup('lkp_scanner');
  return _scannerCache;
}
export async function getRiskAssessmentTypes(): Promise<LookupRow[]> {
  if (!_raTypeCache) _raTypeCache = await fetchLookup('lkp_risk_assessment_type');
  return _raTypeCache;
}
export async function getRiskMethodologies(): Promise<LookupRow[]> {
  if (!_methodologyCache) _methodologyCache = await fetchLookup('lkp_risk_methodology');
  return _methodologyCache;
}
export async function getTprmTemplates(): Promise<LookupRow[]> {
  if (!_tprmTemplateCache) _tprmTemplateCache = await fetchLookup('lkp_tprm_template');
  return _tprmTemplateCache;
}
export async function getRiskRatings(): Promise<LookupRow[]> {
  if (!_riskRatingCache) _riskRatingCache = await fetchLookup('lkp_risk_rating');
  return _riskRatingCache;
}

// ---------------------------------------------------------------
// Generic assessment CRUD hook factory
// ---------------------------------------------------------------

export type AssessmentRecord =
  | AuditEngagement
  | PenTestEngagement
  | VulnScan
  | RiskAssessmentEngagement
  | TprmQuestionnaire;

const TABLE_MAP: Record<AssessmentType, string> = {
  audit:               'audit_engagements',
  pen_test:            'pen_tests',
  vuln_scan:           'vuln_scans',
  risk_assessment:     'risk_assessments',
  tprm_questionnaire:  'tprm_questionnaires',
};

export function useAssessmentList<T extends AssessmentRecord>(type: AssessmentType) {
  const { organizationId } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<LookupRow[]>([]);
  const [sources, setSources] = useState<LookupRow[]>([]);

  const table = TABLE_MAP[type];

  const load = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    try {
      setLoading(true);
      const [{ data, error: err }, statusList, sourceList] = await Promise.all([
        supabase
          .from(table)
          .select('*')
          .eq('organization_id', organizationId)
          .order('scheduled_start', { ascending: false, nullsFirst: false }),
        getAssessmentStatuses(),
        getAssessmentSources(),
      ]);
      if (err) throw err;
      setStatuses(statusList);
      setSources(sourceList);
      // Enrich with lookup names for display
      const enriched = (data || []).map((row: any) => ({
        ...row,
        status_name: statusList.find(s => s.id === row.status_id)?.name,
        status_code: statusList.find(s => s.id === row.status_id)?.code,
        source_name: sourceList.find(s => s.id === row.source_id)?.name,
      })) as T[];
      setItems(enriched);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, table]);

  useEffect(() => { load(); }, [load]);

  const create = async (payload: Partial<T>): Promise<T | null> => {
    if (!organizationId) return null;
    const { data, error: err } = await supabase
      .from(table)
      .insert([{ ...payload, organization_id: organizationId }])
      .select()
      .single();
    if (err) throw err;
    await load();
    return data as T;
  };

  const update = async (id: string, payload: Partial<T>): Promise<void> => {
    const { error: err } = await supabase
      .from(table)
      .update(payload)
      .eq('id', id)
      .eq('organization_id', organizationId!);
    if (err) throw err;
    await load();
  };

  const remove = async (id: string): Promise<void> => {
    const { error: err } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId!);
    if (err) throw err;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Advance status with history record implicitly written by DB trigger
  const advanceStatus = async (id: string, newStatusCode: string, reason?: string): Promise<void> => {
    const newStatus = statuses.find(s => s.code === newStatusCode);
    if (!newStatus) throw new Error(`Unknown status code: ${newStatusCode}`);
    await update(id, { status_id: newStatus.id } as any);
  };

  return { items, loading, error, statuses, sources, load, create, update, remove, advanceStatus };
}

// ---------------------------------------------------------------
// Assessment Calendar hook — reads the v_assessment_calendar view
// ---------------------------------------------------------------

export function useAssessmentCalendar(showClosed = false) {
  const { organizationId } = useAuth();
  const [entries, setEntries] = useState<AssessmentCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    try {
      setLoading(true);
      let query = supabase
        .from('v_assessment_calendar')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: true });

      if (!showClosed) {
        // Forward-looking: from today forward, active statuses only (closed filter is in the view itself)
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('end_date', today);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setEntries((data || []) as AssessmentCalendarEntry[]);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, showClosed]);

  useEffect(() => { load(); }, [load]);

  return { entries, loading, error, load };
}

// ---------------------------------------------------------------
// Findings embedded block — reads audit_findings for any assessment
// ---------------------------------------------------------------

export function useAssessmentFindings(assessmentType: AssessmentType, assessmentId: string | null) {
  const [findings, setFindings] = useState<AssessmentFindingSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assessmentId) return;
    setLoading(true);
    supabase
      .from('audit_findings')
      .select('id, title, severity, status, created_at')
      .eq('assessment_type', assessmentType)
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setFindings((data || []) as AssessmentFindingSummary[]);
        setLoading(false);
      });
  }, [assessmentType, assessmentId]);

  return { findings, loading };
}

// ---------------------------------------------------------------
// Summary stats for the list page tiles
// ---------------------------------------------------------------

export function useAssessmentStats(type: AssessmentType) {
  const { organizationId } = useAuth();
  const [stats, setStats] = useState({
    active: 0,
    thisQuarter: 0,
    openFindings: 0,
    overdueRemediation: 0,
  });

  useEffect(() => {
    if (!organizationId) return;
    const table = TABLE_MAP[type];
    const now = new Date();
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
    const qEnd   = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0).toISOString().split('T')[0];

    Promise.all([
      // active: scheduled + in_progress + reporting
      supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .in('status_id', [
          supabase.from('lkp_assessment_status').select('id').in('code', ['scheduled','in_progress','reporting']),
        ] as any),
      // this quarter
      supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('scheduled_start', qStart)
        .lte('scheduled_end', qEnd),
    ]).then(([activeRes, qRes]) => {
      setStats(prev => ({
        ...prev,
        active: activeRes.count || 0,
        thisQuarter: qRes.count || 0,
      }));
    });
  }, [organizationId, type]);

  return stats;
}
