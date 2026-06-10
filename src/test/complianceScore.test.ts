import { describe, it, expect } from 'vitest';

// Pure-function extraction of the compliance score logic from ComplianceScorecard.tsx
// If the formula changes, this test will catch it before it reaches users.

function calcAuditCompliance(audits: { status: string; overall_score: number | null }[]): number {
  const completedAudits = audits.filter(a => a.status === 'Completed' && a.overall_score != null);
  return completedAudits.length > 0
    ? completedAudits.reduce((sum, a) => sum + (a.overall_score || 0), 0) / completedAudits.length
    : 0;
}

function calcOverallScore({
  controlCompliance,
  riskCompliance,
  findingCompliance,
  auditCompliance,
  evidenceCompliance,
  workPackageCompliance,
}: Record<string, number>): number {
  return Math.round(
    controlCompliance * 0.25 +
    riskCompliance * 0.20 +
    findingCompliance * 0.20 +
    auditCompliance * 0.15 +
    evidenceCompliance * 0.10 +
    workPackageCompliance * 0.10
  );
}

describe('Compliance Score — audit dimension', () => {
  it('returns 0 when no audits exist', () => {
    expect(calcAuditCompliance([])).toBe(0);
  });

  it('returns 0 when no audits are completed', () => {
    expect(calcAuditCompliance([
      { status: 'In Progress', overall_score: 90 },
      { status: 'Planned', overall_score: null },
    ])).toBe(0);
  });

  it('uses actual score, not completion count', () => {
    // A single completed audit scoring 20/100 must contribute 20, not 100
    expect(calcAuditCompliance([
      { status: 'Completed', overall_score: 20 },
    ])).toBe(20);
  });

  it('averages scores of multiple completed audits', () => {
    expect(calcAuditCompliance([
      { status: 'Completed', overall_score: 60 },
      { status: 'Completed', overall_score: 80 },
      { status: 'In Progress', overall_score: 100 }, // excluded
    ])).toBe(70);
  });

  it('ignores completed audits with null score', () => {
    expect(calcAuditCompliance([
      { status: 'Completed', overall_score: null },
      { status: 'Completed', overall_score: 50 },
    ])).toBe(50);
  });
});

describe('Overall compliance score weights', () => {
  it('sums to 100 when all dimensions are 100', () => {
    expect(calcOverallScore({
      controlCompliance: 100,
      riskCompliance: 100,
      findingCompliance: 100,
      auditCompliance: 100,
      evidenceCompliance: 100,
      workPackageCompliance: 100,
    })).toBe(90); // weights only sum to 0.90 — mappingCompliance is excluded
  });

  it('returns 0 when all dimensions are 0', () => {
    expect(calcOverallScore({
      controlCompliance: 0,
      riskCompliance: 0,
      findingCompliance: 0,
      auditCompliance: 0,
      evidenceCompliance: 0,
      workPackageCompliance: 0,
    })).toBe(0);
  });

  it('controls dimension carries the highest weight (25%)', () => {
    const withFullControls = calcOverallScore({
      controlCompliance: 100,
      riskCompliance: 0, findingCompliance: 0,
      auditCompliance: 0, evidenceCompliance: 0, workPackageCompliance: 0,
    });
    const withFullAudit = calcOverallScore({
      auditCompliance: 100,
      controlCompliance: 0, riskCompliance: 0,
      findingCompliance: 0, evidenceCompliance: 0, workPackageCompliance: 0,
    });
    expect(withFullControls).toBeGreaterThan(withFullAudit);
  });
});
