# Code Standards

## General Principles

The codebase must prioritize:

- Readability
- Maintainability
- Security
- Scalability
- Performance

Write code for long-term maintenance rather than short-term convenience.

Never sacrifice code quality for speed.

---

# Development Philosophy

Follow these principles at all times:

- Clean Architecture
- SOLID Principles
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- Separation of Concerns
- Composition over Inheritance

Avoid unnecessary abstractions.

---

# TypeScript

Strict Mode is mandatory.

Rules:

- Never use `any`
- Prefer `unknown` over `any`
- Always define interfaces or types
- Explicit return types for exported functions
- Prefer interfaces for object contracts
- Prefer enums only when necessary
- Avoid type assertions unless unavoidable

All external input must be validated before use.

---

# Naming Convention

Use descriptive names.

Examples

Variables

```
visitorRecord
sessionToken
checkInTime
adminUser
```

Functions

```
createVisitor()
updateCheckOut()
validateVisitorSession()
exportVisitorExcel()
```

Components

```
VisitorForm.tsx
VisitorStatusCard.tsx
DashboardStats.tsx
```

API Routes

```
/api/visitor/check-in
/api/visitor/check-out/confirm
/api/admin/dashboard
/api/admin/export
```

Database Tables

```
visitors
admins
audit_logs
system_settings
```

Avoid abbreviations unless universally understood.

---

# File Organization

Every file should have one responsibility.

Recommended structure

```
app/
components/
services/
repositories/
lib/
utils/
types/
hooks/
prisma/
```

Rules

Components

Only UI

Services

Business logic

Repositories

Database access

Utils

Pure helper functions

Types

Interfaces

Hooks

React hooks only

Never mix responsibilities.

---

# React Standards

Default to Server Components.

Only use

```
"use client"
```

when required.

Keep components:

- Small
- Reusable
- Focused

Avoid components exceeding approximately 300 lines whenever possible.

Split complex UI into smaller components.

---

# API Standards

Every API endpoint must:

- Validate input
- Authenticate user (if protected)
- Authorize permissions
- Execute business logic
- Return standardized responses
- Log critical events

Never place business logic inside route handlers.

Route handlers should delegate work to the service layer.

---

# Validation

Always validate:

- Request Body
- Query Parameters
- Route Parameters
- Cookies
- Headers

Use Zod for validation.

Never trust client-side validation.

---

# Database Standards

Database access must use Prisma only.

Rules

- Never write raw SQL unless absolutely necessary.
- Always use transactions when modifying related records.
- Use indexes for searchable fields.
- Use UUID as primary keys.
- Never duplicate business logic in queries.

---

# Error Handling

Never expose internal errors.

Bad Example

```
Prisma Error:
Unique constraint failed...
```

Good Example

```
Unable to create visitor record.
Please try again.
```

Log internal errors on the server only.

---

# Logging

Log important events.

Examples

Visitor Checked In

Visitor Checked Out

Admin Login

Excel Export

Failed Authentication

Unexpected Errors

Never log:

Passwords

Session Tokens

Sensitive personal information

---

# Security Standards

Always use:

- HTTPS
- Secure Cookies
- HttpOnly Cookies
- SameSite=Lax
- CSRF Protection
- Rate Limiting
- Input Sanitization
- Output Encoding

Never trust client data.

Always use server time.

---

# UI Standards

The project follows Mobile First design.

Requirements

Responsive

Accessible

Consistent spacing

Consistent typography

Large touch targets

Loading states

Empty states

Error states

Success states

Avoid inconsistent UI patterns.

---

# Performance Standards

Avoid unnecessary renders.

Lazy load large components.

Paginate tables.

Optimize database queries.

Cache when appropriate.

Avoid premature optimization.

---

# Code Comments

Only write comments when necessary.

Good comments explain:

Why

Not

What

Bad

```ts
// Increment i
i++;
```

Good

```ts
// Prevent duplicate visitor sessions after successful check-in
```

---

# Testing Standards

Every completed feature should be tested for:

Normal workflow

Validation

Error handling

Edge cases

Mobile responsiveness

Browser compatibility

---

# Git Standards

Commit messages should be meaningful.

Examples

```
feat: implement visitor check-in flow

fix: prevent duplicate visitor sessions

refactor: simplify dashboard statistics

docs: update architecture context
```

Avoid generic commit messages like:

```
update

fix

changes
```

---

# Code Review Checklist

Before considering any feature complete:

- Code compiles successfully
- No TypeScript errors
- No ESLint errors
- No unused imports
- No console.log statements
- Input validation implemented
- Error handling implemented
- Mobile UI verified
- Documentation updated
- Code follows project architecture

Never merge incomplete or untested code.
