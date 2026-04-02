# CIOP Backend Server Startup Guide

## Overview
Your CIOP backend requires multiple services to run:
- **Flask API Server** - REST API on port 3500
- **Celery Worker** - Async task processor
- **Celery Beat** - Task scheduler
- **Message Broker** - Redis or RabbitMQ (required for Celery)
- **Database** - PostgreSQL or SQLite

## Quick Start (Recommended)

### Step 1: Setup Environment
```bash
cd backend
./setup_env.sh
```

### Step 2: Start Message Broker (Choose One)

**Option A: Redis (Recommended)**
```bash
./start_redis.sh
```

**Option B: RabbitMQ**
```bash
./start_rabbitmq.sh
```

### Step 3: Start All Servers
```bash
./start_all_servers.sh
```

This will start:
- Flask API Server (http://localhost:3500)
- Celery Worker
- Celery Beat Scheduler

## Running Individual Servers

If you prefer to run servers in separate terminals:

### Terminal 1 - Start Message Broker
```bash
./start_redis.sh
```

### Terminal 2 - Start Flask Server
```bash
./start_flask_server.sh
```

### Terminal 3 - Start Celery Worker
```bash
./start_celery_worker.sh
```

### Terminal 4 - Start Celery Beat (Optional but Recommended)
```bash
./start_celery_beat.sh
```

## Troubleshooting

### Error: "Cannot connect to amqp://guest:@127.0.0.1:5672"
**Solution:** You need to start a message broker first:
```bash
./start_redis.sh
```

Or update `.env` to use RabbitMQ if you have it installed.

### Error: "Connection refused" for Redis
**Solution:** Install and start Redis:

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo service redis-server start
```

**macOS:**
```bash
brew install redis
brew services start redis
```

Or run the helper script:
```bash
./start_redis.sh
```

### Flask server not starting
**Solution:** Verify your configuration:
```bash
# Check Python setup
python3 --version

# Check virtual environment
source .benv/bin/activate
pip list | grep -i flask

# Check .env file
cat .env
```

### Celery worker not connecting
**Solution:** Ensure Redis is running and configured in `.env`:
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check .env has correct Redis URL
grep REDIS_URL .env
grep CELERY_BROKER_URL .env
```

## Environment Variables

Edit `.env` to configure services:

```bash
# Database
DB_ENGINE=sqlite              # or 'postgresql'
SQLITE_PATH=instance/app.db

# Redis/Message Broker
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# MongoDB (if used for assessments)
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=code_red

# API
API_PREFIX=/api
API_VERSION=v1
```

## Stopping All Servers

### From the same terminal (Ctrl+C)
Simply press `Ctrl+C` to stop all running servers.

### From another terminal
```bash
./stop_all_servers.sh
```

## Available Scripts

| Script | Purpose |
|--------|---------|
| `setup_env.sh` | Setup Python environment & dependencies |
| `start_all_servers.sh` | Start Flask, Celery Worker, and Beat |
| `start_flask_server.sh` | Start Flask API Server only |
| `start_celery_worker.sh` | Start Celery Worker only |
| `start_celery_beat.sh` | Start Celery Beat Scheduler only |
| `start_redis.sh` | Start Redis message broker |
| `start_rabbitmq.sh` | Start RabbitMQ message broker |
| `stop_all_servers.sh` | Stop all running servers |

## API Access

Once Flask server is running, access:
- **Base URL:** http://localhost:3500
- **API Prefix:** http://localhost:3500/api/v1

## Celery Monitoring

To monitor Celery tasks in real-time, use Flower (optional):

```bash
# In another terminal
source .benv/bin/activate
pip install flower
celery -A app.core.celery_app flower --port=5555
```

Then access: http://localhost:5555

## Database Setup

### SQLite (Default)
Database file is automatically created at `instance/app.db`

### PostgreSQL
Update `.env`:
```bash
DB_ENGINE=postgresql
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=code_red
```

Then start server - migrations will run automatically if `AUTO_CREATE_TABLES=True`

## Common Issues & Solutions

### Port Already in Use
```bash
# Find process using port 3500
lsof -i :3500

# Kill process
kill -9 <PID>
```

### Virtual Environment Issues
```bash
# Recreate virtual environment
rm -rf .benv
python3 -m venv .benv
source .benv/bin/activate
pip install -r requirements.txt
```

### Module Import Errors
```bash
# Ensure virtual environment is activated
source .benv/bin/activate

# Reinstall requirements
pip install -r requirements.txt --force-reinstall
```

## Performance Tips

1. **Use PostgreSQL** instead of SQLite for production
2. **Run Celery Worker** in separate terminal for better error tracking
3. **Monitor Redis memory** - clear old task results regularly
4. **Use Flower** to monitor Celery tasks visually
5. **Enable logging** by checking Flask debug output

## Next Steps

- [ ] Setup virtual environment: `./setup_env.sh`
- [ ] Start Redis: `./start_redis.sh`
- [ ] Start all servers: `./start_all_servers.sh`
- [ ] Test API: `curl http://localhost:3500/api/v1/health`
- [ ] Check logs in separate terminal

---

For more details, see:
- [API Endpoints Documentation](API_ENDPOINTS.md)
- [Backend Structure](STRUCTURE.md)
- [README](README.md)
