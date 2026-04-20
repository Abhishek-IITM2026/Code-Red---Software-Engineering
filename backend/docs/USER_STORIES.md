# API User Stories - School Management System

This document contains comprehensive user stories for all API endpoints with descriptions, input, expected output, and error handling.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Students](#students)
3. [Attendance](#attendance)
4. [Marks](#marks)
5. [Faculty](#faculty)
6. [Leave Management](#leave-management)
7. [Payroll](#payroll)
8. [Inventory](#inventory)
9. [Notifications](#notifications)
10. [Parent Portal](#parent-portal)
11. [Schedule](#schedule)
12. [Academics](#academics)
13. [Assessments](#assessments)
14. [Authority](#authority)
15. [Administration](#administration)

---


## 1. Authentication

---

### US-001: User Login

**Description:** Allows users to authenticate and receive JWT tokens for accessing protected endpoints.

**Endpoint:** `POST /api/v1/auth/login`

**Input:**
```json
{
  "email": "student0001.aarav@example.in",
  "password": "student123"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "student0001.aarav@example.in",
      "firstName": "Aarav",
      "lastName": "Sharma",
      "roleScope": "student"
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | INVALID_CREDENTIALS | Invalid email or password |
| 400 | VALIDATION_ERROR | Email and password are required |
| 403 | ACCOUNT_LOCKED | Account is locked |
| 403 | ACCOUNT_INACTIVE | Account is inactive |

**Test Code:**
```python
def test_login_success(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "student0001.aarav@example.in",
        "password": "student123"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "token" in data["data"]
    assert data["data"]["user"]["email"] == "student0001.aarav@example.in"

def test_login_invalid_credentials(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpass"
    })
    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "INVALID_CREDENTIALS"

def test_login_missing_fields(client):
    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 400
```

---

### US-002: Get Current User

**Description:** Returns the profile of the currently authenticated user.

**Endpoint:** `GET /api/v1/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "student0001.aarav@example.in",
    "firstName": "Aarav",
    "lastName": "Sharma",
    "roleScope": "student",
    "roles": ["student"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Authentication required |
| 404 | USER_NOT_FOUND | User not found |

**Test Code:**
```python
def test_get_me_authenticated(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert "email" in data["data"]

def test_get_me_unauthenticated(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
```

---

### US-003: User Logout

**Description:** Invalidates the current user session.

**Endpoint:** `POST /api/v1/auth/logout`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Test Code:**
```python
def test_logout(client, auth_headers):
    response = client.post("/api/v1/auth/logout", headers=auth_headers)
    assert response.status_code == 200
    assert response.get_json()["message"] == "Logged out successfully"
```

---

### US-004: Refresh Access Token

**Description:** Issues a new access token using a valid refresh token.

**Endpoint:** `POST /api/v1/auth/refresh`

**Input:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | INVALID_TOKEN | Invalid or expired refresh token |

---


---

## 2. Students

---

### US-010: List All Students

**Description:** Returns a list of all students. Faculty can only see their assigned classes, administration can see all.

**Endpoint:** `GET /api/v1/students`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| class | string | No | Filter by class name (e.g., "10A") |
| section | string | No | Filter by section (e.g., "A") |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rollNumber": "STU0001",
      "userId": 1,
      "firstName": "Aarav",
      "lastName": "Sharma",
      "email": "student0001.aarav@example.in",
      "class": "10",
      "classId": 5,
      "section": "A",
      "status": "active",
      "dateOfBirth": "2010-05-15",
      "gender": "Male"
    }
  ]
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |

**Test Code:**
```python
def test_list_students_as_admin(client, admin_headers):
    response = client.get("/api/v1/students", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.get_json()["data"], list)

def test_list_students_as_faculty(client, faculty_headers):
    response = client.get("/api/v1/students", headers=faculty_headers)
    assert response.status_code == 200

def test_list_students_filter_by_class(client, admin_headers):
    response = client.get("/api/v1/students?class=10&section=A", headers=admin_headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    for student in data:
        assert student["class"] == "10"
        assert student["section"] == "A"

def test_list_students_as_student_forbidden(client, student_headers):
    response = client.get("/api/v1/students", headers=student_headers)
    assert response.status_code == 403
```

---

### US-011: Get Current Student Profile

**Description:** Returns the profile of the currently logged-in student.

**Endpoint:** `GET /api/v1/students/me`

**Headers:** `Authorization: Bearer <token>`

**Roles:** student

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rollNumber": "STU0001",
    "firstName": "Aarav",
    "lastName": "Sharma",
    "email": "student0001.aarav@example.in",
    "class": "10",
    "section": "A",
    "classId": 5,
    "status": "active",
    "dateOfBirth": "2010-05-15",
    "gender": "Male",
    "address": "123 Main Street, Delhi",
    "phone": "+91-9876543210"
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Only students can access this endpoint |
| 404 | STUDENT_NOT_FOUND | No student profile linked to user |

**Test Code:**
```python
def test_get_my_profile(client, student_headers):
    response = client.get("/api/v1/students/me", headers=student_headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert "rollNumber" in data
    assert "class" in data

def test_get_my_profile_as_non_student(client, faculty_headers):
    response = client.get("/api/v1/students/me", headers=faculty_headers)
    assert response.status_code == 403
```

---

### US-012: Get Student Subjects

**Description:** Returns the list of subjects enrolled by the current student.

**Endpoint:** `GET /api/v1/students/me/subjects`

**Headers:** `Authorization: Bearer <token>`

**Roles:** student

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Mathematics",
      "code": "MATH101",
      "classId": 5,
      "courseType": "core",
      "faculty": {
        "id": 1,
        "name": "Rajesh Kumar"
      }
    },
    {
      "id": 2,
      "name": "Science",
      "code": "SCI101",
      "classId": 5,
      "courseType": "core",
      "faculty": {
        "id": 2,
        "name": "Priya Singh"
      }
    }
  ]
}
```

**Test Code:**
```python
def test_get_my_subjects(client, student_headers):
    response = client.get("/api/v1/students/me/subjects", headers=student_headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert isinstance(data, list)
    if data:
        assert "name" in data[0]
        assert "code" in data[0]
```

---

### US-013: Get Student Performance

**Description:** Returns performance summary including marks and attendance for the current student.

**Endpoint:** `GET /api/v1/students/me/performance`

**Headers:** `Authorization: Bearer <token>`

**Roles:** student

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "overallPercentage": 85.5,
    "subjects": [
      {
        "subjectId": 1,
        "subjectName": "Mathematics",
        "average": 92.0,
        "examsTaken": 5,
        "grade": "A+"
      },
      {
        "subjectId": 2,
        "subjectName": "Science",
        "average": 79.0,
        "examsTaken": 5,
        "grade": "B+"
      }
    ],
    "attendance": {
      "percentage": 95.0,
      "present": 19,
      "total": 20
    }
  }
}
```

**Test Code:**
```python
def test_get_my_performance(client, student_headers):
    response = client.get("/api/v1/students/me/performance", headers=student_headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert "overallPercentage" in data
    assert "subjects" in data
    assert "attendance" in data
```

---

### US-014: Enroll in Course

**Description:** Allows a student to enroll in an optional course with payment plan.

**Endpoint:** `POST /api/v1/students/me/course-enrollments`

**Headers:** `Authorization: Bearer <token>`

**Roles:** student

**Input:**
```json
{
  "courseId": 10,
  "paymentPlan": "full",
  "installmentCount": 1
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "studentId": 1,
    "courseId": 10,
    "courseName": "Advanced Mathematics",
    "totalFee": 5000.00,
    "amountPaid": 0,
    "balanceDue": 5000.00,
    "status": "pending",
    "createdAt": "2024-01-20T10:00:00Z"
  },
  "message": "Course enrollment created."
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Invalid input data |
| 403 | FORBIDDEN | Course not available for student |
| 404 | COURSE_NOT_FOUND | Course not found |
| 409 | ALREADY_ENROLLED | Student already enrolled in this course |

**Test Code:**
```python
def test_enroll_in_course(client, student_headers):
    response = client.post("/api/v1/students/me/course-enrollments",
        headers=student_headers,
        json={"courseId": 10, "paymentPlan": "full", "installmentCount": 1}
    )
    assert response.status_code == 201
    data = response.get_json()["data"]
    assert data["courseId"] == 10

def test_enroll_invalid_course(client, student_headers):
    response = client.post("/api/v1/students/me/course-enrollments",
        headers=student_headers,
        json={"courseId": 9999}
    )
    assert response.status_code == 404
```

---

### US-015: Make Course Payment

**Description:** Records a payment for a course enrollment.

**Endpoint:** `POST /api/v1/students/me/course-enrollments/{enrollmentId}/payments`

**Headers:** `Authorization: Bearer <token>`

**Roles:** student

**Input:**
```json
{
  "amount": 2500.00,
  "paymentMethod": "online",
  "referenceNumber": "TXN123456789"
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "payment": {
      "id": 15,
      "amount": 2500.00,
      "paymentMethod": "online",
      "referenceNumber": "TXN123456789",
      "receiptNumber": "RCP00015",
      "paidAt": "2024-01-20T11:00:00Z"
    },
    "enrollment": {
      "id": 5,
      "balanceDue": 2500.00
    }
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_AMOUNT | Payment amount exceeds balance |
| 404 | ENROLLMENT_NOT_FOUND | Enrollment not found |

**Test Code:**
```python
def test_make_course_payment(client, student_headers, enrolled_enrollment_id):
    response = client.post(
        f"/api/v1/students/me/course-enrollments/{enrolled_enrollment_id}/payments",
        headers=student_headers,
        json={
            "amount": 2500.00,
            "paymentMethod": "online",
            "referenceNumber": "TXN123456789"
        }
    )
    assert response.status_code == 201
    assert response.get_json()["data"]["success"] is True
```

---


---

## 3. Attendance

---

### US-020: Get Attendance Records

**Description:** Returns attendance records. Students can only see their own, faculty see their assigned classes.

**Endpoint:** `GET /api/v1/attendance`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| studentId | integer | No | Filter by student ID |
| subjectId | integer | No | Filter by subject |
| date | string | No | Filter by date (YYYY-MM-DD) |
| class | integer | No | Filter by class ID |
| startDate | string | No | Filter from date |
| endDate | string | No | Filter to date |
| section | string | No | Filter by section |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "studentId": 1,
      "studentName": "Aarav Sharma",
      "classId": 5,
      "className": "10-A",
      "subjectId": 1,
      "subjectName": "Mathematics",
      "attendanceDate": "2024-01-15",
      "status": "PRESENT",
      "markedBy": "Rajesh Kumar",
      "markedAt": "2024-01-15T09:00:00Z"
    }
  ]
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Cannot access other student records |

**Test Code:**
```python
def test_get_attendance_as_student(client, student_headers):
    response = client.get("/api/v1/attendance", headers=student_headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    for record in data:
        assert record["studentId"] == 1  # Own records only

def test_get_attendance_with_date_filter(client, faculty_headers):
    response = client.get("/api/v1/attendance?date=2024-01-15", headers=faculty_headers)
    assert response.status_code == 200

def test_get_attendance_with_student_filter(client, faculty_headers):
    response = client.get("/api/v1/attendance?studentId=1", headers=faculty_headers)
    assert response.status_code == 200
```

---

### US-021: Create Attendance

**Description:** Faculty or admin creates attendance records for a class.

**Endpoint:** `POST /api/v1/attendance`

**Headers:** `Authorization: Bearer <token>`

**Roles:** faculty, administration

**Input:**
```json
{
  "attendanceDate": "2024-01-15",
  "classId": 5,
  "records": [
    {"studentId": 1, "subjectId": 1, "status": "PRESENT"},
    {"studentId": 2, "subjectId": 1, "status": "ABSENT"},
    {"studentId": 3, "subjectId": 1, "status": "LATE"}
  ]
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "count": 3
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | date, class and at least one record required |
| 403 | FORBIDDEN | Not assigned to this class |
| 404 | SUBJECT_ASSIGNMENT_NOT_FOUND | No subject assignment for class |

**Test Code:**
```python
def test_create_attendance(client, faculty_headers):
    response = client.post("/api/v1/attendance",
        headers=faculty_headers,
        json={
            "attendanceDate": "2024-01-15",
            "classId": 5,
            "records": [
                {"studentId": 1, "subjectId": 1, "status": "PRESENT"}
            ]
        }
    )
    assert response.status_code == 201
    assert response.get_json()["data"]["success"] is True

def test_create_attendance_unauthorized(client, student_headers):
    response = client.post("/api/v1/attendance",
        headers=student_headers,
        json={"attendanceDate": "2024-01-15", "classId": 5, "records": []}
    )
    assert response.status_code == 403
```

---

### US-022: Update Attendance

**Description:** Updates existing attendance records.

**Endpoint:** `PUT /api/v1/attendance`

**Headers:** `Authorization: Bearer <token>`

**Roles:** faculty, administration

**Input:** Same as Create Attendance

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "count": 2
  }
}
```

**Test Code:**
```python
def test_update_attendance(client, faculty_headers):
    response = client.put("/api/v1/attendance",
        headers=faculty_headers,
        json={
            "attendanceDate": "2024-01-15",
            "classId": 5,
            "records": [
                {"studentId": 1, "subjectId": 1, "status": "LATE"}
            ]
        }
    )
    assert response.status_code == 200
```

---

### US-023: Get My Attendance Statistics

**Description:** Returns attendance statistics for the current student.

**Endpoint:** `GET /api/v1/attendance/me/stats`

**Headers:** `Authorization: Bearer <token>`

**Roles:** student

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalDays": 20,
    "present": 19,
    "absent": 1,
    "late": 2,
    "percentage": 95.0,
    "bySubject": [
      {
        "subjectId": 1,
        "subjectName": "Mathematics",
        "present": 10,
        "total": 10,
        "percentage": 100.0
      }
    ]
  }
}
```

**Test Code:**
```python
def test_get_my_attendance_stats(client, student_headers):
    response = client.get("/api/v1/attendance/me/stats", headers=student_headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert "percentage" in data
    assert "totalDays" in data
```

---

## 4. Marks

---

### US-030: List Marks

**Description:** Returns marks records based on role-based access.

**Endpoint:** `GET /api/v1/marks`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| studentId | integer | No | Filter by student |
| subjectId | integer | No | Filter by subject |
| examType | string | No | Filter by exam type |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "studentId": 1,
      "studentName": "Aarav Sharma",
      "subjectId": 1,
      "subjectName": "Mathematics",
      "examType": "Unit Test",
      "examName": "Chapter 1 Test",
      "marksObtained": 85,
      "totalMarks": 100,
      "percentage": 85.0,
      "grade": "B+",
      "examDate": "2024-01-10",
      "remarks": "Good performance"
    }
  ]
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Students can only access their own marks |

**Test Code:**
```python
def test_list_marks_as_student(client, student_headers):
    response = client.get("/api/v1/marks", headers=student_headers)
    assert response.status_code == 200
    # Students should only see their own marks

def test_list_marks_as_faculty(client, faculty_headers):
    response = client.get("/api/v1/marks?subjectId=1", headers=faculty_headers)
    assert response.status_code == 200

def test_list_marks_with_filters(client, admin_headers):
    response = client.get("/api/v1/marks?studentId=1&examType=Unit%20Test", headers=admin_headers)
    assert response.status_code == 200
```

---


---

## 5. Faculty

---

### US-040: List Faculty

**Description:** Returns list of faculty members.

**Endpoint:** `GET /api/v1/faculty`

**Headers:** `Authorization: Bearer <token>`

**Roles:** faculty, administration

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 10,
      "employeeCode": "FAC001",
      "firstName": "Rajesh",
      "lastName": "Kumar",
      "email": "faculty001.aarav@example.in",
      "subjectSpecialization": "Mathematics",
      "qualification": "M.Sc. Mathematics",
      "phone": "+91-9876543210",
      "status": "active"
    }
  ]
}
```

**Test Code:**
```python
def test_list_faculty_as_admin(client, admin_headers):
    response = client.get("/api/v1/faculty", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.get_json()["data"], list)

def test_list_faculty_as_faculty(client, faculty_headers):
    response = client.get("/api/v1/faculty", headers=faculty_headers)
    assert response.status_code == 200
    # Faculty should only see their own profile
```

---

### US-041: Get Faculty Classes

**Description:** Returns list of classes assigned to the faculty member.

**Endpoint:** `GET /api/v1/faculty/classes`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "10",
      "section": "A"
    },
    {
      "id": 6,
      "name": "10",
      "section": "B"
    }
  ]
}
```

**Test Code:**
```python
def test_get_faculty_classes(client, faculty_headers):
    response = client.get("/api/v1/faculty/classes", headers=faculty_headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert isinstance(data, list)
```

---

### US-042: Get Classes Overview

**Description:** Returns detailed overview of assigned classes with subjects and materials.

**Endpoint:** `GET /api/v1/faculty/classes/overview`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "10",
      "section": "A",
      "studentCount": 35,
      "subjects": [
        {
          "id": 1,
          "name": "Mathematics",
          "code": "MATH101",
          "materials": [
            {"id": 1, "title": "Chapter 1 Notes", "type": "notes"}
          ]
        }
      ]
    }
  ]
}
```

**Test Code:**
```python
def test_get_classes_overview(client, faculty_headers):
    response = client.get("/api/v1/faculty/classes/overview", headers=faculty_headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    if data:
        assert "subjects" in data[0]
        assert "studentCount" in data[0]
```

---

### US-043: Get Subject Materials

**Description:** Returns materials for a specific subject.

**Endpoint:** `GET /api/v1/faculty/subjects/{subjectId}/materials`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Chapter 1 Notes",
      "type": "notes",
      "unit": "Unit 1",
      "week": 1,
      "createdAt": "2024-01-10T10:00:00Z",
      "createdBy": "Rajesh Kumar"
    }
  ]
}
```

**Test Code:**
```python
def test_get_subject_materials(client, faculty_headers):
    response = client.get("/api/v1/faculty/subjects/1/materials", headers=faculty_headers)
    assert response.status_code == 200
```

---

### US-044: Publish Subject Material

**Description:** Allows faculty to publish teaching materials for a subject.

**Endpoint:** `POST /api/v1/faculty/subjects/{subjectId}/materials`

**Headers:** `Authorization: Bearer <token>`

**Input (multipart/form-data):**
```
title: Chapter 1 Notes
unit: Unit 1
week: 1
materialType: notes
sourceText: This is the content of the notes...
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "title": "Chapter 1 Notes",
    "type": "notes",
    "unit": "Unit 1",
    "week": 1,
    "subjectId": 1,
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 404 | SUBJECT_NOT_FOUND | Subject not found |
| 403 | FORBIDDEN | Not authorized to publish to this subject |

**Test Code:**
```python
def test_publish_material(client, faculty_headers):
    response = client.post("/api/v1/faculty/subjects/1/materials",
        headers=faculty_headers,
        data={
            "title": "Test Notes",
            "unit": "Unit 1",
            "week": 1,
            "materialType": "notes",
            "sourceText": "Test content"
        }
    )
    assert response.status_code == 201
```

---

### US-045: Get Student Performance

**Description:** Faculty can view performance of students in their assigned classes.

**Endpoint:** `GET /api/v1/faculty/performance/students`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| classId | integer | No | Filter by class |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Aarav Sharma",
      "rollNumber": "STU0001",
      "class": "10",
      "section": "A",
      "overallGrade": "A",
      "attendance": 95,
      "performanceTrend": "up",
      "marks": [
        {"subject": "Mathematics", "marks": 85, "totalMarks": 100, "grade": "B+"}
      ]
    }
  ]
}
```

**Test Code:**
```python
def test_get_student_performance(client, faculty_headers):
    response = client.get("/api/v1/faculty/performance/students?classId=5", headers=faculty_headers)
    assert response.status_code == 200
```

---

## 6. Leave Management

---

### US-050: List Leave Requests

**Description:** Returns leave requests. Students/faculty see their own, admin sees all.

**Endpoint:** `GET /api/v1/leave`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status (Pending, Approved, Rejected) |
| applicantRole | string | No | Filter by role (student, faculty) |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "applicantId": 1,
      "applicantRole": "student",
      "applicantContext": "10 A",
      "leaveType": "Sick Leave",
      "fromDate": "2024-01-20",
      "toDate": "2024-01-22",
      "totalDays": 3,
      "reason": "Medical appointment",
      "contactNumber": "+91-9876543210",
      "status": "Pending",
      "submittedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Test Code:**
```python
def test_list_leave_requests_as_student(client, student_headers):
    response = client.get("/api/v1/leave", headers=student_headers)
    assert response.status_code == 200
    # Should only see own requests

def test_list_leave_requests_as_admin(client, admin_headers):
    response = client.get("/api/v1/leave?status=Pending", headers=admin_headers)
    assert response.status_code == 200
```

---

### US-051: Create Leave Request

**Description:** Students and faculty can create leave requests.

**Endpoint:** `POST /api/v1/leave`

**Headers:** `Authorization: Bearer <token>`

**Roles:** student, faculty

**Input:**
```json
{
  "leaveType": "Sick Leave",
  "fromDate": "2024-01-20",
  "toDate": "2024-01-22",
  "reason": "Medical appointment and rest",
  "contactNumber": "+91-9876543210",
  "supportingNote": "Doctor's prescription attached"
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "leaveType": "Sick Leave",
    "fromDate": "2024-01-20",
    "toDate": "2024-01-22",
    "totalDays": 3,
    "reason": "Medical appointment and rest",
    "status": "Pending",
    "submittedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_DATE | Dates must be in YYYY-MM-DD format |
| 400 | INVALID_DATE_RANGE | End date cannot be before start date |

**Test Code:**
```python
def test_create_leave_request(client, student_headers):
    response = client.post("/api/v1/leave",
        headers=student_headers,
        json={
            "leaveType": "Sick Leave",
            "fromDate": "2024-01-20",
            "toDate": "2024-01-22",
            "reason": "Medical appointment"
        }
    )
    assert response.status_code == 201
    assert response.get_json()["data"]["status"] == "Pending"

def test_create_leave_invalid_dates(client, student_headers):
    response = client.post("/api/v1/leave",
        headers=student_headers,
        json={
            "leaveType": "Sick Leave",
            "fromDate": "2024-01-22",
            "toDate": "2024-01-20",
            "reason": "Invalid"
        }
    )
    assert response.status_code == 400
```

---

### US-052: Review Leave Request

**Description:** Administration can approve or reject leave requests.

**Endpoint:** `PUT /api/v1/leave/{requestId}/review`

**Headers:** `Authorization: Bearer <token>`

**Roles:** administration

**Input:**
```json
{
  "status": "Approved",
  "reviewerComment": "Approved. Get well soon."
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "status": "Approved",
    "reviewerName": "Admin User",
    "reviewerComment": "Approved. Get well soon.",
    "reviewedAt": "2024-01-16T10:00:00Z"
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | ALREADY_REVIEWED | This leave request has already been reviewed |
| 400 | INVALID_STATUS | Status must be 'Approved' or 'Rejected' |
| 404 | LEAVE_NOT_FOUND | Leave request not found |

**Test Code:**
```python
def test_review_leave_approve(client, admin_headers, pending_leave_id):
    response = client.put(f"/api/v1/leave/{pending_leave_id}/review",
        headers=admin_headers,
        json={"status": "Approved", "reviewerComment": "Approved"}
    )
    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "Approved"

def test_review_leave_already_reviewed(client, admin_headers, approved_leave_id):
    response = client.put(f"/api/v1/leave/{approved_leave_id}/review",
        headers=admin_headers,
        json={"status": "Rejected"}
    )
    assert response.status_code == 400
```

---

### US-053: Cancel Leave Request

**Description:** User can cancel their own pending leave request.

**Endpoint:** `PUT /api/v1/leave/{requestId}/cancel`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Leave request cancelled successfully."
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 403 | FORBIDDEN | You can only cancel your own leave requests |
| 400 | CANNOT_CANCEL | Only pending requests can be cancelled |
| 404 | LEAVE_NOT_FOUND | Leave request not found |

**Test Code:**
```python
def test_cancel_own_leave(client, student_headers, pending_leave_id):
    response = client.put(f"/api/v1/leave/{pending_leave_id}/cancel", headers=student_headers)
    assert response.status_code == 200

def test_cancel_others_leave_forbidden(client, other_headers, leave_id):
    response = client.put(f"/api/v1/leave/{leave_id}/cancel", headers=other_headers)
    assert response.status_code == 403
```

---

### US-054: Get Leave Statistics

**Description:** Admin can view leave request statistics.

**Endpoint:** `GET /api/v1/leave/stats`

**Headers:** `Authorization: Bearer <token>`

**Roles:** administration

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "pending": 10,
    "approved": 35,
    "rejected": 5,
    "byRole": {
      "student": 30,
      "faculty": 20
    }
  }
}
```

**Test Code:**
```python
def test_get_leave_stats(client, admin_headers):
    response = client.get("/api/v1/leave/stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert "total" in data
    assert "pending" in data
```

---


---

## 7. Payroll

---

### US-060: List Salary Slips

**Description:** Returns salary slips. Admin sees all, faculty sees their own.

**Endpoint:** `GET /api/v1/payroll/salary-slips`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| staffId | string | No | Filter by staff ID |
| year | integer | No | Filter by year |
| monthKey | string | No | Filter by month (YYYY-MM) |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "10-2024-01",
      "staffId": "10",
      "staffName": "Rajesh Kumar",
      "year": 2024,
      "month": "January",
      "monthKey": "2024-01",
      "basicSalary": 50000,
      "allowances": 10000,
      "deductions": 5000,
      "netSalary": 55000,
      "status": "paid",
      "paidAt": "2024-01-28T10:00:00Z"
    }
  ]
}
```

**Test Code:**
```python
def test_list_salary_slips_as_admin(client, admin_headers):
    response = client.get("/api/v1/payroll/salary-slips", headers=admin_headers)
    assert response.status_code == 200

