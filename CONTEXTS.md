# Codebase Context

Updated: 2026-04-18

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
- `frontend/src/features/administration/routes/administration.routes.tsx` for sidebar-level authority gating

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
- normalized staff salary accounts, salary structures, salary-account change approvals, vendors, procurements, and unified financial transactions
- leave requests

### Document store

- Document store implementation: `backend/app/document_store/mongo.py`
- AI settings repository: `backend/app/repositories/ai_settings.py`
- Assessment repositories: `backend/app/repositories/assessment_questions.py`, `backend/app/repositories/assessment_submissions.py`
- Material source repository: `backend/app/repositories/material_sources.py`

Current pattern:

- relational assessment metadata stays in SQL
- `Assessment.week` and `Assignment.week` now exist in SQL so weekly assessment policy and weekly task views are backend-backed
- question and submission payloads can live in Mongo collections
- administration-managed AI runtime settings now live in the document store as a singleton config document under the primary `rag-runtime` scope, with fallback to legacy `assessment-generation`
- RAG-oriented material source metadata also lives in the document store keyed by material id
- multimodal RAG metadata also lives in Mongo collections for ingestion runs, source documents, chunks, extracted images, student chat threads, and student chat messages
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
- profile pictures, documents, and extracted RAG images have separate subfolders
- faculty study-material files are stored under `backend/uploads/documents/<class>/<subject>/<week>/...` when uploaded as files
- extracted PDF images for multimodal RAG are stored under `backend/uploads/images/<subject>/<week>/...`
- profile pictures can be uploaded as multipart files or base64 data URLs
- stored filenames now keep a sanitized version of the original file stem and append a short unique suffix, instead of using only UUID filenames
- public URLs are served from `/uploads/<path>`

### Background jobs, email, and infra fallbacks

- Celery bootstrap: `backend/app/core/celery_app.py`
- Local fallback logic: `backend/app/core/runtime.py`
- Tasks: `backend/app/tasks/notifications.py`
- RAG task: `backend/app/tasks/rag.py`
- Email service: `backend/app/services/email.py`
- Notifications routes: `backend/app/features/notifications/routes.py`

Important behavior:

- Redis is preferred for Celery broker/result storage and rate-limit storage
- if Redis is unavailable locally, Celery and rate limiting fall back to in-memory behavior
- notification routes try Celery first and may execute inline if the broker is unavailable
- multimodal document ingestion is exposed as a Celery task and faculty material upload now queues targeted incremental ingestion when a file-backed source path is available
- email sending/sync is a first-class backend capability, not just a mock-only layer

### Backend feature map

Feature route files live under `backend/app/features/*/routes.py`.

Current modules:

- `auth`: login, register, OTP, profile, password reset/change
- `students`: student profile and student-facing data
- `academics`: classes and sections helpers
- `attendance`: attendance write/list/stats flows
- `marks`: marks views
"- `schedule`: schedule CRUD and self-service schedule views
- `faculty`: faculty classes, subjects, materials, performance, upcoming courses"
- `inventory`: stock and request management
- `authority`: authority assignment endpoints
- `administration`: dashboard, student/staff CRUD, courses, promotions, finance, reports
- `payroll`: payroll and salary-slip workflows with PDF download for salary slips
- `jobs`: job-status endpoints
- `leave`: leave request, review, cancel, stats
- `parent`: parent profile and child dashboards
- `assessments`: assessment CRUD, publish, AI question endpoints, submissions, assignments, weekly grouped student views, due date validation
- `notifications`: email status/send/sync and schedule notifications
- `rag`: admin-only ingestion endpoint
- `uploads`: file-related endpoints

Two notable implementation details:

- assessment question generation is now retrieval-grounded through `backend/app/rag/assessment/` plus the shared multimodal retrieval layer in `backend/app/rag/multimodal/`
- payroll salary-slip records are now normalized around related staff tables: `salary_slips.user_id` links to `users`, and employee metadata such as name, employee code, designation, and department should be resolved from `users` plus `administration_staff` instead of treating duplicated salary-slip columns as the source of truth
- finance workflows now also use dedicated tables for `staff_salary_accounts`, `salary_structures`, `salary_account_change_requests`, `financial_transactions`, `vendors`, and `inventory_procurements`

### Payroll and staff normalization

