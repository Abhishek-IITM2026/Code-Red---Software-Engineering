#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.mongo/mongod.pid"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}No local MongoDB PID file found.${NC}"
    exit 0
fi

PID="$(cat "$PID_FILE")"
if [ -z "$PID" ]; then
    echo -e "${RED}MongoDB PID file is empty.${NC}"
    exit 1
fi

if kill -0 "$PID" >/dev/null 2>&1; then
    echo -e "${GREEN}Stopping local MongoDB PID $PID...${NC}"
    kill "$PID"
else
    echo -e "${YELLOW}Process $PID is not running.${NC}"
fi

rm -f "$PID_FILE"
echo -e "${GREEN}Local MongoDB stopped.${NC}"