def test_list_salary_slips_with_year_filter(client, faculty_headers):
    response = client.get("/api/v1/payroll/salary-slips?year=2024", headers=faculty_headers)
    assert response.status_code == 200
```

---

### US-061: Download Salary Slip

**Description:** Downloads salary slip as PDF.

**Endpoint:** `GET /api/v1/payroll/salary-slips/{slipId}/download`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="SalarySlip_Rajesh_Kumar_January_2024.pdf"

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 404 | SALARY_SLIP_NOT_FOUND | Salary slip not found |
| 403 | FORBIDDEN | Cannot access this salary slip |

**Test Code:**
```python
def test_download_salary_slip(client, faculty_headers):
    response = client.get("/api/v1/payroll/salary-slips/10-2024-01/download", headers=faculty_headers)
    assert response.status_code == 200
    assert response.content_type == "application/pdf"
```

---

### US-062: Get My Salary Account Details

**Description:** Returns the current user's salary account information.

**Endpoint:** `GET /api/v1/payroll/me/account-details`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 10,
    "accountHolderName": "Rajesh Kumar",
    "bankName": "State Bank of India",
    "accountNumber": "****1234",
    "ifscCode": "SBIN0001234",
    "branchName": "Main Branch",
    "accountType": "savings",
    "upiId": "rajesh@upi",
    "verificationStatus": "approved"
  }
}
```

