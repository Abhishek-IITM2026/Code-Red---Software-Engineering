#!/bin/bash

# Start Flask API Server
# Runs on port 3500 in development mode with auto-reload

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Activate virtual environment
if [ -d "$SCRIPT_DIR/.benv" ]; then
    source "$SCRIPT_DIR/.benv/bin/activate"
elif [ -d "$SCRIPT_DIR/.benv" ]; then
    source "$SCRIPT_DIR/.benv/bin/activate"
else
    echo -e "${RED}Virtual environment not found. Please run ./setup_env.sh first${NC}"
    exit 1
fi

echo -e "${GREEN}Starting Flask API Server on port 3500...${NC}"
python run.py
