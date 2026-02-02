#!/bin/bash
set -e

PORT=${PORT:-3000}

echo "Checking SUMM Console health..."

RESPONSE=$(curl -s "http://localhost:$PORT/api/health" || echo '{"status":"error"}')

if echo "$RESPONSE" | grep -q '"status":"ok"'; then
  echo "✓ SUMM Console is healthy"
  echo "$RESPONSE"
  exit 0
else
  echo "✗ SUMM Console health check failed"
  echo "$RESPONSE"
  exit 1
fi