**Test Code:**
```python
def test_get_my_account_details(client, faculty_headers):
    response = client.get("/api/v1/payroll/me/account-details", headers=faculty_headers)
    assert response.status_code == 200
```

---

### US-063: Update Salary Account Details

**Description:** Updates the current user's salary account information.

**Endpoint:** `PUT /api/v1/payroll/me/account-details`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "accountHolderName": "Rajesh Kumar",
  "bankName": "State Bank of India",
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "branchName": "Main Branch",
  "accountType": "savings",
  "upiId": "rajesh@upi"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "accountHolderName": "Rajesh Kumar",
    "bankName": "State Bank of India",
    "verificationStatus": "approved"
  }
}
```

**Test Code:**
```python
def test_update_salary_account(client, faculty_headers):
    response = client.put("/api/v1/payroll/me/account-details",
        headers=faculty_headers,
        json={
            "accountHolderName": "Rajesh Kumar",
            "bankName": "HDFC Bank",
            "accountNumber": "5678901234",
            "ifscCode": "HDFC0001234",
            "accountType": "savings"
        }
    )
    assert response.status_code == 200
```

---

### US-064: Create Account Change Request

**Description:** Submits a request to change salary account details.

**Endpoint:** `POST /api/v1/payroll/me/account-change-requests`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "requestedData": {
    "bankName": "ICICI Bank",
    "accountNumber": "9876543210",
    "ifscCode": "ICIC0001234"
  },
  "proofDocumentUrl": "https://storage.example.com/proof.pdf",
  "proofDocumentName": "bank_statement.pdf",
  "proofNotes": "New account activated on 15 Jan 2024"
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "userId": 10,
    "requestedData": {
      "bankName": "ICICI Bank",
      "accountNumber": "9876543210"
    },
    "status": "pending",
    "requestedAt": "2024-01-20T10:00:00Z"
  }
}
```

**Test Code:**
```python
def test_create_account_change_request(client, faculty_headers):
    response = client.post("/api/v1/payroll/me/account-change-requests",
        headers=faculty_headers,
        json={
            "requestedData": {"bankName": "ICICI Bank"},
            "proofNotes": "New account"
        }
    )
    assert response.status_code == 201
```

---

## 8. Inventory

---

### US-070: List Inventory Items

**Description:** Returns all inventory items.

**Endpoint:** `GET /api/v1/inventory/items`

**Headers:** `Authorization: Bearer <token>`

**Roles:** faculty, administration

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Whiteboard Markers",
      "category": "Stationery",
      "quantity": 100,
      "available": 80,
      "reserved": 20,
      "unit": "pieces",
      "minStock": 20,
      "price": 50.00,
      "supplier": "ABC Supplies",
      "location": "Room 101"
    }
  ]
}
```

**Test Code:**
```python
def test_list_inventory_items(client, admin_headers):
    response = client.get("/api/v1/inventory/items", headers=admin_headers)
    assert response.status_code == 200
