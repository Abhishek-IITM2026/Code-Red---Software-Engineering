#!/bin/bash

# Start RabbitMQ server
# RabbitMQ is an alternative message broker for Celery
# You'll need to update .env to use RabbitMQ if using this instead of Redis

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}Starting RabbitMQ Server...${NC}"
echo "========================================"
echo ""

# Check if rabbitmq-server is available
if ! command -v rabbitmq-server &> /dev/null; then
    echo -e "${RED}Error: RabbitMQ is not installed${NC}"
    echo ""
    echo -e "${YELLOW}Installation instructions:${NC}"
    echo "  Ubuntu/Debian:"
    echo "    sudo apt-get update"
    echo "    sudo apt-get install rabbitmq-server"
    echo ""
    echo "  macOS (with Homebrew):"
    echo "    brew install rabbitmq"
    echo ""
    echo "  Or visit: https://www.rabbitmq.com/download.html"
    exit 1
fi

echo -e "${YELLOW}RabbitMQ will run on amqp://localhost:5672${NC}"
echo -e "${BLUE}Management UI: http://localhost:15672${NC}"
echo -e "${BLUE}Default credentials: guest / guest${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop RabbitMQ${NC}"
echo ""

# Start RabbitMQ in foreground
rabbitmq-server
