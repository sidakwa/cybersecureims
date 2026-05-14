# CyberSecureIMS — Full Code Guide

## What's in this package

All code generated for Phases 1–6 of the ComplyIMS → CyberSecureIMS fork.

---

## File Map

```
cybersecureims/
├── .env.example                          ← Phase 1: env vars
├── scripts/
│   └── rename-project.sh                 ← Phase 1: fork rename script
│
├── supabase/
│   ├── migrations/
│   │   ├── 01_schema_migration.sql       ← Phase 2: full schema + new tables
│   │   ├── 02_rls_policies.sql           ← Phase 2: Row Level Security
│   │   └── 03_seed_framework_controls.sql← Phase 2+6: ISO27001(93) + SOC2(39) + NIST CSF(100+) controls
│   └── edge_functions/
│       └── seed-org-controls/index.ts    ← Phase 6: auto-seed on org create
│
├── src/
│   ├── App.tsx                           ← Phase 6: all routes updated
│   │
│   ├── lib/
│   │   └── cybersecure-types.ts          ← Phase 3a: all TypeScript interfaces
│   │
│   ├── hooks/
│   │   ├── useControls.ts                ← Phase 3b: framework controls CRUD + stats
│   │   ├── useAssets.ts                  ← Phase 3b: asset inventory CRUD
│   │   ├── useVulnerabilities.ts         ← Phase 3b: vuln tracker CRUD + SLA
│   │   ├── usePenTests.ts                ← Phase 3b: pen test CRUD
│   │   ├── useBcDrPlans.ts               ← Phase 3b: BC/DR CRUD
│   │   └── useSecurityIncidents.ts       ← Phase 3b: incidents + MTTD/MTTR
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── Layout.tsx                ← Phase 4: cybersecurity sidebar nav
│   │   ├── controls/
│   │   │   └── ControlModal.tsx          ← Phase 3c: control status editor
│   │   ├── assets/
│   │   │   └── AssetModal.tsx            ← Phase 3c: asset form
│   │   ├── vulnerabilities/
│   │   │   ├── VulnerabilityModal.tsx    ← Phase 3c: vuln form
│   │   │   └── PenTestModal.tsx          ← Phase 3c: pen test form
│   │   └── incidents/
│   │       ├── IncidentModal.tsx         ← Phase 3c: incident report form
│   │       └── BcDrModal.tsx             ← Phase 3c: BC/DR plan form
│   │
│   └── pages/
│       ├── Dashboard.tsx                 ← Phase 6: cyber security dashboard
│       ├── ControlLibrary.tsx            ← Phase 3d: NEW – multi-framework controls
│       ├── StatementOfApplicability.tsx  ← Phase 5: NEW – ISO 27001 SoA
│       ├── ComplianceScorecard.tsx       ← Phase 5: NEW – multi-framework scorecard
│       ├── CyberRiskAssessment.tsx       ← Phase 3e: refactored risk register
│       ├── AssetInventory.tsx            ← Phase 3d: NEW – asset inventory
│       ├── VulnerabilityTracker.tsx      ← Phase 3d: NEW – vuln tracker
│       ├── PenTestTracker.tsx            ← Phase 3d: NEW – pen test tracker
│       ├── BcDrPlans.tsx                 ← Phase 3d: NEW – BC/DR plans
│       ├── SecurityIncidents.tsx         ← Phase 3e: refactored incidents
│       ├── VendorRiskManagement.tsx      ← Phase 3e: refactored vendor risk
│       └── AuditMaster.tsx               ← Phase 3e: refactored audit (cyber standards)
```

---

## Deployment Steps

### 1. Fork & Rename
```bash
# Fork on GitHub: sidakwa/complyims → sidakwa/cybersecureims
git clone https://github.com/sidakwa/cybersecureims
cd cybersecureims
bash scripts/rename-project.sh
```

### 2. Run DB Migrations (in order in Supabase SQL editor)
```
1. supabase/migrations/01_schema_migration.sql
2. supabase/migrations/02_rls_policies.sql
3. supabase/migrations/03_seed_framework_controls.sql
   → Replace :org_id with your organization UUID
```

### 3. Copy new source files
Copy all files from `src/` into your project's `src/` directory.
- Overwrite: `App.tsx`, `pages/Dashboard.tsx`, `pages/AuditMaster.tsx`
- Add all other new pages and hooks

### 4. Update Layout import in your existing Layout usage
```tsx
// In App.tsx (already updated in this package)
import Layout from '@/components/layout/Layout';
```

### 5. Install Recharts (if not already installed)
```bash
npm install recharts
```

### 6. Deploy
```bash
npm run build
npx vercel --prod
```

---

## Key Notes

- **Existing hooks** (`useAudits`, `useRisks`, `useAuth`, `useSuppliers`) are UNCHANGED — only field options inside forms are updated
- **Multi-tenant RBAC** is fully preserved — `organization_id` RLS works on all new tables
- **Framework controls** are pre-seeded: 93 ISO 27001, 39 SOC 2, 100+ NIST CSF controls
- **VendorRiskManagement.tsx** uses the renamed `third_party_vendors` table — connect to your existing `useSuppliers` hook
