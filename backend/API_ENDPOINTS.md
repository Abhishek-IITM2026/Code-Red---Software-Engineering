# API Endpoints Used By Frontend

Base URL used by most frontend API slices:

- `http://localhost:3000/api`

Auth slice base URL:

- `http://localhost:3000/api/auth`

This file is generated from the React frontend source in `frontend/src` and lists the HTTP endpoints the frontend actually references today.

## 1. Authentication Feature

Frontend sources:

- `frontend/src/features/auth/api/authApi.ts`
- `frontend/src/features/auth/store/authSlice.ts`
- `frontend/src/features/auth/pages/Profile.tsx`
- `frontend/src/features/auth/components/OTPModal.tsx`

Endpoints:

- `POST /api/auth/login`
  Used for sign in.

- `POST /api/auth/register`
  Used for sign up.

- `POST /api/auth/logout`
  Used to clear authenticated backend session/token state.

- `GET /api/auth/me`
  Used to fetch the current logged-in user profile.

- `POST /api/auth/refresh`
  Used to refresh auth token.

- `POST /api/auth/otp/send`
  Used before profile update, password change, and profile picture update.

- `POST /api/auth/otp/verify`
  Used to verify OTP entered in the modal.

- `POST /api/auth/profile/update`
  Used to update first name, last name, and phone.

- `POST /api/auth/profile/picture`
  Used to update profile picture.

- `POST /api/auth/profile/change-password`
  Used to change password after OTP verification.

## 2. Shared Academic Data Feature

Frontend source:

- `frontend/src/services/api/dataApi.ts`

Endpoints:

- `GET /api/students`
  Used to fetch all students.

- `GET /api/students?class={classId}&section={section}`
  Used by faculty attendance screens to fetch students for a class-section.

- `GET /api/students/{studentId}`
  Used to fetch one student by id.

- `GET /api/classes`
  Used in administration schedule forms and faculty attendance workflows.

- `GET /api/classes/{classId}/sections`
  Used to fetch sections for the selected class.

- `GET /api/attendance?studentId={studentId}`
  Used to fetch attendance records for a student.

- `GET /api/attendance?date={yyyy-mm-dd}&class={classId}&section={section}`
  Used to load attendance for a specific date and class-section.

- `POST /api/attendance`
  Used to submit a new attendance sheet.

- `PUT /api/attendance`
  Used to update an existing attendance sheet.

- `GET /api/marks?studentId={studentId}`
  Used to fetch marks for a student.

- `GET /api/schedule`
  Used to fetch all schedules.

- `GET /api/schedule?classId={classId}&sectionId={sectionId}`
  Used to filter schedule by class and section.

- `GET /api/schedule?facultyId={facultyId}`
  Used to filter schedule by faculty.

- `POST /api/schedule`
  Used to create a schedule entry.

- `PUT /api/schedule/{scheduleId}`
  Used to update a schedule entry.

- `DELETE /api/schedule/{scheduleId}`
  Used to delete a schedule entry.

- `GET /api/faculty`
  Used to populate faculty dropdowns in schedule management.

- `POST /api/notifications/schedule`
  Used to send schedule notifications to faculty, students, and parents.

## 3. Student Feature API

Frontend source:

- `frontend/src/features/student/api/studentApi.ts`

Endpoints:

- `GET /api/students/me`
  Used to fetch the current student profile.

- `GET /api/students/me/subjects`
  Used to fetch subjects enrolled by the current student.

- `GET /api/attendance?subjectId={subjectId}&startDate={date}&endDate={date}`
  Used by the student API slice to filter attendance.
  Any combination of these query parameters may be sent.

- `GET /api/marks?subjectId={subjectId}&examType={examType}`
  Used by the student API slice to filter marks.
  Any combination of these query parameters may be sent.

- `GET /api/assignments?subjectId={subjectId}&status={status}`
  Used by the student API slice to fetch assignments.
  Any combination of these query parameters may be sent.

- `GET /api/schedule/me`
  Used to fetch the current student’s own timetable.

- `POST /api/assignments/{assignmentId}/submit`
  Used to submit assignment work.

- `GET /api/attendance/me/stats`
  Used to fetch student attendance summary.

