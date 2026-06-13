/**
 * TPRM Questionnaires — /assessment/tprm
 * STRAT-PORTAL-005 §4.6
 *
 * Two streams: Inbound (answered via SARE) and Outbound (vendor assessment).
 * Direction filter is the type-specific fourth filter per §5.6.
 */
import React, { useEffect, useState } from 'react';
import { AssessmentListPage } from '@/components/assessment/AssessmentListPage';
import type { AssessmentListConfig } from '@/components/assessment/AssessmentListPage';
import { getTprmTemplates, getRiskRatings } from '@/hooks/useAssessmentData';
import type { LookupRow } from '@/lib/cybersecure-types';

// Direction is a boolean-like filter, not a lookup table row — we
// synthesise two LookupRow entries so it fits the shared filter component.
const DIRECTION_OPTIONS: LookupRow[] = [
  { id: 'inbound',  code: 'inbound',  name: 'Inbound',  is_active: true, sort_order: 1 },
  { id: 'outbound', code: 'outbound', name: 'Outbound', is_active: true, sort_order: 2 },
];

export default function TprmPage() {
  const [templates, setTemplates] = useState<LookupRow[]>([]);
  const [riskRatings, setRiskRatings] = useState<LookupRow[]>([]);

  useEffect(() => {
    Promise.all([getTprmTemplates(), getRiskRatings()]).then(
      ([tmpl, ratings]) => {
        setTemplates(tmpl);
        setRiskRatings(ratings);
      }
    );
  }, []);

  const config: AssessmentListConfig = {
    title: 'TPRM Questionnaires',
    type: 'tprm_questionnaire',
    detailRoute: '/assessment/tprm/:id',
    // Direction is the 4th filter per §5.6
    typeSpecificFilter: {
      field: 'direction',
      label: 'Direction',
      options: DIRECTION_OPTIONS,
    },
    typeSpecificFields: [
      {
        key: 'direction',
        label: 'Direction',
        type: 'select',
        required: true,
        options: [
          { value: 'outbound', label: 'Outbound — Seacom assessing a vendor' },
          { value: 'inbound',  label: 'Inbound — Customer assessing Seacom (answered via SARE)' },
        ],
      },
      { key: 'customer_name',  label: 'Customer Name (inbound)', type: 'text', placeholder: 'Customer name' },
      {
        key: 'questionnaire_template_id',
        label: 'Template',
        type: 'select',
        options: templates.map(t => ({ value: t.id, label: t.name })),
      },
      { key: 'responses_received_on', label: 'Responses Received On', type: 'date' },
      {
        key: 'resulting_risk_rating_id',
        label: 'Resulting Risk Rating (outbound)',
        type: 'select',
        options: riskRatings.map(r => ({ value: r.id, label: r.name })),
      },
      { key: 'report_ref', label: 'Report Ref', type: 'text', placeholder: 'URL or document reference' },
    ],
  };

  return <AssessmentListPage config={config} />;
}
