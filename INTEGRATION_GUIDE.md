# CyberSecureIMS — Integration Guide

## What's in this repo

A full-stack GRC (Governance, Risk & Compliance) platform built on React + Supabase, structured around an 8-module security lifecycle. Covers everything from executive dashboards and control libraries through audit management, risk tracking, remediation programmes, and evidence assurance.

---

## Navigation Modules

The top-bar navigation is organized into 8 lifecycle sections (see [src/components/Layout.tsx](src/components/Layout.tsx)):

| # | Module | Key Pages |
|---|--------|-----------|
| 1 | **Reporting** | Executive Dashboard, CSI Programme, Compliance Scorecard, Regulatory Dashboard, Risk Heatmap, Priority Actions, Report Portal |
| 2 | **Strategy & Architecture** | Information Security Strategy, Security Architecture, ISMS Authority Chain, Statement of Applicability, Security Objectives |
| 3 | **Inventory** | UCI Controls, Control Library, Asset Inventory, Application Register, Data Asset Register, Business Process Register, Exception Register, Policy Library, Vendor Register, Compliance Obligations, Security Training |
| 4 | **Assessment** | Audit Portfolio, Control Testing, Pen Tests, Vulnerability Scans, Risk Assessments, TPRM Questionnaires, Audit Calendar |
| 5 | **Findings & Risks** | Findings Register, Cyber Risk Register, Threat Register, Risk Mapping, Vulnerability Tracker, Incident Register |
| 6 | **Remediation** | Remediation Programmes, CSI Items, Work Packages, Action Tracker |
| 7 | **Assurance & Response** | Evidence Repository, Evidence Requests, Management Attestations, SARE Inbox/Templates/Archive, Policy Approval Workflow |
| 8 | **Admin** | User Management, Workflow Engine, Integration Manager, Bulk Import, System Settings, Reference Data |

---

## File Map