- `GET /api/students/me/performance`
  Used to fetch performance summary.

## 4. Faculty Assessment Builder API

Frontend source:

- `frontend/src/features/faculty/api/assessmentApi.ts`
- `frontend/src/features/faculty/components/AssessmentBuilder/*`

Endpoints:

- `GET /api/faculty/classes`
  Used to fetch faculty class list in assessment builder.

- `GET /api/faculty/classes/{classId}/subjects`
  Used to fetch subjects for the selected class.

- `GET /api/faculty/subjects/{subjectId}/materials`
  Used to fetch teaching/study materials for the selected subject.

- `POST /api/ai/generate-questions`
  Used to generate questions from selected materials and config.

- `POST /api/ai/modify-questions`
  Used to revise generated questions using a modification prompt.

- `POST /api/assessments`
  Used to save a generated assessment.

- `POST /api/assessments/{assessmentId}/publish`
  Used to publish an assessment.

- `GET /api/assessments`
  Used to fetch all assessments.

- `GET /api/assessments?classId={classId}&subjectId={subjectId}&published={true|false}&startDate={date}&endDate={date}`
  Used to fetch filtered assessments.
  Any subset of these query parameters may be sent.

- `GET /api/assessments/{assessmentId}`
  Used to fetch one assessment.

- `DELETE /api/assessments/{assessmentId}`
  Used to delete one assessment.

- `PATCH /api/assessments/{assessmentId}`
  Used to update one assessment.

## 5. Administration Schedule Management Feature

Frontend sources:

- `frontend/src/features/administration/components/ScheduleForm.tsx`
- `frontend/src/features/administration/components/ScheduleView.tsx`
- `frontend/src/features/administration/components/ScheduleNotification.tsx`

This feature reuses endpoints already listed in sections 2 and 3:

- `GET /api/classes`
- `GET /api/classes/{classId}/sections`
- `GET /api/faculty`
- `GET /api/schedule`
- `POST /api/schedule`
- `PUT /api/schedule/{scheduleId}`
- `DELETE /api/schedule/{scheduleId}`
- `POST /api/notifications/schedule`

## 6. Faculty Attendance Feature

Frontend source:

- `frontend/src/features/faculty/pages/MarkAttendance.tsx`

This feature reuses endpoints already listed in section 2:

- `GET /api/classes`
- `GET /api/classes/{classId}/sections`
- `GET /api/students?class={classId}&section={section}`
- `GET /api/attendance?date={yyyy-mm-dd}&class={classId}&section={section}`
- `POST /api/attendance`
- `PUT /api/attendance`

## 7. Additional Endpoints Needed For Administration Features

These endpoints are not currently called by HTTP in the frontend, but the administration React pages clearly need them if we want to move those pages off local mock state.

Frontend sources include:

- `frontend/src/features/administration/pages/ManageStudentRecords.tsx`
- `frontend/src/features/administration/pages/ManageStaffRecords.tsx`
- `frontend/src/features/administration/pages/LeaveManagement.tsx`
- `frontend/src/features/administration/pages/CourseManagement.tsx`
- `frontend/src/features/administration/pages/PromoteStudents.tsx`
- `frontend/src/features/administration/pages/FinancialRecords.tsx`
- `frontend/src/features/administration/pages/SalarySlips.tsx`
- `frontend/src/features/administration/pages/AdminMySalarySlip.tsx`
- `frontend/src/features/administration/pages/AuthorityManagement.tsx`
- `frontend/src/features/administration/pages/MonitorPerformanceTrends.tsx`
- `frontend/src/features/administration/pages/ViewConsolidatedAttendanceReports.tsx`
- `frontend/src/features/administration/pages/ViewExamParticipationReports.tsx`
- `frontend/src/features/administration/pages/GenerateReports.tsx`
- `frontend/src/features/administration/api/inventoryApi.ts`

Recommended endpoints:

- `GET /api/admin/dashboard`
  Summary cards, counters, pending approvals, and overview data for administration dashboard.

- `GET /api/admin/students`
  List student records with search and filtering support.

- `POST /api/admin/students`
  Create a student record.

