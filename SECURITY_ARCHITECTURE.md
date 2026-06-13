# CyberSecureIMS — Security Architecture

**Version:** 1.0  
**Date:** 2026-06-11  
**Scope:** Full-stack GRC platform — frontend (React/PWA), backend (Supabase/PostgreSQL), edge functions, integrations, and offline capability.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (React PWA)                                │
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ AuthContext │  │ProtectedRoute│  │  RoleBased     │  │OfflineService │  │
│  │(session/org)│  │(user check)  │  │  (UI guards)   │  │(IndexedDB)    │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  └──────┬────────┘  │
│         │                │                  │                   │           │
│  ┌──────▼──────────────────────────────────▼───────────────────▼────────┐  │
│  │                    React Router (80+ pages / 8 modules)              │  │
│  └──────────────────────────────────┬────────────────────────────────── ┘  │
│                                     │ supabase-js (PKCE, HTTPS only)        │
│         ┌───────────────────────────┘                                       │
│  ┌──────▼──────────┐   ┌──────────────────┐   ┌──────────────────────────┐ │
│  │  Service Worker  │   │  Vite PWA Build  │   │  Browser Notification    │ │
│  │ (Workbox cache) │   │  (static bundle) │   │  API (document expiry)   │ │
│  └──────────────── ┘   └──────────────────┘   └──────────────────────────┘ │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │ HTTPS / TLS 1.2+
                                        │ x-application-name: cybersecureims
                           ┌────────────▼─────────────┐
                           │     SUPABASE PLATFORM     │
                           │  ┌─────────────────────┐  │
                           │  │   Auth (GoTrue)      │  │
                           │  │  - Email/Password    │  │
                           │  │  - Azure AD SSO      │  │
                           │  │  - PKCE OAuth2       │  │
                           │  │  - JWT (HS256)       │  │
                           │  └──────────┬──────────┘  │
                           │             │              │
                           │  ┌──────────▼──────────┐  │
                           │  │  PostgREST (API)     │  │
                           │  │  - JWT validation    │  │
                           │  │  - RLS enforcement   │  │
                           │  └──────────┬──────────┘  │
                           │             │              │
                           │  ┌──────────▼──────────┐  │
                           │  │  PostgreSQL (DB)     │  │
                           │  │  - 10 migrations     │  │
                           │  │  - RLS on all tables │  │
                           │  │  - org_id isolation  │  │
                           │  │  - CASCADE deletes   │  │
                           │  └─────────────────────┘  │
                           │  ┌─────────────────────┐  │
                           │  │  Edge Functions      │  │
                           │  │  (Deno / TypeScript) │  │
                           │  │  - seed-org-controls │  │
                           │  └─────────────────────┘  │
                           │  ┌─────────────────────┐  │
                           │  │  Storage (files,     │  │
                           │  │  evidence, docs)     │  │
                           │  └─────────────────────┘  │
                           └──────────────────────────┘
                                        │
                           ┌────────────▼─────────────┐
                           │    EXTERNAL INTEGRATIONS  │
                           │  SIEM · Vuln Scanner      │
                           │  Cloud Provider · ITSM    │
                           │  IAM · EDR · Email Sec    │
                           │  Firewall · Azure AD      │
                           └──────────────────────────┘
```

---

## 2. Authentication

### 2.1 Methods

| Method | Implementation | Config |
|--------|---------------|--------|
| Email / Password | Supabase GoTrue | `signInWithPassword()` |
| Azure AD SSO | OAuth2 + PKCE | `signInWithOAuth({ provider: 'azure' })` — scopes: `email openid profile User.Read offline_access` |
| Session refresh | Auto | `autoRefreshToken: true`, `persistSession: true` |

### 2.2 PKCE Flow

PKCE (`flowType: 'pkce'`) is enforced on all OAuth interactions. This prevents authorization code interception attacks — critical because the app runs entirely client-side with no confidential backend to safely store a client secret.

```
Browser                    Azure AD / Supabase Auth
   │──── code_challenge ──────────────────────────▶│
   │◀─── authorization_code ──────────────────────│
   │──── code_verifier + authorization_code ──────▶│
   │◀─── access_token + refresh_token ────────────│
