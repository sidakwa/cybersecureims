# CyberSecureIMS

**Enterprise Cybersecurity GRC Platform** — Integrated Management System for Governance, Risk, Compliance, Audit & Controls.

## ✨ Features

- **Executive Dashboards** – Compliance scorecard, priority actions, programme overview
- **Audit Management** – Full audit portfolio, findings, evidence library, action tracking
- **GRC Core** – Statement of Applicability, Policies, Regulatory Register, Training
- **Risk Management** – Cyber risk register, vulnerabilities, vendor risk
- **Control Assurance** – UCI Controls, CSI Work Packages
- **Multitenancy & RBAC** – Full tenant isolation and role-based access
- **Bulk Import** + **Analytics**

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend**: Supabase (PostgreSQL + RLS + Edge Functions)
- **Deployment**: Vercel

## Quick Start

```bash
git clone https://github.com/sidakwa/cybersecureims.git
cd cybersecureims
cp .env.example .env.local
npm install
npm run dev

Project Structure
textsrc/
├── components/     # Domain-specific components
├── pages/          # Main feature pages
├── data/           # Repositories, hooks, services
├── lib/            # Utilities
└── contexts/       # Auth & Tenant context
License
MIT License


# cybersecureims
