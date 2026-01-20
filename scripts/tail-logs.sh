#!/bin/bash
# Tail all ketchup log files in real-time
# Usage: ./tail-logs.sh [logs-dir]

LOGS_DIR="${1:-.claude/logs}"

if [ ! -d "$LOGS_DIR" ]; then
  echo "Logs directory not found: $LOGS_DIR"
  exit 1
fi

echo "Tailing logs in $LOGS_DIR..."
echo "Press Ctrl+C to stop"
echo

# Use tail -f with all .log files, showing which file each line comes from
find "$LOGS_DIR" -name "*.log" -exec tail -f {} + 2>/dev/null