```

### 2.3 Session Storage

- JWT stored under key `sb-auth-token` in `localStorage`
- `detectSessionInUrl: true` — OAuth callback fragments are consumed and cleared
- Redirect target: `/auth/callback` (handled by [src/pages/auth/callback.tsx](src/pages/auth/callback.tsx))

### 2.4 Custom App Header

Every Supabase call carries `x-application-name: cybersecureims`, enabling server-side filtering/audit of requests by application.

---

## 3. Authorization

### 3.1 Role Model

Five roles are defined. All are stored in the `profiles.role` column (set at org invitation time):

| Role | Level | Typical Capabilities |
|------|-------|---------------------|
| `admin` | 5 | Full CRUD, user management, org config |
| `security_manager` | 4 | Controls, risks, incidents write |
| `quality_manager` | 4 | Audits, compliance, evidence write |
| `auditor` | 3 | Read-all + audit-specific write |
| `viewer` | 1 | Read-only across all modules |

`is_platform_admin` is a separate boolean on `profiles` (migration 10) for cross-org super-admin capability checked via [src/lib/permissions.ts](src/lib/permissions.ts).

### 3.2 UI Enforcement — RoleBased Component

[src/components/RoleBased.tsx](src/components/RoleBased.tsx) wraps UI elements:

```tsx
<RoleBased roles={['admin', 'security_manager']}>
  <DeleteButton />
</RoleBased>
```

Buttons, forms, and actions are hidden when the user's role is insufficient. **This is UI-only and is not the authoritative enforcement layer** — that is RLS (§4).

### 3.3 Route Enforcement — ProtectedRoute

[src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) gates every authenticated page:

```tsx
if (!user) return <Navigate to="/login" replace />;
```

Admin-only routes additionally check `isAdmin` from `useAuth`. Unauthenticated visitors are redirected to `/login` before any page renders.

---

## 4. Database Security (PostgreSQL / RLS)

### 4.1 Multi-Tenant Isolation

Every data table carries an `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE` column. Row-level security uses a SECURITY DEFINER helper to resolve the current user's org:

```sql
-- migrations/02_rls_policies.sql
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
```

**No cross-org data leakage is possible through PostgREST** — every SELECT, INSERT, UPDATE, and DELETE is filtered through these policies before any row is returned.

### 4.2 RLS Policy Coverage

| Table | Read | Write | Role Gate |
|-------|------|-------|-----------|
| `framework_controls` | org-scoped | org-scoped | manager roles only |
| `control_risk_mappings` | org-scoped | org-scoped | admin, security_manager, quality_manager |
| `statement_of_applicability` | org-scoped | org-scoped | manager roles |
| `assets` | org-scoped | org-scoped | manager roles |
| `vulnerabilities` | org-scoped | org-scoped | manager roles |
| `pen_tests` | org-scoped | org-scoped | manager roles |
| `bc_dr_plans` | org-scoped | org-scoped | manager roles |
| `security_exceptions` | org-scoped | org-scoped | manager roles |
| `control_test_records` | org-scoped | org-scoped | manager roles |
| `threat_register` | org-scoped | org-scoped | manager roles |
| `security_objectives` | org-scoped | org-scoped | manager roles |
| `remediation_programmes` | org-scoped | org-scoped | manager roles |
| `evidence_requests` | org-scoped | org-scoped | manager roles |
| `integration_connectors` | org-scoped | org-scoped | admin only |
| `data_assets` | org-scoped | org-scoped | manager roles |
| `business_processes` | org-scoped | org-scoped | manager roles |
| `management_attestations` | org-scoped | org-scoped | manager roles |
| `control_framework_mappings` | org-scoped | org-scoped | manager roles |

### 4.3 Schema-Level Data Controls

Key data classification and integrity constraints from [supabase/migrations/](supabase/migrations/):

```sql
-- Data classification on assets and data_assets
data_classification TEXT CHECK (
  data_classification IN ('public','internal','confidential','restricted','top_secret')
)

