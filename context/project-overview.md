# TOE Visitor Management System

## Overview

TOE Visitor Management System (TVMS) is a mobile-first web application designed to digitize factory visitor registration.

Visitors scan a QR code upon arrival, complete a registration form, and check in to the factory. The system securely records the check-in time, generates a temporary visitor session, and allows visitors to check out when leaving the premises. Administrators can monitor visitors in real time, search historical records, and export professional Excel reports.

The system replaces traditional paper logbooks with a secure, efficient, and enterprise-grade digital solution.

## Goals

1. Allow visitors to register using a QR code without creating an account.
2. Record accurate server-side check-in and check-out timestamps.
3. Prevent duplicate or fraudulent visitor registrations using secure session management.
4. Provide administrators with a centralized dashboard for visitor monitoring.
5. Allow administrators to search, filter, and manage visitor records.
6. Generate professional Excel reports for visitor history and auditing.
7. Deliver a secure, mobile-first, production-ready visitor management platform.

## Core User Flow

1. Visitor arrives at the factory.
2. Visitor scans the factory QR code.
3. Visitor opens the registration page.
4. Visitor completes the registration form.
5. System validates all submitted information.
6. System records the visitor check-in time using the server clock.
7. System creates a secure visitor session.
8. Visitor is redirected to the Visitor Status page.
9. Visitor remains checked in while inside the factory.
10. Visitor presses the Check Out button before leaving.
11. System records the check-out time.
12. Visitor session is destroyed.
13. Administrator can review the completed visitor record from the dashboard.

## Features

### Visitor Registration

- QR code entry point.
- Mobile-first registration form.
- Server-side form validation.
- Visitor information collection: name, IC/passport number, contact number, email, vehicle/no-vehicle selection, vehicle plate number when applicable, company name, purpose of visit, person to meet/PIC, department, and visitor pass ID.
- Secure session creation.
- Automatic server-side check-in timestamp.

### Visitor Check-out

- Visitor status page.
- One-click check-out.
- Automatic server-side check-out timestamp.
- Session termination after successful check-out.

### Session Management

- Secure HttpOnly session cookies.
- 24-hour session expiration.
- Prevention of duplicate submissions.
- Protection against repeated QR code abuse.

### Admin Dashboard

- Dashboard statistics.
- Current visitors.
- Visitor history.
- Search and filtering.
- Visitor detail view.
- Excel export.
- Basic system settings.
- Deployment-aware visitor registration QR code generation for printing.

### Reporting

- Professional Excel export.
- Date range filtering.
- Visitor duration calculation.
- Current visitor statistics.
- Historical visitor reports.

## Scope

### In Scope

- QR code visitor registration
- Visitor check-in
- Visitor check-out
- Secure visitor session management
- Mobile-first responsive interface
- Admin authentication
- Admin dashboard
- Visitor history
- Search and filtering
- Excel report generation
- PostgreSQL data storage
- Secure audit logging

### Out Of Scope

- Visitor account registration
- Visitor self-service history
- Email notifications
- SMS or WhatsApp notifications
- Visitor badge printing
- Multi-factory management
- Facial recognition
- Native mobile applications

## Success Criteria

1. A visitor can successfully register by scanning the QR code.
2. The system records accurate server-side check-in and check-out timestamps.
3. Visitors cannot submit duplicate registrations within the active session.
4. Administrators can monitor visitors currently inside the factory.
5. Administrators can search and review historical visitor records.
6. Administrators can export professional Excel reports.
7. Visitor sessions expire automatically after 24 hours.
8. The application is secure, mobile-first, and ready for production deployment.
