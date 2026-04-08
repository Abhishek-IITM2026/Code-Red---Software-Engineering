# Codebase Context

Updated: 2026-04-07

This is the repo-level context file for coding agents and future maintainers. It is based on the current code, not older summary docs.

When this file conflicts with older context docs, trust the code first, then update this file.

## Maintenance Rule

Update this file in the same change set whenever a code change affects any of the following:

- backend or frontend entry points
- API routes, request/response shapes, auth, or role behavior
- data models, migrations, document-store structure, or uploads
- Redux store wiring, route wiring, feature ownership, or local persistence
- environment variables, service dependencies, or background job flow
- feature additions/removals or major architectural conventions

## Repo Snapshot

- `backend/` is a Flask app-factory backend with blueprints, SQLAlchemy, Flask-Migrate, Pydantic validation, Celery, Redis-backed rate limiting, Mongo-backed document storage with in-memory fallback, and local file uploads.
- `frontend/` is a Vite + React + TypeScript app using React Router, Redux Toolkit, RTK Query, Tailwind, and a CSS-variable theme system.
- Frontend API consumers are expected to target `http://localhost:3500/api` by default unless `VITE_API_URL` overrides that for another environment.
- Some older docs in `frontend/docs/` and `backend/docs/` are useful references but may be stale. This file is the repo-wide context source to keep current.

## Backend Context

### Bootstrap and runtime

- App factory: `backend/app/__init__.py`
- Local entrypoint: `backend/run.py`
- WSGI entrypoint: `backend/wsgi.py`
- Config surface: `backend/app/core/settings.py` and `backend/app/core/config.py`

`create_app()` does the following in order:

1. loads config from Pydantic settings
2. applies Redis/Celery/rate-limit local fallbacks when Redis is unavailable
3. initializes SQLAlchemy, migrations, limiter, and CORS
4. initializes the document store and upload storage
5. initializes Celery with Flask app context
6. registers blueprints
7. optionally auto-creates tables and seeds data

Important runtime note:

- Backend settings are read from `backend/.env` first, then project-root `.env`.
- The checked-in backend local `.env` enables `AUTO_CREATE_TABLES=true` and `SEED_ON_STARTUP=true` so `python run.py` seeds a local dev SQLite database on startup.
- `AUTO_CREATE_TABLES` and `SEED_ON_STARTUP` can modify startup behavior significantly.

### Backend route mounting

- Shared router: `backend/app/api/router.py`
- Blueprint registry: `backend/app/modules/__init__.py`

Feature blueprints are mounted twice:

- versioned: `/api/v1/...`
- legacy: `/api/...`

This matters because:

- backend tests usually call `/api/v1/...`
- frontend API slices mostly call `/api/...`

If you add or rename a backend feature module, update:

- `backend/app/modules/__init__.py`
- any affected frontend API slices
- `backend/docs/openapi.yaml`
- this file

### Response and error contract

- Success helper: `backend/app/common/responses.py`
- Error handler: `backend/app/api/errors.py`

Current behavior:

- list responses are returned as bare JSON arrays
- dict responses are merged into the top-level JSON object
- errors use `{ "error": { "code", "message", "details" } }`

This is important for frontend consumers because some routes return arrays directly while others return objects with named fields.

### Auth and roles

- Auth helpers: `backend/app/common/auth.py`
- Main auth routes: `backend/app/features/auth/routes.py`

Current auth model:

- token auth uses `itsdangerous.URLSafeTimedSerializer`, not JWT
- bearer token is required by `auth_required`
- `roles_required` expands aliases like `teacher -> faculty` and admin-family roles into shared access groups
- frontend and backend both rely on normalized role strings such as `student`, `faculty`, `parent`, `admin`, `administration`, `director`, `superadmin`

If role names or access rules change, also update:

- `frontend/src/app/routes.tsx`
- `frontend/src/features/administration/utils/authorityAccess.ts`
- any role-based UI menus/pages

### Persistence model

- SQLAlchemy models: `backend/app/models/core.py`, `backend/app/models/leave.py`
- Extension setup: `backend/app/core/extensions.py`
- Migration workspace: `backend/migrations/`

