# Production Timezone Issue - Action Plan

## Current Situation

The timezone fix has been developed and committed locally (commit `57d4a5e`), but production is still showing incorrect times.

## What Was Fixed Locally

1. **Database Migration**: Converted all `TIMESTAMP(3)` columns to `TIMESTAMPTZ` 
2. **Display Format**: Changed from 12-hour to 24-hour format
3. **Migration Files Created**:
   - `prisma/migrations/20260806015726_fix_timestamp_timezone/migration.sql`
   - `prisma/migrations/20260806095800_fix_timestamp_timezone/migration.sql`

## Steps to Apply Fix to Production

### Step 1: Deploy Code to Production

On your **local machine**, push the changes:

```bash
git push origin main
```

### Step 2: Pull and Rebuild on Production Server

SSH into your production server and run:

```bash
cd /path/to/visitor_system

# Pull the latest code
git pull origin main

# Rebuild the Docker image (this includes the new migration files)
docker compose -f docker-compose.prod.yml build --no-cache app

# Stop the current containers
docker compose -f docker-compose.prod.yml down

# Start the new containers
docker compose -f docker-compose.prod.yml up -d

# Check if containers are running
docker compose -f docker-compose.prod.yml ps
```

The migration will run automatically on container startup via `docker-entrypoint.sh`.

### Step 3: Verify the Fix

Run the diagnostic script:

```bash
bash deploy/debug-timezone-production.sh > timezone-debug.log
cat timezone-debug.log
```

### Step 4: Test with New Check-in

1. Open the visitor registration page
2. Complete a check-in at a known time (e.g., 10:30 AM)
3. Check the admin dashboard
4. Verify the time shows correctly (10:30, not 02:30 or 12:30 AM)

## Alternative: Manual Migration (If Auto-Migration Fails)

If the automatic migration doesn't run, manually apply it:

```bash
# Get the app container name
APP_CONTAINER=$(docker ps --filter "name=app" --format "{{.Names}}" | head -1)

# Apply migrations manually
docker exec $APP_CONTAINER npx prisma migrate deploy

# Restart the app
docker compose -f docker-compose.prod.yml restart app
```

## Common Issues

### Issue 1: Migration Already Applied (from earlier attempt)

If you see "No pending migrations", check the column types:

```bash
DB_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
docker exec $DB_CONTAINER psql -U visitor_system -d visitor_system -c "\d visitors" | grep checkInAt
```

Should show: `timestamp(3) with time zone`

If it shows `timestamp(3) without time zone`, the migration wasn't applied correctly.

### Issue 2: Old Records Still Show Wrong Time

**This is expected behavior.** Records created **before** the migration were stored with the timezone bug. After migration:
- They will be interpreted as UTC timestamps
- They will display in Malaysia time (UTC + 8 hours)
- So a record that showed "12:49 AM" will now show "08:49 AM"

**Only new check-ins created AFTER the migration will be 100% accurate.**

### Issue 3: Docker Image Not Rebuilt

If you pulled the code but didn't rebuild the Docker image, the old code is still running. Always rebuild after pulling:

```bash
docker compose -f docker-compose.prod.yml build --no-cache app
docker compose -f docker-compose.prod.yml up -d
```

## Quick Verification Commands

```bash
# Check column type (should have "with time zone")
docker exec $(docker ps --filter "name=postgres" -q) psql -U visitor_system -d visitor_system -c "\d visitors" | grep checkInAt

# Check a recent record (should have +00 at the end)
docker exec $(docker ps --filter "name=postgres" -q) psql -U visitor_system -d visitor_system -c 'SELECT "checkInAt" FROM visitors ORDER BY "createdAt" DESC LIMIT 1;'

# Check app logs
docker logs $(docker ps --filter "name=app" -q) --tail 50
```

## Need Help?

Run the diagnostic script and share the output:

```bash
bash deploy/debug-timezone-production.sh
```

This will show:
- Server timezone
- Container status  
- Migration status
- Database column types
- Sample records
- Node.js timezone configuration