-- Vulnerability severity tied to CVSS
severity TEXT CHECK (severity IN ('critical','high','medium','low','informational'))
cvss_score NUMERIC(4,1)

-- Exception lifecycle enforcement
status TEXT CHECK (status IN ('pending','approved','rejected','expired'))
expiry_date DATE  -- exceptions must be time-bound

-- Framework controls: immutable maturity scale
maturity_level INTEGER CHECK (maturity_level BETWEEN 0 AND 5)
```

`updated_at` triggers are applied on all Tier 2 and Tier 3 tables (migrations 07–08) to maintain an accurate modification timestamp.

### 4.4 Relationship Layer & Control Chain (Migration 09)

Foreign key linkages enforce referential integrity across the control traceability chain:

```
framework_controls
    ├── audit_findings.linked_control_id
    ├── audit_evidence.linked_control_id
    ├── control_test_records.linked_finding_id
    ├── evidence_requests.linked_control_id
    ├── security_exceptions.linked_control_id
    └── control_framework_mappings.source_control_id

cyber_risks
    ├── audit_findings.linked_risk_id
    ├── security_exceptions.linked_risk_id
    └── threat_register.linked_risk_id
```

`control_framework_mappings` provides cross-framework traceability (ISO → NIST → PCI DSS etc.) with `mapping_type` (`direct`, `partial`, `compensating`).

### 4.5 Platform Admin (Migration 10)

```sql
ALTER TABLE profiles ADD COLUMN is_platform_admin BOOLEAN NOT NULL DEFAULT false;
```

Super-admin access is a database flag, not a role string — it is checked server-side via a SECURITY DEFINER function, so it cannot be spoofed client-side.

---

## 5. API Security (Supabase / PostgREST)

### 5.1 JWT Validation

Every request from `supabase-js` carries an `Authorization: Bearer <JWT>` header. PostgREST validates the JWT signature before RLS policies run. Expired or tampered tokens are rejected at this layer before any SQL executes.

### 5.2 Anon Key vs Service Role

The browser bundle holds `VITE_SUPABASE_ANON_KEY` — this is the public anon key, not the service-role key. It can only access what RLS allows for the authenticated user. The service-role key (which bypasses RLS) is **never** shipped to the browser.

### 5.3 Edge Functions

`seed-org-controls` (Deno) runs in Supabase's isolated edge runtime. It is invoked server-side on org creation and requires a valid Supabase service context. CORS headers previously blocked by the `x-application-name` header were fixed in commit `5de13da`.

---

## 6. Frontend Security

### 6.1 Build Pipeline

The Vite build produces a static bundle with no server component. All secrets are environment variables resolved at build time (`VITE_*`). The `.env` file is `.gitignore`'d. Source maps are opt-in only (`build:map` script).

### 6.2 XSS Surface

React escapes all JSX string interpolation by default. One instance of `dangerouslySetInnerHTML` exists in [src/components/ui/chart.tsx:79](src/components/ui/chart.tsx#L79) (Recharts tooltip content). This content comes from the Recharts library internals, not user input — but it is worth auditing if custom tooltip content is ever added.

No `DOMPurify` or equivalent sanitizer is currently imported; this should be added if raw HTML from user-controlled sources is ever rendered.

### 6.3 Content Security Policy

**No CSP headers are configured.** The Vite dev server and production deployment do not define `Content-Security-Policy` headers. This is a gap — without CSP, injected scripts (from a future XSS vector or third-party dependency compromise) would run without restriction.

Recommended policy (to be added at the hosting/CDN layer):
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  connect-src 'self' https://*.supabase.co https://login.microsoftonline.com;
  img-src 'self' data:;
  style-src 'self' 'unsafe-inline';
  frame-ancestors 'none';
```

