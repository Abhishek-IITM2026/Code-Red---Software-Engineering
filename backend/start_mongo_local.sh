#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONGO_ROOT="$SCRIPT_DIR/.mongo"
DATA_DIR="$MONGO_ROOT/data"
LOG_DIR="$MONGO_ROOT/log"
PID_FILE="$MONGO_ROOT/mongod.pid"
LOG_FILE="$LOG_DIR/mongod.log"
PORT="${MONGO_PORT:-27017}"
HOST="${MONGO_HOST:-127.0.0.1}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if ! command -v mongod >/dev/null 2>&1; then
    echo -e "${RED}mongod is not installed or not on PATH.${NC}"
    echo "Install MongoDB Community Edition first, then rerun this script."
    exit 1
fi

mkdir -p "$DATA_DIR" "$LOG_DIR"

if [ -f "$PID_FILE" ]; then
    EXISTING_PID="$(cat "$PID_FILE")"
    if [ -n "$EXISTING_PID" ] && kill -0 "$EXISTING_PID" >/dev/null 2>&1; then
        echo -e "${YELLOW}MongoDB is already running with PID $EXISTING_PID.${NC}"
        echo "URI: mongodb://$HOST:$PORT"
        exit 0
    fi
    rm -f "$PID_FILE"
fi

echo -e "${GREEN}Starting local MongoDB on $HOST:$PORT...${NC}"
mongod \
    --dbpath "$DATA_DIR" \
    --logpath "$LOG_FILE" \
    --pidfilepath "$PID_FILE" \
    --bind_ip "$HOST" \
    --port "$PORT" \
    --fork

echo -e "${GREEN}MongoDB started.${NC}"
echo "URI: mongodb://$HOST:$PORT"
echo "Data dir: $DATA_DIR"
echo "Log file: $LOG_FILE"
echo "Configured backend DB name: ciop_db"
