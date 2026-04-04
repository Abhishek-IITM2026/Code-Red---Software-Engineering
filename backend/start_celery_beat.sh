#!/bin/bash

# Start Celery Beat (Scheduler)
# Schedules periodic tasks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.benv" ]; then
    echo -e "${RED}Error: .benv file not found${NC}"
    exit 1
fi

# Activate virtual environment
if [ -d "$SCRIPT_DIR/.benv" ]; then
    source "$SCRIPT_DIR/.benv/bin/activate"
else
    echo -e "${RED}Virtual environment not found. Please run ./setup_env.sh first${NC}"
    exit 1
fi

echo -e "${GREEN}Starting Celery Beat (Scheduler)...${NC}"
celery -A app.core.celery_app beat --loglevel=info
