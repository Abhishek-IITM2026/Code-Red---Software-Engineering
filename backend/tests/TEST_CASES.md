# Test Cases Documentation

## Overview
This document contains all test cases for the Flask backend API.

## Seed Data
The tests use the following seeded data:
- Student Email: `student0001.aarav@example.in` (password: `student123`)
- Faculty Email: `faculty001.aarav@example.in` (password: `faculty123`)
- Admin Email: `admin@example.in` (password: `admin123`)
- Parent Email: `parent0001.aarav@example.in` (password: `parent123`)
- Director Email: `director@example.in` (password: `admin123`)

---

## Auth Blueprint Tests

### Test: Login Success - Student
| Field | Value |
|-------|-------|
| **API** | POST /api/v1/auth/login |
| **Input** | `{"email": "student0001.aarav@example.in", "password": "student123"}` |
| **Expected Output** | `{"success": true, "token": "<jwt>", "user": {...}}` |
| **Actual Output** | Status 200, token received |
| **Result** | ✅ Success |

### Test: Login Invalid Email
| Field | Value |
|-------|-------|
| **API** | POST /api/v1/auth/login |
| **Input** | `{"email": "nonexistent@example.com", "password": "password123"}` |
| **Expected Output** | `{"error": "Invalid credentials"}` |
| **Actual Output** | Status 401 |
| **Result** | ✅ Success |

### Test: Get Current User
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/auth/me |
| **Input** | Authorization: Bearer <token> |
| **Expected Output** | `{"data": {"email": "...", ...}}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

---

## Students Blueprint Tests

### Test: List Students
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/students |
| **Input** | Authorization: Bearer <faculty_token> |
| **Expected Output** | `{"data": [...]}` |
| **Actual Output** | Status 200, array of students |
| **Result** | ✅ Success |

### Test: Get Student Profile
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/students/me |
| **Input** | Authorization: Bearer <student_token> |
| **Expected Output** | `{"data": {"id": 1, "rollNumber": "...", ...}}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

### Test: Get Student Subjects
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/students/me/subjects |
| **Input** | Authorization: Bearer <student_token> |
| **Expected Output** | `{"data": [...]}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

### Test: Get Student Performance
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/students/me/performance |
| **Input** | Authorization: Bearer <student_token> |
| **Expected Output** | `{"data": {...}}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

---

## Attendance Blueprint Tests

### Test: Get Attendance (Student)
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/attendance |
| **Input** | Authorization: Bearer <student_token> |
| **Expected Output** | `{"data": [...]}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

### Test: Get Attendance (Admin)
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/attendance |
| **Input** | Authorization: Bearer <admin_token> |
| **Expected Output** | `{"data": [...]}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

### Test: Attendance Stats
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/attendance/me/stats |
| **Input** | Authorization: Bearer <student_token> |
| **Expected Output** | `{"data": {"percentage": ...}}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

### Test: Create Attendance (Forbidden for Student)
| Field | Value |
|-------|-------|
| **API** | POST /api/v1/attendance |
| **Input** | Authorization: Bearer <student_token> |
| **Expected Output** | Status 403 Forbidden |
| **Actual Output** | Status 403 |
| **Result** | ✅ Success |

---

## Marks Blueprint Tests

### Test: List Marks (Student)
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/marks |
| **Input** | Authorization: Bearer <student_token> |
| **Expected Output** | `{"data": [...]}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

### Test: List Marks with Filter
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/marks?examType=Unit Test |
| **Input** | Authorization: Bearer <admin_token> |
| **Expected Output** | `{"data": [...]}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

---

## Faculty Blueprint Tests

### Test: List Faculty
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/faculty |
| **Input** | Authorization: Bearer <admin_token> |
| **Expected Output** | `{"data": [...]}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

### Test: Get Faculty Classes
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/faculty/classes |
| **Input** | Authorization: Bearer <faculty_token> |
| **Expected Output** | `{"data": [...]}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

### Test: Get Student Performance
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/faculty/performance/students |
| **Input** | Authorization: Bearer <faculty_token> |
| **Expected Output** | `{"data": [...{"name": "...", "overallGrade": "A"}]}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

---

## Inventory Blueprint Tests

