# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Product Completion

## Current Goal

- None active.

## Completed

- Design system foundation configured with shadcn/ui, shared Tailwind design tokens, and `cn()` utility.
- Docker PostgreSQL and Prisma database foundation files are implemented.
- Initial Prisma migration applied successfully to Docker PostgreSQL on host port `5433`.
- Authentication foundation configured with Better Auth, protected admin routing, login page, and seeded local admin user.
- Frontend shell pass completed for the public entry screen, admin sign-in, protected admin dashboard, and sign-out flow.
- Visitor Registration implemented with mobile form, validated check-in API, service/repository database boundary, audit log creation, and HttpOnly visitor session cookie creation.
- Visitor session management implemented with active cookie validation, duplicate registration prevention, and automatic expired-session handling.
- Visitor status and check-out implemented with server-clock check-out timestamp, session destruction, audit logging, and cookie clearing.
- Admin dashboard implemented with statistics, visitor history, search/filtering, pagination, and protected Excel export.
- Basic settings visibility added to the admin dashboard for session duration and export format.
- Visitor registration fields aligned to collect name, IC/passport number, contact number, email, vehicle/no-vehicle selection, vehicle plate number when applicable, company name, purpose of visit, and person to meet/PIC.
- Index route `/` now renders the visitor registration page directly, with `/register` kept as the same registration experience.
- Navigation/header bars removed from visitor registration, visitor status, and admin screens.
- Visitor checked-in screen restyled as the approved green pass card.
- Visitor check-out now redirects to a dedicated checked-out success screen.
- Admin control center restyled with sidebar navigation, dashboard metrics/trends, visitor filters/sort/delete, export screen, persisted settings, and audit log view.
- Settings QR code generation added for printable visitor registration entry.
- Project README and beginner VPS deployment guide added.
- IP-address-only VPS deployment guide added.
- Admin route proxy and server session checks support secure signed Better Auth cookies.
- Resolved post-rebase conflict markers that were blocking production builds.
- Admin visitor history View action opens a full visitor detail dialog.
- Excel export check-in and check-out times match the admin dashboard display format.
- Production hardening pass added security headers, stricter API parsing, safer login redirects, focused admin data loading, and a health check endpoint.
- Visitor registration number-of-people capture was previously added and has since been removed from the active app flow.
- Admin visitor detail modal now uses responsive sizing with a wider desktop layout and mobile-safe viewport bounds.
- Visitor check-in and check-out now have separate static QR entry routes: `/check-in` and `/check-out`.
- Visitor checked-in status no longer shows an inline check-out button; visitors are instructed to scan the exit check-out QR.
- Visitor check-out now uses a dedicated confirmation page that searches for a unique active visit by contact number before allowing check-out.
- Admin Settings QR generation now produces separate printable/downloadable check-in and check-out QR codes.
- Visitor check-out search is rate-limited and requires a unique active `CHECKED_IN` visitor for the submitted contact number before checkout can be confirmed.
- Visitor Pass ID has been removed from registration, storage, visitor screens, admin views, exports, and checkout search.
- Check-out database indexes now support contact number and status lookup.
- Phone-number checkout flow verified with check-in, lookup, confirm, repeated-confirm conflict, removed cookie-route check, and ambiguous same-phone blocking.
- Admin Settings QR generation now converts localhost check-in/check-out URLs to the server machine's internal IPv4 address when available.
- Visitor registration now saves an in-progress draft to browser session storage so accidental mobile page refreshes do not wipe the form.
- Next.js local development now allows the server machine's private IPv4 origins so QR pages opened from phones can load dev assets and hydrate client-side forms.
- Visitor Safety Acknowledgment and Indemnity capture added to check-in with required visitor acceptance, server-side version validation, and admin-visible audit fields.
- Visitor-facing Safety Acknowledgment UI hides the visible version label while preserving backend version validation and audit capture.
- Visitor-facing Safety Acknowledgment title now opens the full acknowledgment modal directly, replacing the separate Read button.
- Admin dashboard copy has been cleaned for production by replacing technical helper text, raw audit event names, JSON metadata indicators, deployment wording, and session terminology with operational language.

