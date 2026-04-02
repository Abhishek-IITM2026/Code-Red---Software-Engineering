#!/bin/bash

# Setup frontend environment
# Installs Node.js dependencies

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}Setting up CIOP Frontend Environment...${NC}"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo ""
    echo -e "${YELLOW}Installation instructions:${NC}"
    echo "  Ubuntu/Debian:"
    echo "    sudo apt-get update"
    echo "    sudo apt-get install nodejs npm"
    echo ""
    echo "  macOS (with Homebrew):"
    echo "    brew install node"
    echo ""
    echo "  Or visit: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}Node.js version:${NC}"
node --version
echo ""

echo -e "${GREEN}npm version:${NC}"
npm --version
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo -e "${GREEN}Frontend setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start development server:"
    echo "     ./start_frontend.sh"
    echo ""
    echo "  2. Or build for production:"
    echo "     ./build_frontend.sh"
    echo ""
    echo "  3. Or run linting:"
    echo "     ./lint_frontend.sh"
else
    echo -e "${RED}Failed to install dependencies${NC}"
    exit 1
fi