- `backend/app/models/core.py` keeps legacy salary-slip columns like `staff_id`, `staff_name`, `employee_code`, and `department` for compatibility, but API serialization now resolves those values from related `User` and `AdministrationStaff` records whenever `salary_slips.user_id` is present.
- `backend/app/features/payroll/routes.py` accepts `staffId` as either a normalized user id or a legacy staff code, but payroll ownership and filtering should prefer `user_id`.
- `backend/app/features/administration/routes.py` now reads salary history and syncs pending slips by staff relation (`user_id`) instead of by duplicated `employee_code` on the salary-slip row.
- Seed data now creates an `AdministrationStaff` record for faculty users as well as non-teaching staff so payroll metadata has a normalized employee-code and department source for all staff categories.
- `backend/app/services/courses.py::sync_schema_compatibility_if_needed()` also backfills missing `administration_staff` rows from existing salary slips in SQLite dev databases, which helps old local `app.db` files adapt without a manual reset.
- That same SQLite compatibility sync is also responsible for adding `salary_slips.user_id` to older local databases and backfilling it from `administration_staff.employee_code` before payroll queries rely on the normalized relation.
- Administration finance APIs now include salary-account CRUD, salary-structure CRUD, salary-account change-request review, salary-slip payment marking, financial transaction listing/export, and procurement summary endpoints under `backend/app/features/administration/routes.py`.
- Payroll self-service APIs now expose `GET/PUT /api/payroll/me/account-details` plus `GET/POST /api/payroll/me/account-change-requests` for staff-managed account updates that admins can approve.
- Unified finance logging lives in `backend/app/services/finance.py`; course payments, salary payments, and inventory procurements should create `financial_transactions` rows so report exports can include income and expense activity in one place.
- Parent course payments still flow through `POST /api/parent/fees/<invoice_id>/payment`, and the backend sends receipt emails after successful course payments via `backend/app/services/courses.py`.
- Inventory procurement is now authority-aware: `backend/app/features/inventory/routes.py` exposes vendor and procurement endpoints for administration users who hold the `procurementManagement` authority (or director/superadmin-level access), and procurements both increment stock and log inventory-expense transactions.
- faculty question generation now treats provider-response, retrieval, and normalization failures as logged fallback conditions where possible, instead of letting unexpected provider/RAG exceptions surface as generic internal errors
- student subject pages now expose a multimodal RAG-backed chatbot at `POST /api/v1/students/me/subjects/<subject_id>/chat` that answers from uploaded subject materials, can return cited snippets plus referenced images, persists conversation history in Mongo, and is expected to return polished Markdown for rich frontend rendering
- student chat history endpoints now exist at `GET /api/v1/students/me/subjects/<subject_id>/chat/history` and `DELETE /api/v1/students/me/subjects/<subject_id>/chat/history`
- administration owns shared student/faculty AI runtime configuration through `backend/app/features/administration/routes.py`
- admin-only ingestion is available at `POST /api/v1/ingest` and legacy `POST /api/ingest`
- assessment AI routes under `backend/app/features/assessments/routes.py` now read dynamic per-route limits from the stored AI settings instead of a hard-coded limiter string
- generated question payloads can include `imageUrls`, `contextSnippet`, source material references, and now accept optional `week` plus `questionStyle`; follow-up refinement is handled by `POST /api/v1/ai/modify-questions`
- faculty material UIs now group uploaded materials by normalized week labels such as `Week 1`, with a fallback `General` bucket for items without week metadata
- some route prefixes are embedded in the feature route itself, for example leave routes define `/leave` inside a blueprint mounted without a route prefix
- schedule create/update routes now reject overlapping active entries for the same class or same faculty on the same day
- schedule conflict detection endpoint: `GET /api/v1/schedule/available-slots?classId=&facultyId=&dayOfWeek=` returns available and occupied time slots to help prevent conflicts before schedule creation
- assessment question generation and modification now have proper error handling with specific error codes
- assessments now support due date validation: students cannot submit after due date passes
- `GET /api/v1/assessments/weekly` returns assessments grouped by week for student subject view
- `GET /api/v1/assessments/<id>/answers` reveals correct answers after due date has passed
- `POST /api/v1/assessments/<id>/submit` blocks submissions after due date with `ASSESSMENT_EXPIRED` error

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

Recent coverage additions include multimodal RAG discovery/parsing, idempotent ingestion/retrieval, and student chat history/deadline guard behavior in `backend/tests/test_rag_multimodal.py`.

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

### Study materials, multimodal RAG, and student chat

Current assessment generation flow:

- study materials still use SQL `materials` rows for core metadata such as title, week, type, and description
- richer source context for those materials is stored in the document store via `MaterialSourceRepository`
- faculty material creation can include uploaded documents, pasted source text, external URLs, and explicit image URLs
- administration can manage shared AI runtime settings: provider, mode, model, base URL, API key, fallback mode, and generate/modify rate limits
- generated questions are built by `backend/app/rag/assessment/`:
  - `extractors.py` resolves uploaded study-material files and image URLs
  - `retrieval.py` chunks and ranks material context
  - `pipeline.py` creates grounded question drafts with answer keys and optional image references
  - `llm.py` can now call Ollama or an OpenAI-compatible cloud/local endpoint when administration has configured one, then falls back to grounded local generation if allowed