Structured relational data lives in SQLAlchemy models. Major domains include:

- users, roles, contact profiles, OTP challenges
- students, parents, faculty, administration staff
- classes, enrollments, courses, faculty-subject assignments
- course enrollments and course payments for optional/program-style courses
- attendance, marks, schedules
- materials, assignments, assessments, submissions
- notifications, email messages
- inventory, material requests
- authority assignments
- salary slips and staff financial profiles
- leave requests

### Document store

- Document store implementation: `backend/app/document_store/mongo.py`
- AI settings repository: `backend/app/repositories/ai_settings.py`
- Assessment repositories: `backend/app/repositories/assessment_questions.py`, `backend/app/repositories/assessment_submissions.py`
- Material source repository: `backend/app/repositories/material_sources.py`

Current pattern:

- relational assessment metadata stays in SQL
- question and submission payloads can live in Mongo collections
- administration-managed assessment AI settings also live in the document store as a singleton config document
- RAG-oriented material source metadata also lives in the document store keyed by material id
- if Mongo or `pymongo` is unavailable, the app falls back to an in-memory document store
- the resilient wrapper can fall back at call time even when Mongo was configured initially
- the document store now supports simple filtered reads used by material-source lookup

This means assessment code changes often need coordinated updates across:

- SQL models
- repositories
- `backend/app/services/assessments.py`
- `backend/app/services/materials.py`
- `backend/app/rag/assessment/`
- frontend faculty/student assessment API consumers

Student chat changes often need coordinated updates across:

- `backend/app/features/students/routes.py`
- `backend/app/rag/student_chat.py`
- `backend/app/services/materials.py`
- student portal API/UI files under `frontend/src/features/student/`

### Uploads and static file serving

- Upload helpers: `backend/app/upload_storage.py`
- Public upload route: `backend/app/api/static_files.py`

Current behavior:

- uploads are stored under `backend/uploads/`
- profile pictures and documents have separate subfolders
- faculty study-material files are stored under `backend/uploads/documents/<class>/<subject>/<week>/...` when uploaded as files
- profile pictures can be uploaded as multipart files or base64 data URLs
- public URLs are served from `/uploads/<path>`

### Background jobs, email, and infra fallbacks

- Celery bootstrap: `backend/app/core/celery_app.py`
- Local fallback logic: `backend/app/core/runtime.py`
- Tasks: `backend/app/tasks/notifications.py`
- Email service: `backend/app/services/email.py`
- Notifications routes: `backend/app/features/notifications/routes.py`

Important behavior:

- Redis is preferred for Celery broker/result storage and rate-limit storage
- if Redis is unavailable locally, Celery and rate limiting fall back to in-memory behavior
- notification routes try Celery first and may execute inline if the broker is unavailable
- email sending/sync is a first-class backend capability, not just a mock-only layer

### Backend feature map

Feature route files live under `backend/app/features/*/routes.py`.

Current modules:

- `auth`: login, register, OTP, profile, password reset/change
- `students`: student profile and student-facing data
- `academics`: classes and sections helpers
- `attendance`: attendance write/list/stats flows
- `marks`: marks views
- `schedule`: schedule CRUD and self-service schedule views
- `faculty`: faculty classes, subjects, materials, performance, upcoming courses
- `inventory`: stock and request management
- `authority`: authority assignment endpoints
- `administration`: dashboard, student/staff CRUD, courses, promotions, finance, reports
- `payroll`: payroll and salary-slip workflows
- `jobs`: job-status endpoints
- `leave`: leave request, review, cancel, stats
- `parent`: parent profile and child dashboards
- `assessments`: assessment CRUD, publish, AI question endpoints, submissions, assignments
- `notifications`: email status/send/sync and schedule notifications
- `uploads`: file-related endpoints

Two notable implementation details:

- assessment question generation is now retrieval-grounded through `backend/app/rag/assessment/`
- student subject pages now expose a RAG-backed chatbot at `POST /api/v1/students/me/subjects/<subject_id>/chat` that answers from uploaded subject materials and returns cited snippets
- administration owns assessment AI provider/model/api-key/rate-limit configuration through `backend/app/features/administration/routes.py`
- assessment AI routes under `backend/app/features/assessments/routes.py` now read dynamic per-route limits from the stored AI settings instead of a hard-coded limiter string
- generated question payloads can include `imageUrls`, `contextSnippet`, and source material references
- some route prefixes are embedded in the feature route itself, for example leave routes define `/leave` inside a blueprint mounted without a route prefix