## In Progress

- None yet.

## Next Up

- Security hardening and deployment packaging.

## Open Questions

- None currently.

## Architecture Decisions

- Use shadcn/ui with Tailwind CSS v4 tokens in `app/globals.css`.
- Keep generated `components/ui/*` files unmodified after generation; project theme customization lives in global CSS tokens.
- Use `lib/utils.ts` as the shared `cn()` helper for Tailwind class merging.
- Use Docker Compose for the local PostgreSQL database.
- Bind local PostgreSQL to host port `5433` and container port `5432` to avoid the existing host `5432` conflict.
- Use Prisma 7 with `prisma.config.ts` datasource configuration and the PostgreSQL driver adapter.
- Use Better Auth for admin authentication with public sign-up disabled.
- Use Next.js 16 `proxy.ts` to redirect unauthenticated `/admin` requests to `/login`.
- Use `/api/visitor/check-in` as the visitor registration mutation endpoint.
- Store only hashed visitor session tokens in PostgreSQL and issue the raw visitor session token only through an HttpOnly `visitor_session` cookie.
- Use `/api/visitor/check-out/lookup` and `/api/visitor/check-out/confirm` as the visitor check-out search and confirmation endpoints.
- Use `/check-in` as the explicit visitor check-in QR landing page while keeping `/` and `/register` compatible with the same registration experience.
- Use `/check-out` as the static visitor check-out QR landing page; it must not embed visitor-specific session tokens in the QR code.
- Check-out QR lookup does not depend on the `visitor_session` cookie; visitors enter the contact number used during check-in.
- Phone-number checkout search is rate-limited and blocks self-checkout when the contact number matches multiple active visits.
- Use `/api/admin/export` as a protected server-side Excel export endpoint.
- Use `/api/admin/settings` as the protected settings update endpoint.
- Use `/api/admin/visitors/[visitorId]` as the protected visitor deletion endpoint.
- Use `/api/health` as a no-store application health endpoint for deployment/process checks.
- Visitor registration collects name, IC/passport number, contact number, email, vehicle/no-vehicle selection, vehicle plate number when applicable, company name, purpose of visit, and person to meet/PIC.
- Visitor check-in requires the active Visitor Safety Acknowledgment and Indemnity Form to be accepted and records the accepted version and server timestamp.
- Use `safety_acknowledgment_versions` to publish editable English safety acknowledgment text; every admin edit creates a new active version and preserves older versions for audit traceability.

## Session Notes

