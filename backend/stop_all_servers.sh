#!/bin/bash

# Stop all backend servers gracefully

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping all CIOP Backend Servers...${NC}"
echo "========================================"
echo ""

# Kill processes by name
echo -e "${GREEN}Stopping Flask API Server...${NC}"
pkill -f "python run.py" || echo "Flask server not running"

echo -e "${GREEN}Stopping Celery Worker...${NC}"
pkill -f "celery.*worker" || echo "Celery worker not running"

echo -e "${GREEN}Stopping Celery Beat...${NC}"
pkill -f "celery.*beat" || echo "Celery beat not running"

if [ -x "$SCRIPT_DIR/stop_mongo_local.sh" ]; then
    echo -e "${GREEN}Stopping local MongoDB...${NC}"
    "$SCRIPT_DIR/stop_mongo_local.sh" || echo "Local MongoDB not running"
fi

echo ""
echo -e "${GREEN}All servers stopped.${NC}"

# Clean up PID file if it exists
if [ -f "$SCRIPT_DIR/.server_pids" ]; then
    rm "$SCRIPT_DIR/.server_pids"
fi