```

---

### US-071: Create Inventory Item

**Description:** Admin creates a new inventory item.

**Endpoint:** `POST /api/v1/inventory/items`

**Headers:** `Authorization: Bearer <token>`

**Roles:** administration

**Input:**
```json
{
  "name": "Projector Bulb",
  "category": "Electronics",
  "quantity": 10,
  "available": 10,
  "reserved": 0,
  "unit": "pieces",
  "minStock": 5,
  "price": 2500.00,
  "supplier": "Tech Solutions",
  "location": "Storage Room",
  "description": "Replacement bulbs for projectors"
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "Projector Bulb",
    "category": "Electronics",
    "quantity": 10,
    "available": 10,
    "minStock": 5
  }
}
```

**Test Code:**
```python
def test_create_inventory_item(client, admin_headers):
    response = client.post("/api/v1/inventory/items",
        headers=admin_headers,
        json={
            "name": "Test Item",
            "category": "Test",
            "quantity": 10,
            "available": 10,
            "unit": "pieces",
            "minStock": 5,
            "price": 100
        }
    )
    assert response.status_code == 201
```

---

### US-072: Update Inventory Item

**Description:** Admin updates an existing inventory item.

**Endpoint:** `PUT /api/v1/inventory/items/{itemId}`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "quantity": 15,
  "available": 15,
  "price": 2750.00
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "quantity": 15,
    "available": 15,
    "price": 2750.00
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 404 | ITEM_NOT_FOUND | Inventory item was not found |

**Test Code:**
```python
def test_update_inventory_item(client, admin_headers, inventory_item_id):
    response = client.put(f"/api/v1/inventory/items/{inventory_item_id}",
        headers=admin_headers,
        json={"quantity": 20, "available": 20}
    )
    assert response.status_code == 200
```

---

### US-073: Delete Inventory Item

**Description:** Admin deletes an inventory item.

**Endpoint:** `DELETE /api/v1/inventory/items/{itemId}`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (204 No Content):**

**Test Code:**
```python
def test_delete_inventory_item(client, admin_headers, inventory_item_id):
    response = client.delete(f"/api/v1/inventory/items/{inventory_item_id}", headers=admin_headers)
    assert response.status_code == 204
```

---

### US-074: List Material Requests

**Description:** Returns material requests from faculty.

**Endpoint:** `GET /api/v1/inventory/requests`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| facultyId | integer | No | Filter by faculty |
| status | string | No | Filter by status |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "facultyId": 5,
      "facultyName": "Rajesh Kumar",
      "department": "Science",
      "status": "pending",
      "items": [
        {"itemId": 1, "name": "Whiteboard Markers", "quantity": 5}
      ],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Test Code:**
```python
def test_list_material_requests(client, admin_headers):
    response = client.get("/api/v1/inventory/requests", headers=admin_headers)
    assert response.status_code == 200
```

---

### US-075: Create Material Request

**Description:** Faculty creates a material request.

**Endpoint:** `POST /api/v1/inventory/requests`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "facultyId": 5,
  "department": "Science",
  "items": [
    {"itemId": 1, "quantity": 5, "notes": "For lab experiments"}
  ]
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "facultyId": 5,
    "department": "Science",
    "status": "pending",
    "items": [...]
  }
}
```

**Test Code:**
```python
def test_create_material_request(client, faculty_headers):
    response = client.post("/api/v1/inventory/requests",
        headers=faculty_headers,
        json={
            "department": "Science",
            "items": [{"itemId": 1, "quantity": 5}]
        }
    )
    assert response.status_code == 201
```

---

### US-076: Update Material Request Status

**Description:** Admin updates the status of a material request.

**Endpoint:** `PATCH /api/v1/inventory/requests/{requestId}/status`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "status": "approved",
  "reviewNotes": "Approved for procurement"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "status": "approved",
    "reviewNotes": "Approved for procurement",
    "reviewedBy": 1
  }
}
```

**Test Code:**
```python
def test_update_request_status(client, admin_headers, material_request_id):
    response = client.patch(f"/api/v1/inventory/requests/{material_request_id}/status",
        headers=admin_headers,
        json={"status": "approved"}
    )
    assert response.status_code == 200
```

---


---

## 9. Notifications

---

### US-080: Schedule Notification

**Description:** Admin schedules a notification for recipients.

**Endpoint:** `POST /api/v1/notifications/schedule`

**Headers:** `Authorization: Bearer <token>`

**Roles:** administration

**Input:**
```json
{
  "message": "School will remain closed tomorrow due to heavy rainfall.",
  "recipientScope": "all"
}
```

**Expected Output (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "id": "abc123",
    "taskId": "task-uuid-123"
  }
}
```

**Test Code:**
```python
def test_schedule_notification(client, admin_headers):
    response = client.post("/api/v1/notifications/schedule",
        headers=admin_headers,
        json={"message": "Test notification", "recipientScope": "all"}
    )
    assert response.status_code == 202
```

---

### US-081: Send Email

**Description:** Admin sends an email to recipients.

**Endpoint:** `POST /api/v1/notifications/email/send`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "to": ["parent@example.com"],
  "cc": ["teacher@school.edu"],
  "subject": "Parent-Teacher Meeting",
  "text": "Dear Parent, You are invited...",
  "html": "<p>Dear Parent, You are invited...</p>",
  "category": "meeting"
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "to": ["parent@example.com"],
    "subject": "Parent-Teacher Meeting",
    "status": "sent",
    "sentAt": "2024-01-20T10:00:00Z"
  }
}
```

**Test Code:**
```python
def test_send_email(client, admin_headers):
    response = client.post("/api/v1/notifications/email/send",
        headers=admin_headers,
        json={
            "to": ["test@example.com"],
            "subject": "Test Email",
            "text": "This is a test email"
        }
    )
    assert response.status_code == 201
```

---

### US-082: Sync Email Messages

**Description:** Admin syncs incoming email messages from mailbox.

**Endpoint:** `POST /api/v1/notifications/email/sync`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "limit": 50,
  "mailbox": "INBOX",
  "unseenOnly": true
}
```

**Expected Output (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "taskId": "sync-task-123"
  }
}
```

**Test Code:**
```python
def test_sync_emails(client, admin_headers):
    response = client.post("/api/v1/notifications/email/sync",
        headers=admin_headers,
        json={"limit": 10, "mailbox": "INBOX", "unseenOnly": true}
    )
    assert response.status_code == 202
```

---

### US-083: List Email Messages

**Description:** Admin lists email messages with filters.

**Endpoint:** `GET /api/v1/notifications/email/messages`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| direction | string | No | Filter by direction (inbound/outbound) |
| status | string | No | Filter by status |
| limit | integer | No | Number of results |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "direction": "inbound",
      "from": "parent@example.com",
      "to": ["admin@school.edu"],
      "subject": "Inquiry about admissions",
      "body": "Hello, I would like to know...",
      "status": "unread",
      "receivedAt": "2024-01-20T09:00:00Z"
    }
  ]
}
```

**Test Code:**
```python
def test_list_email_messages(client, admin_headers):
    response = client.get("/api/v1/notifications/email/messages?limit=10", headers=admin_headers)
    assert response.status_code == 200
```

---

## 10. Parent Portal

---

### US-090: List Children

**Description:** Returns list of children linked to the parent account.

**Endpoint:** `GET /api/v1/parent/children`

**Headers:** `Authorization: Bearer <token>`

**Roles:** parent

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "rollNumber": "STU0005",
      "firstName": "Riya",
      "lastName": "Sharma",
      "class": "8",
      "section": "A",
      "status": "active"
    }
  ]
}
```

**Test Code:**
```python
def test_list_children(client, parent_headers):
    response = client.get("/api/v1/parent/children", headers=parent_headers)
    assert response.status_code == 200
    assert isinstance(response.get_json()["data"], list)
```

---

### US-091: Get Child Dashboard

**Description:** Returns comprehensive dashboard data for a child.

**Endpoint:** `GET /api/v1/parent/children/{childId}/dashboard`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 5,
      "name": "Riya Sharma",
      "class": "8-A",
      "rollNumber": "STU0005"
    },
    "attendance": {
      "percentage": 92.5,
      "present": 37,
      "total": 40
    },
    "performance": {
      "overallPercentage": 78.0,
      "grade": "B+"
    },
    "upcomingEvents": [...],
    "pendingFees": 5000
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 403 | FORBIDDEN | You can only access linked children |

**Test Code:**
```python
def test_get_child_dashboard(client, parent_headers, linked_child_id):
    response = client.get(f"/api/v1/parent/children/{linked_child_id}/dashboard", headers=parent_headers)
    assert response.status_code == 200

def test_get_other_child_forbidden(client, parent_headers, other_child_id):
    response = client.get(f"/api/v1/parent/children/{other_child_id}/dashboard", headers=parent_headers)
    assert response.status_code == 403
```

---

### US-092: Get Child Attendance

**Description:** Returns attendance records for a child.

**Endpoint:** `GET /api/v1/parent/children/{childId}/attendance`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 5,
      "name": "Riya Sharma"
    },
    "attendance": [
      {
        "subject": "Mathematics",
        "attended": "18",
        "total": "20",
        "percentage": "90%"
      }
    ],
    "summary": {
      "totalDays": 40,
      "present": 37,
      "absent": 2,
      "late": 1,
      "percentage": 92.5
    }
  }
}
```

**Test Code:**
```python
def test_get_child_attendance(client, parent_headers, linked_child_id):
    response = client.get(f"/api/v1/parent/children/{linked_child_id}/attendance", headers=parent_headers)
    assert response.status_code == 200
```

---

### US-093: Get Child Performance

**Description:** Returns performance summary for a child.

**Endpoint:** `GET /api/v1/parent/children/{childId}/performance`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 5,
      "name": "Riya Sharma"
    },
    "subjects": [
      {
        "id": 1,
        "name": "Mathematics",
        "score": "85%",
        "teacher": "Rajesh Kumar",
        "report": [
          "Current average score in Mathematics is 85%.",
          "Total assessments recorded: 5."
        ]
      }
    ]
  }
}
```

**Test Code:**
```python
def test_get_child_performance(client, parent_headers, linked_child_id):
    response = client.get(f"/api/v1/parent/children/{linked_child_id}/performance", headers=parent_headers)
    assert response.status_code == 200
