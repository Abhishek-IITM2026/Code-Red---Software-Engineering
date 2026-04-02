#!/bin/bash

# Start frontend development server
# Runs on port 5173 with hot module replacement

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Dependencies not installed. Running setup...${NC}"
    ./setup_frontend.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}Setup failed${NC}"
        exit 1
    fi
    echo ""
fi

echo -e "${GREEN}Starting CIOP Frontend Development Server...${NC}"
echo ""
echo -e "${BLUE}Frontend running at: http://localhost:5173${NC}"
echo -e "${BLUE}Backend API at: http://localhost:3500${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

npm run dev