- shared multimodal retrieval is implemented in `backend/app/rag/multimodal/`:
  - `discovery.py` traverses `backend/uploads/documents/<class>/<subject>/<week>/...`
  - `parser.py` extracts TXT content and PDF page text/images using PyMuPDF when available
  - `embeddings.py` builds text embeddings and CLIP-style image/query embeddings, with deterministic fallback embeddings when optional model dependencies are unavailable locally
  - `vector_store.py` uses persistent Chroma when installed and a JSON-backed local fallback otherwise
  - `chat_memory.py` persists student thread/message history and provides bounded runtime context
  - `policy.py` enforces week-aware due-date answer blocking for active assessments
  - `service.py` orchestrates ingestion, retrieval, metadata persistence, and question-context assembly

Current route behavior tied to this flow:

- `GET /api/ai/settings` exposes sanitized runtime details to faculty and administration without returning the raw API key
- `POST /api/ai/generate-questions` and `POST /api/ai/modify-questions` use the stored rate-limit strings
- `POST /api/students/me/subjects/<id>/chat` uses the same AI settings plus multimodal retrieval for student-facing grounded answers
- `GET /api/students/me/subjects/<id>/chat/history` and `DELETE /api/students/me/subjects/<id>/chat/history` load and clear persisted student subject conversations
- `GET /api/faculty/subjects/<id>/materials` now returns an empty array for valid courses with no materials instead of 404, which the builder relies on
- `GET /api/students/me/subjects/<id>/content` now returns enriched study-material metadata including download URLs/file names so the student subject page can render backend-backed materials by week
- faculty material publish now triggers targeted ingest when the saved material can be resolved to a local uploaded document path

Important current behavior and limitations:

- multimodal ingestion currently supports `pdf` and `txt` from the folder-based upload corpus
- PDFs are parsed page-by-page for text and extracted images; image-only PDFs contribute image retrieval but no OCR is performed in v1
- student chat blocks direct answers for active same-subject same-week assessments before the due date, but still allows concept guidance and revision help
- student chat memory is persisted per student + subject thread, with each message tagged by optional week, citations, and referenced images
- retrieval is always local; AI Settings only switch the generation provider/runtime between local and API-key-backed modes

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

### Schedule API

Schedule-related types and hooks in `frontend/src/services/api/dataApi.ts`:

- `TimeSlotOption`: `{ startTime, endTime, label }` for time slot display
- `OccupiedSlot`: extends `TimeSlotOption` with `{ classId, facultyId, subject }`
- `AvailableSlotsRequest`: `{ classId, facultyId, dayOfWeek }`
- `AvailableSlotsResponse`: `{ availableSlots, occupiedSlots, dayOfWeek, classId, facultyId }`
- `useGetAvailableSlotsQuery`: fetches available/occupied slots for schedule conflict prevention
- Conflict errors are detected by `err.status === 409` or `err.data.code === 'SCHEDULE_CONFLICT'`

Dashboard types in `frontend/src/features/administration/api/adminApi.ts`:
- `UpcomingEvent`: `{ id, title, className, section, startDate }` for upcoming courses/events display

### Assessment API

Assessment-related types and hooks in `frontend/src/features/faculty/api/assessmentApi.ts`:

- `GeneratedAssessment`: assessment with questions, total marks, due date, published status
- `WeeklyAssessmentGroup`: `{ week, assessments[], count }` for grouped assessment view
- `AssessmentSubmission`: student submission with score, answers, evaluation
- `AIRuntimeSettings`: AI provider configuration for question generation
- `useGetWeeklyAssessmentsQuery`: fetches assessments grouped by week for student view
- `useGetAssessmentAnswersQuery`: fetches correct answers after due date passes
- `useSubmitAssessmentMutation`: submits student assessment, blocks after due date
- `useGenerateQuestionsMutation`: AI-powered question generation with multimodal RAG
- `useModifyQuestionsMutation`: AI-powered question modification

Student assessment states:
- `isExpired`: true when due date has passed
- `submitted`: true when student has submitted
- `submissionStatus`: submission status string
- `score`: achieved score if submitted

Due date errors:
- `err.status === 403` with `err.data.code === 'ASSESSMENT_EXPIRED'` for expired submissions
- `err.data.code === 'ASSESSMENT_NOT_EXPIRED'` for accessing answers before due date

### Frontend feature map

Feature areas under `frontend/src/features/`:

