/**
 * Vulnerability Scans — /assessment/vuln-scans
 * STRAT-PORTAL-005 §4.4
 *
 * Each row = one scan run (DefectDojo engagement, Nessus scan, etc.).
 * Findings land in the Vulnerability Tracker, not the Findings Register
 * (Q3). Unmatched DefectDojo targets surface in the summary tile.
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AssessmentListPage } from '@/components/assessment/AssessmentListPage';
import type { AssessmentListConfig } from '@/components/assessment/AssessmentListPage';
import { getScanners } from '@/hooks/useAssessmentData';
import type { LookupRow } from '@/lib/cybersecure-types';

export default function VulnScansPage() {
  const [scanners, setScanners] = useState<LookupRow[]>([]);

  useEffect(() => {
    getScanners().then(setScanners);
  }, []);

  const config: AssessmentListConfig = {
    title: 'Vulnerability Scans',
    type: 'vuln_scan',
    detailRoute: '/assessment/vuln-scans/:id',
    typeSpecificFilter: scanners.length
      ? { field: 'scanner_id', label: 'Scanner', options: scanners }
      : undefined,
    typeSpecificFields: [
      {
        key: 'scanner_id',
        label: 'Scanner',
        type: 'select',
        options: scanners.map(s => ({ value: s.id, label: s.name })),
      },
      { key: 'target_scope_text', label: 'Target Scope (URLs / IPs / ranges)', type: 'textarea', placeholder: 'Targets not yet in Asset Register' },
      { key: 'scan_run_ref',      label: 'External Scan Ref',                  type: 'text',     placeholder: 'DefectDojo engagement ID or ticket ref' },
    ],
  };

  return (
    <div>
      {/* Q9 — unmatched targets tile: rendered above the list when data exists */}
      <UnmatchedTargetsBanner />
      <AssessmentListPage config={config} />
    </div>
  );
}

function UnmatchedTargetsBanner() {
  // In Phase 2 this will query vulnerabilities where asset_id IS NULL
  // and scan_id IS NOT NULL. For Sprint 1 it is a placeholder.
  const [count] = useState(0);
  if (count === 0) return null;
  return (
    <div className="px-6 pt-4">
      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="py-3 px-4 text-sm text-amber-800">
          <strong>{count} unmatched scan targets</strong> — findings imported without a matching Asset Register entry.
          {' '}<a href="/assets" className="underline">Review asset list</a> to resolve.
        </CardContent>
      </Card>
    </div>
  );
}
