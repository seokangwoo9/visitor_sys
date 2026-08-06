#!/bin/bash

# Production Timezone Fix Deployment Script
# This script applies the timezone migration to the production database

set -e

echo "============================================"
echo "Production Timezone Fix Deployment"
echo "============================================"
echo ""

# Get container names
APP_CONTAINER=$(docker ps --filter "name=app" --format "{{.Names}}" | head -1)
DB_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)

if [ -z "$APP_CONTAINER" ]; then
    echo "ERROR: Could not find app container"
    exit 1
fi

if [ -z "$DB_CONTAINER" ]; then
    echo "ERROR: Could not find postgres container"
    exit 1
fi

echo "Found containers:"
echo "  App: $APP_CONTAINER"
echo "  DB:  $DB_CONTAINER"
echo ""

# Check current column type
echo "Step 1: Checking current database column types..."
docker exec "$DB_CONTAINER" psql -U visitor_system -d visitor_system -c "\d visitors" | grep "checkInAt"
echo ""

# Check migration status
echo "Step 2: Checking migration status..."
docker exec "$APP_CONTAINER" npx prisma migrate status
echo ""

# Apply migration
echo "Step 3: Applying timezone migration..."
docker exec "$APP_CONTAINER" npx prisma migrate deploy
echo ""

# Verify column type after migration
echo "Step 4: Verifying column types after migration..."
docker exec "$DB_CONTAINER" psql -U visitor_system -d visitor_system -c "\d visitors" | grep "checkInAt"
echo ""

# Check a sample record
echo "Step 5: Checking sample visitor record..."
docker exec "$DB_CONTAINER" psql -U visitor_system -d visitor_system -c 'SELECT "id", "fullName", "checkInAt" FROM visitors ORDER BY "checkInAt" DESC LIMIT 1;'
echo ""

# Restart app
echo "Step 6: Restarting app container..."
docker restart "$APP_CONTAINER"
echo ""

echo "============================================"
echo "Migration applied successfully!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Wait for the app to restart (about 10-30 seconds)"
echo "2. Test by creating a new visitor check-in"
echo "3. Verify the time displays correctly in the admin dashboard"
echo ""
echo "Note: Old records stored before this fix may show adjusted times"
echo "because they were stored with the timezone bug."