### Backend tests

- Test setup: `backend/tests/conftest.py`
- Summary doc: `backend/tests/BACKEND_TEST_SUMMARY.md`

Current backend test strategy:

- pytest-based
- uses `create_app("testing")`
- in-memory SQLite
- in-memory document store
- eager Celery
- rate limiting disabled
- seed data recreated for each test via `seed_database(force=True)`

Seeded test identities currently include student, faculty, admin, and parent accounts and are used heavily by auth fixtures.

When backend behavior changes, the usual sync set is:

- route file
- schema file under `backend/app/schemas/`
- service/repository/model code as needed
- backend tests
- `backend/docs/openapi.yaml`

### Unified course model

Current course shape is in transition from older "subjects + upcoming_courses" terminology to a unified courses model:

- SQL table is now `courses`
- the mapped SQLAlchemy class is still named `Subject` for compatibility in existing code paths
- `Course = Subject` and `UpcomingCourse = Subject` aliases exist to reduce breakage while routes are being migrated
- older foreign key column names like `subject_id` still exist in several academic tables, but they now point at `courses.id`
- app startup currently includes a compatibility sync that copies legacy `subjects` and `upcoming_courses` rows into `courses` when older databases are detected

Important current convention:

- core academic teaching records still flow through subject-oriented pages/routes
- optional or program-style courses are distinguished with `course_type != "core"`
- course publication status now lives on the course row with values such as `upcoming`, `active`, and `inactive`
- upcoming and purchased/enrolled course flows are both modeled off the single `courses` table plus `course_enrollments` / `course_payments`

### Enrollment and payment flow

Course commerce-style enrollment currently uses:

- `CourseEnrollment` in SQL for student/parent enrollment state
- `CoursePayment` in SQL for receipts and payment history
- `backend/app/services/courses.py` for enrollment validation, payment rules, and receipt email dispatch

Important business rule currently enforced in code:

- if a student has a linked parent, parent payment is preferred and direct student payment is blocked for that enrollment

Current backend endpoints added/changed for this flow:

- administration course CRUD still lives under `backend/app/features/administration/routes.py`
- student enrollment/payment routes live under `backend/app/features/students/routes.py`
- parent fee invoice/payment routes live under `backend/app/features/parent/routes.py`
- faculty upcoming-course visibility uses the same unified course table in `backend/app/features/faculty/routes.py`
- this file

### Study materials and assessment RAG

Current assessment generation flow:

- study materials still use SQL `materials` rows for core metadata such as title, week, type, and description
- richer source context for those materials is stored in the document store via `MaterialSourceRepository`
- faculty material creation can include uploaded documents, pasted source text, external URLs, and explicit image URLs
- administration can manage assessment AI runtime settings: provider, model, base URL, API key, fallback mode, and generate/modify rate limits
- generated questions are built by `backend/app/rag/assessment/`:
  - `extractors.py` resolves uploaded study-material files and image URLs
  - `retrieval.py` chunks and ranks material context
  - `pipeline.py` creates grounded question drafts with answer keys and optional image references
  - `llm.py` optionally calls an OpenAI-compatible cloud/local endpoint when administration has configured one, then falls back to grounded local generation if allowed

Current route behavior tied to this flow:

- `GET /api/ai/settings` exposes sanitized runtime details to faculty and administration without returning the raw API key
- `POST /api/ai/generate-questions` and `POST /api/ai/modify-questions` use the stored rate-limit strings
- `POST /api/students/me/subjects/<id>/chat` uses the same AI settings plus material-source retrieval for student-facing grounded answers
- `GET /api/faculty/subjects/<id>/materials` now returns an empty array for valid courses with no materials instead of 404, which the builder relies on
- `GET /api/students/me/subjects/<id>/content` now returns enriched study-material metadata including download URLs/file names so the student subject page can render backend-backed materials by week

Important current limitation:

