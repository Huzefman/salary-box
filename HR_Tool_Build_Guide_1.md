**INTERNAL HR TOOL**  |  Build Guide & Agent Handbook

**BUILD GUIDE &**

**AGENT HANDBOOK**

Internal HR Tool — How to Build, Branch, and Work Across AI Platforms

|**Field**|**Value**|
| :- | :- |
|Project|Internal HR Tool (SalaryBox-inspired)|
|Stack|React + TypeScript + Tailwind + Supabase|
|Target|10–20 employee companies|
|Roles|Owner, HR, Employee, System Admin|
|Version|v1.0 — June 2026|
|Author|Engineering / Product Team|

# **Part A — Sequential vs Parallel: The Answer**
Build sequentially. One module at a time, fully completed and merged before the next begins.

## **Why Not Parallel?**
The four modules have a hard dependency chain:

|**Module**|**Depends On**|
| :- | :- |
|Employee Management|Nothing — this is the foundation|
|Attendance Tracking|Employees must exist (foreign keys, RLS policies, seed data)|
|Leave Management|Employees + Attendance records (leave balance tied to attendance)|
|Reports & Analytics|All three modules must have real data to query|

Building attendance before employees are stable means constantly fixing the foundation while building the floor above it. Every schema change in employees ripples into attendance tables, RLS policies, TypeScript types, and seed data. That compounds fast.

|**ℹ**|One active feature branch at a time. Branches are workspaces, not separate applications. Supabase is a single project throughout — all modules share the same database, auth, and storage. Syncing is just merging a branch into dev, which Git handles cleanly as long as you're not building in parallel.|
| :-: | :- |

## **Module Build Order**

|**Order**|**Module**|**PRD Milestone**|
| :- | :- | :- |
|1|Auth + RBAC + Project Setup|M1|
|2|Employee Management (full)|M1 → M2|
|3|Attendance Tracking (full)|M3|
|4|Leave Management (full)|M4|
|5|Reports, Notifications, Polish|M5|

# **Part B — Phase 0: Before Writing Any Code**
Every item here prevents a category of pain later. Do all of this before touching a component.

## **B.1 Repository Documents to Create**
These are your agent context files. Any AI agent on any platform reads these and gets fully up to speed without scanning the whole repo.

|**File**|**Purpose**|**Update Frequency**|
| :- | :- | :- |
|AGENTS.md|Single entry point for every AI agent. Stack, roles, current status, critical rules, what not to do.|Every session|
|PRD.md|Product requirements (already done — rename your existing file).|On scope changes only|
|SCHEMA.md|Full DB schema with column types, foreign keys, and RLS rules per table.|When schema changes|
|CONVENTIONS.md|Naming rules, file structure, branch strategy, commit format, code style.|Rarely|
|ENV.md|All environment variables (keys only, no values). Description of each.|When new vars are added|
|PROGRESS.md|Running log: what's built, what's in progress, what's broken, last decision made.|Every session|

### **AGENTS.md — Exact Structure to Use**
This is the most important file. Structure it exactly like this:

\# HR Tool — Agent Context File  ## What this is Internal HR webapp. Stack: React + TypeScript + Tailwind + Supabase. No separate backend. Supabase is the entire backend (DB, Auth, Storage, Edge Functions, Realtime).  ## Current status  ← UPDATE THIS EVERY SESSION Last updated: DD/MM/YYYY Active branch: feature/employee-module Just completed: Employee CRUD form (P0 fields only) Next task: Document upload to Supabase Storage Known issues: None  ## Roles (4 only) Owner > HR > Employee > System Admin RLS enforced at DB level. Never bypass RLS in frontend code.  ## File structure src/   components/ui/        ← generic (Button, Input, Modal, Table)   components/modules/   ← feature-specific (EmployeeCard, LeaveForm)   pages/   hooks/                ← useEmployees, useLeave, useAttendance   lib/supabase.ts       ← single client instance, import from here only   types/                ← index.ts + database.types.ts (auto-generated)   utils/   constants/  ## Critical rules - Never install axios. Use supabase-js client or native fetch. - Never create an Express/FastAPI server. - Never use localStorage for auth (Supabase handles sessions). - All DB access via supabase-js. Never raw SQL from frontend. - RLS policies exist for every table. Test per role after every feature. - Regenerate types after every schema change: npx supabase gen types typescript  ## Branch rules main ← protected, production only dev  ← integration, always working feature/[module-name] ← one branch per PRD module fix/[short-desc] ← short-lived, branch from dev  ## What NOT to do - Do not write a backend server - Do not skip RLS policies - Do not use any auth library other than Supabase Auth - Do not mix two feature modules in one branch