```

---

### US-094: Get Child Fees

**Description:** Returns fee payment history for a child.

**Endpoint:** `GET /parent/children/{childId}/fees`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 5,
      "name": "Riya Sharma"
    },
    "fees": [
      {
        "month": "Mathematics Course - Receipt RCP0001",
        "amount": "Rs. 2,500.00",
        "status": "Paid",
        "date": "2024-01-15"
      },
      {
        "month": "Mathematics Course - Outstanding",
        "amount": "Rs. 2,500.00",
        "status": "Pending",
        "date": "2024-01-20"
      }
    ]
  }
}
```

**Test Code:**
```python
def test_get_child_fees(client, parent_headers, linked_child_id):
    response = client.get(f"/api/v1/parent/children/{linked_child_id}/fees", headers=parent_headers)
    assert response.status_code == 200
```

---

### US-095: Get Faculty Contacts

**Description:** Returns faculty contact information for a child's subjects.

**Endpoint:** `GET /api/v1/parent/children/{childId}/faculty`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 5,
      "name": "Riya Sharma"
    },
    "faculty": [
      {
        "subject": "Mathematics",
        "faculty": "Rajesh Kumar",
        "phone": "+91-9876543210"
      },
      {
        "subject": "Science",
        "faculty": "Priya Singh",
        "phone": "+91-9876543211"
      }
    ]
  }
}
```

**Test Code:**
```python
def test_get_faculty_contacts(client, parent_headers, linked_child_id):
    response = client.get(f"/api/v1/parent/children/{linked_child_id}/faculty", headers=parent_headers)
    assert response.status_code == 200
```

---

### US-096: Make Fee Payment

**Description:** Parent makes a payment for child's course enrollment.

**Endpoint:** `POST /parent/children/{childId}/course-enrollments/{enrollmentId}/payments`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "amount": 2500.00,
  "paymentMethod": "online",
  "referenceNumber": "TXN987654321"
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "payment": {
      "id": 20,
      "amount": 2500.00,
      "paymentMethod": "online",
      "receiptNumber": "RCP00020"
    }
  }
}
```

**Test Code:**
```python
def test_make_fee_payment(client, parent_headers, linked_child_id, enrollment_id):
    response = client.post(
        f"/api/v1/parent/children/{linked_child_id}/course-enrollments/{enrollment_id}/payments",
        headers=parent_headers,
        json={"amount": 2500, "paymentMethod": "online", "referenceNumber": "TXN123"}
    )
    assert response.status_code == 201
```

---


---

## 11. Schedule

---

### US-100: List Schedules

**Description:** Returns schedules based on user role.

**Endpoint:** `GET /api/v1/schedule/me`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| classId | integer | No | Filter by class |
| facultyId | integer | No | Filter by faculty |
| sectionId | string | No | Filter by section |
| dayOfWeek | integer | No | Filter by day (0-6) |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "classId": 5,
      "className": "10-A",
      "subjectId": 1,
      "subjectName": "Mathematics",
      "facultyId": 10,
      "facultyName": "Rajesh Kumar",
      "dayOfWeek": 0,
      "dayName": "Monday",
      "startTime": "09:00",
      "endTime": "10:00",
      "isActive": true
    }
  ]
}
```

**Test Code:**
```python
def test_list_schedules_as_student(client, student_headers):
    response = client.get("/api/v1/schedule", headers=student_headers)
    assert response.status_code == 200

def test_list_schedules_with_filters(client, faculty_headers):
    response = client.get("/api/v1/schedule?dayOfWeek=0", headers=faculty_headers)
    assert response.status_code == 200
```

---

### US-101: Create Schedule

**Description:** Creates a new class schedule.

**Endpoint:** `POST /schedule`

**Headers:** `Authorization: Bearer <token>`

**Roles:** faculty (with authority), administration

**Input:**
```json
{
  "classId": 5,
  "subjectId": 1,
  "facultyId": 10,
  "dayOfWeek": 0,
  "timeSlot": {
    "startTime": "09:00",
    "endTime": "10:00"
  }
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "classId": 5,
    "subjectId": 1,
    "facultyId": 10,
    "dayOfWeek": 0,
    "startTime": "09:00",
    "endTime": "10:00",
    "isActive": true
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 409 | SCHEDULE_CONFLICT | This time overlaps with an existing schedule |
| 422 | INVALID_TIME_FORMAT | Time must use HH:MM 24-hour format |
| 422 | INVALID_TIME_RANGE | End time must be later than start time |
| 403 | INSUFFICIENT_AUTHORITY | No permission to create schedules |

**Test Code:**
```python
def test_create_schedule(client, admin_headers):
    response = client.post("/api/v1/schedule",
        headers=admin_headers,
        json={
            "classId": 5,
            "subjectId": 1,
            "dayOfWeek": 1,
            "timeSlot": {"startTime": "10:00", "endTime": "11:00"}
        }
    )
    assert response.status_code == 201

def test_create_schedule_conflict(client, admin_headers):
    response = client.post("/api/v1/schedule",
        headers=admin_headers,
        json={
            "classId": 5,
            "subjectId": 1,
            "dayOfWeek": 0,
            "timeSlot": {"startTime": "09:00", "endTime": "10:00"}
        }
    )
    assert response.status_code == 409
```

---

### US-102: Update Schedule

**Description:** Updates an existing schedule.

**Endpoint:** `PUT /api/v1/schedule/{scheduleId}`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "startTime": "09:30",
  "endTime": "10:30",
  "facultyId": 12
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "startTime": "09:30",
    "endTime": "10:30",
    "facultyId": 12
  }
}
```

**Test Code:**
```python
def test_update_schedule(client, admin_headers, schedule_id):
    response = client.put(f"/api/v1/schedule/{schedule_id}",
        headers=admin_headers,
        json={"startTime": "10:00", "endTime": "11:00"}
    )
    assert response.status_code == 200
```

---

### US-103: Delete Schedule

**Description:** Deletes a schedule.

**Endpoint:** `DELETE /api/v1/schedule/{scheduleId}`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (204 No Content):**

**Test Code:**
```python
def test_delete_schedule(client, admin_headers, schedule_id):
    response = client.delete(f"/api/v1/schedule/{schedule_id}", headers=admin_headers)
    assert response.status_code == 204
```

---

## 12. Academics

---

### US-110: List Classes

**Description:** Returns all academic classes.

**Endpoint:** `GET /api/v1/academics/classes`

**Headers:** `Authorization: Bearer <token>`

**Roles:** student, faculty, parent, administration

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "10",
      "grade": "10",
      "section": "A",
      "academicYear": "2024-2025",
      "studentCount": 35
    },
    {
      "id": 2,
      "name": "10",
      "grade": "10",
      "section": "B",
      "academicYear": "2024-2025",
      "studentCount": 32
    }
  ]
}
```

**Test Code:**
```python
def test_list_classes(client, student_headers):
    response = client.get("/api/v1/academics/classes", headers=student_headers)
    assert response.status_code == 200
    assert isinstance(response.get_json()["data"], list)
```

---

### US-111: List Class Sections

**Description:** Returns sections for a specific class.

**Endpoint:** `GET /api/v1/academics/classes/{classId}/sections`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {"id": "A", "name": "A"},
    {"id": "B", "name": "B"}
  ]
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 404 | CLASS_NOT_FOUND | Class was not found |

**Test Code:**
```python
def test_list_class_sections(client, student_headers):
    response = client.get("/api/v1/academics/classes/1/sections", headers=student_headers)
    assert response.status_code == 200
```

---


---

## 13. Assessments

---

### US-120: Generate AI Questions

**Description:** Faculty generates assessment questions using AI.

**Endpoint:** `POST /api/v1/assessments/ai/generate-questions`

**Headers:** `Authorization: Bearer <token>`

**Roles:** faculty, administration

**Input:**
```json
{
  "subjectId": 1,
  "subjectName": "Mathematics",
  "topic": "Quadratic Equations",
  "questionCount": 10,
  "difficulty": "medium",
  "questionTypes": ["mcq", "short_answer"],
  "week": 3,
  "classId": 5
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "q1",
        "type": "mcq",
        "question": "Find the roots of x² - 5x + 6 = 0",
        "options": [
          {"id": "a", "text": "2, 3"},
          {"id": "b", "text": "1, 6"},
          {"id": "c", "text": "-2, -3"},
          {"id": "d", "text": "None"}
        ],
        "correctAnswer": "a",
        "difficulty": "easy",
        "marks": 2
      }
    ]
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 429 | RATE_LIMIT_EXCEEDED | Too many requests. Please try again later. |
| 500 | QUESTION_GENERATION_ERROR | Question generation failed |

**Test Code:**
```python
def test_generate_questions(client, faculty_headers):
    response = client.post("/api/v1/assessments/ai/generate-questions",
        headers=faculty_headers,
        json={
            "subjectId": 1,
            "topic": "Algebra",
            "questionCount": 5,
            "difficulty": "easy",
            "questionTypes": ["mcq"]
        }
    )
    assert response.status_code == 200
    assert "questions" in response.get_json()["data"]
```

---

### US-121: List Assessments

**Description:** Returns list of assessments.

**Endpoint:** `GET /api/v1/assessments/assessments`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subjectId | integer | No | Filter by subject |
| classId | integer | No | Filter by class |
| published | boolean | No | Filter by publish status |
| status | string | No | Filter by status |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Chapter 1 Test",
      "subjectId": 1,
      "subjectName": "Mathematics",
      "classId": 5,
      "className": "10-A",
      "examType": "Unit Test",
      "totalMarks": 50,
      "duration": 60,
      "dueDate": "2024-01-25T23:59:59Z",
      "published": true,
      "status": "active",
      "questionCount": 25
    }
  ]
}
```

**Test Code:**
```python
def test_list_assessments(client, faculty_headers):
    response = client.get("/api/v1/assessments?subjectId=1", headers=faculty_headers)
    assert response.status_code == 200
```

---

### US-122: Create Assessment

**Description:** Faculty creates a new assessment with questions.

**Endpoint:** `POST /api/v1/assessments/assessments`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "title": "Chapter 2 Test",
  "subjectId": 1,
  "classId": 5,
  "examType": "Unit Test",
  "totalMarks": 50,
  "duration": 60,
  "dueDate": "2024-01-25T23:59:59Z",
  "questions": [
    {
      "type": "mcq",
      "question": "Solve: 2x + 5 = 15",
      "options": [
        {"text": "x = 4"},
        {"text": "x = 5"},
        {"text": "x = 6"},
        {"text": "x = 7"}
      ],
      "correctAnswer": "x = 5",
      "marks": 2
    }
  ]
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "title": "Chapter 2 Test",
    "subjectId": 1,
    "totalMarks": 50,
    "questionCount": 1,
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

