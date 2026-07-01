# Architecture Context

## System Overview

This project is an enterprise-grade TOE Visitor Management System (TVMS) designed for factory visitor registration.

The system allows visitors to:

- Scan a QR Code
- Complete a visitor registration form
- Check in
- View their visitor status
- Check out when leaving

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
| Deployment | Docker | Containerized deployment |
| Reverse Proxy | Nginx | HTTPS & reverse proxy |
| SSL | Let's Encrypt | Secure HTTPS |
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
- Collecting required visitor details: name, IC/passport number, contact number, email, vehicle/no-vehicle selection, vehicle plate number when applicable, company name, purpose of visit, person to meet/PIC, department, and visitor pass ID
- Check-in
- Check-out
- Session verification
- Visitor status page

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
- Deployment-aware QR code generation for the visitor registration entry point
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

Sessions expire automatically after 24 hours.

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

Scan QR

↓

Registration Form

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

Check Out

↓

Database Update

↓

Session Destroy

---

# API Architecture

API endpoints are organized by feature.

Example:

/api/visitor/check-in

/api/visitor/check-out

/api/admin/visitors

/api/admin/export

/api/admin/settings

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
