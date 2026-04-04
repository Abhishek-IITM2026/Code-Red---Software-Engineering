#!/bin/bash

# Build frontend for production
# Creates optimized bundle in dist/ directory

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

echo -e "${GREEN}Building CIOP Frontend for Production...${NC}"
echo ""

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Build successful!${NC}"
    echo ""
    echo "Output directory: ./dist"
    echo ""
    echo "Next steps:"
    echo "  1. Preview build:"
    echo "     ./preview_frontend.sh"
    echo ""
    echo "  2. Deploy dist/ folder to your hosting"
    echo ""
else
    echo -e "${RED}Build failed${NC}"
    exit 1
fi
