# Development Workflow

## Approach

Build this project using a specification-driven and incremental workflow.

This project is an enterprise-grade TOE Visitor Management System (TVMS) designed for factory visitor check-in and check-out. Every implementation must strictly follow the project context documents.

Do not invent features, business logic, workflows, or UI behavior that are not explicitly documented.

Prioritize:

- Security
- Reliability
- Maintainability
- Scalability
- Corporate-grade quality

Every implementation should be production-ready.

---

## Scoping Rules

Implement only one feature module at a time.

Examples:

- Visitor Registration
- Check-in Flow
- Check-out Flow
- Session Management
- Admin Dashboard
- Visitor History
- Excel Export
- Authentication
- Settings

Each implementation must:

- Be independently testable
- Have a clear beginning and end
- Not depend on unfinished features
- Be completed before moving to the next module

Avoid implementing multiple unrelated modules simultaneously.

---

## When To Split Work

Split implementation whenever a task contains multiple independent responsibilities.

Examples include:

- Visitor UI and Admin Dashboard
- Frontend and Database redesign
- Authentication and Visitor workflow
- Excel Export and Dashboard Analytics
- Multiple unrelated API endpoints
- UI implementation and infrastructure configuration

If a feature cannot be fully verified within a single development cycle, divide it into smaller units.

---

## Handling Missing Requirements

Never assume business requirements.

If a requirement is ambiguous:

- Stop implementation.
- Update the appropriate context document.
- Resolve the requirement before writing code.

If a requirement is missing:

- Record it inside `progress-tracker.md`
- Mark it as an Open Question
- Wait until the specification is finalized

Do not implement guessed functionality.

---

## Development Order

Always follow this implementation sequence unless explicitly instructed otherwise.

1. Project Foundation
2. Database Schema
3. Authentication
4. Visitor Registration
5. Check-in Logic
6. Session Management
7. Visitor Status Page
8. Check-out Logic
9. Admin Dashboard
10. Visitor History
11. Excel Export
12. Settings
13. Security Hardening
14. Testing
15. Deployment

Do not skip steps unless required.

---

## Protected Foundation Components

Do not modify framework-generated or third-party foundation components unless explicitly instructed.

This includes:

- components/ui/*
- shadcn/ui
- Next.js internal files
- Prisma generated files
- Tailwind base configuration
- Third-party library source code

Project-specific behavior should always be implemented inside application components.

---

## Documentation Synchronization

Whenever implementation changes, immediately update the corresponding project documentation.

Examples include:

- Architecture changes
- Database schema updates
- API modifications
- Security decisions
- UI flow changes
- Business logic updates
- Development progress

Documentation must always represent the current implementation.

Never leave documentation outdated.

---

## Quality Requirements

Every implementation must satisfy the following requirements:

- Clean Architecture
- SOLID Principles
- Mobile-first responsive design
- Enterprise-level coding standards
- Type safety
- Reusable components
- Server-side validation
- Proper error handling
- Logging
- Secure coding practices

Avoid quick fixes or temporary implementations.

---

## Before Moving To The Next Module

Before starting another feature, ensure:

- Current feature is fully functional
- Frontend is complete
- Backend is complete
- Database migration has been verified
- APIs have been tested
- Mobile experience has been verified
- Security requirements are satisfied
- No critical bugs remain
- Documentation has been updated
- `progress-tracker.md` reflects the actual project status

Never continue development with unfinished or unstable modules.

---

## General AI Instructions

As the AI software engineer for this project:

- Follow the project documentation at all times.
- Never invent requirements.
- Never remove existing functionality without approval.
- Prefer maintainable solutions over clever solutions.
- Write production-quality code.
- Explain major architectural decisions when necessary.
- Keep changes focused on the requested scope.
- Ensure every feature is enterprise-ready before marking it as complete.
