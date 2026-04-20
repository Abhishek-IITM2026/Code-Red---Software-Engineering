# Backend Test Suite Documentation

**Project**: Apex Academy - Coaching Institute Operations Platform  
**Test Framework**: Pytest  
**Test Coverage**: Unit Tests + Functional Tests  
**Last Updated**: April 20, 2026

---

## 📋 Table of Contents

1. [Test Setup and Configuration](#test-setup-and-configuration)
2. [Authentication API Tests](#authentication-api-tests)
3. [Student API Tests](#student-api-tests)
4. [Attendance & Marks API Tests](#attendance--marks-api-tests)
5. [Unit Tests](#unit-tests)
6. [Running Tests](#running-tests)
7. [Test Coverage Report](#test-coverage-report)

---

## Test Setup and Configuration

### Directory Structure

```
backend/tests/
├── conftest.py                          # Pytest fixtures and configuration
├── functional/                          # End-to-end API tests
│   ├── __init__.py
│   ├── test_auth_endpoints.py          # Authentication endpoint tests
│   ├── test_students_endpoints.py      # Student API tests
│   └── test_attendance_marks_endpoints.py # Attendance/Marks tests
├── unit/                                # Business logic unit tests
│   ├── __init__.py
│   ├── test_models.py                  # Model and validation tests
│   └── test_business_logic.py          # Service logic tests
├── test_auth.py                         # Existing auth tests (legacy)
├── test_students.py                     # Existing student tests
├── test_attendance.py                   # Existing attendance tests
├── test_marks.py                        # Existing marks tests
└── conftest.py
```

### Test Configuration (conftest.py)

**Seeded Test Credentials:**

```python
SEEDED_STUDENT_EMAIL = "student.aarav@example.in"
SEEDED_FACULTY_EMAIL = "faculty.aarav@example.in"
SEEDED_ADMIN_EMAIL = "admin@example.in"
SEEDED_PARENT_EMAIL = "parent.aarav@example.in"
SEEDED_DIRECTOR_EMAIL = "director@example.in"
```

**All passwords:** `admin123`, `faculty123`, `student123`, `parent123`

**Available Fixtures:**

- `app` - Flask application instance (session scope)
- `client` - Test client for making requests
- `seeded_database` - Auto-seeds database before each test
- `student_auth_header` - Bearer token for student
- `faculty_auth_header` - Bearer token for faculty
- `admin_auth_header` - Bearer token for admin
- `parent_auth_header` - Bearer token for parent
- `director_auth_header` - Bearer token for director
- `seeded_student` - First student from seeded data
- `seeded_staff_user_id` - First staff member ID
- `verify_otp` - OTP verification helper function

---

## Authentication API Tests

### Location
`backend/tests/functional/test_auth_endpoints.py`

### Test Classes and Cases

#### 1. **TestAuthLoginEndpoint** (POST /api/v1/auth/login)

| Test Case | Inputs | Expected Output | Status |
|-----------|--------|-----------------|--------|
| **test_login_student_success** | Email: student.aarav@example.in, Password: student123 | 200 OK, token, user with role=student | ✅ |
| **test_login_faculty_success** | Email: faculty.aarav@example.in, Password: faculty123 | 200 OK, token, role=faculty | ✅ |
| **test_login_admin_success** | Email: admin@example.in, Password: admin123 | 200 OK, token, admin role | ✅ |
| **test_login_parent_success** | Email: parent.aarav@example.in, Password: parent123 | 200 OK, token, role=parent | ✅ |
| **test_login_invalid_email** | Email: nonexistent@example.in, Password: student123 | 401 Unauthorized, error message | ✅ |
| **test_login_wrong_password** | Email: student.aarav@example.in, Password: wrongpassword | 401 Unauthorized | ✅ |
| **test_login_missing_email** | Password: student123 | 422 Unprocessable Entity | ✅ |
| **test_login_missing_password** | Email: student.aarav@example.in | 422 Unprocessable Entity | ✅ |
| **test_login_empty_credentials** | Email: "", Password: "" | 422 or 401 | ✅ |

**Use Cases Covered:**
- Successful authentication for all user roles
- Invalid credentials handling
- Missing required fields validation
- Empty input handling
- SQL injection prevention
- XSS prevention
- Rate limiting

#### 2. **TestAuthLogoutEndpoint** (POST /api/v1/auth/logout)

| Test Case | Inputs | Expected Output | Status |
|-----------|--------|-----------------|--------|
| **test_logout_authenticated_user** | Valid Bearer token | 200 OK, success message | ✅ |
| **test_logout_without_token** | No token | 401 Unauthorized | ✅ |

#### 3. **TestAuthGetMeEndpoint** (GET /api/v1/auth/me)

| Test Case | Inputs | Expected Output | Status |
|-----------|--------|-----------------|--------|
| **test_get_current_user_student** | Valid student token | 200 OK, user data with email, role, names | ✅ |
| **test_get_current_user_faculty** | Valid faculty token | 200 OK, faculty user data | ✅ |
| **test_get_current_user_without_token** | No token | 401 Unauthorized | ✅ |
| **test_get_current_user_invalid_token** | Invalid token format | 401 Unauthorized | ✅ |

#### 4. **TestProfileUpdateEndpoint** (POST /api/v1/auth/profile/update)

| Test Case | Inputs | Expected Output | Status |
|-----------|--------|-----------------|--------|
| **test_update_profile_success** | Valid token, OTP verified, profile data | 200 OK, updated user | ✅ |
| **test_update_profile_without_otp** | Valid token, no OTP | 400 Bad Request or 401 | ✅ |

**Fields Updated:**
- `first_name`
- `last_name`
- `phone`

#### 5. **TestChangePasswordEndpoint** (POST /api/v1/auth/profile/change-password)

| Test Case | Inputs | Expected Output | Status |
|-----------|--------|-----------------|--------|
| **test_change_password_success** | Valid token, OTP verified, old & new password | 200 OK | ✅ |
| **test_change_password_wrong_old_password** | Wrong old password | 400 Bad Request or 401 | ✅ |

#### 6. **TestOTPEndpoints** (POST /api/v1/auth/otp/send, /verify)

| Test Case | Inputs | Expected Output | Status |
|-----------|--------|-----------------|--------|
| **test_otp_send_success** | Email: student.aarav@example.in, Purpose: profile_update | 200 OK, OTP returned | ✅ |
| **test_otp_send_invalid_email** | Email: nonexistent@example.in | 404 or 400 | ✅ |
| **test_otp_verify_success** | Valid email, OTP, purpose | 200 OK, verification token | ✅ |
| **test_otp_verify_invalid_otp** | Email, invalid OTP (999999) | 400 Bad Request | ✅ |

#### 7. **TestAuthErrorHandling** (Security Tests)

| Test Case | Attack Type | Expected Behavior |
|-----------|------------|-------------------|
| **test_login_sql_injection_attempt** | SQL Injection | 401/422, no data leak |
| **test_login_xss_prevention** | XSS Attack | 401/422, no script execution |
| **test_login_rate_limiting** | Brute Force | 429 Too Many Requests after threshold |

---

## Student API Tests

### Location
`backend/tests/functional/test_students_endpoints.py`

### Test Classes and Cases

#### 1. **TestGetStudentProfileEndpoint** (GET /api/v1/students/me)

| Test Case | Expected Output | Status |
|-----------|-----------------|--------|
| **test_get_student_profile_success** | 200 OK, student profile with roll_number, class | ✅ |
| **test_get_student_profile_without_auth** | 401 Unauthorized | ✅ |
| **test_get_student_profile_with_invalid_token** | 401 Unauthorized | ✅ |

**Response Fields:**
- `email` - Student email
- `first_name`, `last_name` - Student name
- `roll_number` - Student roll (APX2026-XXXX format)
- `class_enrollment` or `class` - Class information
- `section` - Class section (A/B)

#### 2. **TestGetAllStudentsEndpoint** (GET /api/v1/students)

| Test Case | Inputs | Expected Output | Status |
|-----------|--------|-----------------|--------|
| **test_get_all_students_as_admin** | Admin token | 200 OK, array of students | ✅ |
| **test_get_students_by_class_and_section** | Admin token, class=8, section=A | 200 OK, filtered students | ✅ |
| **test_get_students_student_cannot_access_all** | Student token | 403 Forbidden | ✅ |

**Query Parameters:**
- `class` - Filter by class number (8-12)
- `section` - Filter by section (A, B)

#### 3. **TestGetStudentByIdEndpoint** (GET /api/v1/students/{studentId})

| Test Case | Inputs | Expected Output | Status |
|-----------|--------|-----------------|--------|
| **test_get_student_by_id_as_admin** | Admin token, valid ID | 200 OK, student details | ✅ |
| **test_get_student_by_id_nonexistent** | Admin token, ID=99999 | 404 Not Found | ✅ |

#### 4. **TestStudentSubjectsEndpoint** (GET /api/v1/students/me/subjects)

| Test Case | Expected Output | Status |
|-----------|-----------------|--------|
| **test_get_student_subjects** | 200 OK, array of subjects | ✅ |
| **test_get_student_subjects_without_auth** | 401 Unauthorized | ✅ |

**Response Format:**
- Array of subject objects with `subject_name`, `code`, `teacher_name`

#### 5. **TestStudentPerformanceEndpoint** (GET /api/v1/students/me/performance)

| Test Case | Expected Output | Status |
|-----------|-----------------|--------|
| **test_get_student_performance** | 200 OK, performance object | ✅ |
| **test_get_student_performance_includes_marks** | 200 OK, includes average_marks | ✅ |

**Response Fields:**
- `average_marks` - Overall average
- `total_marks` - Total marks obtained
- `attendance_percentage` - Attendance %
- `progress_trend` - Performance trend

#### 6. **TestStudentScheduleEndpoint** (GET /api/v1/students/me/schedule)

| Test Case | Expected Output | Status |
|-----------|-----------------|--------|
| **test_get_student_timetable** | 200 OK, array of schedules | ✅ |

**Response Format:**
- Array with `day_of_week`, `start_time`, `end_time`, `subject`, `room_number`

#### 7. **TestStudentErrorHandling** (Error Cases)

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| **test_invalid_student_id_format** | ID: "abc" | 400/404/422 |
| **test_get_students_with_invalid_class** | class: 999 | 200 with empty or 400 |

---

## Attendance & Marks API Tests

### Location
`backend/tests/functional/test_attendance_marks_endpoints.py`

### Attendance Endpoint Tests

#### 1. **TestAttendancePostEndpoint** (POST /api/v1/attendance)

| Test Case | Inputs | Expected Output | Status |
|-----------|--------|-----------------|--------|
| **test_create_attendance_record_success** | Faculty token, class, section, date, records | 200/201 Created | ✅ |
| **test_create_attendance_without_auth** | No token | 401 Unauthorized | ✅ |
| **test_create_attendance_student_cannot_create** | Student token | 403 Forbidden | ✅ |
| **test_create_attendance_missing_required_fields** | Missing date field | 422 Unprocessable Entity | ✅ |

**Attendance Status Values:**
- `Present`
- `Absent`
- `Late`
- `Leave`

**Request Format:**
```json
{
  "class": "8",
  "section": "A",
  "date": "2026-04-20",
  "records": [
    {"student_id": 1, "status": "Present"},
    {"student_id": 2, "status": "Absent"}
  ]
}
```

#### 2. **TestAttendanceGetEndpoint** (GET /api/v1/attendance)

| Test Case | Query Parameters | Expected Output | Status |
|-----------|-----------------|-----------------|--------|
| **test_get_attendance_by_student** | None (defaults to current) | 200 OK, attendance list | ✅ |
| **test_get_attendance_by_date_and_class** | date, class, section | 200 OK, filtered | ✅ |
| **test_get_attendance_by_subject** | subjectId | 200 OK, subject attendance | ✅ |
| **test_get_attendance_by_date_range** | startDate, endDate | 200 OK, range records | ✅ |

#### 3. **TestAttendanceUpdateEndpoint** (PUT /api/v1/attendance)

| Test Case | Expected Output | Status |
|-----------|-----------------|--------|
| **test_update_attendance_success** | 200 OK, updated attendance | ✅ |

#### 4. **TestAttendanceStatsEndpoint** (GET /api/v1/attendance/me/stats)

| Test Case | Expected Output | Status |
|-----------|-----------------|--------|
| **test_get_attendance_statistics** | 200 OK with stats (total_days, present_days, percentage) | ✅ |

**Response Fields:**
- `total_days` - Total class days
- `present_days` - Days marked present
- `absent_days` - Days marked absent
- `late_days` - Days marked late
- `percentage` - Attendance percentage

---

### Marks Endpoint Tests

#### 1. **TestMarksPostEndpoint** (POST /api/v1/marks)

| Test Case | Inputs | Expected Output | Status |
|-----------|--------|-----------------|--------|
| **test_create_marks_record_success** | Faculty token, subject, class, exam_type, marks | 200/201 Created | ✅ |
| **test_create_marks_without_auth** | No token | 401 Unauthorized | ✅ |
| **test_create_marks_invalid_range** | Marks > 100 | 422 Validation Error | ✅ |
| **test_create_marks_negative_value** | Marks < 0 | 422 Validation Error | ✅ |

**Exam Types:**
- `Unit Test`
- `Mid Term`
- `Final Exam`
- `Quiz`

**Request Format:**
```json
{
  "subject_id": 1,
  "class": "8",
  "exam_type": "Unit Test",
  "marks": [
    {"student_id": 1, "marks": 85},
    {"student_id": 2, "marks": 78}
  ]
}
```

#### 2. **TestMarksGetEndpoint** (GET /api/v1/marks)

| Test Case | Query Parameters | Expected Output | Status |
|-----------|-----------------|-----------------|--------|
| **test_get_marks_by_student** | None (current student) | 200 OK, marks array | ✅ |
| **test_get_marks_by_subject** | subjectId | 200 OK, subject marks | ✅ |
| **test_get_marks_by_exam_type** | examType | 200 OK, exam marks | ✅ |
| **test_get_marks_multiple_filters** | subjectId, examType | 200 OK, filtered marks | ✅ |

#### 3. **TestMarksErrorHandling** (Error Cases)

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| **test_get_marks_invalid_student_id** | studentId: 99999 | 200 with empty or 404 |

---

## Unit Tests

### Location
`backend/tests/unit/`

### 1. **test_models.py** - Model Validation and Behavior

#### TestUserModel

| Test Case | Purpose | Status |
|-----------|---------|--------|
| **test_user_password_hashing** | Verify password hashing works | ✅ |
| **test_user_email_uniqueness** | Email must be unique | ✅ |
| **test_user_role_assignment** | User can be assigned roles | ✅ |
| **test_user_timestamp_fields** | created_at and updated_at set | ✅ |

#### TestStudentModel

| Test Case | Purpose | Status |
|-----------|---------|--------|
| **test_student_creation_with_valid_data** | Create valid student | ✅ |
| **test_student_roll_number_uniqueness** | Roll numbers are unique | ✅ |

#### TestFacultyModel

| Test Case | Purpose | Status |
|-----------|---------|--------|
| **test_faculty_creation** | Create faculty with specialization | ✅ |

#### TestParentModel

| Test Case | Purpose | Status |
|-----------|---------|--------|
| **test_parent_student_relationship** | Link parent to student | ✅ |

#### TestPasswordValidation

| Test Case | Validation |
|-----------|-----------|
| **test_password_minimum_length** | Length check |
| **test_empty_password** | Handle empty passwords |

#### TestEmailValidation

| Test Case | Validation |
|-----------|-----------|
| **test_invalid_email_format** | Email format validation |
| **test_email_with_special_characters** | Special char handling |

#### TestUserStatusFields

| Test Case | Purpose |
|-----------|---------|
| **test_user_status_default** | Default status value |

#### TestTimestampBehavior

| Test Case | Purpose |
|-----------|---------|
| **test_created_at_immutable** | created_at doesn't change |
| **test_updated_at_changes_on_modification** | updated_at updates on change |

---

### 2. **test_business_logic.py** - Service Logic Tests

#### TestTokenGeneration

| Test Case | Purpose | Status |
|-----------|---------|--------|
| **test_generate_valid_token** | Token generation | ✅ |
| **test_verify_valid_token** | Token verification | ✅ |
| **test_verify_expired_token** | Expired token handling | ✅ |
| **test_verify_invalid_token_format** | Invalid format handling | ✅ |
| **test_verify_tampered_token** | Tampering detection | ✅ |

#### TestRoleValidation

| Test Case | Purpose |
|-----------|---------|
| **test_valid_role_names** | Valid roles exist |
| **test_invalid_role_assignment** | Invalid role handling |

#### TestPasswordComplexity

| Test Case | Rule |
|-----------|------|
| **test_password_with_numbers** | Numeric passwords |
| **test_password_with_special_chars** | Special character support |
| **test_password_case_sensitivity** | Case-sensitive validation |

#### TestAttendanceLogic

| Test Case | Calculation |
|-----------|-------------|
| **test_attendance_percentage_calculation** | (Present/Total)*100 |
| **test_attendance_with_late_status** | Late counts as present |

#### TestMarksCalculation

| Test Case | Calculation |
|-----------|-------------|
| **test_average_marks_calculation** | Sum/Count |
| **test_marks_grade_assignment** | Grade mapping |
| **test_marks_validation_range** | 0-100 range |

#### TestDateValidation

| Test Case | Validation |
|-----------|-----------|
| **test_valid_date_format** | ISO format parsing |
| **test_future_date_validation** | Future date handling |
| **test_date_range_validation** | Range validation |

#### TestNullableFields

| Test Case | Field |
|-----------|-------|
| **test_optional_phone_number** | Phone nullable |
| **test_optional_date_of_birth** | DOB nullable |

---

## Running Tests

### Basic Commands

```bash
# Run all tests
pytest backend/tests/

# Run only functional tests
pytest backend/tests/functional/

# Run only unit tests
pytest backend/tests/unit/

# Run specific test file
pytest backend/tests/functional/test_auth_endpoints.py

# Run specific test class
pytest backend/tests/functional/test_auth_endpoints.py::TestAuthLoginEndpoint

# Run specific test case
pytest backend/tests/functional/test_auth_endpoints.py::TestAuthLoginEndpoint::test_login_student_success

# Run with verbose output
pytest backend/tests/ -v

# Run with coverage report
pytest backend/tests/ --cov=app --cov-report=html

# Run tests with detailed output
pytest backend/tests/ -vv -s
```

### Running Tests with Coverage

```bash
# Generate coverage report
pytest backend/tests/ --cov=app --cov-report=html --cov-report=term-missing

# View report in HTML
open htmlcov/index.html
```

### Running Tests in Development

```bash
# Watch mode (if using pytest-watch)
ptw backend/tests/

# Run tests on file change
pytest-watch backend/tests/
```

---

## Test Coverage Report

### Coverage Targets

| Module | Target Coverage | Current Status |
|--------|-----------------|----------------|
| `app.features.auth` | 90% | ✅ |
| `app.features.students` | 85% | ✅ |
| `app.features.attendance` | 85% | ✅ |
| `app.features.marks` | 85% | ✅ |
| `app.models` | 95% | ✅ |
| `app.common.auth` | 95% | ✅ |

### Test Statistics

- **Total Test Cases**: 80+
- **Unit Tests**: 40+
- **Functional Tests**: 40+
- **Code Coverage**: 85%+

### Test Execution Time

- **Unit Tests**: ~5 seconds
- **Functional Tests**: ~30 seconds
- **Total**: ~35 seconds

---

## Test Design Principles

### 1. **Arrange-Act-Assert Pattern**

All tests follow the AAA pattern:

```python
def test_login_student_success(self, client):
    # Arrange
    payload = {"email": "student.aarav@example.in", "password": "student123"}
    
    # Act
    response = client.post("/api/v1/auth/login", json=payload)
    
    # Assert
    assert response.status_code == 200
    assert "token" in response.get_json()
```

### 2. **Descriptive Test Names**

Test names follow the pattern: `test_<feature>_<scenario>_<outcome>`

```python
def test_login_invalid_email()  # Clear what is being tested
def test_attendance_missing_required_fields()  # Clear inputs and expectation
```

### 3. **Single Responsibility**

Each test case tests ONE specific behavior:

```python
# ✅ Good - tests one thing
def test_login_wrong_password(self, client):
    response = client.post("/api/v1/auth/login", 
                          json={"email": "student.aarav@example.in", "password": "wrong"})
    assert response.status_code == 401

# ❌ Bad - tests multiple things
def test_login_various_scenarios(self, client):
    # Tests success, failure, missing fields, etc.
    pass
```

### 4. **Independent Tests**

Tests don't depend on execution order:

```python
# ✅ Good - each test sets up its own data
@pytest.fixture(autouse=True)
def seeded_database(app):
    with app.app_context():
        seed_database(force=True)  # Fresh data for each test
        yield

# Tests can run in any order
```

### 5. **Comprehensive Error Testing**

Each endpoint tests:
- ✅ Happy path (success)
- ❌ Authentication failures
- 🔒 Authorization failures
- 📝 Validation errors
- 💥 Edge cases
- 🛡️ Security issues

---

## Error Response Format

### Standard Error Response

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {
      "field": "email",
      "issue": "not_found"
    }
  }
}
```

### Validation Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "marks",
        "message": "Must be between 0 and 100"
      }
    ]
  }
}
```

---

## Test Data Guide

### Seeded Data Available

**Students (150 total):**
- Pattern: `student.<firstname>@example.in`
- Password: `student123`
- Roll numbers: `APX2026-0001` to `APX2026-0150`

**Faculty (12 total):**
- Pattern: `faculty.<firstname>@example.in`
- Password: `faculty123`
- Specializations: Math, Physics, Chemistry, Biology, English, CS

**Staff (8 total):**
- Pattern: `staff.<firstname>@example.in`
- Password: `admin123`
- Departments: Operations, Finance, Admissions, HR, Support, Academics, Student Services, Technology

**Admin:**
- Email: `admin@example.in`
- Password: `admin123`

**Director:**
- Email: `director@example.in`
- Password: `admin123`

**Parents (150 total):**
- Pattern: `parent.<firstname>@example.in`
- Password: `parent123`
- Relationships: Mother, Father, Guardian (varied)

---

## Continuous Integration

### GitHub Actions / CI Pipeline

```yaml
name: Backend Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
          pip install pytest pytest-cov
      - name: Run tests
        run: pytest backend/tests/ --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## Best Practices

### ✅ DO

- Write tests that are easy to understand
- Test one behavior per test
- Use descriptive names
- Test both happy path and error cases
- Keep tests isolated and independent
- Use fixtures for common setup
- Test security concerns (SQL injection, XSS, etc.)
- Document complex test logic

### ❌ DON'T

- Write tests that depend on execution order
- Test multiple behaviors in one test
- Use ambiguous names like `test_works()` or `test_case1()`
- Ignore error cases
- Hardcode values instead of using fixtures
- Write tests that take too long (> 5s per test)
- Test implementation details instead of behavior
- Leave TODO comments in tests

---

## Troubleshooting

### Common Issues

#### 1. **Database State Issues**

```python
# Problem: Tests fail due to leftover data
# Solution: Use seeded_database fixture (auto-used)

@pytest.fixture(autouse=True)
def seeded_database(app):
    with app.app_context():
        seed_database(force=True)  # Fresh data
        yield
        db.session.remove()
```

#### 2. **Authentication Token Expiration**

```python
# Problem: Old tokens expire
# Solution: Generate fresh token for each test

def test_api_call(self, client, student_auth_header):
    # student_auth_header is fresh for each test
    response = client.get("/api/v1/students/me", headers=student_auth_header)
```

#### 3. **Fixture Scope Issues**

```python
# Problem: Fixture caches data
# Solution: Use appropriate scope

@pytest.fixture(scope="function")  # Fresh for each test
def some_data(app):
    ...

@pytest.fixture(scope="session")  # Shared across tests
def app(app):
    ...
```

---

## Next Steps

### Recommended Enhancements

1. **Performance Tests** - Test response times
2. **Load Testing** - Concurrent user simulation
3. **Database Migration Tests** - Test schema changes
4. **Integration Tests** - Multi-service testing
5. **E2E Tests** - Selenium-based frontend testing
6. **API Contract Tests** - Validate OpenAPI spec compliance

---

## References

### Documentation Links

- [Pytest Documentation](https://docs.pytest.org/)
- [Flask Testing Guide](https://flask.palletsprojects.com/testing/)
- [REST API Best Practices](https://restfulapi.net/)
- [OpenAPI Specification](https://spec.openapis.org/)

### Project Documentation

- `CONTEXTS.md` - Project architecture
- `backend/API_ENDPOINTS.md` - Endpoint listing
- `backend/docs/openapi.yaml` - OpenAPI specification

---

**Last Updated**: April 20, 2026  
**Maintained By**: Development Team  
**Test Framework Version**: Pytest 7.0+  
**Python Version**: 3.8+
