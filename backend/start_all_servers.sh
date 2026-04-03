#!/bin/bash

# Start all backend servers for CIOP project
# This script starts:
#   - Flask API Server (port 3500)
#   - Celery Worker
#   - Celery Beat (Scheduler)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting CIOP Backend Servers...${NC}"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo -e "${RED}Error: .env file not found in $SCRIPT_DIR${NC}"
    echo "Please create a .env file before starting servers"
    exit 1
fi

# Check if Python virtual environment exists
if [ ! -d "$SCRIPT_DIR/.benv" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating one...${NC}"
    python3 -m venv .benv
    source .benv/bin/activate
    pip install -r requirements.txt
else
    # Activate virtual environment
    source "$SCRIPT_DIR/.benv/bin/activate"
fi

# Check if Redis is running
echo -e "${BLUE}Checking Redis connection...${NC}"
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Warning: Redis is not running!${NC}"
    echo -e "${YELLOW}Celery needs a message broker to function.${NC}"
    echo -e "${YELLOW}Options:${NC}"
    echo -e "${YELLOW}  1. Start Redis: redis-server${NC}"
    echo -e "${YELLOW}  2. Or use the helper script: ./start_redis.sh${NC}"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 1
    fi
else
    echo -e "${GREEN}✓ Redis is running${NC}"
fi
echo ""

# Start local MongoDB when mongod is available
if command -v mongod > /dev/null 2>&1; then
    echo -e "${BLUE}Checking local MongoDB...${NC}"
    if ! ./start_mongo_local.sh; then
        echo -e "${YELLOW}Warning: local MongoDB could not be started.${NC}"
        echo -e "${YELLOW}The backend will fall back to in-memory document storage.${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}mongod not found on PATH. MongoDB will not start locally.${NC}"
    echo -e "${YELLOW}The backend will fall back to in-memory document storage unless another MongoDB server is available.${NC}"
    echo ""
fi

echo -e "${GREEN}Starting Flask API Server...${NC}"
python run.py &
FLASK_PID=$!
echo -e "${GREEN}Flask API Server started (PID: $FLASK_PID)${NC}"
echo ""

echo -e "${GREEN}Starting Celery Worker...${NC}"
celery -A app.core.celery_app worker --loglevel=info &
CELERY_PID=$!
echo -e "${GREEN}Celery Worker started (PID: $CELERY_PID)${NC}"
echo ""

echo -e "${GREEN}Starting Celery Beat (Scheduler)...${NC}"
celery -A app.core.celery_app beat --loglevel=info &
BEAT_PID=$!
echo -e "${GREEN}Celery Beat started (PID: $BEAT_PID)${NC}"
echo ""

echo "========================================"
echo -e "${GREEN}All servers started successfully!${NC}"
echo ""
echo "Running processes:"
echo "  - Flask API Server (PID: $FLASK_PID) - http://localhost:3500"
echo "  - Celery Worker (PID: $CELERY_PID)"
echo "  - Celery Beat (PID: $BEAT_PID)"
echo ""
echo "To stop all servers, press Ctrl+C or run: ./stop_all_servers.sh"
echo ""

# Save PIDs to file
echo "$FLASK_PID" > .server_pids
echo "$CELERY_PID" >> .server_pids
echo "$BEAT_PID" >> .server_pids

# Wait for all processes
wait
