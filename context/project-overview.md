# TOE Visitor Management System

## Overview

TOE Visitor Management System (TVMS) is a mobile-first web application designed to digitize factory visitor registration.

Visitors scan a check-in QR code upon arrival, complete a registration form, and check in to the factory. The system securely records the check-in time, generates a temporary visitor session, and allows visitors to check out by scanning a separate check-out QR code when leaving the premises. Administrators can monitor visitors in real time, search historical records, and export professional Excel reports.

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
2. Visitor scans the factory check-in QR code.
3. Visitor opens the registration page.
4. Visitor completes the registration form.
5. Visitor reads the Visitor Safety Acknowledgment and Indemnity Form when needed.
6. Visitor ticks the required safety acknowledgment checkbox.
7. System validates all submitted information and the active safety acknowledgment version.
8. System records the visitor check-in time using the server clock.
9. System records the safety acknowledgment acceptance time and version.
10. System creates a secure visitor session.
11. Visitor is redirected to the Visitor Status page.
12. Visitor remains checked in while inside the factory.
13. Visitor scans the factory check-out QR code before leaving.
14. Visitor enters the contact number used during check-in.
15. System searches for a unique active `CHECKED_IN` visit matching that contact number.
16. Visitor confirms check-out on the check-out confirmation page.
17. System records the check-out time.
18. Visitor session is destroyed.
19. Administrator can review the completed visitor record from the dashboard.

## Features

### Visitor Registration

- Check-in QR code entry point.
- Mobile-first registration form.
- Server-side form validation.
- Visitor information collection: name, IC/passport number, contact number, number of people in the visiting group, email, vehicle/no-vehicle selection, vehicle plate number when applicable, company name, purpose of visit, person to meet/PIC, and department.
- Visitor Safety Acknowledgment and Indemnity Form display with required acknowledgment checkbox.
- Safety acknowledgment acceptance recorded with server-side timestamp and active version.
- Secure session creation.
- Automatic server-side check-in timestamp.

### Visitor Check-out

- Separate check-out QR code entry point.
- Visitor status page without an inline check-out action.
- Check-out confirmation page.
- Phone-number check-out lookup that requires a unique active visit before confirmation.
- Automatic server-side check-out timestamp.
- Session termination after successful check-out.

### Session Management

- Secure HttpOnly session cookies.
- 24-hour session expiration.
- Prevention of duplicate submissions.
- Protection against repeated QR code abuse.
- Rate-limited check-out search attempts.

### Admin Dashboard

- Dashboard statistics.
- Current visitors.
- Visitor history.
- Search and filtering.
- Visitor detail view.
- Excel export.
- Basic system settings.
- Editable English Visitor Safety Acknowledgment and Indemnity Form text with version history.
- Deployment-aware visitor check-in and check-out QR code generation for printing.

### Reporting

- Professional Excel export.
- Date range filtering.
- Visitor duration calculation.
- Current visitor statistics.
- Historical visitor reports.

## Scope

### In Scope

- QR code visitor registration
- Separate visitor check-in and check-out QR codes
- Visitor check-in
- Visitor check-out
- Secure visitor session management
- Mobile-first responsive interface
- Admin authentication
- Admin dashboard
- Visitor history
- Search and filtering
- Excel report generation
- Versioned visitor safety acknowledgment capture
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

1. A visitor can successfully register by scanning the check-in QR code.
2. The system records accurate server-side check-in and check-out timestamps.
3. Visitors cannot submit duplicate registrations within the active session.
4. Administrators can monitor visitors currently inside the factory.
5. Administrators can search and review historical visitor records.
6. Administrators can export professional Excel reports.
7. Visitor sessions expire automatically after 24 hours.
8. The application is secure, mobile-first, and ready for production deployment.
9. A visitor can check out by scanning the check-out QR code and entering the contact number used during check-in.
10. A visitor cannot self-checkout when the contact number matches multiple active visits; the system asks the visitor to contact the front desk.
11. A visitor cannot check in without accepting the active Visitor Safety Acknowledgment and Indemnity Form.
12. Admin users can update the safety acknowledgment text and audit visitor acceptance by timestamp and version.
