#!/bin/bash

# Run frontend tests
# Uses Vitest for unit and integration testing

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

echo -e "${GREEN}Running CIOP Frontend Tests...${NC}"
echo ""

npm run test

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo ""
    echo -e "${YELLOW}✗ Some tests failed${NC}"
fi
