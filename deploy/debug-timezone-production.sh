#!/bin/bash

# Production Timezone Debugging Script
# Run this on the production server to diagnose the timezone issue

echo "============================================"
echo "Production Timezone Diagnostic Report"
echo "============================================"
echo ""

# Server timezone
echo "1. SERVER TIMEZONE:"
echo "-------------------"
timedatectl
echo ""

# Container names
APP_CONTAINER=$(docker ps --filter "name=app" --format "{{.Names}}" | head -1)
DB_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)

echo "2. DOCKER CONTAINERS:"
echo "---------------------"
echo "App container: $APP_CONTAINER"
echo "DB container:  $DB_CONTAINER"
echo ""

# Check if containers are running
echo "3. CONTAINER STATUS:"
echo "--------------------"
docker ps --filter "name=visitor_system" --format "table {{.Names}}\t{{.Status}}"
echo ""

# Migration status
echo "4. PRISMA MIGRATION STATUS:"
echo "---------------------------"
docker exec "$APP_CONTAINER" npx prisma migrate status 2>&1 || echo "ERROR: Could not check migration status"
echo ""

# Database timezone
echo "5. POSTGRESQL TIMEZONE:"
echo "-----------------------"
docker exec "$DB_CONTAINER" psql -U visitor_system -d visitor_system -c "SHOW timezone;" 2>&1 || echo "ERROR: Could not check DB timezone"
echo ""

# Column types
echo "6. DATABASE COLUMN TYPES:"
echo "-------------------------"
docker exec "$DB_CONTAINER" psql -U visitor_system -d visitor_system -c "\d visitors" 2>&1 | grep -A 2 "checkInAt"
echo ""

# Sample recent visitor record
echo "7. RECENT VISITOR RECORD (RAW FROM DB):"
echo "---------------------------------------"
docker exec "$DB_CONTAINER" psql -U visitor_system -d visitor_system -c 'SELECT "id", "fullName", "checkInAt", "checkOutAt", "createdAt" FROM visitors ORDER BY "createdAt" DESC LIMIT 1;' 2>&1
echo ""

# Test date creation in Node.js container
echo "8. NODE.JS TIMEZONE TEST:"
echo "-------------------------"
docker exec "$APP_CONTAINER" node -e "console.log('System timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone); console.log('Current time:', new Date().toString()); console.log('UTC time:', new Date().toISOString());" 2>&1
echo ""

# Test date formatting
echo "9. NODE.JS DATE FORMATTING TEST:"
echo "---------------------------------"
docker exec "$APP_CONTAINER" node -e "const d = new Date(); console.log('Formatted (24h):', new Intl.DateTimeFormat('en-MY', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false}).format(d));" 2>&1
echo ""

# Check if TZ environment variable is set
echo "10. CONTAINER TIMEZONE ENVIRONMENT:"
echo "-----------------------------------"
echo "App container TZ:"
docker exec "$APP_CONTAINER" printenv TZ 2>&1 || echo "(TZ not set)"
echo ""
echo "DB container TZ:"
docker exec "$DB_CONTAINER" printenv TZ 2>&1 || echo "(TZ not set)"
echo ""

# Git status
echo "11. GIT STATUS:"
echo "---------------"
git log --oneline -3
echo ""

echo "============================================"
echo "Diagnostic Report Complete"
echo "============================================"
echo ""
echo "Please share this entire output for analysis."