|**⚠**|The first message to any agent in any session should be: "Read AGENTS.md and PROGRESS.md. Tell me what you understand before writing any code." Don't let it start building until it has confirmed the stack and current state.|
| :-: | :- |

## **B.2 Supabase Schema First**
Design the complete schema before building any UI. Put it in SCHEMA.md. Changing schema mid-build with RLS is painful — you'll be regenerating types, rewriting policies, and fixing seed data constantly.

Tables to define before Day 1 of coding:

|**Table**|**Key Fields**|**Notes**|
| :- | :- | :- |
|employees|id, name, email, department\_id, designation\_id, manager\_id, role, status, join\_date|Core master table. All other tables reference this.|
|departments|id, name, parent\_id|Self-referencing for tree structure (max 3 levels).|
|designations|id, name, department\_id|Maps to departments.|
|attendance\_records|id, employee\_id, date, check\_in, check\_out, status, shift\_id|One row per employee per day.|
|shifts|id, name, start\_time, end\_time, break\_minutes, weekly\_off\_days|Assigned per department or per employee.|
|leave\_types|id, name, accrual\_type, max\_carry\_forward, allow\_negative|Configurable per company.|
|leave\_balances|id, employee\_id, leave\_type\_id, balance, year|Updated on approval.|
|leave\_applications|id, employee\_id, leave\_type\_id, from\_date, to\_date, status, approved\_by|Status: pending/approved/rejected/cancelled.|
|holidays|id, date, name, type|Type: national/state/company.|
|audit\_logs|id, table\_name, record\_id, action, actor\_id, old\_data, new\_data, timestamp|Every mutation logged here.|

For each table in SCHEMA.md, document:

- Column names, types, nullable/required
- Foreign key references
- RLS policy: who can SELECT / INSERT / UPDATE / DELETE
- Example: employees — Owner: all rows. HR: all rows. Employee: own row only. System Admin: read-only all rows.

## **B.3 Branch Strategy**
main                        ← production-ready only (protected) └── dev                     ← integration branch, always in working state     ├── feature/auth-rbac     ├── feature/employee-module     ├── feature/attendance-module     ├── feature/leave-module     ├── feature/reports-polish     └── fix/[short-description]

|**Rule**|**Reason**|
| :- | :- |
|Never commit directly to main or dev|main = production. dev = always deployable. Direct commits skip review and can break things for everyone.|
|One feature branch per PRD module|Keeps diffs small and reviewable. Mixing modules in one branch makes rollback impossible.|
|Branch from dev, merge back into dev|Feature branches should always be created from the latest dev, and PRs go back to dev — not main.|
|dev → main only at milestone completion|Matches your M1–M5 milestones. main should always reflect a deployable, tested milestone.|
|Fix branches are short-lived|Create, fix, merge within the same day or session. Don't let fix branches sit open.|
|Delete branches after merge|Keeps the repo clean. Merged branches are preserved in Git history anyway.|

## **B.4 Pre-Coding Checklist**

|**Item**|**Done?**|
| :- | :- |
|AGENTS.md written and committed|☐|
|SCHEMA.md written with all tables + RLS policies|☐|
|CONVENTIONS.md written (naming, file structure, branch rules, commit format)|☐|
|ENV.md written (all keys listed, no values, descriptions)|☐|
|PROGRESS.md template created|☐|
|Supabase project created (ap-south-1 Mumbai region)|☐|
|GitHub repo folder structure scaffolded|☐|
|Branch dev created, feature/auth-rbac branched off it|☐|
|Seed script drafted (1 Owner, 1 HR, 5 Employees, 2 departments)|☐|
|SalaryBox screenshots organised in /docs/screenshots/ by module|☐|

# **Part C — Step-by-Step Build Order**
Within each milestone, always build in this order: schema → types → data hook → UI → wire up → test per role. Never skip the role test.

|**⚠**|Important: Every milestone covers both the admin/HR side AND the employee self-service side. These are the same routes rendered differently by role — not separate apps. Never finish a milestone with only the admin side built.|
| :-: | :- |

## **M1 — Foundation (Week 1–3)**
Branch: feature/auth-rbac

### **Infrastructure**
1. Create Supabase project. Set region to ap-south-1 (Mumbai).
1. Design and create all tables in Supabase (schema first, from SCHEMA.md).
1. Write RLS policies for every table immediately after creation.
1. Run: npx supabase gen types typescript --project-id [id] > src/types/database.types.ts
1. Create src/lib/supabase.ts — single client instance. All other files import from here.
1. Set up Tailwind config with brand colours and spacing tokens.

