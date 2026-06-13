/**
 * Risk Assessments — /assessment/risk-assessments
 * STRAT-PORTAL-005 §4.5
 */
import React, { useEffect, useState } from 'react';
import { AssessmentListPage } from '@/components/assessment/AssessmentListPage';
import type { AssessmentListConfig } from '@/components/assessment/AssessmentListPage';
import { getRiskAssessmentTypes, getRiskMethodologies } from '@/hooks/useAssessmentData';
import type { LookupRow } from '@/lib/cybersecure-types';

export default function RiskAssessmentsPage() {
  const [raTypes, setRaTypes] = useState<LookupRow[]>([]);
  const [methodologies, setMethodologies] = useState<LookupRow[]>([]);

  useEffect(() => {
    Promise.all([getRiskAssessmentTypes(), getRiskMethodologies()]).then(
      ([types, methods]) => {
        setRaTypes(types);
        setMethodologies(methods);
      }
    );
  }, []);

  const config: AssessmentListConfig = {
    title: 'Risk Assessments',
    type: 'risk_assessment',
    detailRoute: '/assessment/risk-assessments/:id',
    typeSpecificFilter: raTypes.length
      ? { field: 'assessment_type_id', label: 'Assessment Type', options: raTypes }
      : undefined,
    typeSpecificFields: [
      {
        key: 'assessment_type_id',
        label: 'Assessment Type',
        type: 'select',
        options: raTypes.map(t => ({ value: t.id, label: t.name })),
      },
      {
        key: 'methodology_id',
        label: 'Methodology',
        type: 'select',
        options: methodologies.map(m => ({ value: m.id, label: m.name })),
      },
      { key: 'facilitator_role', label: 'Facilitator Role', type: 'text', placeholder: 'e.g. Security Manager' },
      { key: 'report_ref',       label: 'Report Ref',       type: 'text', placeholder: 'URL or document reference' },
    ],
  };

  return <AssessmentListPage config={config} />;
}