- `GET /api/admin/students/{studentId}`
  Fetch one detailed student record.

- `PUT /api/admin/students/{studentId}`
  Update a student record.

- `PATCH /api/admin/students/{studentId}/status`
  Activate or deactivate a student record.

- `DELETE /api/admin/students/{studentId}`
  Delete a student record after confirmation.

- `GET /api/admin/staff`
  List staff records with category and status filters.

- `POST /api/admin/staff`
  Create a staff record.

- `GET /api/admin/staff/{staffId}`
  Fetch one staff record.

- `PUT /api/admin/staff/{staffId}`
  Update a staff record.

- `PATCH /api/admin/staff/{staffId}/status`
  Change staff status such as Active, On Leave, or Inactive.

- `DELETE /api/admin/staff/{staffId}`
  Delete a staff record after confirmation.

- `GET /api/admin/leave-requests`
  List leave requests from students and faculty with filters for role and status.

- `PATCH /api/admin/leave-requests/{requestId}/review`
  Approve or reject a leave request with reviewer comment.

- `GET /api/admin/upcoming-courses`
  List administration-published upcoming courses.

- `POST /api/admin/upcoming-courses`
  Create and publish a new upcoming course.

- `PUT /api/admin/upcoming-courses/{courseId}`
  Update an upcoming course.

- `DELETE /api/admin/upcoming-courses/{courseId}`
  Delete or unpublish an upcoming course.

- `GET /api/admin/promotions/candidates`
  Fetch students eligible for promotion and those requiring review.

- `POST /api/admin/promotions`
  Submit promotion decisions for one or more students.

- `GET /api/admin/financial-records`
  List summarized financial records for staff.

- `GET /api/admin/financial-records/{staffId}`
  Fetch detailed financial profile for one staff member.

- `PUT /api/admin/financial-records/{staffId}`
  Update salary, increment, bank, or review details.

- `GET /api/admin/salary-slips`
  Fetch salary slips for administration payroll views.

- `GET /api/admin/salary-slips/{slipId}`
  Fetch a single salary slip.

- `GET /api/admin/salary-slips/me`
  Fetch the current administrator’s own salary slips.

- `GET /api/admin/authority-rules`
  List authority or approval control rules.

- `POST /api/admin/authority-rules`
  Create a new authority assignment rule.

- `PUT /api/admin/authority-rules/{ruleId}`
  Update a rule.

- `DELETE /api/admin/authority-rules/{ruleId}`
  Delete a rule.

- `GET /api/admin/reports/performance-trends`
  Fetch trend data for institute performance analytics.

- `GET /api/admin/reports/attendance`
  Fetch consolidated attendance reports.

- `GET /api/admin/reports/exam-participation`
  Fetch exam participation reports.

- `POST /api/admin/reports/generate`
  Generate or export selected reports.

- `GET /api/admin/inventory/items`
  List inventory items.

- `POST /api/admin/inventory/items`
  Create an inventory item.

- `GET /api/admin/inventory/items/{itemId}`
  Fetch one inventory item.

- `PUT /api/admin/inventory/items/{itemId}`
  Update one inventory item.

- `DELETE /api/admin/inventory/items/{itemId}`
  Delete one inventory item.

- `GET /api/admin/inventory/transactions`
  List stock in/out transactions.

- `POST /api/admin/inventory/transactions`
  Create a stock transaction.

- `GET /api/admin/inventory/requests`
  List faculty material requests.

- `POST /api/admin/inventory/requests`
  Create a material request if administration also needs to create one manually.

- `PATCH /api/admin/inventory/requests/{requestId}/status`
  Approve, reject, or fulfill a material request.

## 8. Additional Endpoints Needed For Parent Features

These endpoints are inferred from the parent pages and child-selection workflow.

Frontend sources include:

- `frontend/src/features/parent/useParentChildren.ts`
- `frontend/src/features/parent/data.ts`
- `frontend/src/features/parent/pages/ParentDashboard.tsx`
- `frontend/src/features/parent/pages/ParentAttendance.tsx`
- `frontend/src/features/parent/pages/ParentPerformance.tsx`
- `frontend/src/features/parent/pages/ParentFees.tsx`
- `frontend/src/features/parent/pages/ParentCommunication.tsx`
- `frontend/src/features/parent/pages/ParentUpcomingCourses.tsx`
- `frontend/src/features/parent/pages/ParentSubjectReport.tsx`
- `frontend/src/features/parent/pages/ParentTimetable.tsx`