- Completed design system foundation implementation from `context/feature-specs/01-design-system.md`.
- Installed/configured shadcn/ui and generated Button, Card, Dialog, Input, Label, Select, Textarea, Table, Badge, Separator, Sheet, DropdownMenu, AlertDialog, Calendar, Popover, Form, Skeleton, and Sonner components.
- Added required dependencies including Lucide React, class variance utilities, class merging utilities, and form dependencies required by the generated Form component.
- Verified `npm run lint` and `npm run build` pass.
- Started Docker PostgreSQL and Prisma database foundation implementation.
- Added Docker Compose PostgreSQL service, Prisma schema, Prisma config, Prisma Client singleton, database scripts, and local env template.
- Verified `docker compose config`, `npm run db:validate`, `npm run db:generate`, `npm run lint`, and `npm run build`.
- `docker compose up -d postgres` pulled `postgres:16-alpine` and created the container, network, and volume, but startup failed because host port `5432` is already allocated by `com.docker.backend` (PID 19864). `prisma migrate dev --name init` is pending until the database container can bind a usable host port.
- Updated Docker PostgreSQL host binding and local `DATABASE_URL` from `5432` to `5433`.
- Recreated and started the Docker PostgreSQL container on `localhost:5433`; container is healthy.
- Applied Prisma migration `20260630100547_init`.
- Re-verified `npm run db:validate`, `npm run db:generate`, `npm run lint`, and `npm run build`.
- Installed Better Auth, added auth API route, client helper, login page, protected admin placeholder, and admin route proxy.
- Applied Prisma migration `20260630101812_add_better_auth`.
- Added `npm run auth:seed-admin` for provisioning the initial local admin account from env variables.
- Seeded local admin auth user `admin@example.com`.
- Verified unauthenticated `/admin` redirects to `/login?callbackUrl=%2Fadmin`, `/api/auth/get-session` returns `null` without a session, and credential sign-in succeeds for the seeded admin.
- Replaced the placeholder home page with a token-backed operational entry screen.
- Improved admin login form polish, disabled submitting fields while signing in, and preserved protected callback navigation.
- Added protected admin dashboard shell content plus a client-side sign-out control.
- Updated application metadata from the generated Next.js defaults to TOE Visitor Management System.
- Verified `npm run lint` and `npm run build` pass after the frontend shell changes.
- Implemented visitor registration page at `/register`.
- Added shared Zod validation for visitor registration payloads.
- Added visitor registration service and repository so database writes stay out of UI and route handlers.
- Added `/api/visitor/check-in` route handler with server-side validation, server-clock check-in timestamp, visitor/session/audit database writes, and 24-hour HttpOnly visitor session cookie issuance.
- Added temporary visitor status page at `/visitor/status` after successful registration.
- Linked the home page primary visitor action to `/register`.
- Verified Docker PostgreSQL is healthy, `npm run db:validate`, `npm run lint`, and `npm run build` pass.
- Smoke-tested `POST /api/visitor/check-in`; the endpoint returned `201`, created a `CHECKED_IN` visitor, and set the visitor session cookie.
- Added active visitor session validation and duplicate active registration prevention.
- Added the original `/api/visitor/check-out` cookie-based route handler, later replaced by phone-number lookup and confirmation endpoints.
- Replaced the temporary visitor status page with a session-aware page showing visitor details and check-out action.
- Added admin dashboard statistics, visitor history search/filtering, pagination, status badges, and basic settings visibility.
- Installed ExcelJS and added protected server-side `.xlsx` export at `/api/admin/export`.
- Verified `npm run db:validate`, `npm run lint`, and `npm run build` pass.
- Smoke-tested full visitor lifecycle: check-in returned `201`, duplicate active registration returned `409`, status page returned `200`, check-out returned `200`, and the status page returned `200` after cookie clearing.
- Verified unauthenticated admin access redirects with `307` and unauthenticated export access returns `401`.
- Confirmed Docker PostgreSQL remains healthy on host port `5433`.
- Added Prisma migration `20260630124108_add_visitor_required_fields` for `vehiclePlateNumber` and the then-required visitor fields.
- Updated visitor registration validation, form fields, status display, admin visitor history, search, and Excel export for the finalized required visitor information set.
- Verified `npm run db:validate`, `npm run db:generate`, `npm run lint`, and `npm run build` pass.
- Verified Prisma can persist and read all finalized visitor fields against Docker PostgreSQL.
- Replaced the previous public home/entry screen with the visitor registration experience.
- Removed header/navigation bars from app pages while retaining workflow actions such as check-out, sign out, filtering, pagination, and export.
- Updated visitor status UI to match the provided checked-in and checked-out designs, including pass-style header, status panel, detail tiles, dark checkout button, and checked-out thank-you card.
- Removed the Back to Registration action from visitor checked-out and no-active-visit status screens.
- Restyled visitor registration to the approved stacked card design and added no-vehicle capture through validation, database persistence, admin search, and Excel export.
- Rebuilt the admin experience to match the approved control-center design with Dashboard, Visitors, Export, Settings, and Audit Logs sections.
- Added date-window filtering, sort modes, current visitor table, visitor deletion with audit logging, persisted visitor timeout settings, and audit-log display.
- Added inset table gutters and first/last cell padding to admin tables so rows, status pills, and action pills do not crowd rounded container edges.
- Switched shared brand accents from blue to green across visitor registration and the admin control center.
- Renamed the product identity to TOE Visitor Management System (TVMS) across app metadata, admin brand, and project context.
- Added Settings tab QR code generation that derives the visitor registration URL from the active deployment origin.
- Updated Settings QR generation so the displayed, downloaded, and printed QR code uses rounded corners.
- Replaced the starter README with a TVMS project guide and added `VPS_DEPLOYMENT_GUIDE.md` for first-time VPS deployment.
- Added `VPS_DEPLOYMENT_GUIDE_IP_ADDRESS.md` with IP-only deployment steps using Nginx and a self-signed HTTPS certificate.
- Fixed admin authentication behind HTTPS reverse proxies by recognizing `__Secure-` Better Auth cookie names and validating signed session-cookie values against the database.
- Removed unresolved Git conflict markers from `lib/admin-auth-session.ts` and `context/progress-tracker.md`, restoring production build parsing.
- Wired the admin Visitors table View button to a token-matched detail dialog showing visitor identity, contact, company, PIC, vehicle, timing, duration, status, and purpose information.
- Updated Excel visitor exports to write formatted check-in and check-out timestamp text instead of raw spreadsheet date values, preventing timezone/display shifts between Excel and the dashboard.
- Added app-wide production security headers and disabled the `X-Powered-By` framework header.
- Added shared API response/request parsing helpers and hardened protected route handlers with explicit Node runtime, stricter JSON body handling, no-store export headers, and less internal error leakage.
- Optimized `/admin` section loading so each section fetches only the data it renders.
- Restricted admin login callback redirects to `/admin` paths only.
- Added `/api/health` for production uptime checks.
- Earlier number-of-people support has since been removed and dashboard metrics now count visitor records.
- Expanded the admin visitor View modal so complete audit details remain readable across mobile, tablet, and desktop viewports.
- Added explicit `/check-in` route for entrance QR scans.
- Added `/check-out` confirmation page that validates the active visitor session via the existing HttpOnly visitor session cookie.
- Removed the inline check-out button from the checked-in status card and replaced it with exit QR instructions.
- Updated Admin Settings QR card to generate, download, and print separate check-in and check-out QR codes.
- Verified `npm run lint` and `npm run build` pass after the split QR flow implementation.
- Smoke-tested the split QR lifecycle locally: `/check-in` returns `200`, `/check-out` without a cookie returns `200`, check-in API returns `201`, checked-in status returns `200`, check-out confirmation returns `200`, and check-out API returns `200`.
- Replaced cookie/fallback checkout with phone-number active visit search at `/api/visitor/check-out/lookup` and `/api/visitor/check-out/confirm`.
- Added `lib/rate-limit.ts` for rate-limiting checkout search attempts and `lib/visitor-checkout-api.ts` for shared checkout search response handling.
- Added Prisma migration `20260709070000_remove_visitor_pass_id` to remove Visitor Pass ID and add contact-number/status lookup indexing.
- Updated `/check-out` to always show the phone-number active visit search form, active visit confirmation summary, and checkout confirmation action.
- Verified `npm run db:validate`, `npx prisma migrate dev`, `npm run db:generate`, `npm run lint`, and `npm run build` pass after phone-only checkout changes.
- Smoke-tested phone-only checkout locally: check-in returned `201`, lookup returned `200`, confirm returned `200`, repeated confirm returned `409`, removed cookie checkout route returned `404`, and ambiguous same-phone lookup returned `409`.
- Updated Settings QR URL generation so check-in/check-out QR codes use an internal IPv4 origin instead of localhost during local network use.
- Added session-storage draft restore for visitor registration and cleared the draft after successful check-in or active-session redirect.
- Added automatic `allowedDevOrigins` configuration for local private IPv4 addresses after iPhone QR testing showed checkout form submissions refreshing because React handlers were not hydrated.
- Added versioned Visitor Safety Acknowledgment and Indemnity Form support with placeholder initial text, Settings editor, visitor checkbox/modal, database acceptance fields, admin detail visibility, and Excel export columns.
- Removed the extra group-size and team fields from active visitor registration, storage, admin views, checkout lookup, and Excel export; Safety Acknowledgment Read button no longer uses a shadow.
- Removed visible Safety Acknowledgment version text from the visitor registration card and read dialog while retaining the hidden submitted version id.
- Replaced the Safety Acknowledgment Read button with a clickable acknowledgment title that opens the same modal.
- Cleaned production admin dashboard wording across Dashboard, Visitors, Export, Settings, QR cards, and Activity Log while keeping the underlying audit/version data intact.
