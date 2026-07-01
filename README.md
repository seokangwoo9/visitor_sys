# TOE Visitor Management System (TVMS)

TOE Visitor Management System is a full-stack visitor check-in/check-out web app for factory reception workflows.

Visitors scan a QR code, fill in the registration form, check in, and later check out from the visitor status page. Admin users can monitor live visitors, review history, export Excel reports, manage timeout settings, view audit logs, and generate the printable visitor registration QR code.

## Features

- Visitor registration at `/`
- QR-code based visitor entry
- Visitor check-in with server-side timestamps
- Visitor status page at `/visitor/status`
- Visitor check-out with session destruction
- Secure HttpOnly visitor session cookies
- Admin login at `/login`
- Protected admin control center at `/admin`
- Dashboard metrics and current visitor monitoring
- Visitor history with search, filters, sorting, pagination, detail view, and delete action
- Excel export for visitor records
- Persisted visitor timeout settings
- Audit log view
- Deployment-aware printable QR code generation

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, Lucide icons |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | Better Auth |
| Reports | ExcelJS |
| QR Code | qrcode |
| Local database | Docker Compose |

## Requirements

- Node.js 20 or newer
- npm
- Docker Desktop or Docker Engine
- Git

For production VPS deployment with a domain, see [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md).

For VPS deployment using only an IP address, see [VPS_DEPLOYMENT_GUIDE_IP_ADDRESS.md](./VPS_DEPLOYMENT_GUIDE_IP_ADDRESS.md).

## Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Local defaults:

```env
DATABASE_URL="postgresql://visitor_system:visitor_system_password@localhost:5433/visitor_system?schema=public"
BETTER_AUTH_SECRET="replace-with-a-secure-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
ADMIN_SEED_NAME="System Administrator"
ADMIN_SEED_EMAIL="admin@example.com"
ADMIN_SEED_PASSWORD="replace-with-a-secure-admin-password"
```

Important notes:

- `DATABASE_URL` must match your PostgreSQL host, port, database, username, and password.
- `BETTER_AUTH_SECRET` must be a long random secret.
- `BETTER_AUTH_URL` must match the public app URL in production.
- `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` create the first admin login.

## Local Development Setup

Install dependencies:

```bash
npm install
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Validate Prisma and generate Prisma Client:

```bash
npm run db:validate
npm run db:generate
```

Apply database migrations:

```bash
npx prisma migrate dev
```

Seed the first admin user:

```bash
npm run auth:seed-admin
```

Start the development server:

```bash
npm run dev
```

Open:

- Visitor registration: `http://localhost:3000/`
- Admin login: `http://localhost:3000/login`
- Admin dashboard: `http://localhost:3000/admin`

## Available Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start local development server |
| `npm run build` | Build production app |
| `npm run start` | Start production server after build |
| `npm run lint` | Run ESLint |
| `npm run db:validate` | Validate Prisma schema |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Run Prisma development migration |
| `npm run db:studio` | Open Prisma Studio |
| `npm run auth:seed-admin` | Create first admin auth user |

## Database

The local Docker Compose database uses:

- Image: `postgres:16-alpine`
- Database: `visitor_system`
- User: `visitor_system`
- Local host port: `5433`
- Container port: `5432`
- Volume: `visitor_system_postgres_data`

Current Prisma models include:

- `Visitor`
- `VisitorSession`
- `Admin`
- Better Auth tables: `Users`, `Sessions`, `Accounts`, `Verifications`
- `SystemSetting`
- `AuditLog`

## Visitor Flow

1. Visitor scans the generated QR code.
2. Visitor opens `/`.
3. Visitor fills in:
   - Full name
   - IC/passport number
   - Phone number
   - Number of people in the visiting group
   - Email
   - Vehicle/no-vehicle selection
   - Vehicle plate number when applicable
   - Company name
   - Purpose of visit
   - Person to meet/PIC
   - Department
   - Visitor pass ID
4. System creates the visitor record and secure visitor session.
5. Visitor is redirected to `/visitor/status`.
6. Visitor checks out before leaving.

## Admin Flow

1. Admin opens `/login`.
2. Admin signs in with the seeded admin account.
3. Admin opens `/admin`.
4. Admin can:
   - View dashboard metrics
   - See current visitors
   - Search/filter/sort visitor history
   - Export Excel reports
   - Update timeout settings
   - Generate and print the visitor registration QR code
   - Review audit logs

## QR Code Behavior

The admin Settings tab generates a visitor registration QR code from the browser's current deployment origin.

Example:

- Local: `http://localhost:3000/`
- Production: `https://your-domain.com/`
- IP deployment: `http://your-server-ip/`

This means the QR code automatically points to the correct registration page after deployment, without hardcoding the domain in code.

## Project Structure

```text
app/                 Next.js app routes, pages, and route handlers
components/ui/       Generated shadcn/ui components
context/             Project planning and implementation context
lib/                 Shared app utilities, auth, and Prisma client
prisma/              Prisma schema and migrations
repositories/        Database access layer
scripts/             Operational scripts such as admin seeding
services/            Business logic layer
types/               Shared TypeScript types
public/              Public assets
```

## Verification Checklist

Run these before handing off or deploying:

```bash
npm run db:validate
npm run db:generate
npm run lint
npm run build
```

For a local end-to-end smoke test:

1. Start Docker PostgreSQL.
2. Start the dev server.
3. Register a visitor at `/`.
4. Confirm visitor status page loads.
5. Check out the visitor.
6. Log in as admin.
7. Confirm dashboard, visitors, export, settings, QR generation, and audit logs work.

## Deployment

Use the step-by-step VPS guide:

[VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)

If you are deploying with only a server IP address:

[VPS_DEPLOYMENT_GUIDE_IP_ADDRESS.md](./VPS_DEPLOYMENT_GUIDE_IP_ADDRESS.md)