### 6.4 Auth State Boundary

[src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) redirects unauthenticated users before rendering any page content. The `loading` state prevents a flash of protected content during session hydration.

---

## 7. Offline & PWA Security

### 7.1 Service Worker Caching

[src/sw.ts](src/sw.ts) uses Workbox with the following strategies:

| Cache | Strategy | TTL | Max Entries |
|-------|----------|-----|-------------|
| `api-cache` (Supabase REST) | NetworkFirst | 1 hour | 100 |
| `images` | CacheFirst | 30 days | 50 |
| `static-resources` (JS/CSS/fonts) | StaleWhileRevalidate | none | — |

**Risk:** API cache TTL is 1 hour. If a user's permissions are downgraded, the old (broader) API responses remain in `api-cache` and may be served for up to an hour. Cache invalidation on auth state change is not implemented.

### 7.2 IndexedDB Offline Queue

[src/services/offlineService.ts](src/services/offlineService.ts) queues mutations locally when the network is unavailable:

```
DB: 'cybersecure-offline'
  ├── pending_operations  { id, operation, table, data, timestamp }
  └── offline_data        { table, data[], last_sync }
```

When connectivity returns, `syncPendingOperations()` replays mutations against Supabase using the user's active JWT. Failed operations remain queued indefinitely for retry.

**Risk:** IndexedDB is unencrypted on disk. On a shared or seized device, sensitive GRC data (risk registers, incidents, findings) is readable from the browser profile without authentication. Consider encrypting with a key derived from the user's session (e.g., WebCrypto AES-GCM keyed from the JWT's `sub`).

---

## 8. Integrations

### 8.1 Connector Registry

External tool integrations are stored in `integration_connectors` (migration 07):

| Connector Type | Purpose |
|---------------|---------|
| SIEM | Ingest security events |
| Vulnerability Scanner | Sync CVE/CVSS findings |
| Cloud Provider | Asset and config inventory |
| Ticketing / ITSM | Remediation ticket creation |
| Identity & Access | User provisioning events |
| Endpoint Security (EDR) | Endpoint risk data |
| Email Security | Phishing/threat data |
| Firewall | Network security events |
| Azure AD | SSO, user directory |

### 8.2 Credential Storage — Current State

The `integration_connectors` table stores `api_endpoint TEXT` in plaintext. There is no dedicated `api_key` or `credentials` column with encryption — connector credentials are either absent from the schema or stored in the untyped `config_notes TEXT` field.

**This is the highest-risk data exposure gap in the platform.** API keys for SIEM systems, vulnerability scanners, and cloud providers must never be stored as plaintext database rows.

**Recommended remediation:**

1. Add a `credentials_encrypted` BYTEA column
2. Encrypt at the edge function layer using Supabase Vault (`pgsodium`) before insert
3. Decrypt only at the edge function layer when performing sync — never return to browser
4. Store only metadata (key name, last rotated) in the browser-accessible row

### 8.3 Sync Operations

Sync is manual, hourly, daily, or weekly per connector. `last_sync TIMESTAMPTZ` and `status` fields provide basic health visibility. There is no audit trail of what data was imported from each sync run.

---

## 9. Data Classification Model

The platform enforces a five-tier data classification hierarchy applied at the asset and data-asset level:

| Classification | Description | Examples in platform |
|---------------|-------------|---------------------|
| `public` | No restrictions | Published policies, public controls |
| `internal` | Org-internal only (default) | Risk register, asset list |
| `confidential` | Need-to-know within org | Vulnerability details, pen test reports |
| `restricted` | Strict access control | Personal data, credential records |
| `top_secret` | Most sensitive, limited distribution | Zero-day findings, incident forensics |