Recommended endpoints:

- `GET /api/parent/children`
  Fetch all children linked to the logged-in parent.

- `GET /api/parent/children/{childId}`
  Fetch one child profile for the parent portal.

- `GET /api/parent/children/{childId}/dashboard`
  Fetch summary cards for the selected child.

- `GET /api/parent/children/{childId}/attendance`
  Fetch subject-wise attendance rows for a child.

- `GET /api/parent/children/{childId}/performance`
  Fetch subject performance overview for a child.

- `GET /api/parent/children/{childId}/performance/{subjectId}`
  Fetch detailed subject report including score, teacher, report comments, and syllabus coverage.

- `GET /api/parent/children/{childId}/fees`
  Fetch fee transactions and current dues.

- `GET /api/parent/children/{childId}/contacts`
  Fetch faculty/class-teacher contact details for the child.

- `GET /api/parent/children/{childId}/schedule`
  Fetch timetable for the child.

- `GET /api/parent/children/{childId}/upcoming-courses`
  Fetch upcoming courses published for the child’s class and section.

- `POST /api/parent/messages`
  Send a message or inquiry to faculty or administration if the communication page becomes interactive.

- `GET /api/parent/messages`
  Fetch communication history for the parent portal if messaging is added.

## 9. Additional Endpoints Needed For Home/Public Features

These are public-site endpoints that would support the home pages if static content is moved into the backend or CMS.

Frontend sources include:

- `frontend/src/features/Home/pages/Landing.tsx`
- `frontend/src/features/Home/pages/About.tsx`
- `frontend/src/features/Home/pages/Features.tsx`
- `frontend/src/features/Home/pages/Courses.tsx`
- `frontend/src/features/Home/pages/Contact.tsx`

Recommended endpoints:

- `GET /api/public/landing`
  Fetch hero content, feature highlights, stats, testimonials, and pricing for the landing page.

- `GET /api/public/about`
  Fetch about-page content.

- `GET /api/public/features`
  Fetch product feature cards and descriptions.

- `GET /api/public/pricing`
  Fetch public plans or course/pricing cards shown on the courses page.

- `GET /api/public/contact`
  Fetch public contact information such as email, phone, and address.

- `POST /api/public/contact`
  Submit a contact or demo inquiry form if the contact page becomes interactive.

- `GET /api/public/testimonials`
  Fetch testimonials independently if you want them managed separately.

- `GET /api/public/stats`
  Fetch public aggregate counts such as students, teachers, institutions, and uptime.

## 10. Features Currently Using Mock Or Local Frontend Data

These features/pages exist in the React frontend but do not currently call backend HTTP endpoints directly:

- Home pages under `frontend/src/features/Home/*`
- Most parent pages under `frontend/src/features/parent/*`
- Administration record-management, promotion, finance, reporting, and authority pages
- Inventory flows under `frontend/src/features/administration/api/inventoryApi.ts`
  These are async local mock functions, not HTTP endpoints.
- Some student pages such as `StudentAttendance.tsx`, `StudentMarks.tsx`, and `StudentAssignments.tsx`
  These pages currently render local mock data even though reusable API slices exist elsewhere.
- Some faculty pages such as `FacultyClasses.tsx` and `ViewStudentPerformance.tsx`
  These also currently use local mock data.

