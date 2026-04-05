# Backend Test Case Summary

This document explains what each backend test file is validating, why those tests matter, and how the overall suite is organized.

Overall suite status at the time of generation:

- Total backend test files: 12
- Total test classes: 84
- Total individual test cases: 209
- Final result: 209 passed, 0 failed

## 1. Auth Tests

File: `backend/tests/test_auth.py`
Classes: 7
Tests: 24

Purpose:
This file verifies the authentication and identity lifecycle for all supported user roles. It focuses on login, registration, token-based identity, profile updates, password changes, logout, and refresh flows.

What it covers:

- Login success for seeded student, faculty, admin, and parent accounts
- Login failure for invalid email and wrong password
- Validation failures when login payload fields are missing
- Successful user registration
- Duplicate email rejection during registration
- Registration validation failures for missing fields or invalid role
- `/auth/me` identity lookup for authenticated and unauthenticated requests
- OTP-protected profile update flow
- OTP-protected password change flow
- Expected rejection when profile/password operations are attempted without OTP verification
- Logout success response
- Token refresh success response

Why it matters:
These tests prove that the system accepts valid credentials, rejects invalid authentication attempts, respects request validation, and enforces stronger security for sensitive actions such as profile edits and password changes.

## 2. Administration Tests

File: `backend/tests/test_administration.py`
Classes: 7
Tests: 39

Purpose:
This file validates the administration workspace, which is one of the largest backend feature areas. It exercises student management, staff management, course administration, promotions, financial records, and reporting endpoints.

What it covers:

- Dashboard access for administration and denial for unauthorized users
- Student listing, retrieval, creation, duplicate-email checks, validation, update, status change, and deletion
- Staff listing, retrieval, creation for both teaching and non-teaching roles, duplicate employee code handling, validation, update, status change, and deletion
- Course listing, creation, invalid date handling, invalid seat handling, update, and deletion
- Promotion candidate listing
- Single-student promotion, already-enrolled promotion handling, and bulk promotion validation
- Financial record listing, retrieval, creation, invalid salary input handling, and update
- Attendance report retrieval
- Exam participation report retrieval
- Report generation endpoint behavior

Why it matters:
This file verifies the core operational controls that administrators rely on. It ensures that the application can manage academic records, workforce data, promotions, and finance-related data with appropriate validation and access control.

## 3. Assessment Tests

File: `backend/tests/test_assessments.py`
Classes: 13
Tests: 24

Purpose:
This file validates both assessments and assignments, including AI-assisted question flows. It covers faculty-authoring behavior and student-submission behavior.

What it covers:

- Listing assessments for faculty and students
- Creating assessments with structured question payloads
- Validation failure when required fields are missing
- Assessment retrieval for existing and non-existing IDs
- Assessment updates and not-found handling
- Assessment deletion behavior
- Assessment publishing behavior
- Student submission of a published assessment
- Not-found handling for invalid assessment submission targets
- Retrieval of a student's own submission
- Faculty retrieval of submissions for an assessment
- Assignment listing for students
- Assignment submission success and validation failure for missing URL
- AI question generation endpoint behavior
- AI question modification endpoint behavior

Why it matters:
This file confirms the entire assessment pipeline, from authoring and publishing to student interaction and automated question tooling. It protects one of the most behavior-heavy parts of the platform.

## 4. Attendance Tests

File: `backend/tests/test_attendance.py`
Classes: 4
Tests: 9

Purpose:
This file verifies recording, updating, listing, and reading attendance statistics.

What it covers:

- Faculty attendance submission success
- Validation failure when attendance date is missing
- Validation/logic failure when attendance records are empty
- Access denial when students try to submit attendance
- Attendance update success
- Attendance listing success
- Unauthenticated access rejection for attendance listing
- Student self-service attendance statistics
- Unauthenticated rejection for self-service attendance statistics

Why it matters:
Attendance data drives reports, dashboards, and academic monitoring. These tests ensure that only authorized users can write attendance and that students can view their own attendance metrics safely.

## 5. Faculty Tests

File: `backend/tests/test_faculty.py`
Classes: 8
Tests: 18

Purpose:
This file validates faculty-facing endpoints for classroom operations, materials, performance views, schedule visibility, and upcoming courses.

What it covers:

- Faculty directory listing for admins
- Access denial when students try to view faculty-only resources
- Assigned class listing for faculty
- Faculty class overview endpoint
- Subject listing for a class, including invalid class behavior
- Student performance listing and class-filtered performance retrieval
- Faculty schedule retrieval
- Subject material listing
- Material publishing success and validation failures
- Upcoming course listing for faculty
- Upcoming course listing for administration users
- Unauthorized and unauthenticated access behavior

Why it matters:
This file proves that the faculty workspace returns the academic information teachers need while still respecting permissions and not exposing faculty tools to student users.

## 6. Inventory Tests

File: `backend/tests/test_inventory.py`
Classes: 7
Tests: 16

Purpose:
This file validates inventory items and material request workflows.

What it covers:

- Inventory item listing for authorized users
- Access denial for students
- Inventory item creation behavior
- Inventory item update and not-found behavior
- Inventory item deletion and not-found behavior
- Material request listing
- Material request creation success
- Validation failures such as missing department
- Request status updates
- Not-found handling for request status changes
- Access denial when faculty attempt admin-only review/status actions

