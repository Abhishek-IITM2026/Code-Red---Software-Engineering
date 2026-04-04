#!/bin/bash

# Preview production build
# Serves the built files from dist/ directory on port 4173

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if dist/ exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}Production build not found. Building now...${NC}"
    ./build_frontend.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}Build failed${NC}"
        exit 1
    fi
    echo ""
fi

echo -e "${GREEN}Starting CIOP Frontend Preview Server...${NC}"
echo ""
echo -e "${BLUE}Preview available at: http://localhost:4173${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

npm run preview