### Test: List Inventory Items
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/inventory/items |
| **Input** | Authorization: Bearer <admin_token> |
| **Expected Output** | `{"data": [...]}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

### Test: Create Inventory Item
| Field | Value |
|-------|-------|
| **API** | POST /api/v1/inventory/items |
| **Input** | `{"name": "Test Item", "category": "Test", "quantity": 100, "available": 100, "unit": "pieces", "minStock": 10, "price": 50.00}` |
| **Expected Output** | `{"data": {"id": 1, "name": "Test Item"}}` |
| **Actual Output** | Status 201 |
| **Result** | ✅ Success |

### Test: Create Vendor
| Field | Value |
|-------|-------|
| **API** | POST /api/v1/inventory/vendors |
| **Input** | `{"name": "Test Vendor", "email": "vendor@test.com", "phone": "+919876543210"}` |
| **Expected Output** | `{"data": {"id": 1, "name": "Test Vendor"}}` |
| **Actual Output** | Status 201 |
| **Result** | ✅ Success |

---

## Leave Blueprint Tests

### Test: Create Leave Request (Student)
| Field | Value |
|-------|-------|
| **API** | POST /api/v1/leave/leave |
| **Input** | `{"fromDate": "2024-06-01", "toDate": "2024-06-03", "leaveType": "Sick Leave", "reason": "Medical"}` |
| **Expected Output** | `{"data": {"id": 1, "status": "Pending"}}` |
| **Actual Output** | Status 201 |
| **Result** | ✅ Success |

### Test: Create Leave - Invalid Date Range
| Field | Value |
|-------|-------|
| **API** | POST /api/v1/leave/leave |
| **Input** | `{"fromDate": "2024-06-10", "toDate": "2024-06-05", "leaveType": "Sick", "reason": "Test"}` |
| **Expected Output** | Status 400 |
| **Actual Output** | Status 400 |
| **Result** | ✅ Success |

### Test: Leave Stats (Admin)
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/leave/leave/stats |
| **Input** | Authorization: Bearer <admin_token> |
| **Expected Output** | `{"data": {"total": 0, "pending": 0, "approved": 0}}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

---

## Payroll Blueprint Tests

### Test: List Salary Slips
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/payroll/salary-slips |
| **Input** | Authorization: Bearer <admin_token> |
| **Expected Output** | `{"data": [...]}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

### Test: Save Account Details
| Field | Value |
|-------|-------|
| **API** | PUT /api/v1/payroll/me/account-details |
| **Input** | `{"accountHolderName": "Admin", "bankName": "SBI", "accountNumber": "123456", "ifscCode": "SBIN0001", "accountType": "Savings"}` |
| **Expected Output** | `{"data": {...}}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

---

## Notifications Blueprint Tests

### Test: Schedule Notification
| Field | Value |
|-------|-------|
| **API** | POST /api/v1/notifications/schedule |
| **Input** | `{"message": "Test", "recipientScope": "all"}` |
| **Expected Output** | `{"data": {"taskId": "..."}}` |
| **Actual Output** | Status 202 |
| **Result** | ✅ Success |

### Test: Send Email
| Field | Value |
|-------|-------|
| **API** | POST /api/v1/notifications/email/send |
| **Input** | `{"to": ["test@example.com"], "subject": "Test", "text": "Body"}` |
| **Expected Output** | `{"data": {"id": "..."}}` |
| **Actual Output** | Status 201 |
| **Result** | ✅ Success |

---

## Parent Blueprint Tests

### Test: List Children
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/parent/children |
| **Input** | Authorization: Bearer <parent_token> |
| **Expected Output** | `{"data": [...]}` |
| **Actual Output** | Status 200 |
| **Result** | ✅ Success |

---

## Error Handling Tests

### Test: 401 Unauthorized
| Field | Value |
|-------|-------|
| **API** | Any protected endpoint |
| **Input** | No Authorization header |
| **Expected Output** | `{"error": {"code": "AUTH_REQUIRED"}}` |
| **Actual Output** | Status 401 |
| **Result** | ✅ Success |

### Test: 403 Forbidden
| Field | Value |
|-------|-------|
| **API** | POST /api/v1/attendance (as student) |
| **Input** | Authorization: Bearer <student_token> |
| **Expected Output** | `{"error": {"code": "FORBIDDEN"}}` |
| **Actual Output** | Status 403 |
| **Result** | ✅ Success |

### Test: 404 Not Found
| Field | Value |
|-------|-------|
| **API** | GET /api/v1/students/99999 |
| **Input** | Authorization: Bearer <admin_token> |
| **Expected Output** | `{"error": {"code": "STUDENT_NOT_FOUND"}}` |
| **Actual Output** | Status 404 |
| **Result** | ✅ Success |

---

## Running Tests

```bash
# Run all tests
cd backend && python -m pytest tests/ -v

# Run unit tests only
python -m pytest tests/unit/ -v

# Run integration tests only
python -m pytest tests/integration/ -v

# Run specific test file
python -m pytest tests/integration/test_auth_endpoints.py -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html
```