**Test Code:**
```python
def test_create_assessment(client, faculty_headers):
    response = client.post("/api/v1/assessments",
        headers=faculty_headers,
        json={
            "title": "Test Assessment",
            "subjectId": 1,
            "classId": 5,
            "totalMarks": 30,
            "duration": 45
        }
    )
    assert response.status_code == 201
```

---

### US-123: Publish Assessment

**Description:** Publishes an assessment to make it available to students.

**Endpoint:** `POST /api/v1/assessments/assessments/{assessmentId}/publish`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "published": true,
    "publishedAt": "2024-01-21T10:00:00Z"
  }
}
```

**Test Code:**
```python
def test_publish_assessment(client, faculty_headers, assessment_id):
    response = client.post(f"/api/v1/assessments/{assessment_id}/publish", headers=faculty_headers)
    assert response.status_code == 200
    assert response.get_json()["data"]["published"] is True
```

---

### US-124: Submit Assessment

**Description:** Student submits their assessment answers.

**Endpoint:** `POST /assessments/me/{assessmentId}/submit`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "answers": [
    {"questionId": "q1", "answer": "x = 5"},
    {"questionId": "q2", "answer": "The discriminant is positive"}
  ]
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "submissionId": 15,
    "assessmentId": 10,
    "studentId": 1,
    "submittedAt": "2024-01-22T14:30:00Z",
    "status": "submitted"
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | ASSESSMENT_EXPIRED | Assessment due date has passed |
| 409 | ALREADY_SUBMITTED | Assessment already submitted |

**Test Code:**
```python
def test_submit_assessment(client, student_headers, assessment_id):
    response = client.post(f"/api/v1/assessments/me/{assessment_id}/submit",
        headers=student_headers,
        json={"answers": [{"questionId": "q1", "answer": "test"}]}
    )
    assert response.status_code == 201
```

---

### US-125: Evaluate Submission

**Description:** Faculty evaluates a student submission.

**Endpoint:** `POST /assessments/{assessmentId}/submissions/{submissionId}/evaluate`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "submissionId": 15,
    "marksObtained": 45,
    "totalMarks": 50,
    "percentage": 90.0,
    "grade": "A+",
    "evaluatedAt": "2024-01-23T10:00:00Z",
    "feedback": "Excellent work!"
  }
}
```

**Test Code:**
```python
def test_evaluate_submission(client, faculty_headers, assessment_id, submission_id):
    response = client.post(
        f"/api/v1/assessments/{assessment_id}/submissions/{submission_id}/evaluate",
        headers=faculty_headers
    )
    assert response.status_code == 200
```

---

### US-126: Get My Assignments

**Description:** Student gets their assigned assignments.

**Endpoint:** `GET /assignments/me`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Chapter 1 Homework",
      "subjectId": 1,
      "subjectName": "Mathematics",
      "dueDate": "2024-01-25T23:59:59Z",
      "totalMarks": 20,
      "status": "pending"
    }
  ]
}
```

**Test Code:**
```python
def test_get_my_assignments(client, student_headers):
    response = client.get("/api/v1/assignments/me", headers=student_headers)
    assert response.status_code == 200
```

---

### US-127: Submit Assignment

**Description:** Student submits an assignment.

**Endpoint:** `POST /assignments/me/{assignmentId}/submit`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "submissionText": "My answers to the homework...",
  "fileUrls": ["https://storage.example.com/assignment.pdf"]
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 20,
    "assignmentId": 1,
    "studentId": 1,
    "submittedAt": "2024-01-24T16:00:00Z",
    "status": "submitted"
  }
}
```

**Test Code:**
```python
def test_submit_assignment(client, student_headers, assignment_id):
    response = client.post(f"/api/v1/assignments/me/{assignment_id}/submit",
        headers=student_headers,
        json={"submissionText": "My homework answers"}
    )
    assert response.status_code == 201
```

---

## 14. Authority

---

### US-130: List Authority Assignments

**Description:** Admin lists all authority assignments.

**Endpoint:** `GET /api/v1/authority/assignments`

**Headers:** `Authorization: Bearer <token>`

**Roles:** administration

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 10,
      "userName": "Rajesh Kumar",
      "roles": ["Mathematics Teacher"],
      "roleTemplate": "Mathematics Teacher",
      "authorities": ["studentPromotion", "scheduleCreation"],
      "updatedBy": "Admin User",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Test Code:**
```python
def test_list_authority_assignments(client, admin_headers):
    response = client.get("/api/v1/authority/assignments", headers=admin_headers)
    assert response.status_code == 200
```

---

### US-131: Replace Authority Assignments

**Description:** Admin replaces all authority assignments.

**Endpoint:** `PUT /api/v1/authority/assignments`

**Headers:** `Authorization: Bearer <token>`

**Input:**
```json
[
  {
    "userId": "10",
    "roles": ["Mathematics Teacher"],
    "roleTemplate": "Mathematics Teacher",
    "authorities": ["studentPromotion", "scheduleCreation"]
  },
  {
    "userId": "11",
    "roles": ["Science Teacher"],
    "roleTemplate": "Science Teacher",
    "authorities": ["scheduleCreation"]
  }
]
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 10,
      "authorities": ["studentPromotion", "scheduleCreation"]
    },
    {
      "id": 2,
      "userId": 11,
      "authorities": ["scheduleCreation"]
    }
  ]
}
```

**Test Code:**
```python
def test_replace_authority_assignments(client, admin_headers):
    response = client.put("/api/v1/authority/assignments",
        headers=admin_headers,
        json=[
            {
                "userId": "10",
                "roles": ["Teacher"],
                "authorities": ["scheduleCreation"]
            }
        ]
    )
    assert response.status_code == 200
```

---

### US-132: List Authority Templates

**Description:** Returns available authority role templates.