```
cybersecureims/
├── .env.example
├── scripts/
│   └── rename-project.sh
│
├── supabase/
│   ├── migrations/
│   │   ├── 01_schema_migration.sql          ← core schema + base tables
│   │   ├── 02_rls_policies.sql              ← Row Level Security (org-scoped)
│   │   ├── 03_seed_framework_controls.sql   ← ISO 27001 (93) + SOC 2 (39) + NIST CSF (100+)
│   │   ├── 04_applications.sql              ← application_register table
│   │   ├── 05_control_testing_exceptions.sql← control_test_records + security_exceptions
│   │   ├── 06_threat_register_objectives.sql← threat_register + security_objectives
│   │   ├── 07_tier2_tables.sql              ← remediation_programmes, evidence_requests, integrations
│   │   ├── 08_tier3_tables.sql              ← data_assets, business_processes, attestations,
│   │   │                                      regulatory_obligations, workflows
│   │   ├── 09_relationship_layer.sql        ← FK columns linking findings/evidence/tests/exceptions
│   │   │                                      to framework_controls + cyber_risks;
│   │   │                                      control_framework_mappings cross-framework table
│   │   └── 10_platform_admin_flag.sql       ← platform_admin flag on profiles
│   └── edge_functions/
│       └── seed-org-controls/index.ts       ← auto-seeds framework controls on org create
│
├── src/
│   ├── App.tsx                              ← all routes (80+ pages)
│   ├── main.tsx
│   │
│   ├── lib/
│   │   ├── cybersecure-types.ts             ← all TypeScript interfaces
│   │   ├── supabase.ts                      ← Supabase client init
│   │   ├── permissions.ts                   ← RBAC helpers
│   │   ├── reportGenerator.ts               ← PDF/Excel report generation
│   │   ├── evidenceReportGenerator.ts
│   │   ├── hrReportGenerator.ts
│   │   ├── normalize.ts
│   │   └── trends.ts                        ← metric trend calculations
│   │
│   ├── hooks/                               ← Supabase CRUD hooks (all org-scoped)
│   │   ├── useAuth.ts
│   │   ├── useControls.ts                   ← framework controls + stats
│   │   ├── useAssets.ts
│   │   ├── useVulnerabilities.ts            ← vuln tracker + SLA
│   │   ├── usePenTests.ts
│   │   ├── useBcDrPlans.ts
│   │   ├── useSecurityIncidents.ts          ← incidents + MTTD/MTTR
│   │   ├── useRisks.ts
│   │   ├── useAudits.ts
│   │   ├── useCompliance.ts
│   │   ├── useDocuments.ts
│   │   ├── useEmployees.ts
│   │   ├── useHRTasks.ts
│   │   ├── useLegalRegisters.ts
│   │   ├── useOrganizationId.ts
│   │   ├── useReportTemplates.ts
│   │   ├── useScheduledReports.ts
│   │   └── useTasks.ts
│   │
│   ├── data/
│   │   ├── client.ts                        ← typed Supabase client
│   │   ├── repositories/                    ← low-level DB access layer
│   │   │   ├── audit.repo.ts / audits.repo.ts
│   │   │   ├── actions.repo.ts
│   │   │   ├── evidence.repo.ts
│   │   │   ├── findings.repo.ts
│   │   │   ├── uciControls.repo.ts
│   │   │   └── workPackages.repo.ts
│   │   └── hooks/                           ← React hooks over repositories
│   │       ├── useAuditActions.ts
│   │       ├── useAuditEvidence.ts
│   │       ├── useAuditFindings.ts
│   │       └── useWorkPackages.ts
│   │
│   ├── services/
│   │   ├── auditService.ts
│   │   ├── metricsService.ts
│   │   ├── notificationService.ts
│   │   ├── offlineService.ts                ← IndexedDB-backed offline queue (idb)
│   │   └── unifiedMetricsService.ts
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx                  ← auth + org context provider
│   │
│   ├── components/
│   │   ├── Layout.tsx                       ← 8-module top-bar nav
│   │   ├── assets/AssetModal.tsx
│   │   ├── audit/AuditModal.tsx, AuditNavigation.tsx
│   │   ├── controls/ControlModal.tsx
│   │   ├── documents/DocumentModal.tsx, DocumentUpload.tsx
│   │   ├── evidence/EvidenceLink.tsx
│   │   ├── incidents/IncidentModal.tsx, BcDrModal.tsx
│   │   ├── risks/RiskModal.tsx
│   │   ├── suppliers/SupplierModal.tsx
│   │   ├── tasks/TaskModal.tsx
│   │   ├── vulnerabilities/VulnerabilityModal.tsx, PenTestModal.tsx
│   │   └── ui/                              ← shadcn/ui component library
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx                    ← executive cybersecurity dashboard
│   │   ├── ProgrammeDashboard.tsx           ← CSI programme tracker
│   │   ├── ComplianceScorecard.tsx          ← multi-framework scorecard
│   │   ├── RegulatoryDashboard.tsx          ← auto-calculates % from control status
│   │   ├── RiskHeatmapPage.tsx
│   │   ├── PriorityActionDashboard.tsx
│   │   ├── ReportPortal.tsx
│   │   ├── StatementOfApplicability.tsx
│   │   ├── SecurityObjectives.tsx
│   │   ├── ControlLibrary.tsx               ← clickable titles → ControlDetail, mapping badges
│   │   ├── ControlDetail.tsx                ← chain view: control → tests → evidence → findings → risks
│   │   ├── ControlTesting.tsx
│   │   ├── UCIControls.tsx / UCIControlsFull.tsx
│   │   ├── AssetInventory.tsx
│   │   ├── ApplicationRegister.tsx
│   │   ├── DataAssetRegister.tsx
│   │   ├── BusinessProcessRegister.tsx
│   │   ├── ExceptionRegister.tsx
│   │   ├── ThreatRegister.tsx
│   │   ├── CyberRiskAssessment.tsx
│   │   ├── RiskAssessment.tsx
│   │   ├── RiskMapping.tsx
│   │   ├── VulnerabilityTracker.tsx
│   │   ├── SecurityIncidents.tsx
│   │   ├── BcDrPlans.tsx
│   │   ├── VendorRiskManagement.tsx
│   │   ├── RemediationProgrammes.tsx
│   │   ├── CSIItems.tsx
│   │   ├── WorkPackageManagement.tsx
│   │   ├── EvidenceManagement.tsx
│   │   ├── EvidenceCollection.tsx
│   │   ├── EvidenceRequests.tsx
│   │   ├── ManagementAttestations.tsx
│   │   ├── WorkflowEngine.tsx
│   │   ├── IntegrationManager.tsx
│   │   ├── BulkImport.tsx
│   │   ├── AuditMaster.tsx / AuditManager.tsx
│   │   ├── DocumentManagement.tsx
│   │   ├── LegalRegisters.tsx
│   │   ├── HumanResources.tsx
│   │   ├── AdminUsers.tsx / RoleManagement.tsx
│   │   ├── OrganizationManagement.tsx
│   │   ├── Settings.tsx
│   │   └── audit/
│   │       ├── AuditPortfolio.tsx
│   │       ├── AuditDetail.tsx
│   │       ├── AuditCalendar.tsx
│   │       ├── AuditMetrics.tsx
│   │       ├── FindingsRegister.tsx         ← linked_control_id + linked_risk_id FK pickers
│   │       ├── EvidenceLibrary.tsx
│   │       └── ActionTracker.tsx
│   │
│   ├── portals/
│   │   ├── auditor/AuditorLayout.tsx
│   │   └── client/ClientLayout.tsx
│   │
│   ├── test/
│   │   ├── setup.ts
│   │   ├── adminRoute.test.tsx
│   │   ├── complianceScore.test.ts
│   │   └── offlineSync.test.ts
│   │
│   └── sw.ts                                ← service worker (offline support)
```

