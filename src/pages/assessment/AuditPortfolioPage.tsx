/**
 * Audit Portfolio — /assessment/audits
 * STRAT-PORTAL-005 §4.1 (Sprint 1A)
 */
import React, { useEffect, useState } from 'react';
import { AssessmentListPage } from '@/components/assessment/AssessmentListPage';
import type { AssessmentListConfig } from '@/components/assessment/AssessmentListPage';
import { getRiskMethodologies } from '@/hooks/useAssessmentData';
import type { LookupRow } from '@/lib/cybersecure-types';

export default function AuditPortfolioPage() {
  const [frameworks, setFrameworks] = useState<LookupRow[]>([]);

  useEffect(() => {
    // lkp_regulatory_reference is the framework lookup (ISO 27001, SOC 2, etc.)
    import('@/lib/supabase').then(({ supabase }) => {
      supabase
        .from('lkp_regulatory_reference')
        .select('id, code, name, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order')
        .then(({ data }) => setFrameworks((data || []) as LookupRow[]));
    });
  }, []);

  const config: AssessmentListConfig = {
    title: 'Audit Portfolio',
    type: 'audit',
    detailRoute: '/assessment/audits/:id',
    typeSpecificFilter: frameworks.length
      ? { field: 'audit_framework_id', label: 'Framework', options: frameworks }
      : undefined,
    typeSpecificFields: [
      { key: 'auditor_firm',           label: 'Audit Firm',             type: 'text',     placeholder: 'e.g. Cybersplice' },
      { key: 'engagement_letter_ref',  label: 'Engagement Letter Ref',  type: 'text',     placeholder: 'URL or document reference' },
      { key: 'final_report_ref',       label: 'Final Report Ref',       type: 'text',     placeholder: 'URL or document reference' },
    ],
  };

  return <AssessmentListPage config={config} />;
}