- image-aware questions are supported when a material already has direct image URLs or image uploads
- text extraction currently supports plain text-style formats such as `txt`, `md`, `csv`, `json`, and `html`
- binary office formats and PDFs can still contribute document URLs and manual source text, but they are not deeply parsed yet

## Frontend Context

### Bootstrap

- App shell: `frontend/src/App.tsx`
- Mount entry: `frontend/src/main.tsx`
- Router: `frontend/src/app/routes.tsx`
- Redux store: `frontend/src/app/store.ts`

Boot order:

1. Redux `Provider`
2. custom `ThemeProvider`
3. `RouterProvider`

### Routing and access control

- Main router: `frontend/src/app/routes.tsx`
- Route groups: `frontend/src/features/*/routes/*.routes.tsx`

Current route model:

- `App.tsx` is just an `Outlet`
- route groups are aggregated from feature route arrays
- `ProtectedRoute` gates by auth token plus allowed role strings
- `AuthGuard` redirects authenticated users away from `/auth/*`
- `FeatureAccessRoute` applies extra authority checks for some faculty/admin pages

Role redirect defaults currently map to:

- student -> `/student/dashboard`
- faculty/teacher -> `/faculty/dashboard`
- parent -> `/parent/dashboard`
- admin-family roles -> `/administration/dashboard`

### Store and state ownership

- Root store wiring: `frontend/src/app/store.ts`
- Theme slice: `frontend/src/theme/themeSlice.ts`
- Auth slice: `frontend/src/features/auth/store/authSlice.ts`

The root store currently mounts:

- `theme`
- `auth`
- RTK Query reducers for `authApi`, `dataApi`, `studentApi`, `assessmentApi`, `facultyApi`, `parentApi`, `adminApi`, `leaveApi`

Important nuance:

- there are extra feature slice files under some `store/` folders, but they are not all wired into the root store
- some feature behavior still uses local module state, React context, or localStorage-backed utilities instead of Redux reducers

### Theme system

- Theme provider: `frontend/src/theme/ThemeProvider.tsx`
- Theme definitions: `frontend/src/theme/themes.ts`

Current theme behavior:

- theme and UI customization preferences are stored in localStorage
- `ThemeProvider` writes CSS custom properties directly onto `document.documentElement`
- theme controls include font size, radii, spacing, shadow intensity, and card background preset

### API layer

- Shared config: `frontend/src/services/api/config.ts`
- Shared axios instance: `frontend/src/services/api/axios.ts`
- Shared RTK Query slice: `frontend/src/services/api/dataApi.ts`

Important current reality:

- most data access is done with RTK Query `fetchBaseQuery`
- auth code still mixes RTK Query, raw `fetch`, and mock fallbacks
- `axios.ts` exists but is not the dominant pattern across features
- API base defaults are inconsistent:
  - `frontend/src/services/api/config.ts` defaults to `http://localhost:3000/api`
  - most RTK Query slices default to `http://localhost:3500/api`
  - `frontend/.env` currently sets `VITE_API_URL=http://localhost:3500/api`

If API base behavior changes, update:

- `frontend/.env`
- `frontend/src/services/api/config.ts`
- each hard-coded fallback base in API slices
- this file

### Frontend feature map

Feature areas under `frontend/src/features/`:

- `Home`: public marketing/home routes and layout
- `auth`: login, register, profile, OTP modal, password reset/change, auth API/types/store
- `student`: dashboard, attendance, marks, materials, assignments, subjects, leave, schedule, upcoming course enrollment/payment
- `faculty`: dashboard, classes, attendance, materials, schedule, leave, salary slip, assessment builder, unified upcoming-course view
- `parent`: dashboard, attendance, performance, fees, communication, timetable, child selector, live course/fee invoice views
- `administration`: dashboard, authority management, course management, AI settings, records, promotions, finance, reports, inventory, schedule
- `leave`: leave portal plus RTK Query/localStorage utilities
- `notifications`: notification API helpers
- `courses`: academic course API/local storage helpers

### Notable frontend implementation details

