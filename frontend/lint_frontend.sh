#!/bin/bash

# Run ESLint on frontend code
# Checks for code quality and style issues

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

echo -e "${GREEN}Running CIOP Frontend Linter...${NC}"
echo ""

npm run lint

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Linting passed!${NC}"
else
    echo ""
    echo -e "${YELLOW}✗ Linting found issues${NC}"
    echo "Fix them and try again"
fi
