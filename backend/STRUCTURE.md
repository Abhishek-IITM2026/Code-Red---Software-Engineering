# Backend Structure

The backend follows an app-factory driven Flask layout with clear separation between HTTP, validation, business logic, persistence, and background processing.

```text
backend/
backend/
├── app/
│   ├── __init__.py            # main Flask app factory
│   ├── api/                   # router registration, health endpoint, error handling
│   ├── common/                # auth decorators and shared response helpers
│   ├── core/                  # config, settings, extensions, Celery, runtime fallbacks
│   ├── document_store/        # MongoDB and in-memory document adapters
│   ├── features/              # blueprint modules grouped by feature
│   │   ├── academics/
│   │   ├── assessments/
│   │   ├── attendance/
│   │   ├── auth/
│   │   ├── faculty/
│   │   ├── jobs/
│   │   ├── marks/
│   │   ├── notifications/
│   │   ├── parent/
│   │   ├── schedule/
│   │   └── students/
│   ├── models/                # SQLAlchemy relational models
│   ├── modules/               # central feature blueprint registry
│   ├── repositories/          # persistence helpers for data access
│   ├── schemas/               # Pydantic request/query validation schemas
│   ├── seed/                  # seed data bootstrap
│   ├── services/              # business logic and orchestration
│   └── tasks/                 # Celery tasks
├── docs/                      # API, ER, RBAC, and project documentation
├── instance/                  # local sqlite database for development
├── migrations/                # Alembic / Flask-Migrate workspace
├── tests/                     # backend pytest suite
├── .env.example               # backend environment variable template
├── requirements.txt           # backend Python dependencies
├── run.py                     # local development entrypoint
└── wsgi.py                    # production WSGI entrypoint
```

## Key Layers

- `app/api/`
  Owns top-level HTTP concerns such as route mounting, health checks, and normalized API error responses.
- `app/features/`
  Owns endpoint handlers grouped by business capability.
- `app/schemas/`
  Uses Pydantic to validate JSON bodies and query parameters before route logic executes.
- `app/services/`
  Holds reusable business logic that should not live directly in route handlers.
- `app/repositories/`
  Wraps persistence-specific access patterns, especially for document-backed assessment questions.
- `app/tasks/`
  Holds Celery jobs for asynchronous work such as notifications.
- `app/core/`
  Centralizes settings, Flask extensions, Celery bootstrap, and runtime fallback behavior.

## Data Strategy

- Structured and relational data is stored with SQLAlchemy models in `app/models/`.
- Unstructured or evolving assessment question payloads are stored through `app/document_store/`.
- Assessments keep relational metadata in SQL and a `questions_document_id` pointer for question documents.
- Mongo-backed document storage automatically falls back to an in-memory implementation in test and fallback scenarios.

## Background Jobs And Rate Limiting

- Celery is configured in `app/core/celery_app.py`.
- Redis is the preferred broker/result backend for Celery and the preferred backend for rate-limit storage.
- If Redis is unavailable locally, runtime fallback logic switches Celery and rate limiting to in-memory behavior so development requests do not fail.
- Job status is exposed through the `jobs` feature module.

## Runtime notes

- Settings are loaded from backend `.env` and project-root `.env` files through Pydantic settings.
- `AUTO_CREATE_TABLES` and `SEED_ON_STARTUP` are disabled by default for safer production behavior.
- Tests use in-memory SQL, in-memory document storage, eager Celery execution, and disabled rate limiting by default.
- `run.py` is the local Flask entrypoint, while `wsgi.py` is the production server entrypoint.
- `backend/docs/openapi.yaml` is the API contract and should stay aligned with route behavior.