Why it matters:
Inventory operations often support physical classroom delivery. These tests ensure both stock records and request workflows behave consistently and stay role-safe.

## 7. Leave Tests

File: `backend/tests/test_leave.py`
Classes: 6
Tests: 13

Purpose:
This file validates leave request creation, review, cancellation, listing, and statistics.

What it covers:

- Faculty leave request submission with the correct schema
- Validation failures for missing leave type
- Invalid date-range handling
- Unauthenticated leave-creation rejection
- Leave listing for faculty and administrators
- Retrieval of leave requests by ID
- Review/approval workflow behavior for administration
- Canceling a newly created leave request
- Not-found behavior for invalid leave IDs
- Leave statistics retrieval for administrators

Why it matters:
Leave management combines workflow state, role-based permissions, and request validation. These tests confirm all three operate correctly.

## 8. Notifications Tests

File: `backend/tests/test_notifications.py`
Classes: 12
Tests: 20

Purpose:
This file validates notification-related endpoints as well as several closely related modules tested from the same file: marks, authority, jobs, academics helpers, and health.

What it covers:

- Email message listing and message-by-ID retrieval
- Email transport status endpoint
- Email sending with the current API payload structure
- Validation failures for incomplete email payloads
- Schedule notification creation and async acceptance behavior
- Marks listing for faculty and students
- Authority assignment listing
- Authority template listing
- Job status endpoint
- Academics class listing and section listing
- Health endpoint and document-store health endpoint

Why it matters:
This file protects a broad set of integration-style routes that support messaging, monitoring, operational tooling, and academic metadata retrieval.

## 9. Parent Tests

File: `backend/tests/test_parent.py`
Classes: 5
Tests: 12

Purpose:
This file validates parent-specific child access flows and ensures linked-child authorization rules are enforced correctly.

What it covers:

- Listing a parent's linked children
- Unauthenticated and unauthorized access rejection
- Child detail retrieval
- Child dashboard retrieval
- Dashboard payload shape validation
- Child attendance retrieval
- Child performance retrieval
- Rejection when a parent requests a child who is not linked to them

Why it matters:
Parent access is intentionally narrow. These tests confirm that parents can see only their own linked student records and cannot read unrelated student data.

## 10. Payroll Tests

File: `backend/tests/test_payroll.py`
Classes: 3
Tests: 8

Purpose:
This file verifies salary slip visibility for both administrators and staff members.

What it covers:

- Admin access to salary slip listings
- Denial for students
- Unauthenticated rejection
- Faculty self-service salary slip listing
- Admin self-service salary slip listing
- Basic salary-slip payload shape validation

Why it matters:
Payroll information is sensitive. These tests check both visibility boundaries and basic payload consistency.

## 11. Schedule Tests

File: `backend/tests/test_schedule.py`
Classes: 5
Tests: 11

Purpose:
This file validates the schedule module for list, self-view, create, update, and delete flows.

What it covers:

- Schedule listing for administration
- Unauthenticated access rejection
- Faculty self-schedule retrieval
- Student self-schedule retrieval
- Schedule creation success
- Validation failures for missing fields
- Validation failures for invalid day-of-week
- Schedule update success and not-found handling
- Schedule deletion success and not-found handling

Why it matters:
Schedule data is central to multiple user roles. These tests prove both retrieval and schedule-administration workflows behave correctly.

## 12. Student Tests

File: `backend/tests/test_students.py`
Classes: 7
Tests: 15

Purpose:
This file validates student-facing self-service APIs and selected role-based student lookup behavior.

What it covers:

- Student listing for admins
- Access denial when students try to list all students
- `/students/me` self lookup
- Subject listing for the current student
- Subject content lookup
- Performance retrieval
- Upcoming course retrieval
- Student-by-ID retrieval for administration and faculty
- Access denial for unauthorized student-by-ID access

Why it matters:
These tests ensure the student portal returns the right self-service information and that broader student record access remains restricted to authorized roles.

## Test Infrastructure Notes

Shared fixtures are defined in `backend/tests/conftest.py`.

Important fixture responsibilities:

- Create the Flask app in testing mode
- Reset the seeded database state before each test
- Provide pre-authenticated headers for student, faculty, admin, and parent roles
- Provide reusable seeded-record helpers such as `seeded_student` and `seeded_staff_user_id`
- Provide an OTP helper used by authentication tests for sensitive flows

Why this matters:
The fixture layer ensures tests run against a predictable seeded state while still exercising the application through real HTTP requests.

## Final Interpretation

Taken together, these 209 test cases provide coverage for:

- Authentication and account security
- Role-based authorization
- Student, parent, faculty, and admin workflows
- CRUD-heavy operational modules
- Academic scheduling and attendance
- Assessments, assignments, and submissions
- Leave and payroll operations
- Notifications, health, and supporting helper endpoints

The suite is not just checking happy paths. It also covers:

- Missing-field validation
- Unauthorized and unauthenticated requests
- Duplicate/conflict conditions
- Not-found handling
- Sensitive-flow protections such as OTP checks

That makes the backend test suite a strong regression safety net for both business logic and access control.