Data types tracked in `data_assets`: `pii`, `financial`, `health`, `intellectual_property`, `operational`, `public`, `credential`, `other`.

RLS enforces org-level isolation at all classifications; row-level classification-based access (e.g., only `security_manager` can see `top_secret` rows) is not currently implemented.

---

## 10. Controls Summary

### Implemented Controls

| Control Domain | Control | Mechanism |
|---------------|---------|-----------|
| Authentication | Strong auth with PKCE | Supabase GoTrue + `flowType: 'pkce'` |
| Authentication | SSO federation | Azure AD OAuth2 via Supabase |
| Authentication | Session auto-refresh | `autoRefreshToken: true` |
| Authentication | Secure token storage key | `storageKey: 'sb-auth-token'` |
| Authorization | Multi-tenant data isolation | PostgreSQL RLS + `get_current_org_id()` |
| Authorization | Role-based access | 5-level role model, UI + RLS enforcement |
| Authorization | Platform super-admin | `is_platform_admin` DB flag |
| Authorization | Route protection | `ProtectedRoute` wraps all authenticated pages |
| Data Integrity | Referential integrity | FK constraints across 9 relationship pairs |
| Data Integrity | Cascade deletes | `ON DELETE CASCADE` on all org-scoped tables |
| Data Integrity | Schema constraints | CHECK constraints on all enum columns |
| Data Integrity | Modification timestamps | `updated_at` triggers on Tier 2/3 tables |
| Data Classification | Asset sensitivity tagging | 5-level classification on assets and data assets |
| Resilience | Offline capability | Workbox service worker + IndexedDB mutation queue |
| Secure build | No secrets in bundle | `VITE_*` env vars, `.gitignore` |
| Secure comms | HTTPS enforced | Supabase only exposes HTTPS endpoints |
| Secure comms | App identity header | `x-application-name` on every request |
| Exception management | Time-bound exceptions | `expiry_date` required, status lifecycle |
| Control testing | Testing records | `control_test_records` with evidence + next-test-date |
| Framework coverage | Cross-framework mapping | `control_framework_mappings` table |

### Gaps and Risks

| Ref | Gap | Severity | Location |
|-----|-----|----------|----------|
| G-01 | **No audit log** — no table or service records who changed what | High | Whole platform |
| G-02 | **Plaintext integration credentials** — `api_endpoint` and any keys in `config_notes` stored unencrypted | High | `integration_connectors` table |
| G-03 | **Table name mismatch** — RLS helper uses `user_profiles`; `permissions.ts` and migrations 09–10 use `profiles` | High | `02_rls_policies.sql` vs `10_platform_admin_flag.sql` |
| G-04 | **UI-only role checks** — `RoleBased` component hides UI but does not prevent direct API calls | Medium | `src/components/RoleBased.tsx` |
| G-05 | **No CSP headers** — no `Content-Security-Policy` on any delivery channel | Medium | `vite.config.ts`, hosting config |
| G-06 | **IndexedDB unencrypted** — offline cache stores sensitive GRC data in plaintext | Medium | `src/services/offlineService.ts` |
| G-07 | **API cache not invalidated on auth change** — stale permissions may be served for up to 1 hour | Medium | `src/sw.ts` |
| G-08 | **Weak TypeScript config** — `strictNullChecks: false`, `noImplicitAny: false` allow null-deref bugs | Low–Medium | `tsconfig.json` |
| G-09 | **No rate limiting on auth** — no brute-force protection for email/password login | Medium | Supabase project config |
| G-10 | **No classification-based RLS** — `top_secret` rows readable by any role in the org | Low–Medium | `02_rls_policies.sql` |
| G-11 | **dangerouslySetInnerHTML in chart.tsx** — safe today but creates XSS risk if user data flows through | Low | `src/components/ui/chart.tsx:79` |
| G-12 | **Hardcoded org name in migration 10** — platform admin seeding uses `WHERE name = 'Default Organization'` | Low | `10_platform_admin_flag.sql` |
| G-13 | **Indefinite offline retry** — failed sync operations queue forever with no expiry or dead-letter | Low | `src/services/offlineService.ts:78` |

