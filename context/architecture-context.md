# Architecture Context

## System Overview

This project is an enterprise-grade TOE Visitor Management System (TVMS) designed for factory visitor registration.

The system allows visitors to:

- Scan a check-in QR Code
- Complete a visitor registration form
- Read and acknowledge the Visitor Safety Acknowledgment and Indemnity Form
- Check in
- View their visitor status
- Scan a separate check-out QR Code and confirm check-out when leaving

Administrators can:

- Monitor current visitors
- View visitor history
- Export visitor records
- Manage system settings

The application follows a modern full-stack architecture using Next.js and PostgreSQL.

---

# Technology Stack

| Layer | Technology | Purpose |
|---------|------------|---------|
| Framework | Next.js 16 (App Router) | Full-stack web application |
| Language | TypeScript | Type safety |
| UI | Tailwind CSS + shadcn/ui | Responsive enterprise UI |
| Form Validation | React Hook Form + Zod | Client & server validation |
| ORM | Prisma | Database access |
| Database | PostgreSQL | Relational database |
| Authentication | Better Auth | Admin authentication |
| Session | Secure HTTP Cookie | Visitor session management |
| Excel Export | ExcelJS | Enterprise Excel reports |
| Deployment | Docker Compose | Containerized app, database, and proxy |
| Reverse Proxy | Caddy | HTTPS entry point & reverse proxy |
| SSL | Let's Encrypt (via Caddy) | Automatic HTTPS certificate & renewal |
| Logging | Pino | Application logging |

---

# System Architecture

```

Internet

↓

QR Code

↓

Visitor Portal

↓

Next.js Application

↓

API Layer

↓

Business Logic

↓

Prisma ORM

↓

PostgreSQL Database

↓

Admin Dashboard

```

All business logic must pass through the API layer.

Frontend components must never access the database directly.

---

# Project Structure

```
visitor-management-system/

├── app/
│   ├── (visitor)/
│   ├── admin/
│   ├── api/
│   └── login/
│
├── components/
│
├── lib/
│
├── services/
│
├── prisma/
│
├── middleware.ts
│
├── types/
│
├── utils/
│
└── docs/
```

---

# System Boundaries

## Visitor Module

Responsible for:

- Registration
- Collecting required visitor details: name, IC/passport number, contact number, email, vehicle/no-vehicle selection, vehicle plate number when applicable, company name, purpose of visit, and person to meet/PIC
- Check-in
- Check-out
- Session verification
- Visitor status page
- Static check-out QR entry point
- Check-out confirmation page
- Phone-number check-out lookup for finding a unique active visit
- Required Visitor Safety Acknowledgment and Indemnity acceptance during check-in

Must NOT:

- Access admin features
- Modify historical records
- Export data

---

## Admin Module

Responsible for:

- Dashboard
- Visitor management
- Search
- Statistics
- Excel export
- Settings
- Deployment-aware QR code generation for the visitor check-in and check-out entry points
- Audit logs

Must NOT:

- Modify visitor session tokens
- Bypass security validation

---

## API Layer

Responsible for:

- Input validation
- Business rules
- Database operations
- Session verification
- Authentication
- Authorization

Every database operation must go through the API layer.

---

## Database Layer

Responsible only for data persistence.

Business logic must never exist inside database queries.

---

# Storage Model

## PostgreSQL

Stores:

- Visitor records
- Versioned Visitor Safety Acknowledgment and Indemnity Form text
- Admin accounts
- System settings
- Audit logs
- Session metadata

---

## Browser Cookie

Stores:

- Secure Visitor Session Token

Cookie Requirements:

- HttpOnly
- Secure
- SameSite=Lax
- 24-hour expiration

---

## Browser Session Storage

Stores:

- Temporary in-progress visitor registration draft

Session Storage Requirements:

- Used only to survive accidental page refreshes in the same browser tab
- Cleared after successful check-in or active-session redirect
- Must never store visitor session tokens

---

# Visitor Session Architecture

Each visitor receives:

- Random Session Token
- Unique Visitor UUID

The browser stores only the secure session cookie.

The database stores:

- Visitor UUID
- Session Token Hash
- Check-in status
- Expiration time
- Accepted safety acknowledgment version and server-side acceptance timestamp

Sessions expire automatically after 24 hours.

The check-out QR code is a static deployment URL. It does not contain visitor-specific tokens. Check-out lookup does not depend on the browser session cookie; visitors enter the contact number used during check-in.

Phone-number check-out search must be rate-limited, must only operate when the contact number resolves to exactly one active `CHECKED_IN` visitor, and must never expose session tokens to the browser. If the contact number matches multiple active visits, self-checkout is blocked and the visitor is asked to contact the front desk.