- Assessment builder uses React context and reducer state in `frontend/src/features/faculty/context/AssessmentBuilderContext.tsx`.
- Faculty study-material publishing is now backend-backed through `frontend/src/features/faculty/api/facultyApi.ts` and `frontend/src/features/faculty/pages/FacultyMaterials.tsx`, not the earlier local-only material helper path.
- Student course enrollment/payment UI is driven by `frontend/src/features/student/api/studentApi.ts` and `frontend/src/features/student/pages/UpcomingCourses.tsx`.
- Parent fee invoices/payments are now driven by live RTK Query calls in `frontend/src/features/parent/api/parentApi.ts` and `frontend/src/features/parent/pages/ParentFees.tsx`.
- Parent and faculty upcoming-course pages now expect the richer unified course payload: status, fee/installment metadata, and optional enrollment state for parent dashboards.
- Faculty assessment generation now expects richer material payloads, can preview question images/context snippets, can see the active AI runtime summary, and can jump directly into manual question authoring from the generate step.
- Administration AI settings are served through RTK Query in `frontend/src/features/administration/api/adminApi.ts` and edited in `frontend/src/features/administration/pages/AISettings.tsx`.
- Authority management is hybrid:
  - backend data comes through API hooks
  - localStorage is used for immediate persistence and UI sync
  - `FeatureAccessRoute` reads authority assignments from localStorage-backed helpers
- Leave flows include a localStorage-backed store in `frontend/src/features/leave/leaveStore.ts`.
- Some study/material data is persisted locally, for example `frontend/src/features/student/data/subjectContent.ts`.
- Parent child selection persists in localStorage via `frontend/src/features/parent/useParentChildren.ts`.
- Auth has mock fallbacks when backend calls fail, so frontend auth behavior can appear to work even if the backend is unreachable.

### Frontend testing status

- `package.json` has `vitest` scripts
- a helper script exists at `frontend/test_frontend.sh`
- no frontend test/spec source files were found during this review

Treat frontend behavior changes as needing manual verification unless tests are added.

## Cross-Stack Sync Points

### If you change backend API routes or payloads

Update all affected items:

- backend route, schema, service, repository, and model code
- frontend RTK Query slice or fetch caller
- any consuming page/component
- `backend/docs/openapi.yaml`
- `backend/API_ENDPOINTS.md` if it is being kept current
- this file

### If you change course, enrollment, or payment flows

Update all affected items:

- `backend/app/models/core.py`
- `backend/app/services/courses.py`
- administration, student, parent, and faculty route files that expose course data
- frontend RTK Query types in `studentApi`, `parentApi`, `adminApi`, and `facultyApi`
- the course/payment pages consuming those types
- seed data and migrations if the schema changed
- this file

### If you add a backend feature module

Update all affected items:

- `backend/app/features/<feature>/routes.py`
- `backend/app/modules/__init__.py`
- tests under `backend/tests/`
- frontend API slice and routes if the feature is user-facing
- this file

### If you change auth, roles, or authorities

Update all affected items:

- `backend/app/common/auth.py`
- affected backend route decorators
- `frontend/src/app/routes.tsx`
- `frontend/src/features/administration/utils/authorityAccess.ts`
- any page/nav items gated by role or authority
- this file

### If you change assessment/question storage

Update all affected items:

- SQL models
- document repositories
- `backend/app/services/assessments.py`
- `backend/app/services/materials.py`
- `backend/app/rag/assessment/`
- faculty assessment builder API/types
- student assessment/submission consumers
- document-store notes in this file

### If you change uploads or profile pictures

Update all affected items:

- `backend/app/upload_storage.py`
- `backend/app/api/static_files.py`
- auth/profile frontend callers
- any stored URL assumptions in frontend types/components
- this file

## Practical Guidance For Future Agents

- Read code, not only older docs. Some older context files are already outdated.
- Prefer adding new backend capability inside an existing feature module unless the domain is clearly separate.
- Keep backend request validation in `backend/app/schemas/` instead of validating ad hoc inside route handlers.
- Keep route handlers thin when logic can move into `backend/app/services/` or repositories.
- Remember that backend list responses may be raw arrays.
- Remember that frontend state is hybrid; not every feature uses the root Redux store.
- When a change spans both backend and frontend, verify both `/api` legacy consumers and `/api/v1` test coverage expectations.
