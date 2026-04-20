# Code-Red: Coaching Institute Management Platform - Complete Setup Guide

A comprehensive coaching institute operation management system with a Flask backend and React frontend.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Using Provided Scripts](#using-provided-scripts)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Running the Projects](#running-the-projects)
8. [Development Workflow](#development-workflow)
9. [Testing](#testing)
10. [Environment Variables](#environment-variables)
11. [Troubleshooting](#troubleshooting)
12. [Project Architecture](#project-architecture)

---

## Project Overview

This is a full-stack coaching institute management platform designed to streamline administrative operations, academic management, and student engagement.

### Key Features

- **Multi-role Portal**: Separate interfaces for Students, Faculty, Parents, and Administrators
- **Academic Management**: Classes, courses, assessments, attendance, and marks tracking
- **AI-Powered Features**: Automated assessment question generation with RAG and student chat support
- **Financial Management**: Fee collection, salary management, and procurement tracking
- **Background Jobs**: Asynchronous task processing for notifications and emails
- **Document Management**: MongoDB-backed document store for assessments and materials
- **Responsive UI**: Modern React frontend with role-based access and customizable themes

### Tech Stack

**Backend:**
- Flask (Python web framework)
- SQLAlchemy (ORM)
- MongoDB (Document store)
- Celery (Task queue)
- Redis (Cache & Celery broker)
- PostgreSQL/SQLite (Relational database)

**Frontend:**
- React 19
- TypeScript
- Redux Toolkit (State management)
- RTK Query (Data fetching)
- React Router (Navigation)
- Tailwind CSS (Styling)
- Vite (Build tool)

---

## Prerequisites

### System Requirements

**For Backend:**
- Python 3.9+
- pip/poetry
- Git

**For Frontend:**
- Node.js 18+
- npm 9+ or yarn

**Optional Services (for full functionality):**
- MongoDB 4.4+
- Redis 6.0+
- PostgreSQL 12+ (or SQLite for development)

### OS-Specific Notes

**Ubuntu/Debian:**
```bash
# Install Python and dependencies
sudo apt-get update
sudo apt-get install python3 python3-venv python3-dev build-essential

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Optional: Install MongoDB
sudo apt-get install -y mongodb

# Optional: Install Redis
sudo apt-get install -y redis-server
```

**macOS:**
```bash
# Using Homebrew
brew install python3 node

# Optional services
brew install mongodb-community redis
```

**Windows:**
- Download Python from https://www.python.org
- Download Node.js from https://nodejs.org
- Use WSL 2 or Docker for MongoDB/Redis or download from official websites

---

## Using Provided Scripts

The project includes convenient shell scripts to automate setup and server management. **Make scripts executable first:**

```bash
chmod +x backend/*.sh frontend/*.sh
```

### Backend Scripts

**Setup Backend Environment**
```bash
cd backend
./setup_env.sh
```
- Creates Python virtual environment
- Installs all dependencies from `requirements.txt`
- Checks Python version compatibility
- Colored output for easy tracking

**Start All Backend Services** (Recommended for development)
```bash
cd backend
./start_all_servers.sh
```
- Starts Flask API server (port 3500)
- Starts Celery worker
- Starts Celery Beat scheduler
- Starts MongoDB locally (if available)
- Starts Redis server (if available)
- Saves process IDs for later cleanup
- **Note**: Run in a dedicated terminal window

**Start Individual Backend Services**

Start Flask API Server Only:
```bash
./start_flask_server.sh
```
- Runs on port 3500 with auto-reload

Start Celery Worker Only:
```bash
./start_celery_worker.sh
```
- Processes background tasks

Start Celery Beat (Scheduler) Only:
```bash
./start_celery_beat.sh
```
- Manages scheduled tasks

Start MongoDB Locally:
```bash
./start_mongo_local.sh
```
- Runs MongoDB in `backend/.mongo/` directory

Start Redis Server:
```bash
./start_redis.sh
```
- Starts Redis for caching and Celery broker

**Stop All Backend Services**
```bash
cd backend
./stop_all_servers.sh
```
- Gracefully stops all running services
- Cleans up process IDs

**Stop MongoDB Locally**
```bash
./stop_mongo_local.sh
```
- Stops locally-running MongoDB instance

**Inspect MongoDB Data**
```bash
cd backend
python3 inspect_mongo.py
python3 inspect_mongo.py --collection assessment_questions --limit 3
python3 inspect_mongo.py --collection assessment_submissions --limit 3
```
- View MongoDB collections without `mongosh`
- Optional collection filter and limit

**Reseed Database**
```bash
cd backend
python3 reseed_database.py
```
- Clear and repopulate SQLite/PostgreSQL with seed data
- Useful for testing and development reset

### Frontend Scripts

**Setup Frontend Environment**
```bash
cd frontend
./setup_frontend.sh
```
- Checks Node.js and npm installation
- Installs npm dependencies
- Colored output for easy tracking

**Start Frontend Development Server** (Recommended)
```bash
cd frontend
./start_frontend.sh
```
- Runs on port 5173 (or next available)
- Hot module replacement enabled
- Auto-runs setup if dependencies missing

**Complete Frontend Development Setup**
```bash
cd frontend
./dev_complete.sh
```
- Runs linter
- Runs tests
- Starts development server
- All in parallel with visual feedback

**Build for Production**
```bash
cd frontend
./build_frontend.sh
```
- Creates optimized production bundle
- Output in `dist/` directory
- Ready for deployment

**Preview Production Build**
```bash
cd frontend
./preview_frontend.sh
```
- Test production build locally
- Useful for verifying production behavior

**Lint Code**
```bash
cd frontend
./lint_frontend.sh
```
- Runs ESLint for code quality
- Checks TypeScript and React best practices

**Run Tests**
```bash
cd frontend
./test_frontend.sh
```
- Runs Vitest test suite
- Check test configuration in `package.json`

**Generate Test Coverage**
```bash
cd frontend
./coverage_frontend.sh
```
- Runs tests and generates coverage report
- Useful for assessing test coverage

---

## Quick Start Using Scripts

For the fastest way to get the project running locally:

### Backend Quick Start
```bash
cd backend
python3 -m venv .benv
source .benv/bin/activate  # On Windows: .benv\Scripts\activate
pip install -r requirements.txt
python run.py
```
Backend will run at `http://localhost:3500`

### Frontend Quick Start
```bash
cd frontend
npm install
npm run dev
```
Frontend will run at `http://localhost:5173` (or next available port)

### Test with Demo Credentials
Once both are running, access the app at the frontend URL and login with:
- **Admin**: admin@demo.com / password
- **Faculty**: faculty@demo.com / password
- **Student**: student@demo.com / password
- **Parent**: parent@demo.com / password

---

## Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Create Virtual Environment
```bash
python3 -m venv .benv
source .benv/bin/activate  # On Windows: .benv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Setup Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Core Settings
SECRET_KEY=your-secret-key-here
FLASK_ENV=development

# Database (SQLite for development, PostgreSQL for production)
DB_ENGINE=sqlite  # or postgres
SQLITE_PATH=app.db
# DATABASE_URL=postgresql://user:password@localhost:5432/ciom_db

# Auto-setup for development
AUTO_CREATE_TABLES=true
SEED_ON_STARTUP=true

# MongoDB (Optional - for assessments and documents)
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=ciop_db

# Redis (Optional - for caching and Celery)
REDIS_URL=redis://localhost:6379

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379
CELERY_RESULT_BACKEND=redis://localhost:6379

# Email Configuration (Optional)
EMAIL_ENABLED=false
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USERNAME=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password

# Rate Limiting
RATELIMIT_DEFAULT=200/day;50/hour

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 5: Initialize Database (Optional - automatic if AUTO_CREATE_TABLES=true)

```bash
# Activate virtual environment if not already
source .benv/bin/activate

# Initialize migrations (only needed if starting fresh)
flask --app run.py db init

# Create migration
flask --app run.py db migrate -m "Initial schema"

# Apply migration
flask --app run.py db upgrade
```

### Step 6: Start Backend Services

**Basic Backend Only:**
```bash
source .benv/bin/activate
python run.py
```
Backend runs at: `http://localhost:3500`

**With All Services (Redis, MongoDB, Celery):**

Open multiple terminal tabs:

**Tab 1 - Flask Server:**
```bash
cd backend
source .benv/bin/activate
python run.py
```

**Tab 2 - Celery Worker (for background tasks):**
```bash
cd backend
source .benv/bin/activate
celery -A app.core.celery_app worker -l info
```

**Tab 3 - Celery Beat (for scheduled tasks):**
```bash
cd backend
source .benv/bin/activate
celery -A app.core.celery_app beat -l info
```

**Tab 4 - MongoDB (if not running as service):**
```bash
cd backend
./start_mongo_local.sh
```

**Tab 5 - Redis (if not running as service):**
```bash
redis-server
```

Or use the provided script (Linux/macOS):
```bash
cd backend
chmod +x start_all_servers.sh
./start_all_servers.sh
```

To stop all services:
```bash
cd backend
chmod +x stop_all_servers.sh
./stop_all_servers.sh
```

### Health Checks

Check if backend is healthy:
```bash
curl http://localhost:3500/health
```

Check document store (MongoDB):
```bash
curl http://localhost:3500/health/document-store
```

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Environment Variables

Create `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:3500/api
VITE_APP_NAME=Code-Red CIOM
VITE_APP_LOGO=CR
VITE_APP_TAGLINE=Coaching Institute Operation Management
```

### Step 4: Start Development Server
```bash
npm run dev
```

Frontend will run at: `http://localhost:5173` (or next available port)

### Step 5: Build for Production
```bash
npm run build
```

Production files will be in `dist/` directory.

### Step 6: Preview Production Build
```bash
npm run preview
```

---

## Running the Projects

### Option 1: Backend Only (Minimal Setup)

Perfect for backend development or API testing:

```bash
# Terminal 1: Backend
cd backend
python3 -m venv .benv
source .benv/bin/activate
pip install -r requirements.txt
python run.py
```

Access API documentation: `http://localhost:3500/api/docs` (if Swagger is enabled)

### Option 2: Backend + Frontend (Full Stack)

Perfect for local development:

**Terminal 1 - Backend:**
```bash
cd backend
source .benv/bin/activate
python run.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access app at: Frontend URL (usually `http://localhost:5173`)

### Option 3: Full Stack with All Services

Perfect for testing complete functionality including background jobs:

**Terminal 1 - Flask Backend:**
```bash
cd backend
source .benv/bin/activate
python run.py
```

**Terminal 2 - Celery Worker:**
```bash
cd backend
source .benv/bin/activate
celery -A app.core.celery_app worker -l info
```

**Terminal 3 - Celery Beat:**
```bash
cd backend
source .benv/bin/activate
celery -A app.core.celery_app beat -l info
```

**Terminal 4 - MongoDB (if local):**
```bash
cd backend
./start_mongo_local.sh
```

**Terminal 5 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 4: Using Docker (Optional)

If you have Docker installed, build and run containers:

```bash
# Build backend image
docker build -t ciom-backend backend/

# Build frontend image
docker build -t ciom-frontend frontend/

# Run backend
docker run -p 3500:3500 -e DB_ENGINE=sqlite ciom-backend

# Run frontend
docker run -p 5173:5173 ciom-frontend
```

---

## Development Workflow

### Adding Backend Features

1. **Create route handler** in `backend/app/features/<feature>/routes.py`
2. **Create Pydantic schema** in `backend/app/schemas/<feature>.py`
3. **Create service** in `backend/app/services/<feature>.py`
4. **Add database migration** if needed:
   ```bash
   cd backend
   flask --app run.py db migrate -m "description"
   flask --app run.py db upgrade
   ```
5. **Register blueprint** in `backend/app/modules/__init__.py`
6. **Write tests** in `backend/tests/test_<feature>.py`
7. **Update documentation** in `backend/docs/` and `CONTEXTS.md`

### Adding Frontend Features

1. **Create feature folder** in `frontend/src/features/<feature>`
2. **Create API slice** in `frontend/src/features/<feature>/api/<feature>Api.ts`
3. **Create routes** in `frontend/src/features/<feature>/routes/<feature>.routes.tsx`
4. **Create pages/components** in `frontend/src/features/<feature>/pages/`
5. **Wire routes** into `frontend/src/app/routes.tsx`
6. **Write tests** in `frontend/src/features/<feature>/__tests__/`

### Key Directories

**Backend:**
- `backend/app/features/` - Feature blueprints
- `backend/app/models/` - SQLAlchemy models
- `backend/app/schemas/` - Pydantic validation schemas
- `backend/app/services/` - Business logic
- `backend/app/repositories/` - Data access layer
- `backend/tests/` - Test suite

**Frontend:**
- `frontend/src/features/` - Feature modules
- `frontend/src/app/` - Store and routing
- `frontend/src/services/` - API clients
- `frontend/src/theme/` - Theme system
- `frontend/src/components/` - Reusable components

---

## Testing

### Backend Tests

#### Using Test Script
The backend includes a test script for automated testing:

```bash
cd backend

# Run all tests with the setup script
./setup_env.sh     # Setup if not already done
pytest             # Run all tests

# Or use pytest directly
source .benv/bin/activate
pytest
```

#### Manual Test Commands

**Run all tests:**
```bash
cd backend
source .benv/bin/activate
pytest
```

**Run specific test file:**
```bash
pytest tests/test_auth.py
```

**Run with coverage report:**
```bash
pytest --cov=app tests/
```

**Run verbose output:**
```bash
pytest -v
```

**Run specific test:**
```bash
pytest tests/test_auth.py::test_login
```

**Run tests in watch mode (auto-rerun on changes):**
```bash
pytest --watch
```

**Run with HTML coverage report:**
```bash
pytest --cov=app --cov-report=html tests/
# Open htmlcov/index.html in browser
```

**Test Configuration:**
- Uses in-memory SQLite database (no external DB needed)
- Uses in-memory document store (no MongoDB needed)
- Celery runs eagerly (synchronous task execution)
- Rate limiting disabled
- Test data seeded for each test

**Test Files Location:**
- `backend/tests/conftest.py` - Test fixtures and setup
- `backend/tests/BACKEND_TEST_SUMMARY.md` - Detailed test documentation
- `backend/tests/unit/` - Unit tests
- `backend/tests/integration/` - Integration tests

**Backend Test Structure:**
```
backend/tests/
├── conftest.py              # Fixtures and setup
├── BACKEND_TEST_SUMMARY.md  # Test documentation
├── TEST_CASES.md            # Test case specifications
├── unit/                    # Unit tests
│   ├── test_auth.py
│   ├── test_models.py
│   └── ...
└── integration/             # Integration tests
    ├── test_rag_multimodal.py
    └── ...
```

### Frontend Tests

#### Using Test Scripts

**Run frontend tests:**
```bash
cd frontend
./test_frontend.sh
```

**Generate test coverage:**
```bash
cd frontend
./coverage_frontend.sh
```

**Lint code:**
```bash
cd frontend
./lint_frontend.sh
```

**Run complete development setup with tests:**
```bash
cd frontend
./dev_complete.sh  # Runs linter, tests, and dev server
```

#### Manual Test Commands

**Run all tests with watch mode:**
```bash
cd frontend
npm run test
```

**Run tests once (CI mode):**
```bash
npm run test -- run
```

**Run with coverage:**
```bash
npm run coverage
```

**Run specific test file:**
```bash
npm run test -- src/features/auth/__tests__/auth.test.ts
```

**Lint code:**
```bash
npm run lint
```

**Check for TypeScript errors:**
```bash
npm run type-check
```

**Frontend Test Configuration:**
- Uses Vitest as test runner
- Uses React Testing Library for component tests
- TypeScript for type safety
- ESLint for code quality
- Located in `src/**/__tests__/` directories

**Frontend Test Structure:**
```
frontend/src/
├── features/
│   ├── auth/
│   │   └── __tests__/
│   │       └── auth.test.ts
│   ├── student/
│   │   └── __tests__/
│   │       └── student.test.ts
│   └── ...
├── utils/
│   └── __tests__/
│       └── helpers.test.ts
└── ...
```

### Running Tests in CI/CD Pipeline

**Backend CI/CD:**
```bash
cd backend
source .benv/bin/activate
pip install -r requirements.txt
pytest --cov=app --cov-report=xml tests/
```

**Frontend CI/CD:**
```bash
cd frontend
npm install
npm run lint
npm run type-check
npm run test -- run --coverage
```

### Integration Testing

Test the full stack locally:

1. **Start Backend Services:**
   ```bash
   cd backend
   ./setup_env.sh
   ./start_all_servers.sh
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   ./setup_frontend.sh
   ./start_frontend.sh
   ```

3. **Login with demo credentials:**
   - **Admin**: admin@demo.com / password
   - **Faculty**: faculty@demo.com / password
   - **Student**: student@demo.com / password
   - **Parent**: parent@demo.com / password

4. **Test main workflows:**
   - Navigate through different role portals
   - Create/edit records
   - Submit forms
   - Check backend responses
   - Verify database changes

### Testing Best Practices

**Backend:**
- Write tests alongside feature code
- Use fixtures in `conftest.py` for common setup
- Test both success and error cases
- Mock external services (APIs, emails)
- Aim for >80% code coverage

**Frontend:**
- Write component tests for complex components
- Test user interactions, not implementation details
- Use accessibility queries when possible
- Mock API calls with MSW (Mock Service Worker)
- Keep tests fast and isolated

### Debugging Tests

**Backend Debugging:**
```bash
cd backend
source .benv/bin/activate

# Run with verbose output and print statements
pytest -v -s tests/test_auth.py

# Stop on first failure
pytest -x tests/

# Drop into debugger on failure
pytest --pdb tests/test_auth.py
```

**Frontend Debugging:**
```bash
cd frontend

# Run tests with UI
npm run test -- --ui

# Debug specific test
npm run test -- --reporter=verbose src/features/auth/__tests__/auth.test.ts
```

---

## Environment Variables

### Backend Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `FLASK_ENV` | development | Flask environment mode |
| `SECRET_KEY` | - | Secret key for sessions |
| `DB_ENGINE` | sqlite | Database engine (sqlite, postgres) |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `SQLITE_PATH` | app.db | SQLite database file path |
| `AUTO_CREATE_TABLES` | false | Auto-create tables on startup |
| `SEED_ON_STARTUP` | false | Auto-seed test data on startup |
| `MONGO_URI` | mongodb://localhost:27017 | MongoDB connection URI |
| `MONGO_DB_NAME` | ciop_db | MongoDB database name |
| `REDIS_URL` | redis://localhost:6379 | Redis connection URI |
| `CELERY_BROKER_URL` | redis://localhost:6379 | Celery broker URL |
| `CELERY_RESULT_BACKEND` | redis://localhost:6379 | Celery result backend |
| `EMAIL_ENABLED` | false | Enable email sending |
| `EMAIL_SMTP_HOST` | - | SMTP server host |
| `EMAIL_SMTP_PORT` | 587 | SMTP server port |
| `RATELIMIT_DEFAULT` | 200/day;50/hour | Rate limit rule |
| `CORS_ORIGINS` | http://localhost:5173 | CORS allowed origins |

### Frontend Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | http://localhost:3500/api | Backend API base URL |
| `VITE_APP_NAME` | Code-Red CIOM | Application name |
| `VITE_APP_LOGO` | CR | Logo text |
| `VITE_APP_TAGLINE` | - | Tagline text |

---

## Troubleshooting

### Backend Issues

**Port 3500 already in use:**
```bash
# Find process using port 3500
lsof -i :3500
# Kill the process
kill -9 <PID>
```

**Module not found errors:**
```bash
# Ensure virtual environment is activated
source .benv/bin/activate

# Reinstall requirements
pip install --upgrade -r requirements.txt
```

**Database locked (SQLite):**
```bash
# Remove old database
rm backend/app.db

# Restart backend - will auto-create and seed
python run.py
```

**MongoDB connection failed:**
```bash
# Check MongoDB is running
ps aux | grep mongod

# Start MongoDB if not running
cd backend
./start_mongo_local.sh

# Or install MongoDB service
sudo systemctl start mongod
```

**Redis connection failed:**
```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Start Redis if not running
redis-server
```

### Frontend Issues

**Port 5173 already in use:**
```bash
# Kill process on port 5173 or use different port
npm run dev -- --port 5174
```

**API connection errors:**
```bash
# Check VITE_API_URL in .env
cat frontend/.env

# Ensure backend is running on correct port
curl http://localhost:3500/health
```

**Module not found in node_modules:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Blank screen or routing issues:**
```bash
# Clear browser cache and local storage
# Reload page: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (macOS)
```

### Common Issues

**CORS errors in browser console:**
- Ensure `CORS_ORIGINS` in backend `.env` includes frontend URL
- Backend default: `http://localhost:5173`

**Login not working:**
- Check `AUTO_CREATE_TABLES=true` and `SEED_ON_STARTUP=true` are set
- Try the demo credentials in the [Quick Start](#quick-start) section
- Check backend logs for errors

**Background jobs not running:**
- Ensure Celery worker is running: `celery -A app.core.celery_app worker -l info`
- Check Redis is available
- View worker logs for errors

---

## Project Architecture

### Backend Architecture

```
backend/
├── app/
│   ├── __init__.py           # App factory
│   ├── core/
│   │   ├── settings.py       # Pydantic settings
│   │   ├── config.py         # App configuration
│   │   ├── extensions.py     # SQLAlchemy, Flask extensions
│   │   └── celery_app.py     # Celery setup
│   ├── models/
│   │   ├── core.py           # Main SQLAlchemy models
│   │   └── leave.py          # Leave models
│   ├── schemas/              # Pydantic schemas for validation
│   ├── features/             # Feature blueprints
│   │   ├── auth/
│   │   ├── students/
│   │   ├── faculty/
│   │   ├── administration/
│   │   ├── assessments/
│   │   └── ...
│   ├── services/             # Business logic
│   ├── repositories/         # Data access layer
│   ├── document_store/       # MongoDB document store
│   ├── rag/                  # AI/RAG functionality
│   ├── tasks/                # Celery tasks
│   └── common/               # Common utilities
├── migrations/               # Database migrations
├── tests/                    # Test suite
├── run.py                    # Local development entry point
└── wsgi.py                   # Production WSGI entry point
```

### Frontend Architecture

```
frontend/
├── src/
│   ├── app/
│   │   ├── routes.tsx        # Main routing
│   │   └── store.ts          # Redux store
│   ├── features/             # Feature modules
│   │   ├── auth/
│   │   ├── student/
│   │   ├── faculty/
│   │   ├── parent/
│   │   ├── administration/
│   │   └── ...
│   ├── services/
│   │   └── api/              # RTK Query slices
│   ├── theme/                # Theme system
│   ├── components/           # Reusable components
│   └── utils/                # Utilities
├── index.html                # HTML entry point
└── vite.config.ts            # Vite configuration
```

### Data Flow

```
┌─────────────────────────────────────────┐
│         Frontend (React + Redux)        │
│  ┌──────────────┐  ┌────────────────┐   │
│  │  Components  │  │  RTK Query     │   │
│  └──────────────┘  └────────────────┘   │
└──────────────┬──────────────────────────┘
               │ HTTP REST API
               ▼
┌──────────────────────────────────────────┐
│  Backend (Flask + SQLAlchemy)            │
│  ┌────────────┐  ┌─────────────────┐    │
│  │  Routes    │  │  Services       │    │
│  └────────────┘  └─────────────────┘    │
│  ┌────────────┐  ┌─────────────────┐    │
│  │  Schemas   │  │  Repositories   │    │
│  └────────────┘  └─────────────────┘    │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┬────────────────┐
      ▼                 ▼                ▼
   SQLite/          MongoDB          Redis
   PostgreSQL      (Documents)    (Cache/Queue)
```

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students/me` - Get student profile
- `GET /api/students/me/dashboard` - Student dashboard
- `GET /api/assessments` - List assessments
- `POST /api/assessments/{id}/submit` - Submit assessment

### Faculty
- `GET /api/faculty/dashboard` - Faculty dashboard
- `GET /api/faculty/subjects/{id}/materials` - List materials
- `POST /api/assessments` - Create assessment

### Administration
- `GET /api/administration/dashboard` - Admin dashboard
- `POST /api/students` - Create student
- `POST /api/courses` - Create course

### More endpoints
See backend documentation in `backend/docs/` or access Swagger UI if enabled.

---

## Support and Documentation

For more detailed information:
- Backend documentation: `backend/README.md`
- Frontend documentation: `frontend/README.md`
- Architecture context: `CONTEXTS.md`
- API endpoints: `backend/API_ENDPOINTS.md`

---

## Next Steps

1. **Complete the Quick Start** above to get both projects running
2. **Access the frontend** at the URL provided
3. **Login with demo credentials** to explore the application
4. **Read CONTEXTS.md** for detailed architecture information
5. **Explore the backend code** in `backend/app/features/`
6. **Review the frontend components** in `frontend/src/features/`
7. **Write tests** for your changes
8. **Check the troubleshooting section** if you encounter issues

Happy coding! 🚀
