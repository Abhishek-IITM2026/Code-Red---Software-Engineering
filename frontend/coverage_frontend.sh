#!/bin/bash

# Run frontend tests with coverage report
# Shows code coverage metrics using Vitest

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}Dependencies not installed. Please run: ./setup_frontend.sh${NC}"
    exit 1
fi

echo -e "${GREEN}Running CIOP Frontend Tests with Coverage...${NC}"
echo ""

npm run coverage

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Coverage report generated!${NC}"
    echo ""
    echo "View detailed coverage report"
else
    echo ""
    echo -e "${YELLOW}✗ Coverage generation failed${NC}"
fi