### **Admin / HR Side**
1. Login page (email + password via Supabase Auth).
1. Session handling — protect all routes, redirect unauthenticated users.
1. Role detection — read user role from employees table on login, store in context.
1. Sidebar shell: nav items vary by role. Owner + HR see all sections. Employee sees limited nav.
1. Placeholder routes for all modules (ComingSoon component) — routes exist from Day 1.
1. Department and designation management pages (Owner/HR only).

### **Employee Self-Service Side**
1. Same login page — role detected on login, redirected to role-appropriate dashboard.
1. Forced password change on first login.
1. Employee dashboard shell — simplified layout, only their nav items visible.
1. Onboarding checklist view — employee sees their pending onboarding tasks.

### **Sign-off Gate**

|**⚠**|Do not move to M2 until: all 4 roles can log in, each sees only their permitted nav items, and RLS blocks data access correctly per role. Test this explicitly with the seed data.|
| :-: | :- |

## **M2 — Employee Module (Week 4–6)**
Branch: feature/employee-module  |  Branch off dev after M1 is merged

### **Admin / HR Side**
1. Employee list page — full table, filterable by department, status, employment type. Add + bulk import buttons.
1. Add employee form — multi-step: Personal Info, Job Details, Documents, Bank Details.
1. Document vault — upload to Supabase Storage. Presigned URLs. RLS on storage bucket.
1. Employee profile page (admin view) — all fields editable, activity timeline, lifecycle event buttons.
1. Lifecycle events — promotion, transfer, resignation, termination. Each writes to audit\_logs.
1. Bulk import — CSV/XLSX upload, row validation, error CSV download for failed rows.
1. Org chart — tree rendered from reporting HR field. Clickable nodes.
1. Search + export (CSV, XLSX) with configurable column selection.

### **Employee Self-Service Side**
1. My Profile page — employee views their own details (read-only for most fields).
1. Profile edit request — employee can request a change (name, phone, address). HR sees request and approves/rejects.
1. Own photo upload — writes directly to their profile.
1. My Documents — employee views their own uploaded documents (Aadhar, PAN, offer letter). Cannot delete.

### **Sign-off Gate**

|**⚠**|Test: Employee logs in and can only see their own profile. Cannot see the employee list. Cannot access any other employee's documents. Owner sees all. HR sees all.|
| :-: | :- |

## **M3 — Attendance Module (Week 7–8)**
Branch: feature/attendance-module  |  Branch off dev after M2 is merged

### **Admin / HR Side**
1. Shift management — create named shifts, assign defaults per department, override per employee.
1. Team attendance calendar — monthly view, all employees, colour-coded status per day.
1. Manual attendance entry — HR/Owner only, past date, mandatory reason field.
1. Regularization approvals — queue of pending requests from employees, approve/reject with comment.
1. Overtime approvals — flag and approve overtime hours.
1. Late mark config — grace period and threshold settings.
1. Auto-checkout Edge Function — Supabase scheduled function at 11:59 PM, flags Incomplete status.

### **Employee Self-Service Side**
1. Check-in / check-out button on employee dashboard — prominent, one tap. Timestamped server-side.
1. My Attendance page — monthly calendar view of own records, colour-coded per day.
1. Drill-down on a day — see exact check-in/out times, shift, computed hours.
1. Regularization request form — select date, explain reason, submit. Status tracked.
1. Incomplete attendance prompt — shown next morning if forgot to check out.

### **Sign-off Gate**

|**⚠**|Test: Employee can check in/out but cannot edit own attendance. Employee can submit regularization but cannot approve it. HR sees team calendar, not just their own record.|
| :-: | :- |

## **M4 — Leave Module (Week 9–10)**
Branch: feature/leave-module  |  Branch off dev after M3 is merged

### **Admin / HR Side**
1. Leave type configuration — create/edit leave types, accrual rules, carry forward, negative balance rules.
1. Holiday calendar management — add national, state, company holidays. Auto-seeded for India.
1. Leave balance initialisation — credit balances per employee per leave type.
1. Leave approval queue — pending applications with approve/reject and comment.
1. Leave cancellation re-confirmation — HR must confirm before an approved leave is cancelled.
1. Comp-off approval — review and credit comp-off balance.
1. Team leave calendar — company-wide, filterable by department, colour-coded by leave type.
1. Leave balance expiry alerts — Edge Function triggers 30 days and 7 days before expiry.

