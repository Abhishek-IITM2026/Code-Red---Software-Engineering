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

For a project-local MongoDB process after installation:

```bash
./start_mongo_local.sh
./stop_mongo_local.sh
```

The backend runs on:

```text
http://localhost:3500
```

Health check:

```text
GET /health
```

Document-store health:

```text
GET /health/document-store
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
- `EMAIL_ENABLED`
- `EMAIL_SMTP_HOST`
- `EMAIL_SMTP_PORT`
- `EMAIL_SMTP_USERNAME`
- `EMAIL_SMTP_PASSWORD`
- `EMAIL_IMAP_HOST`
- `EMAIL_IMAP_PORT`
- `EMAIL_IMAP_USERNAME`
- `EMAIL_IMAP_PASSWORD`
- `REDIS_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `RATELIMIT_STORAGE_URI`
- `RATELIMIT_DEFAULT`

See [`.env.example`](/media/dheerajkumarvishwakarma/E/degree_level/software engineering/project/Code-Red---Software-Engineering/backend/.env.example) for the full template.

## Database And Storage

- SQLAlchemy stores structured relational data.
- MongoDB stores unstructured assessment question documents.
- Default MongoDB database name is `ciop_db`.
- Email sending uses SMTP and inbound email sync uses IMAP.
- Assessments keep relational metadata in SQL plus a `questions_document_id` pointer to question documents.

For Ubuntu 24.04, MongoDB's official install guide supports Community Edition 8.0 on Noble. After installation, this repo's `start_mongo_local.sh` script runs `mongod` with its data under `backend/.mongo/`.

For development and tests:

- SQLite is supported out of the box.
- If MongoDB is not available, the document layer can fall back to in-memory behavior where configured.

To inspect MongoDB data without `mongosh`, use:

```bash
cd backend
./.benv/bin/python inspect_mongo.py
./.benv/bin/python inspect_mongo.py --collection assessment_questions --limit 3
./.benv/bin/python inspect_mongo.py --collection assessment_submissions --limit 3
```

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

## Email Transport

The backend now supports:

- SMTP delivery for OTP emails and admin/system notifications
- IMAP inbox synchronization for received mail storage
- SQL persistence of outbound and inbound email messages

Main admin endpoints:

```text
GET  /api/v1/notifications/email/status
POST /api/v1/notifications/email/send
POST /api/v1/notifications/email/sync
GET  /api/v1/notifications/email/messages
GET  /api/v1/notifications/email/messages/<id>
```

Typical configuration:

```bash
EMAIL_ENABLED=true
EMAIL_FROM_ADDRESS=no-reply@example.com
EMAIL_FROM_NAME=CIOP Platform
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USERNAME=no-reply@example.com
EMAIL_SMTP_PASSWORD=app-password
EMAIL_SMTP_USE_TLS=true
EMAIL_IMAP_HOST=imap.example.com
EMAIL_IMAP_PORT=993
EMAIL_IMAP_USERNAME=no-reply@example.com
EMAIL_IMAP_PASSWORD=app-password
EMAIL_IMAP_MAILBOX=INBOX
EMAIL_IMAP_USE_SSL=true
EMAIL_DEBUG_INCLUDE_OTP=false
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
