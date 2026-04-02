#!/bin/bash

# Setup backend environment
# Creates virtual environment and installs dependencies

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}Setting up CIOP Backend Environment...${NC}"
echo "========================================"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}Python version:${NC}"
python3 --version
echo ""

# Create virtual environment
echo -e "${YELLOW}Creating virtual environment...${NC}"
if [ -d ".benv" ]; then
    echo "Virtual environment already exists at ./.benv"
else
    python3 -m venv .benv
    echo -e "${GREEN}Virtual environment created${NC}"
fi
echo ""

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source .benv/bin/activate
echo -e "${GREEN}Virtual environment activated${NC}"
echo ""

# Upgrade pip
echo -e "${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip
echo ""

# Install requirements
echo -e "${YELLOW}Installing requirements...${NC}"
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo -e "${GREEN}Requirements installed${NC}"
else
    echo -e "${RED}Error: requirements.txt not found${NC}"
    exit 1
fi
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}.env file not found. Creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}.env created from .env.example${NC}"
        echo -e "${YELLOW}Please update .env with your configuration${NC}"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
    fi
else
    echo -e "${GREEN}.env file already exists${NC}"
fi
echo ""

# Check for broker availability
echo -e "${BLUE}Checking message broker availability...${NC}"
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is available${NC}"
elif command -v rabbitmq-server &> /dev/null; then
    echo -e "${YELLOW}⚠ Redis not found, but RabbitMQ is installed${NC}"
else
    echo -e "${YELLOW}⚠ No message broker detected (Redis/RabbitMQ)${NC}"
fi
echo ""

echo "========================================"
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update your .env file with configuration"
echo "  2. Start message broker:"
echo "     - ./start_redis.sh (recommended)"
echo "     - or ./start_rabbitmq.sh"
echo "  3. Start all servers:"
echo "     - ./start_all_servers.sh"
echo ""
echo "Or run individual servers in separate terminals:"
echo "  - ./start_flask_server.sh"
echo "  - ./start_celery_worker.sh"
echo "  - ./start_celery_beat.sh"
echo ""
