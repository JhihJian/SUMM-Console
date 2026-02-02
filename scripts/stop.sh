#!/bin/bash
echo "Stopping SUMM Console..."

# Find and kill process
PID=$(lsof -ti:3000) || true

if [ -n "$PID" ]; then
  echo "Killing process $PID"
  kill $PID
  echo "SUMM Console stopped"
else
  echo "SUMM Console not running"
fi