## 11. Complete Unique Endpoint List

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/otp/send`
- `POST /api/auth/otp/verify`
- `POST /api/auth/profile/update`
- `POST /api/auth/profile/picture`
- `POST /api/auth/profile/change-password`
- `GET /api/students`
- `GET /api/students/{studentId}`
- `GET /api/students/me`
- `GET /api/students/me/subjects`
- `GET /api/students/me/performance`
- `GET /api/classes`
- `GET /api/classes/{classId}/sections`
- `GET /api/faculty`
- `GET /api/attendance`
- `POST /api/attendance`
- `PUT /api/attendance`
- `GET /api/attendance/me/stats`
- `GET /api/marks`
- `GET /api/assignments`
- `POST /api/assignments/{assignmentId}/submit`
- `GET /api/schedule`
- `POST /api/schedule`
- `PUT /api/schedule/{scheduleId}`
- `DELETE /api/schedule/{scheduleId}`
- `GET /api/schedule/me`
- `POST /api/notifications/schedule`
- `GET /api/faculty/classes`
- `GET /api/faculty/classes/{classId}/subjects`
- `GET /api/faculty/subjects/{subjectId}/materials`
- `POST /api/ai/generate-questions`
- `POST /api/ai/modify-questions`
- `GET /api/assessments`
- `POST /api/assessments`
- `GET /api/assessments/{assessmentId}`
- `PATCH /api/assessments/{assessmentId}`
- `DELETE /api/assessments/{assessmentId}`
- `POST /api/assessments/{assessmentId}/publish`
- `GET /api/admin/dashboard`
- `GET /api/admin/students`
- `POST /api/admin/students`
- `GET /api/admin/students/{studentId}`
- `PUT /api/admin/students/{studentId}`
- `PATCH /api/admin/students/{studentId}/status`
- `DELETE /api/admin/students/{studentId}`
- `GET /api/admin/staff`
- `POST /api/admin/staff`
- `GET /api/admin/staff/{staffId}`
- `PUT /api/admin/staff/{staffId}`
- `PATCH /api/admin/staff/{staffId}/status`
- `DELETE /api/admin/staff/{staffId}`
- `GET /api/admin/leave-requests`
- `PATCH /api/admin/leave-requests/{requestId}/review`
- `GET /api/admin/upcoming-courses`
- `POST /api/admin/upcoming-courses`
- `PUT /api/admin/upcoming-courses/{courseId}`
- `DELETE /api/admin/upcoming-courses/{courseId}`
- `GET /api/admin/promotions/candidates`
- `POST /api/admin/promotions`
- `GET /api/admin/financial-records`
- `GET /api/admin/financial-records/{staffId}`
- `PUT /api/admin/financial-records/{staffId}`
- `GET /api/admin/salary-slips`
- `GET /api/admin/salary-slips/{slipId}`
- `GET /api/admin/salary-slips/me`
- `GET /api/admin/authority-rules`
- `POST /api/admin/authority-rules`
- `PUT /api/admin/authority-rules/{ruleId}`
- `DELETE /api/admin/authority-rules/{ruleId}`
- `GET /api/admin/reports/performance-trends`
- `GET /api/admin/reports/attendance`
- `GET /api/admin/reports/exam-participation`
- `POST /api/admin/reports/generate`
- `GET /api/admin/inventory/items`
- `POST /api/admin/inventory/items`
- `GET /api/admin/inventory/items/{itemId}`
- `PUT /api/admin/inventory/items/{itemId}`
- `DELETE /api/admin/inventory/items/{itemId}`
- `GET /api/admin/inventory/transactions`
- `POST /api/admin/inventory/transactions`
- `GET /api/admin/inventory/requests`
- `POST /api/admin/inventory/requests`
- `PATCH /api/admin/inventory/requests/{requestId}/status`
- `GET /api/parent/children`
- `GET /api/parent/children/{childId}`
- `GET /api/parent/children/{childId}/dashboard`
- `GET /api/parent/children/{childId}/attendance`
- `GET /api/parent/children/{childId}/performance`
- `GET /api/parent/children/{childId}/performance/{subjectId}`
- `GET /api/parent/children/{childId}/fees`
- `GET /api/parent/children/{childId}/contacts`
- `GET /api/parent/children/{childId}/schedule`
- `GET /api/parent/children/{childId}/upcoming-courses`
- `POST /api/parent/messages`
- `GET /api/parent/messages`
- `GET /api/public/landing`
- `GET /api/public/about`
- `GET /api/public/features`
- `GET /api/public/pricing`
- `GET /api/public/contact`
- `POST /api/public/contact`
- `GET /api/public/testimonials`
- `GET /api/public/stats`