**Endpoint:** `GET /api/v1/authority/templates`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "role": "Director",
      "authorities": ["leaveApproval", "admissionApproval", "staffCreation", "studentPromotion", "scheduleCreation"]
    },
    {
      "role": "Office Administrator",
      "authorities": ["leaveApproval", "admissionApproval", "staffCreation", "scheduleCreation", "procurementManagement"]
    },
    {
      "role": "Mathematics Teacher",
      "authorities": ["studentPromotion", "scheduleCreation"]
    }
  ]
}
```

**Test Code:**
```python
def test_list_authority_templates(client, admin_headers):
    response = client.get("/api/v1/authority/templates", headers=admin_headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert any(t["role"] == "Director" for t in data)
```

---



### US-133: User Registration

**Description:** Allows new users to create accounts in the system.

**Endpoint:** `POST /api/v1/auth/register`

**Input:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 15,
      "email": "newuser@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Email, password, firstName and lastName are required |
| 409 | EMAIL_EXISTS | Email already registered |
| 400 | INVALID_EMAIL | Invalid email format |

**Test Code:**
```python
def test_register_success(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "firstName": "John",
        "lastName": "Doe",
        "role": "student"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data["data"]["user"]["email"] == "newuser@example.com"

def test_register_email_exists(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "student0001.aarav@example.in",
        "password": "SecurePass123!",
        "firstName": "John",
        "lastName": "Doe"
    })
    assert response.status_code == 409
```

---

### US-134: Send OTP for Verification

**Description:** Sends a One-Time Password to user's email for account verification.

**Endpoint:** `POST /api/v1/auth/otp/send`

**Input:**
```json
{
  "email": "user@example.com",
  "purpose": "password_reset"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 404 | USER_NOT_FOUND | User not found |
| 429 | TOO_MANY_REQUESTS | Too many OTP requests. Try again later |

**Test Code:**
```python
def test_send_otp_success(client):
    response = client.post("/api/v1/auth/otp/send", json={
        "email": "student0001.aarav@example.in",
        "purpose": "password_reset"
    })
    assert response.status_code == 200

def test_send_otp_user_not_found(client):
    response = client.post("/api/v1/auth/otp/send", json={
        "email": "nonexistent@example.com",
        "purpose": "password_reset"
    })
    assert response.status_code == 404
```

---

### US-135: Verify OTP Code

**Description:** Verifies the OTP code sent to user's email.

**Endpoint:** `POST /api/v1/auth/otp/verify`

**Input:**
```json
{
  "email": "user@example.com",
  "purpose": "password_reset",
  "otp": "123456"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_OTP | Invalid or expired OTP |
| 404 | USER_NOT_FOUND | User not found |

**Test Code:**
```python
def test_verify_otp_success(client):
    response = client.post("/api/v1/auth/otp/verify", json={
        "email": "student0001.aarav@example.in",
        "purpose": "password_reset",
        "otp": "123456"
    })
    assert response.status_code == 200

def test_verify_otp_invalid(client):
    response = client.post("/api/v1/auth/otp/verify", json={
        "email": "student0001.aarav@example.in",
        "purpose": "password_reset",
        "otp": "000000"
    })
    assert response.status_code == 400
```

---

### US-136: Update User Profile

**Description:** Updates user profile information like name and phone.

**Endpoint:** `POST /api/v1/auth/profile/update`

**Input:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+1234567890"
  }
}
```

**Test Code:**
```python
def test_update_profile(client, auth_headers):
    response = client.post("/api/v1/auth/profile/update", headers=auth_headers, json={
        "firstName": "John",
        "lastName": "Smith"
    })
    assert response.status_code == 200
```

---

### US-137: Update Profile Picture

**Description:** Uploads and sets a new profile picture for the user.

**Endpoint:** `POST /api/v1/auth/profile/picture`

**Input:**
```json
{
  "profilePicture": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Profile picture updated"
}
```

**Test Code:**
```python
def test_update_profile_picture(client, auth_headers):
    response = client.post("/api/v1/auth/profile/picture", headers=auth_headers, json={
        "profilePicture": "data:image/jpeg;base64,test"
    })
    assert response.status_code == 200
```

---

### US-138: Change Password

**Description:** Changes user's password with current password verification.

**Endpoint:** `POST /api/v1/auth/profile/change-password`

**Input:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456",
  "confirmPassword": "newpass456"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | INVALID_PASSWORD | Current password is incorrect |
| 400 | VALIDATION_ERROR | Passwords do not match |

**Test Code:**
```python
def test_change_password_success(client, auth_headers):
    response = client.post("/api/v1/auth/profile/change-password", headers=auth_headers, json={
        "currentPassword": "student123",
        "newPassword": "newpass456",
        "confirmPassword": "newpass456"
    })
    assert response.status_code == 200

def test_change_password_incorrect_current(client, auth_headers):
    response = client.post("/api/v1/auth/profile/change-password", headers=auth_headers, json={
        "currentPassword": "wrongpass",
        "newPassword": "newpass456",
        "confirmPassword": "newpass456"
    })
    assert response.status_code == 401
```

---

### US-139: Request Password Reset

**Description:** Initiates password reset process by sending OTP to email.

**Endpoint:** `POST /api/v1/auth/password/reset-request`

**Input:**
```json
{
  "email": "user@example.com"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

**Test Code:**
```python
def test_password_reset_request(client):
    response = client.post("/api/v1/auth/password/reset-request", json={
        "email": "student0001.aarav@example.in"
    })
    assert response.status_code == 200
```

---

### US-140: Confirm Password Reset

**Description:** Completes password reset using OTP verification.

**Endpoint:** `POST /api/v1/auth/password/reset-confirm`

**Input:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpass456"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Test Code:**
```python
def test_password_reset_confirm(client):
    response = client.post("/api/v1/auth/password/reset-confirm", json={
        "email": "student0001.aarav@example.in",
        "otp": "123456",
        "newPassword": "newpass456"
    })
    assert response.status_code == 200
```

---

### US-141: Request Email Change

**Description:** Requests to change user's email address.

**Endpoint:** `POST /api/v1/auth/email/change-request`

**Input:**
```json
{
  "newEmail": "newemail@example.com"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Verification OTP sent to new email"
}
```

**Test Code:**
```python
def test_email_change_request(client, auth_headers):
    response = client.post("/api/v1/auth/email/change-request", headers=auth_headers, json={
        "newEmail": "newemail@example.com"
    })
    assert response.status_code == 200
```

---

### US-142: Confirm Email Change

**Description:** Confirms email change with OTP verification.

**Endpoint:** `POST /api/v1/auth/email/change-confirm`

**Input:**
```json
{
  "otp": "123456"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Email changed successfully"
}
```

**Test Code:**
```python
def test_email_change_confirm(client, auth_headers):
    response = client.post("/api/v1/auth/email/change-confirm", headers=auth_headers, json={
        "otp": "123456"
    })
    assert response.status_code == 200
```

---

## 15. Administration

---

### US-143: Get Admin Dashboard

**Description:** Retrieves dashboard statistics for administrators.

**Endpoint:** `GET /api/v1/administration/dashboard`

**Headers:** `Authorization: Bearer <token>`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "totalStaff": 25,
    "totalCourses": 10,
    "activeCourses": 8
  }
}
```

**Test Code:**
```python
def test_get_dashboard(client, admin_headers):
    response = client.get("/api/v1/administration/dashboard", headers=admin_headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert "totalStudents" in data
```

---

### US-144: List All Students (Admin)

**Description:** List all students with filtering and pagination (Admin view).

**Endpoint:** `GET /api/v1/administration/students`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20) |
| status | string | No | Filter by status |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "active"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```

**Test Code:**
```python
def test_list_students_admin(client, admin_headers):
    response = client.get("/api/v1/administration/students", headers=admin_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data["data"], list)
```

---

### US-145: Get Student Details (Admin)

**Description:** Retrieve detailed information for a specific student.

**Endpoint:** `GET /api/v1/administration/students/{student_id}`

**Parameters:**
- `student_id` (path, required): Student ID

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "class": "10A",
    "status": "active"
  }
}
```

**Test Code:**
```python
def test_get_student_details_admin(client, admin_headers):
    response = client.get("/api/v1/administration/students/1", headers=admin_headers)
    assert response.status_code == 200
```

---

### US-146: Create Student (Admin)

**Description:** Create a new student account via admin panel.

**Endpoint:** `POST /api/v1/administration/students`

**Input:**
```json
{
  "email": "newstudent@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "SecurePass123!"
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 151,
    "email": "newstudent@example.com",
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

**Test Code:**
```python
def test_create_student_admin(client, admin_headers):
    response = client.post("/api/v1/administration/students", headers=admin_headers, json={
        "email": "newstudent@example.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "password": "SecurePass123!"
    })
    assert response.status_code == 201
```

---

### US-147: Update Student Information (Admin)

**Description:** Update student information via admin panel.

**Endpoint:** `PUT /api/v1/administration/students/{student_id}`

**Input:**
```json
{
  "firstName": "Jane",
  "lastName": "Johnson"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "Jane",
    "lastName": "Johnson"
  }
}
```

**Test Code:**
```python
def test_update_student_admin(client, admin_headers):
    response = client.put("/api/v1/administration/students/1", headers=admin_headers, json={
        "firstName": "Jane",
        "lastName": "Johnson"
    })
    assert response.status_code == 200
```

---

### US-148: Update Student Status

**Description:** Change student account status (active, inactive, suspended).

**Endpoint:** `PATCH /api/v1/administration/students/{student_id}/status`

**Input:**
```json
{
  "status": "active"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Student status updated"
}
```

**Test Code:**
```python
def test_update_student_status(client, admin_headers):
    response = client.patch("/api/v1/administration/students/1/status", headers=admin_headers, json={
        "status": "active"
    })
    assert response.status_code == 200
```

---

### US-149: Delete Student

**Description:** Remove a student from the system.

**Endpoint:** `DELETE /api/v1/administration/students/{student_id}`

**Expected Output (204 No Content):**
```
No content
```

**Test Code:**
```python
def test_delete_student(client, admin_headers):
    response = client.delete("/api/v1/administration/students/1", headers=admin_headers)
    assert response.status_code == 204
```

---

### US-150: Approve Student Account

**Description:** Approve a pending student account for activation.

**Endpoint:** `POST /api/v1/administration/students/{student_id}/approve`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Student account approved"
}
```

**Test Code:**
```python
def test_approve_student(client, admin_headers):
    response = client.post("/api/v1/administration/students/1/approve", headers=admin_headers)
    assert response.status_code == 200
```

---

### US-151: Get Pending Approvals

**Description:** List students pending approval.

**Endpoint:** `GET /api/v1/administration/students/pending-approvals`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "email": "pending@example.com",
      "firstName": "Bob",
      "lastName": "Wilson"
    }
  ]
}
```

**Test Code:**
```python
def test_get_pending_approvals(client, admin_headers):
    response = client.get("/api/v1/administration/students/pending-approvals", headers=admin_headers)
    assert response.status_code == 200
```

---

### US-152: List Staff Members

**Description:** Retrieve list of all staff members.

**Endpoint:** `GET /api/v1/administration/staff`

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| page | integer | 1 |
| limit | integer | 20 |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "email": "faculty@example.com",
      "firstName": "Dr.",
      "lastName": "Smith",
      "role": "faculty"
    }
  ]
}
```

**Test Code:**
```python
def test_list_staff(client, admin_headers):
    response = client.get("/api/v1/administration/staff", headers=admin_headers)
    assert response.status_code == 200
```

---

### US-153: Create Staff Member

**Description:** Add a new staff member to the system.

**Endpoint:** `POST /api/v1/administration/staff`

**Input:**
```json
{
  "email": "newstaff@example.com",
  "firstName": "Mr.",
  "lastName": "Brown",
  "role": "faculty",
  "password": "SecurePass123!"
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 26,
    "email": "newstaff@example.com",
    "role": "faculty"
  }
}
```

**Test Code:**
```python
def test_create_staff(client, admin_headers):
    response = client.post("/api/v1/administration/staff", headers=admin_headers, json={
        "email": "newstaff@example.com",
        "firstName": "Mr.",
        "lastName": "Brown",
        "role": "faculty"
    })
    assert response.status_code == 201
```

---

### US-154: List Courses

**Description:** Retrieve list of all courses in the system.

**Endpoint:** `GET /api/v1/administration/courses`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Advanced Mathematics",
      "description": "Year 10 Mathematics"
    }
  ]
}
```

**Test Code:**
```python
def test_list_courses(client, admin_headers):
    response = client.get("/api/v1/administration/courses", headers=admin_headers)
    assert response.status_code == 200
```

---

### US-155: Create Course

**Description:** Create a new course in the system.

**Endpoint:** `POST /api/v1/administration/courses`

**Input:**
```json
{
  "name": "Physics Basics",
  "description": "Introduction to Physics"
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 11,
    "name": "Physics Basics"
  }
}
```

**Test Code:**
```python
def test_create_course(client, admin_headers):
    response = client.post("/api/v1/administration/courses", headers=admin_headers, json={
        "name": "Physics Basics",
        "description": "Introduction to Physics"
    })
    assert response.status_code == 201
```

---

### US-156: Get Promotion Rules

**Description:** Retrieve student promotion rules configuration.

**Endpoint:** `GET /api/v1/administration/promotions/rules`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "minimumPercentage": 40,
    "requirementType": "percentage"
  }
}
```

**Test Code:**
```python
def test_get_promotion_rules(client, admin_headers):
    response = client.get("/api/v1/administration/promotions/rules", headers=admin_headers)
    assert response.status_code == 200
```

---

### US-157: Set Promotion Rules

**Description:** Configure promotion rules for students.

**Endpoint:** `POST /api/v1/administration/promotions/rules`

**Input:**
```json
{
  "minimumPercentage": 40,
  "requirementType": "percentage"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Promotion rules updated"
}
```

**Test Code:**
```python
def test_set_promotion_rules(client, admin_headers):
    response = client.post("/api/v1/administration/promotions/rules", headers=admin_headers, json={
        "minimumPercentage": 40,
        "requirementType": "percentage"
    })
    assert response.status_code == 200
```

---

### US-158: Get AI Settings (Admin)

**Description:** Retrieve current AI system settings.

