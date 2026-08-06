# Production Timezone Issue - Verification Steps

## Problem
The production server is showing incorrect times even after the timezone migration.

## Server Info (from screenshot)
- Local time: Thu 2026-08-06 10:14:17 +08
- Universal time: Thu 2026-08-06 02:14:17 UTC
- Time zone: Asia/Kuala_Lumpur (+08, +0800)

## Steps to Verify on Production Server

### 1. Check if the migration was applied

```bash
cd /path/to/visitor_system
docker exec visitor_system-app-1 npx prisma migrate status
```

**Expected output:** Should list `20260806095800_fix_timestamp_timezone` as applied.

If it shows as **pending**, you need to apply it:

```bash
docker exec visitor_system-app-1 npx prisma migrate deploy
```

### 2. Check the database column types

```bash
docker exec visitor_system-db-1 psql -U visitor_system -d visitor_system -c "\d visitors" | grep -E "checkInAt|checkOutAt"
```

**Expected output:**
```
checkInAt    | timestamp(3) with time zone |           | not null |
checkOutAt   | timestamp(3) with time zone |           |          |
```

If it shows `timestamp(3) without time zone`, the migration wasn't applied.

### 3. Check database timezone setting

```bash
docker exec visitor_system-db-1 psql -U visitor_system -d visitor_system -c "SHOW timezone;"
```

**Expected output:**
```
TimeZone
----------
UTC
(1 row)
```

This is correct - PostgreSQL should store in UTC.

### 4. Check a sample visitor record

```bash
docker exec visitor_system-db-1 psql -U visitor_system -d visitor_system -c 'SELECT "id", "fullName", "checkInAt" FROM visitors ORDER BY "checkInAt" DESC LIMIT 1;'
```

**Expected format:** Should show `+00` at the end, like:
```
2026-08-06 02:14:17.123+00
```

If it shows without `+00`, the migration wasn't applied.

### 5. Restart the app container (after migration)

After applying the migration, restart the app to ensure Prisma client is refreshed:

```bash
docker compose restart app
```

Or if using different compose file:

```bash
docker compose -f docker-compose.prod.yml restart app
```

## Quick Fix Command Sequence

If the migration wasn't applied, run these commands on the production server:

```bash
cd /path/to/visitor_system

# Apply the migration
docker exec visitor_system-app-1 npx prisma migrate deploy

# Restart the app
docker compose -f docker-compose.prod.yml restart app

# Verify column types
docker exec visitor_system-db-1 psql -U visitor_system -d visitor_system -c "\d visitors" | grep checkInAt
```

## What to Look For

After applying the migration and restarting:
1. New check-ins should display the correct time
2. **Old records** will now show different times because they were stored incorrectly before

## Note About Old Data

**IMPORTANT:** Records created BEFORE the migration were stored with the timezone interpretation bug. After the migration:
- The migration converts old timestamps by treating them as UTC
- If an old record shows "check-in at 12:49 am" in the UI before the fix
- It was actually stored as `2026-08-06 00:49:00` (no timezone)
- After migration, it becomes `2026-08-06 00:49:00+00` (marked as UTC)
- Which displays as `08:49` Malaysia time (UTC + 8 hours)

The old data will shift because it was stored incorrectly. Only new check-ins after the migration will be 100% accurate.
