#!/bin/bash
set -e

echo "Starting SUMM Console..."

# Load environment
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Ensure SUMM directory exists
mkdir -p "${SUMM_DIR:-./SUMM}"

# Start server
NODE_ENV=${NODE_ENV:-production} \
PORT=${PORT:-3000} \
SUMM_DIR="${SUMM_DIR:-./SUMM}" \
SUMM_WORK_DIR="${SUMM_WORK_DIR:-$PWD}" \
node dist/server/index.js
