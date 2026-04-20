# Code-Red: Coaching Institute Operation Management Platform

A comprehensive full-stack coaching institute management system with an intelligent backend and modern React frontend.

## 🚀 Quick Links

- **📖 Complete Setup Guide**: See [PROJECT_SETUP_GUIDE.md](./PROJECT_SETUP_GUIDE.md) for detailed setup and running instructions
- **🏗️ Architecture Context**: See [CONTEXTS.md](./CONTEXTS.md) for in-depth codebase architecture and conventions

## Quick Start (2 Minutes)

### Option 1: Using Provided Scripts (Recommended)

**Backend:**
```bash
cd backend
chmod +x setup_env.sh
./setup_env.sh
./start_all_servers.sh
```

**Frontend (in another terminal):**
```bash
cd frontend
chmod +x setup_frontend.sh
./setup_frontend.sh
./start_frontend.sh
```

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python3 -m venv .benv
source .benv/bin/activate  # On Windows: .benv\Scripts\activate
pip install -r requirements.txt
python run.py
```

**Frontend (in another terminal):**
```bash
cd frontend
npm install
npm run dev
```

Then login with demo credentials:
- **Admin**: admin@example.in / password
- **Faculty**: faculty@example.in / password
- **Student**: student@example.in / password
- **Parent**: parent@example.in / password

## 🧪 Testing

### Backend Tests
```bash
cd backend
source .benv/bin/activate
pytest                           # Run all tests
pytest tests/test_auth.py        # Run specific file
pytest --cov=app tests/          # With coverage
```

### Using Test Scripts
```bash
# Frontend
cd frontend
./test_frontend.sh       # Run tests
./coverage_frontend.sh   # Coverage report
./lint_frontend.sh       # Linting
```

📖 **Full Testing Guide**: See [Testing Section](./PROJECT_SETUP_GUIDE.md#testing) in PROJECT_SETUP_GUIDE.md

## � Available Scripts

### Backend Scripts

| Script | Purpose |
|--------|---------|
| `./setup_env.sh` | Setup Python virtual environment & dependencies |
| `./start_all_servers.sh` | Start Flask, Celery, MongoDB, Redis together |
| `./start_flask_server.sh` | Start Flask API server only (port 3500) |
| `./start_celery_worker.sh` | Start Celery worker for background tasks |
| `./start_celery_beat.sh` | Start Celery scheduler for periodic tasks |
| `./start_mongo_local.sh` | Start local MongoDB instance |
| `./start_redis.sh` | Start Redis server |
| `./stop_all_servers.sh` | Stop all running services |
| `./stop_mongo_local.sh` | Stop local MongoDB |
| `python3 inspect_mongo.py` | Inspect MongoDB collections |
| `python3 reseed_database.py` | Reset and reseed database |

### Frontend Scripts

| Script | Purpose |
|--------|---------|
| `./setup_frontend.sh` | Install Node.js dependencies |
| `./start_frontend.sh` | Start dev server (port 5173) |
| `./dev_complete.sh` | Run linter, tests, dev server together |
| `./build_frontend.sh` | Build production bundle |
| `./preview_frontend.sh` | Preview production build locally |
| `./lint_frontend.sh` | Run ESLint code quality checks |
| `./test_frontend.sh` | Run Vitest test suite |
| `./coverage_frontend.sh` | Generate test coverage report |

**Make scripts executable first:**
```bash
chmod +x backend/*.sh frontend/*.sh
```

📖 **Full Scripts Documentation**: See [Using Provided Scripts](./PROJECT_SETUP_GUIDE.md#using-provided-scripts) in PROJECT_SETUP_GUIDE.md

## �📚 Documentation

### For Setup and Running
→ **Start here**: [PROJECT_SETUP_GUIDE.md](./PROJECT_SETUP_GUIDE.md)

This guide includes:
- System prerequisites and installation
- Step-by-step backend setup
- Step-by-step frontend setup
- How to run both projects
- Using all services (MongoDB, Redis, Celery)
- Testing and development workflows
- Troubleshooting common issues
- Project architecture overview
