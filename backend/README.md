# Coaching institute operation management Backend

Flask backend for the Coaching institute operation management coaching institute platform.

This backend uses:

- Flask with an app factory
- Flask-SQLAlchemy for relational data
- Flask-Migrate / Alembic for schema migrations
- Pydantic for request validation
- MongoDB for unstructured document-style data such as assessment questions
- Celery for background jobs
- Redis for Celery transport and rate-limit storage
- Flask-Limiter for endpoint throttling

## Quick Start

From the project root:

```bash
cd backend
python3 -m venv .benv
source .benv/bin/activate
pip install -r requirements.txt
```

Create your environment file:

```bash
cp .env.example .env
```

For local development with SQLite:

- set `AUTO_CREATE_TABLES=true`
- set `SEED_ON_STARTUP=true`

Start the app:

```bash
source .benv/bin/activate
python run.py
```

The backend runs on:

```text
http://localhost:3500
```

Health check:

```text
GET /health
```

## Environment Variables

Main configuration lives in `.env` and is loaded through Pydantic settings.

Important variables:

- `SECRET_KEY`
- `DB_ENGINE`
- `DATABASE_URL`
- `SQLITE_PATH`
- `AUTO_CREATE_TABLES`
- `SEED_ON_STARTUP`
- `MONGO_URI`
- `MONGO_DB_NAME`
- `MONGO_ASSESSMENT_COLLECTION`
- `REDIS_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `RATELIMIT_STORAGE_URI`
- `RATELIMIT_DEFAULT`

See [`.env.example`](/media/dheerajkumarvishwakarma/E/degree_level/software engineering/project/Code-Red---Software-Engineering/backend/.env.example) for the full template.

## Database And Storage

- SQLAlchemy stores structured relational data.
- MongoDB stores unstructured assessment question documents.
- Assessments keep relational metadata in SQL plus a `questions_document_id` pointer to question documents.

For development and tests:

- SQLite is supported out of the box.
- If MongoDB is not available, the document layer can fall back to in-memory behavior where configured.

## Migrations

Flask-Migrate is already wired into the app factory.

Typical workflow:

```bash
source .benv/bin/activate
flask --app run.py db init
flask --app run.py db migrate -m "initial schema"
flask --app run.py db upgrade
```

Migration workspace:

- [migrations/](/media/dheerajkumarvishwakarma/E/degree_level/software engineering/project/Code-Red---Software-Engineering/backend/migrations)

## Background Jobs

Celery is used for asynchronous tasks such as notification delivery.

Start a worker:

```bash
source .benv/bin/activate
celery -A app.core.celery_app.celery_app worker --loglevel=info
```

Preferred local infra:

- Redis for Celery broker/result backend
- Redis for rate-limit storage

If Redis is not running locally, the backend automatically falls back to:

- `memory://` for the Celery broker
- `cache+memory://` for Celery results
- `memory://` for rate-limit storage

This keeps local development from failing with connection errors.

## Running Tests

Run the backend test suite with:

```bash
cd backend
./.benv/bin/python -m pytest tests
```

The tests use:

- in-memory SQL database
- in-memory document storage
- eager Celery execution
- disabled rate limiting

## API Contract

Primary API documentation:

- [docs/openapi.yaml](/media/dheerajkumarvishwakarma/E/degree_level/software engineering/project/Code-Red---Software-Engineering/backend/docs/openapi.yaml)

Additional references:

- [API_ENDPOINTS.md](/media/dheerajkumarvishwakarma/E/degree_level/software engineering/project/Code-Red---Software-Engineering/backend/API_ENDPOINTS.md)
- [STRUCTURE.md](/media/dheerajkumarvishwakarma/E/degree_level/software engineering/project/Code-Red---Software-Engineering/backend/STRUCTURE.md)

## Project Layout

High-level backend structure:

```text
backend/
├── app/
│   ├── api/
│   ├── common/
│   ├── core/
│   ├── document_store/
│   ├── features/
│   ├── models/
│   ├── modules/
│   ├── repositories/
│   ├── schemas/
│   ├── seed/
│   ├── services/
│   └── tasks/
├── docs/
├── instance/
├── migrations/
├── tests/
├── .env.example
├── requirements.txt
├── run.py
└── wsgi.py
```

## Key Notes

- Route handlers live under `app/features/`.
- Request and query validation lives under `app/schemas/`.
- Shared runtime setup lives under `app/core/`.
- Production entrypoint is `wsgi.py`.
- Local development entrypoint is `run.py`.
