#!/bin/bash

# Start Redis server
# Redis is used as message broker and cache for Celery tasks

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting Redis Server...${NC}"
echo "========================================"
echo ""

# Check if redis-cli is available
if ! command -v redis-cli &> /dev/null; then
    echo -e "${RED}Error: Redis is not installed${NC}"
    echo ""
    echo -e "${YELLOW}Installation instructions:${NC}"
    echo "  Ubuntu/Debian:"
    echo "    sudo apt-get update"
    echo "    sudo apt-get install redis-server"
    echo ""
    echo "  macOS (with Homebrew):"
    echo "    brew install redis"
    echo ""
    echo "  Or visit: https://redis.io/download"
    exit 1
fi

# Check if Redis is already running
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${YELLOW}Redis is already running${NC}"
    echo ""
    redis-cli INFO Server | grep "redis_version\|port\|uptime_in_seconds"
    exit 0
fi

# Check if redis-server is available
if ! command -v redis-server &> /dev/null; then
    echo -e "${RED}Error: redis-server command not found${NC}"
    echo -e "${YELLOW}Make sure Redis is properly installed${NC}"
    exit 1
fi

echo -e "${GREEN}Launching Redis Server...${NC}"
echo -e "${YELLOW}Redis will run on http://localhost:6379${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop Redis${NC}"
echo ""

redis-server --port 6379