**Endpoint:** `GET /api/v1/administration/ai-settings`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "provider": "ollama",
    "mode": "local",
    "model": "llama3.2",
    "temperature": 0.2,
    "maxTokens": 1200
  }
}
```

**Test Code:**
```python
def test_get_ai_settings_admin(client, admin_headers):
    response = client.get("/api/v1/administration/ai-settings", headers=admin_headers)
    assert response.status_code == 200
```

---

### US-159: Update AI Settings (Admin)

**Description:** Update AI system configuration.

**Endpoint:** `PUT /api/v1/administration/ai-settings`

**Input:**
```json
{
  "provider": "openai",
  "mode": "api-key",
  "model": "gpt-4",
  "temperature": 0.3,
  "maxTokens": 2000,
  "apiKey": "sk-..."
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "AI settings updated"
}
```

**Test Code:**
```python
def test_update_ai_settings(client, admin_headers):
    response = client.put("/api/v1/administration/ai-settings", headers=admin_headers, json={
        "provider": "ollama",
        "temperature": 0.5
    })
    assert response.status_code == 200
```

---

### US-160: Get Assessment AI Settings

**Description:** Retrieve AI settings specific to assessments.

**Endpoint:** `GET /api/v1/assessments/ai/settings`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "provider": "ollama",
    "model": "llama3.2",
    "temperature": 0.2,
    "generationRateLimit": "15 per minute"
  }
}
```

**Test Code:**
```python
def test_get_assessment_ai_settings(client, auth_headers):
    response = client.get("/api/v1/assessments/ai/settings", headers=auth_headers)
    assert response.status_code == 200
```

---

### US-161: Modify Assessment Questions

**Description:** Request modifications to AI-generated assessment questions.

**Endpoint:** `POST /api/v1/assessments/ai/modify-questions`

**Input:**
```json
{
  "questionIds": [1, 2, 3],
  "instruction": "Make questions easier and more focused"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": 1,
        "text": "Modified question text"
      }
    ]
  }
}
```

**Test Code:**
```python
def test_modify_assessment_questions(client, auth_headers):
    response = client.post("/api/v1/assessments/ai/modify-questions", headers=auth_headers, json={
        "questionIds": [1, 2],
        "instruction": "Make easier"
    })
    assert response.status_code == 200
```

---

### US-162: Publish Assessment

**Description:** Publish an assessment to make it available to students.

**Endpoint:** `POST /api/v1/assessments/assessments/{assessment_id}/publish`

**Parameters:**
- `assessment_id` (path, required): Assessment ID

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Assessment published"
}
```

**Test Code:**
```python
def test_publish_assessment(client, auth_headers):
    response = client.post("/api/v1/assessments/assessments/1/publish", headers=auth_headers)
    assert response.status_code == 200
```

---

### US-163: Submit Assessment

**Description:** Student submits their assessment responses.

**Endpoint:** `POST /api/v1/assessments/assessments/{assessment_id}/submit`

**Input:**
```json
{
  "answers": [
    {
      "questionId": 1,
      "selectedAnswer": "A"
    },
    {
      "questionId": 2,
      "selectedAnswer": "C"
    }
  ]
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "message": "Assessment submitted successfully"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 404 | ASSESSMENT_NOT_FOUND | Assessment not found |
| 400 | ALREADY_SUBMITTED | Assessment already submitted |

**Test Code:**
```python
def test_submit_assessment(client, student_headers):
    response = client.post("/api/v1/assessments/assessments/1/submit", headers=student_headers, json={
        "answers": [
            {"questionId": 1, "selectedAnswer": "A"}
        ]
    })
    assert response.status_code == 200
```

---

### US-164: Get Faculty Subject Materials

**Description:** Retrieve teaching materials for a specific subject.

**Endpoint:** `GET /api/v1/faculty/subjects/{subject_id}/materials`

**Parameters:**
- `subject_id` (path, required): Subject ID

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Chapter 5 Notes",
      "type": "pdf",
      "url": "/materials/chapter5.pdf"
    }
  ]
}
```

**Test Code:**
```python
def test_get_subject_materials(client, faculty_headers):
    response = client.get("/api/v1/faculty/subjects/1/materials", headers=faculty_headers)
    assert response.status_code == 200
```

---

### US-165: Publish Subject Material

**Description:** Upload and publish teaching material for a subject.

**Endpoint:** `POST /api/v1/faculty/subjects/{subject_id}/materials`

**Input:**
```json
{
  "title": "Chapter 5: Equations",
  "type": "pdf",
  "documentId": 10
}
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "Chapter 5: Equations",
    "url": "/materials/chapter5.pdf"
  }
}
```

**Test Code:**
```python
def test_publish_material(client, faculty_headers):
    response = client.post("/api/v1/faculty/subjects/1/materials", headers=faculty_headers, json={
        "title": "Chapter 5: Equations",
        "type": "pdf"
    })
    assert response.status_code == 201
```

---

### US-166: Get Parent Child Dashboard

**Description:** Retrieve child's academic dashboard for parent view.

**Endpoint:** `GET /api/v1/parent/children/{child_id}/dashboard`

**Parameters:**
- `child_id` (path, required): Child ID

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "childName": "John Doe",
    "class": "10A",
    "attendance": 85,
    "averageMarks": 78,
    "nextClass": "2024-01-20"
  }
}
```

**Test Code:**
```python
def test_get_child_dashboard(client, parent_headers):
    response = client.get("/api/v1/parent/children/1/dashboard", headers=parent_headers)
    assert response.status_code == 200
```

---

### US-167: Get Child Fees Information

**Description:** Retrieve fee information and invoices for child.

**Endpoint:** `GET /api/v1/parent/students/{child_id}/fees`

**Parameters:**
- `child_id` (path, required): Child ID

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "invoiceId": "INV-001",
      "amount": 5000,
      "dueDate": "2024-01-31",
      "status": "pending"
    }
  ]
}
```

**Test Code:**
```python
def test_get_child_fees(client, parent_headers):
    response = client.get("/api/v1/parent/students/1/fees", headers=parent_headers)
    assert response.status_code == 200
```

---

### US-168: Download Invoice PDF

**Description:** Download fee invoice as PDF document.

**Endpoint:** `GET /api/v1/parent/fees/{invoice_id}/download`

**Parameters:**
- `invoice_id` (path, required): Invoice ID

**Expected Output (200 OK):**
```
Content-Type: application/pdf
[PDF file data]
```

**Test Code:**
```python
def test_download_invoice(client, parent_headers):
    response = client.get("/api/v1/parent/fees/INV-001/download", headers=parent_headers)
    assert response.status_code == 200
    assert response.content_type == "application/pdf"
```

---

### US-169: Get My Salary Slips

**Description:** Retrieve personal salary slips for staff members.

**Endpoint:** `GET /api/v1/payroll/me/salary-slips`

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "slipId": "10-2024-01",
      "month": "January 2024",
      "salary": 50000,
      "deductions": 5000,
      "netPayment": 45000
    }
  ]
}
```

**Test Code:**
```python
def test_get_my_salary_slips(client, faculty_headers):
    response = client.get("/api/v1/payroll/me/salary-slips", headers=faculty_headers)
    assert response.status_code == 200
```

---

### US-170: Upload Document

**Description:** Upload a document file (PDF, image, etc.).

**Endpoint:** `POST /api/v1/uploads/documents`

**Input (multipart/form-data):**
```
file: [binary file data]
documentType: pdf
```

**Expected Output (201 Created):**
```json
{
  "success": true,
  "data": {
    "documentId": 10,
    "fileName": "sample.pdf",
    "url": "/uploads/sample.pdf"
  }
}
```

**Test Code:**
```python
def test_upload_document(client, auth_headers):
    with open('test.pdf', 'rb') as f:
        response = client.post("/api/v1/uploads/documents", headers=auth_headers, 
            data={'file': f, 'documentType': 'pdf'})
    assert response.status_code == 201
```

---

### US-171: List Uploaded Documents

**Description:** Retrieve list of uploaded documents.

**Endpoint:** `GET /api/v1/uploads/documents`

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| page | integer | 1 |
| limit | integer | 20 |

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "documentId": 10,
      "fileName": "sample.pdf",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Test Code:**
```python
def test_list_documents(client, auth_headers):
    response = client.get("/api/v1/uploads/documents", headers=auth_headers)
    assert response.status_code == 200
```

---

### US-172: Get Class Sections

**Description:** Get all sections within a class.

**Endpoint:** `GET /api/v1/academics/classes/{class_id}/sections`

**Parameters:**
- `class_id` (path, required): Class ID

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "A",
      "studentCount": 45
    },
    {
      "id": 2,
      "name": "B",
      "studentCount": 42
    }
  ]
}
```

**Test Code:**
```python
def test_get_class_sections(client, auth_headers):
    response = client.get("/api/v1/academics/classes/1/sections", headers=auth_headers)
    assert response.status_code == 200
```

---

### US-173: Chat with AI About Subject Content

**Description:** Ask AI questions about subject material using RAG.

**Endpoint:** `POST /api/v1/students/me/subjects/{subject_id}/chat`

**Parameters:**
- `subject_id` (path, required): Subject ID

**Input:**
```json
{
  "question": "What is a quadratic equation?"
}
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "response": "A quadratic equation is a polynomial equation of degree 2...",
    "sources": [
      {
        "title": "Chapter 5",
        "page": 10
      }
    ]
  }
}
```

**Test Code:**
```python
def test_chat_ai_subject(client, student_headers):
    response = client.post("/api/v1/students/me/subjects/1/chat", headers=student_headers, json={
        "question": "What is a quadratic equation?"
    })
    assert response.status_code == 200
```

---

### US-174: Ingest Materials for RAG

**Description:** Upload and process materials for RAG document store.

**Endpoint:** `POST /api/v1/rag/ingest`

**Input (multipart/form-data):**
```
subject_id: 1
files: [file1.pdf, file2.pdf]
```

**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "processedFiles": 2,
    "chunks": 150,
    "message": "Materials ingested successfully"
  }
}
```

**Test Code:**
```python
def test_ingest_materials(client, faculty_headers):
    with open('material.pdf', 'rb') as f:
        response = client.post("/api/v1/rag/ingest", headers=faculty_headers,
            data={'subject_id': 1, 'files': f})
    assert response.status_code == 200
```

---
