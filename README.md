# 🏢 SalaryBox — Internal HR Management Tool

> A unified, role-based HR platform for small to mid-size companies.  
> **Status:** Pre-development — v1 in planning · June 2026

---

## 📋 Overview

SalaryBox replaces fragmented spreadsheets and manual HR processes with a centralized, audit-ready platform. v1 ships two core modules:

| Module | Status |
|---|---|
| Employee Management | 🔵 In Design |
| Attendance & Leave Tracking | 🔵 In Design |
| Payroll & Tax Compliance | ⚪ Deferred to v2 |

---

## 📁 Repository Structure

```
salary-box/
├── docs/
│   ├── prd.md                          # Product Requirements Document (v1.0)
│   ├── screenshots/                    # UI reference screenshots from Salarybox
│   ├── templates/                      # Data import templates (XLSX, CSV)
│   └── design/                         # Wireframes, mockups, design specs
├── apps/
│   ├── web/                            # React + TypeScript frontend (to be scaffolded)
│   └── api/                            # Node.js / FastAPI backend (to be scaffolded)
├── packages/                           # Shared types, utilities (monorepo, future)
├── infra/                              # Docker, CI/CD, deployment configs
├── .github/
│   └── workflows/                      # GitHub Actions CI/CD pipelines
├── .gitignore
└── README.md
```

---

## 🧑‍💼 Personas

| Role | Access Level |
|---|---|
| HR Admin | Full CRUD, policy config, reports |
| Manager / Team Lead | Team attendance, leave approval |
| Employee | Self-service: check-in, leave, history |
| System Admin / IT | Roles, integrations, audit |
| Senior Management | Read-only dashboards |

---

## 🏗️ Tech Stack (Planned)

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend API | Node.js (Express) or FastAPI (Python) |
| Database | PostgreSQL |
| Auth | JWT + Refresh Tokens; optional SSO |
| File Storage | AWS S3 / Cloudflare R2 |
| Notifications | SMTP + Firebase Cloud Messaging |
| Hosting | AWS / Azure (India region) |
| CI/CD | GitHub Actions |

---

## 🗓️ Release Milestones

| Milestone | Deliverable | Target |
|---|---|---|
| M1 — Foundation | Auth, RBAC, Employee CRUD, UI shell | Week 3 |
| M2 — Employee Module | Doc vault, bulk import, lifecycle events | Week 6 |
| M3 — Attendance Core | Check-in/out, shifts, manual HR entry | Week 8 |
| M4 — Leave Module | Leave policies, workflow, balances | Week 10 |
| M5 — Reports & Polish | P0 reports, notifications, UAT | Week 12 |

---

## 📖 Documentation

- [Product Requirements Document](docs/prd.md)
- [UI Screenshots](docs/screenshots/)
- [Bulk Employee Import Template](docs/templates/Salarybox_Bulk_Add_Employee_Template.xlsx)

---

## 🚀 Getting Started (Dev Setup — Coming Soon)

```bash
# Clone
git clone <repo-url>
cd salary-box

# Frontend
cd apps/web
npm install
npm run dev

# Backend
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload
```

> Full setup instructions will be added as the codebase is scaffolded.

---

## 🔐 Security & Compliance

- AES-256 encryption at rest · TLS 1.2+ in transit
- RBAC enforced at API layer
- PII masked in UI & logs
- DPDP Act (India 2023) compliant design
- Audit logs retained 3 years

---

*Confidential — Internal Use Only*