### **Employee Self-Service Side**
1. Leave dashboard — balance cards per leave type, prominently displayed.
1. Apply leave form — select type, date range (holidays auto-excluded), live balance update, reason, attachment.
1. Working day count shown before submission — 'You are applying for X working days'.
1. My leave history — all applications with status, approver name, rejection reason.
1. Cancel leave — pending: immediate. Approved future: triggers HR re-confirmation flow.
1. Comp-off request form — select the extra-work date, submit for HR approval.
1. Leave lapse notification — employee receives email 30 and 7 days before carry-forward expiry.

### **Sign-off Gate**

|**⚠**|Test: Employee applies for leave spanning a public holiday — holiday must not be counted. Employee with 0 balance sees blocked message (if negative disallowed). HR approval updates balance immediately.|
| :-: | :- |

## **M5 — Reports, Notifications & Polish (Week 11–12)**
Branch: feature/reports-polish  |  Branch off dev after M4 is merged

### **Admin / HR Side**
1. All P0 reports: Monthly Attendance Summary, Absenteeism Report, Leave Balance Report, Headcount Report, Regularization Log.
1. Department Attendance Heatmap chart.
1. All notifications wired: Resend/SendGrid via Edge Functions for all triggers in PRD Section 10.
1. In-app notification bell — Supabase Realtime, shows unread count, dropdown list.

### **Employee Self-Service Side**
1. My Attendance Report — employee can export their own monthly attendance as CSV.
1. My Leave Summary — visual summary of leaves taken vs balance remaining per type.
1. In-app notification bell — same component, employee sees only their own notifications.

### **Polish — Both Sides**
1. Mobile responsiveness audit — test every page at 375px width for both admin and employee views.
1. WCAG 2.1 AA audit on primary flows: check-in, leave application, login.
1. UAT with real users — Owner, HR, and at least 2 employees on actual devices.
1. Fix all UAT bugs on fix/ branches.
1. Merge dev → main. Tag v1.0 release.

# **Part D — Working Across AI Agent Platforms**
This is where most people lose sessions of work. Follow this protocol exactly.

## **D.1 Ending Every Session**
Before closing any session — regardless of platform:

1. Update the 'Current status' block in AGENTS.md.
1. Update PROGRESS.md with: what was completed, what was left mid-way, any decisions made (even small ones like 'decided to use date-fns over dayjs').
1. Leave a // TODO: [exact next step] comment in the exact file and line where you stopped.
1. Commit everything to the feature branch — even broken or incomplete work.

\# Good commit messages for mid-session work: git commit -m 'wip: employee form step 1 done, step 2 not started' git commit -m 'wip: leave application form — date range picker broken, see TODO in LeaveForm.tsx:87' git commit -m 'feat: employee CRUD complete, all RLS tested'  # Bad: git commit -m 'progress' git commit -m 'stuff'

## **D.2 Starting Every Session**
First message to any agent on any platform, every time:

Read AGENTS.md and PROGRESS.md first. Then read [specific file you were working in]. Tell me what you understand — the stack, current status, and what to build next — before writing any code.

|**✗**|Never let an agent start building until it has confirmed: the stack (Supabase only, no separate backend), the 4 roles and RLS model, the active branch, and what was done last session. If it skips this and starts coding immediately, it will hallucinate context.|
| :-: | :- |

## **D.3 Platform-Specific Tips**

|**Platform**|**Best For**|**Tips**|
| :- | :- | :- |
|Cursor / Windsurf|File-level coding, autocomplete, refactoring|Add @AGENTS.md explicitly in every chat. Use composer for multi-file changes. Tag the specific file you're working on.|
|Claude (claude.ai)|Architecture decisions, PRD/doc writing, complex logic design, debugging reasoning|Paste the relevant PROGRESS.md section + the file at session start. Best for designing RLS policies and Edge Function logic before coding.|
|GitHub Copilot|Inline autocomplete within files|Not ideal for architecture. Best used after a Claude session has designed the approach. Let it fill in boilerplate.|
|v0 / Bolt / Lovable|Rapid UI scaffolding from screenshots|Use SalaryBox screenshots as input. Treat output as a first draft — always review for RLS compliance and Supabase client usage before committing.|

## **D.4 Single-Responsibility Sessions**
One session = one component or one table's worth of work. Examples:

|**Good session scope**|**Bad session scope**|
| :- | :- |
|Build the EmployeeForm component (step 1 only)|Build the entire employee module|
|Write RLS policies for the leave\_applications table|Write all RLS policies for all tables|
|Wire up the leave approval notification Edge Function|Build the entire leave module|
|Fix the date range picker bug in LeaveForm.tsx|Fix all known bugs|