Visitor check-in requires acceptance of the active Visitor Safety Acknowledgment and Indemnity Form. The active form text is stored as a versioned database record. The visitor submits the displayed version id with the acknowledgment checkbox, and the backend validates that the version is still active before creating the visitor record. Visitor records store `safetyAcknowledged`, `safetyAcknowledgedAt`, and the accepted safety acknowledgment version for audit traceability.

After expiration:

- Visitor cannot reuse the same session.
- A new QR scan is required.

---

# Security Boundaries

Visitors:

- Can only access their own session.
- Cannot access other visitor data.
- Cannot access admin routes.

Administrators:

- Must authenticate before accessing protected pages.
- Can access visitor records.
- Cannot bypass audit logging.

All API endpoints must verify permissions.

---

# Data Flow

Visitor

↓

Scan Check-in QR

↓

Registration Form

↓

Safety Acknowledgment

↓

Validation

↓

API

↓

Database

↓

Generate Secure Session

↓

Visitor Status Page

↓

Scan Check-out QR

↓

Check-out Confirmation

↓

Database Update

↓

Session Destroy

---

# API Architecture

API endpoints are organized by feature.

Example:

/api/visitor/check-in

/api/visitor/check-out/lookup

/api/visitor/check-out/confirm

/api/admin/visitors

/api/admin/export

/api/admin/settings

/api/admin/safety-acknowledgment

/api/admin/visitors/[visitorId]

/api/admin/dashboard

Each endpoint must:

- Validate input
- Verify permissions
- Execute business logic
- Return standardized responses

---

# Design Principles

The system follows:

- Clean Architecture
- SOLID Principles
- Separation of Concerns
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- Mobile-first Design
- Secure by Default

---

# Deployment Architecture

The system is deployed Docker-first. The application and database run as
containers orchestrated by Docker Compose. HTTPS termination is handled by an
upstream reverse proxy.

## Primary topology (Option A: host + VM, host terminates HTTPS)

The production environment is a host machine with one shared public IP that
runs a reverse proxy in front of multiple VMs. The host routes each hostname to
the correct VM. TVMS runs in its own VM and serves plain HTTP; the host
terminates HTTPS and forwards HTTP to the VM over the private network.

```
Browser → Host reverse proxy (HTTPS, routes by hostname)
        → TVMS VM: App (Next.js container, HTTP :3000) → PostgreSQL (container)
```

- **App container**: built from the repository `Dockerfile` (multi-stage Node
  build). On start, `docker-entrypoint.sh` runs `prisma migrate deploy` before
  launching `next start`. The Next.js container serves both pages and `/api`
  routes over HTTP. `APP_BIND` binds the published port to the VM's private
  interface so only the host reverse proxy can reach it.
- **PostgreSQL container**: data persisted in a named Docker volume.
- **Host reverse proxy** (nginx/Caddy/etc., not part of this repo): holds the
  certificate, terminates TLS, and must forward `X-Forwarded-Proto: https` and
  `Host`/`X-Forwarded-Host` so the app resolves its correct public identity.
  `BETTER_AUTH_URL` must be the public HTTPS URL.

In this topology the VM runs the **base compose file only**
(`docker-compose.prod.yml`); the Caddy overlay is not used.

## Alternative topology (Option B: standalone VM with its own HTTPS)

For a standalone VM that owns HTTPS directly, the optional Caddy overlay
(`docker-compose.prod.https.yml` + `deploy/Caddyfile`) adds a Caddy container
that obtains and renews a Let's Encrypt certificate and proxies to the app.

Compose files:

- `docker-compose.prod.yml` — base stack (app + postgres). Primary file for
  Option A.
- `docker-compose.prod.https.yml` — optional overlay adding in-VM Caddy
  (Option B only).
- `deploy/Caddyfile` — reverse-proxy and TLS config for the Option B overlay.
- `deploy/prod.env` — production secrets and configuration (git-ignored;
  templated by `deploy/prod.env.example`).

Local development continues to use the root `compose.yaml`, which runs only the
PostgreSQL service on host port `5433`.

Deployment steps are documented in `DEPLOYMENT_GUIDE.md` (Option A, host + VM).
`DEPLOY_VPS_UBUNTU_DOMAIN_HTTPS.md` documents the Option B standalone flow.

---

# Performance Requirements

- Initial page load < 2 seconds
- API response < 500ms (excluding exports)
- Dashboard optimized for 10,000+ visitor records
- Database queries indexed appropriately
- Pagination for all large datasets

---

# Architecture Invariants

The following rules must never be violated:

1. All database access must use Prisma.
2. All business logic must reside in the service layer.
3. Frontend must never directly access the database.
4. Every API endpoint must validate input.
5. Every protected endpoint must verify authentication.
6. Visitor sessions must always use secure cookies.
7. Server time is the only trusted source for check-in and check-out timestamps.
8. Excel exports must be generated server-side.
9. All sensitive operations must be logged.
10. Mobile-first design is mandatory for all visitor-facing pages.
11. Visitor safety acknowledgment acceptance must be recorded with server time and the active version accepted.
