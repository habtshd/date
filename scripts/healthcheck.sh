#!/usr/bin/env bash
# Sovereign Healthcheck Script
set -e

echo "=== Checking Sovereign Dating Health ==="

# Check API Health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")
if [ "$API_STATUS" -eq 200 ]; then
  echo "✅ Fastify API is Healthy (HTTP 200)"
else
  echo "❌ Fastify API Failed (HTTP $API_STATUS)"
fi

# Check Database
if docker exec sovereign_postgres pg_isready -U sovereign -d sovereign_dating > /dev/null 2>&1; then
  echo "✅ PostgreSQL Database is Healthy"
else
  echo "❌ PostgreSQL Database Connection Failed"
fi

# Check Redis
if docker exec sovereign_redis redis-cli ping | grep PONG > /dev/null 2>&1; then
  echo "✅ Redis Cache is Healthy"
else
  echo "❌ Redis Connection Failed"
fi

# Check Web App
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 || echo "000")
if [ "$WEB_STATUS" -eq 200 ]; then
  echo "✅ User Web Application is Running (HTTP 200)"
else
  echo "❌ Web Application is Unreachable (HTTP $WEB_STATUS)"
fi

# Check Admin Portal
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5174 || echo "000")
if [ "$ADMIN_STATUS" -eq 200 ]; then
  echo "✅ Admin Command Center is Running (HTTP 200)"
else
  echo "❌ Admin Command Center is Unreachable (HTTP $ADMIN_STATUS)"
fi

echo "=== Healthcheck Complete ==="
