#!/bin/bash

# Start all frontend development tools
# Runs linter, tests, and development server in parallel

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}CIOP Frontend - Complete Development Setup${NC}"
echo "========================================"
echo ""

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

echo -e "${BLUE}Starting development services...${NC}"
echo ""

# Run linter in background
echo -e "${GREEN}Starting linter (in background)...${NC}"
npm run lint > /tmp/frontend_lint.log 2>&1 &
LINT_PID=$!

# Run development server in foreground (main process)
echo -e "${GREEN}Starting development server...${NC}"
echo ""
echo -e "${BLUE}Frontend: http://localhost:5173${NC}"
echo -e "${BLUE}Backend API: http://localhost:3500${NC}"
echo ""
echo -e "${YELLOW}Running in development mode with HMR (Hot Module Replacement)${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

npm run dev

# Clean up background processes
kill $LINT_PID 2>/dev/null

echo ""
echo -e "${GREEN}Development server stopped${NC}"