|**⚠**|If you ask an agent to build an entire module in one shot, it will: invent schema that doesn't match yours, skip RLS, use localStorage for auth, install axios, and create a mock Express server. Narrow scope = reliable output.|
| :-: | :- |

## **D.5 Token Exhaustion Protocol**
When a platform's context window or token limit is hit mid-task:

1. Before the session ends (if you notice context is getting long): ask the agent to summarise what it has done and what remains. Copy that summary into PROGRESS.md.
1. Commit the current state with a wip: commit message.
1. On the new platform/session: start with the standard opening message (read AGENTS.md + PROGRESS.md), then paste the summary from step 1.
1. Ask the agent to confirm its understanding before continuing.

|**ℹ**|Never paste large amounts of code into the opening message to 'restore context'. It wastes tokens and confuses the agent. Let AGENTS.md and PROGRESS.md do the work — that's what they're for.|
| :-: | :- |

# **Part E — Files to Create Right Now**
Create these files in your repo root before writing any code. Templates below.

### **PROGRESS.md — Template**
\# Progress Log  ## Current State Date: [today] Active branch: [branch name] Milestone: M1  ## Completed - [list items]  ## In Progress - [what was being built when session ended] - Stopped at: [file:line or description]  ## Pending (this milestone) - [list items]  ## Decisions Made - [date]: Used date-fns for date manipulation (not dayjs) - [date]: Leave balance stored as integer (half-days multiplied by 2)  ## Known Issues - [any bugs or blockers]

### **CONVENTIONS.md — Key Rules to Include**
\# Conventions  ## File naming Components: PascalCase (EmployeeForm.tsx) Hooks: camelCase with 'use' prefix (useEmployees.ts) Utils: camelCase (formatDate.ts) Pages: kebab-case folders (employee-management/index.tsx)  ## Supabase client Single instance only: import { supabase } from '@/lib/supabase' Never create a new client in a component.  ## TypeScript Never use 'any'. Use database.types.ts for DB types. All props must be typed.  ## Commits feat: new feature fix: bug fix wip: work in progress (not complete) chore: config, deps, tooling docs: documentation only  ## Branches Branch from: dev Merge into: dev main is touched only at milestone completion.

### **ENV.md — Template**
\# Environment Variables Never commit actual values. Add all to .env.local (gitignored).  NEXT\_PUBLIC\_SUPABASE\_URL=         # Your Supabase project URL NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=    # Public anon key (safe to expose in client) SUPABASE\_SERVICE\_ROLE\_KEY=        # Secret — server/Edge Function use only. NEVER in client code. RESEND\_API\_KEY=                   # For transactional emails via Edge Functions  # Add new variables here as they are introduced

# **Part F — Using Screenshots Instead of Figma**
AI agents don't need Figma files. Screenshots are sufficient and in some cases faster to work from.

|**Approach**|**When to Use**|
| :- | :- |
|Screenshot → React component|Hand the screenshot to Claude or v0 with the instruction: 'Build this as a React component using Tailwind. Use Supabase client for data. No mock data.' Review output for RLS compliance before committing.|
|Existing Figma file|Use for the main layout shell and navigation (already built). Reference via inspect mode for exact spacing, colors, and font sizes — map these to Tailwind config.|
|SalaryBox screenshots as spec|Organise in /docs/screenshots/[module-name]/. Reference them during development as the visual target. No need to rebuild in Figma.|

|**✓**|You do not need to complete the remaining Figma screens. For an internal 10–20 person tool, screenshots + PRD is sufficient specification. Build directly from screenshots using AI agents.|
| :-: | :- |

# **Summary — The Rules That Matter Most**
1. Build sequentially: Employee → Attendance → Leave → Reports. Each fully done before the next begins.
1. One active feature branch at a time. Branch from dev, merge back to dev.
1. AGENTS.md and PROGRESS.md are updated every session, no exceptions.
1. Every session starts: 'Read AGENTS.md and PROGRESS.md. Tell me what you understand first.'
1. Schema + RLS before UI. Types regenerated after every schema change.
1. Test all 4 roles after every feature. RLS bugs found late are expensive.
1. One session = one component or one table. Never 'build the whole module' in one shot.
1. Commit everything at session end, even broken work, with a clear wip: message.
1. Screenshots are sufficient spec. You don't need Figma for the remaining screens.
1. Supabase is the entire backend. No Express, no FastAPI, no separate server.

*— End of Document —*
Confidential — Internal Use Only	Page 1