- `Home`: public marketing/home routes and layout
- `auth`: login, register, profile, OTP modal, password reset/change, auth API/types/store
- `student`: dashboard, attendance, marks, assessments, materials, assignments, subjects, leave, schedule, upcoming course enrollment/payment
- `faculty`: dashboard, classes, attendance, materials, schedule, leave, salary slip, assessment builder, unified upcoming-course view
- `parent`: dashboard, attendance, performance, fees, communication, timetable, child selector, live course/fee invoice views
- `administration`: dashboard, authority management, course management, AI settings, records, promotions, finance, reports, inventory, schedule
- `leave`: leave portal plus RTK Query/localStorage utilities
- `notifications`: notification API helpers
- `courses`: academic course API/local storage helpers
- schedule creation UI in administration and faculty portals now shows available/occupied time slots and displays conflict error messages when overlapping schedules are detected

### Notable frontend implementation details

- Assessment builder uses React context and reducer state in `frontend/src/features/faculty/context/AssessmentBuilderContext.tsx`.
- Faculty study-material publishing is now backend-backed through `frontend/src/features/faculty/api/facultyApi.ts` and `frontend/src/features/faculty/pages/FacultyMaterials.tsx`, not the earlier local-only material helper path.
- Student course enrollment/payment UI is driven by `frontend/src/features/student/api/studentApi.ts` and `frontend/src/features/student/pages/UpcomingCourses.tsx`.
- Parent fee invoices/payments are now driven by live RTK Query calls in `frontend/src/features/parent/api/parentApi.ts` and `frontend/src/features/parent/pages/ParentFees.tsx`.
- Parent and faculty upcoming-course pages now expect the richer unified course payload: status, fee/installment metadata, and optional enrollment state for parent dashboards.
- Faculty assessment generation now expects richer material payloads, can preview question images/context snippets, can see the active AI runtime summary, and can jump directly into manual question authoring from the generate step.
- Faculty assessment generation now also supports optional `week` targeting and `questionStyle` values `technical`, `nonTechnical`, and `mixed`.
- Administration AI settings are served through RTK Query in `frontend/src/features/administration/api/adminApi.ts` and edited in `frontend/src/features/administration/pages/AISettings.tsx`.
- Salary slip PDF download is available in administration and faculty salary slip pages through `GET /api/v1/payroll/salary-slips/<id>/download` and `GET /api/v1/payroll/me/salary-slips/<id>/download`, powered by ReportLab PDF generation.
- Administration now also has a procurement page at `/administration/procurement` for vendor entry and inventory procurement recording, gated by the `procurementManagement` authority in the route config and frontend authority utilities.
- Administration also has a finance-operations page at `/administration/finance-operations` that lists unified financial transactions, exports CSV/PDF ledger reports, and reviews salary-account change requests.
- Financial transaction export now supports real `.xlsx` workbook downloads in addition to CSV and PDF through `GET /api/administration/transactions/export?format=xlsx`.
- Administration also has a focused payment ledger page at `/administration/payment-details` that filters payment-oriented transactions such as course payments, salary payouts, and procurement payments.
- Parent upcoming-courses UI now lets parents pay the remaining balance for enrolled courses directly from the course card and relies on the backend receipt-email flow after each recorded payment.
- The shared employee salary portal used by administration/faculty salary-slip pages now also surfaces salary account details plus proof-backed account-change requests using the payroll self-service endpoints instead of being salary-slip only.
- That employee salary portal now uses a single-button modal flow for salary account submission/update, with required fields and proof-document selection to reduce incomplete payroll-account submissions.
- Faculty users now have a visible `Request Materials` route in the faculty workspace so employees can submit inventory-item requests to administration for approval using the existing inventory request workflow.
- Administration AI settings now cover the shared student/faculty runtime, including provider labels for `grounded-rag`, `ollama`, `gemini`, `openai-compatible-cloud`, and `openai-compatible-local`, plus `mode: local | api-key`.
- Student subject chat is integrated into `frontend/src/features/student/pages/SubjectDetails.tsx`, loads/saves backend chat history, passes an optional selected week, renders referenced images, and uses browser-native speech recognition and speech synthesis when available.
- Student assessments are now available at `/student/assessments`, showing published assessments grouped by week with submission status and due date tracking
- Student can view correct answers after due date passes, and are blocked from submitting after due date
- Assessment builder in faculty portal supports AI-powered generation with multimodal RAG, question modification, manual editing, and publish workflow
- Faculty assessment generation endpoints have proper error handling with specific error codes (`QUESTION_GENERATION_ERROR`, `QUESTION_MODIFICATION_ERROR`)
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
- frontend speech utility tests now exist at `frontend/src/features/student/utils/speech.test.ts`

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