---

## 11. Remediation Roadmap

### Immediate — Critical

**G-01 Audit Logging**
```sql
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,           -- INSERT | UPDATE | DELETE
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
Implement via PostgreSQL triggers or a middleware wrapper on every Supabase write.

**G-02 Credential Encryption**  
Use [Supabase Vault](https://supabase.com/docs/guides/database/vault) (`pgsodium`) to store connector credentials:
```sql
-- Store
SELECT vault.create_secret('{"api_key": "..."}', 'connector-name');
-- Retrieve (edge function only, never browser)
SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'connector-name';
```
Remove `api_endpoint` storage from browser-accessible rows; keep only metadata.

**G-03 Table Name Alignment**  
Audit whether `user_profiles` and `profiles` are the same table. If not, align all RLS helpers and migration 10 to a single canonical table name.

### High Priority

**G-04 API-Level Authorization**  
Add a PostgREST `pre-request` hook or Supabase edge function middleware that validates role claims from the JWT against the requested operation — providing a server-side authorization layer independent of UI.

**G-05 Content Security Policy**  
Add to hosting configuration (Vercel `vercel.json` or CDN):
```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "Content-Security-Policy",
        "value": "default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co https://login.microsoftonline.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]
  }]
}
```

**G-06 Encrypt IndexedDB**  
Derive an AES-GCM key from the user's JWT `sub` claim using WebCrypto before writing to IndexedDB:
```typescript
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
  await crypto.subtle.importKey('raw', encoder.encode(userId), 'PBKDF2', false, ['deriveKey']),
  { name: 'AES-GCM', length: 256 },
  false, ['encrypt', 'decrypt']
);
```

**G-09 Rate Limiting**  
Enable Supabase Auth rate limiting in the project dashboard (`Auth → Rate Limits`) and set email/password login attempts to ≤ 5/minute per IP.

### Medium Priority

- **G-07** — Clear API cache entries on `SIGNED_OUT` auth event in service worker
- **G-08** — Enable `strict: true` in `tsconfig.json` and fix type errors incrementally
- **G-10** — Add classification-based RLS policies for `restricted` and `top_secret` rows
- **G-13** — Add `retry_count` and `max_retries` to `pending_operations`; move expired entries to a dead-letter store

---

## 12. Key File Reference

| Concern | File |
|---------|------|
| Supabase client + auth init | [src/lib/supabase.ts](src/lib/supabase.ts) |
| Auth context (session, org, role) | [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) |
| Platform admin permission checks | [src/lib/permissions.ts](src/lib/permissions.ts) |
| Route guard | [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) |
| UI role gate component | [src/components/RoleBased.tsx](src/components/RoleBased.tsx) |
| RLS policies (all tables) | [supabase/migrations/02_rls_policies.sql](supabase/migrations/02_rls_policies.sql) |
| Core schema | [supabase/migrations/01_schema_migration.sql](supabase/migrations/01_schema_migration.sql) |
| Tier 2 tables (integrations) | [supabase/migrations/07_tier2_tables.sql](supabase/migrations/07_tier2_tables.sql) |
| Relationship / FK layer | [supabase/migrations/09_relationship_layer.sql](supabase/migrations/09_relationship_layer.sql) |
| Platform admin flag | [supabase/migrations/10_platform_admin_flag.sql](supabase/migrations/10_platform_admin_flag.sql) |
| Offline queue | [src/services/offlineService.ts](src/services/offlineService.ts) |
| Service worker caching | [src/sw.ts](src/sw.ts) |
| TypeScript config | [tsconfig.json](tsconfig.json) |
| Build config | [vite.config.ts](vite.config.ts) |