---

## Deployment Steps

### 1. Fork & Rename
```bash
git clone https://github.com/sidakwa/cybersecureims
cd cybersecureims
bash scripts/rename-project.sh
```

### 2. Environment
```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 3. Run DB Migrations (in order in Supabase SQL editor)
```
01_schema_migration.sql
02_rls_policies.sql
03_seed_framework_controls.sql   ← replace :org_id with your org UUID
04_applications.sql
05_control_testing_exceptions.sql
06_threat_register_objectives.sql
07_tier2_tables.sql
08_tier3_tables.sql
09_relationship_layer.sql
10_platform_admin_flag.sql
```

### 4. Deploy Edge Function
```bash
supabase functions deploy seed-org-controls
```

### 5. Install & Build
```bash
npm install
npm run build
npx vercel --prod
```

### 6. Run Tests
```bash
npm test
```

---

## Key Architecture Notes

- **Multi-tenant RBAC** — all tables are `organization_id`-scoped via RLS; `useOrganizationId` provides the current org in every hook
- **Relationship layer** (migration 09) — `audit_findings`, `audit_evidence`, `control_test_records`, `evidence_requests`, and `security_exceptions` all carry FK columns to `framework_controls` and `cyber_risks`, enabling the full chain view in `ControlDetail.tsx`
- **Cross-framework mappings** — `control_framework_mappings` table lets one control map to multiple standards; `RegulatoryDashboard` auto-calculates compliance % from these mappings
- **Offline support** — `offlineService.ts` queues mutations in IndexedDB (`idb`) and replays on reconnect; covered by `offlineSync.test.ts`
- **Pre-seeded controls** — 93 ISO 27001, 39 SOC 2, 100+ NIST CSF controls loaded via migration 03 or the `seed-org-controls` edge function on org creation
- **Existing hooks unchanged** — `useAudits`, `useRisks`, `useAuth`, `useDocuments`, `useEmployees` are stable; only form field options were updated for cybersecurity context
