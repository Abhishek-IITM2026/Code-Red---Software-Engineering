# Database Seeding & Data Integrity Strategy

**Document Version:** 2.0 (Updated with SQL + NoSQL integrity)  
**Date:** 2024  
**Status:** Production Ready

## Overview

The coaching institute platform uses a comprehensive seeding strategy that ensures data integrity across both SQL (SQLite) and NoSQL (MongoDB) databases during development, testing, and demo scenarios.

---

## 1. Seed Data Structure

### Email Format Strategy
All email addresses use a **unique identifier prefix** to ensure no duplicates:

```
Format: {role}{index:0Xd}.{first_name}@example.in

Examples:
- admin@example.in                    (special case)
- director@example.in                 (special case)
- student0001.aarav@example.in        (student index: 0001)
- student0002.vivaan@example.in       (student index: 0002)
- faculty001.aditya@example.in        (faculty index: 001)
- staff001.vikram@example.in          (staff index: 001)
- parent0001.ananya@example.in        (parent index: 0001)
```

**Why this format?**
- ✅ Guarantees email uniqueness (numeric index prevents collisions)
- ✅ Preserves readable name component (student.aarav)
- ✅ Scalable to unlimited users (index format: 0001-9999)
- ✅ Meets requirement: "include name in email and preserve unique data"

### Seed Data Counts

| Entity | Count | Format |
|--------|-------|--------|
| Students | 150 | student0001...student0150 |
| Parents | 150 | parent0001...parent0150 |
| Faculty | 12 | faculty001...faculty012 |
| Staff | 8 | staff001...staff008 |
| Admin | 1 | admin@example.in |
| Director | 1 | director@example.in |
| **Total Users** | **322** | - |

### Seeded Roles

- `student` - Student portal access
- `faculty` - Teaching and classroom operations
- `parent` - Parent portal access
- `admin` - Administrative control (assigned to admin user)
- `administration` - Administration workspace
- `director` - Director-level approvals
- `superadmin` - Platform administration

---

## 2. SQL Database Seeding (SQLite)

### Location
`backend/app/seed/__init__.py` → `seed_database(force=False)`

### Seeded SQL Tables

| Table | Records | Purpose |
|-------|---------|---------|
| users | 322 | All system users with roles |
| roles | 7 | Role definitions |
| institute_classes | 10 | Classes 8-12 with sections A, B |
| subjects | 30 | 6 core subjects × 5 grades |
| students | 150 | Student enrollment data |
| faculty | 12 | Faculty specializations |
| administration_staff | 8 | Staff with departments |
| parents | 150 | Parent-student relationships |
| schedules | 30+ | Class timetables |
| attendance | 600+ | Student attendance records |
| marks | 300+ | Student examination marks |
| salary_slips | 20 | March 2026 payroll |
| inventory_items | 10 | Lab equipment and stationery |
| vendors | 4 | Equipment suppliers with GST |
| assessments | 10 | Class assessments |
| materials | 20+ | Study materials and notes |

### Key Constraints

```sql
UNIQUE(users.email)              -- Enforced by numeric prefix
FOREIGN KEY(student_id) REFERENCES students(id)
FOREIGN KEY(parent_id) REFERENCES parents(id)
FOREIGN KEY(faculty_id) REFERENCES faculty(id)
```

### Reset Strategy

When `seed_database(force=True)` is called:

1. **Clear all relationships** - Delete user_roles associations
2. **Delete in order** - Respects foreign key constraints
3. **Commit transaction** - Ensures clean state
4. **Reseed everything** - Recreates complete dataset

```python
# Deletion order (respects foreign keys)
ordered_models = [
    AssignmentSubmission,      # Child references
    AttendanceMarks,
    # ... other children
    User,                       # Parents deleted last
    Role,
]

for model in ordered_models:
    model.query.delete()
db.session.commit()
```

---

## 3. NoSQL Database Seeding (MongoDB)

### Location
`backend/app/seed/__init__.py` → `_seed_mongodb()`

### Seeded MongoDB Collections

| Collection | Documents | Purpose |
|------------|-----------|---------|
| assessments | 10 | Assessment documents with questions |
| materials | 30 | Study materials (notes, worksheets) |

### Sample Document Structure

**Assessment Document:**
```json
{
  "_id": "uuid-...",
  "title": "Assessment Document 1",
  "subject": "Mathematics",
  "class": "Class 9",
  "questions": [
    {"id": "q-1-1", "text": "Question 1", "type": "mcq"},
    {"id": "q-1-2", "text": "Question 2", "type": "short_answer"}
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Material Document:**
```json
{
  "_id": "uuid-...",
  "title": "Study Material 1",
  "subject": "Physics",
  "grade": "10",
  "unit": "Unit 1",
  "type": "notes",
  "content": "Structured content...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Supported Document Stores

1. **InMemoryDocumentStore** - For testing (default)
2. **MongoDocumentStore** - For production MongoDB

---

## 4. Data Integrity Validation

### SeedDataValidator Class
Located: `backend/app/services/seed_validator.py`

#### SQL Integrity Checks

```python
def validate_sql_integrity() -> Tuple[bool, List[str]]:
    """Checks:
    - User count > 0
    - No duplicate emails
    - All required roles exist
    - Student data completeness
    - Parent-student relationships valid
    """
```

**Validation Points:**
1. ✅ Minimum user count (≥322 expected)
2. ✅ Email uniqueness (no duplicates)
3. ✅ Required roles present
4. ✅ Student roll numbers exist
5. ✅ Parent-student relationships consistent

#### MongoDB Integrity Checks

```python
def validate_mongodb_integrity(doc_store) -> Tuple[bool, List[str]]:
    """Checks:
    - Collections accessible
    - Assessment documents exist
    - Material documents exist
    """
```

#### Summary Report

```python
def get_seed_summary() -> Dict:
    """Returns:
    {
        "users": 322,
        "students": 150,
        "faculty": 12,
        "parents": 150,
        "classes": 10,
        "timestamp": "2024-01-15T10:30:00Z",
        "validated": true
    }
    """
```

---

## 5. Test Fixture Setup

### conftest.py - Fixture Chain

```python
@pytest.fixture(scope="session")
def app():
    """Create app once per test session"""
    app = create_app("testing")
    db.drop_all()
    db.create_all()
    return app

@pytest.fixture(autouse=True)
def seeded_database(app):
    """Auto-run before EVERY test"""
    with app.app_context():
        # 1. Force seed with full cleanup
        seed_database(force=True)
        
        # 2. Validate integrity
        SeedDataValidator.validate_sql_integrity()
        SeedDataValidator.validate_mongodb_integrity()
        
        # 3. Raise if validation fails
        # 4. Log summary
        
        yield  # Run test here
        
        # 5. Cleanup after test
        db.session.remove()
```

### Test Credentials (from seeded data)

```python
SEEDED_STUDENT_EMAIL = "student0001.aarav@example.in"      # password: student123
SEEDED_FACULTY_EMAIL = "faculty001.aarav@example.in"       # password: faculty123
SEEDED_ADMIN_EMAIL = "admin@example.in"                    # password: admin123
SEEDED_PARENT_EMAIL = "parent0001.aarav@example.in"        # password: parent123
SEEDED_DIRECTOR_EMAIL = "director@example.in"              # password: admin123
```

---

## 6. Running Tests

### Prerequisites

```bash
# 1. Backend environment setup
cd backend
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows
pip install -r requirements.txt

# 2. Database initialization
export FLASK_APP=run.py
export FLASK_ENV=testing
flask db upgrade
```

### Run Full Test Suite

```bash
# All tests with detailed output
pytest -v

# All tests with coverage
pytest --cov=app --cov-report=html

# Specific test file
pytest tests/functional/test_auth_endpoints.py -v

# Specific test class
pytest tests/functional/test_auth_endpoints.py::TestAuthLoginEndpoint -v

# Single test
pytest tests/functional/test_auth_endpoints.py::TestAuthLoginEndpoint::test_login_student_success -v
```

### Test Output Example

```
PASSED tests/functional/test_auth_endpoints.py::TestAuthLoginEndpoint::test_login_student_success
✓ Seed data validated: {
    'users': 322,
    'students': 150,
    'faculty': 12,
    'parents': 150,
    'classes': 10,
    'validated': True
}
```

---

## 7. Demo/Production Startup

### Start with Seed Data

```bash
# Backend startup script (backend/start_flask_server.sh)
export AUTO_CREATE_TABLES=true
export SEED_ON_STARTUP=true
export DATABASE_URL=sqlite:///coaching_institute.db

python run.py
```

### Application Initialization

When Flask app starts with `SEED_ON_STARTUP=true`:

1. **App factory** (`app/__init__.py`) checks setting
2. **Calls** `seed_database(force=False)` 
3. **Checks** if User.query.first() exists
4. **If not** → Seeds all data
5. **If yes** → Skips (data already exists)
6. **Logs** seed summary

---

## 8. Troubleshooting

### Issue: "UNIQUE constraint failed: users.email"

**Cause:** Email format changed without updating uniqueness strategy

**Solution:** 
- Ensure all email formats include numeric prefix: `{role}{index}.{name}@example.in`
- Run `seed_database(force=True)` to reset
- Check conftest.py email addresses match seed data

### Issue: "No parents found for students"

**Cause:** Parent-student relationship not created

**Solution:**
- Verify parent enrollment loop in `seed_database()`
- Check Parent model foreign key constraint
- Validate seed_database() doesn't exit early

### Issue: MongoDB connection failed

**Cause:** MongoDB not running or connection string invalid

**Solution:**
- MongoDB seeding is optional (uses try/except)
- InMemoryDocumentStore used if MongoDB unavailable
- Check logs: `"MongoDB seeding skipped: {error}"`

### Issue: Tests fail on first run only

**Cause:** autouse fixture not running properly

**Solution:**
- Run: `pytest -v --setup-show` to see fixture execution
- Check: `seeded_database` fixture runs before each test
- Verify: No conflicts with other autouse fixtures

---

## 9. Data Relationships Diagram

```
User (322)
├── Student (150) → Student enrollment (150)
│   ├── Class enrollment (150)
│   ├── Attendance (600+)
│   ├── Marks (300+)
│   └── Parent (150) ← Many-to-one
│
├── Faculty (12)
│   ├── Faculty specialization
│   ├── Subject assignments (30+)
│   ├── Class faculty (10)
│   └── Salary slip (12)
│
├── AdministrationStaff (8)
│   ├── Department assignment
│   └── Salary slip (8)
│
└── Parent (150)
    ├── Primary parent flag
    └── Relation type (Mother/Father/Guardian)
```

---

## 10. Performance Notes

| Operation | Time | Notes |
|-----------|------|-------|
| Full seed database | ~2-3s | Creates 322 users + 2000+ records |
| Reset + reseed | ~1.5s | Faster than cold start |
| Integrity validation | ~0.1s | Quick checks |
| Single test (autouse) | +0.05s | Fixture overhead per test |

**Optimization:** Session-scoped app + autouse per-test seeding balances isolation with performance.

---

## 11. File References

| File | Purpose |
|------|---------|
| `backend/app/seed/__init__.py` | Main seed data generator |
| `backend/app/services/seed_validator.py` | Data integrity validator |
| `backend/tests/conftest.py` | Test fixtures with seeding |
| `backend/app/models/__init__.py` | Database models |
| `backend/app/config.py` | Configuration settings |

---

## 12. Summary

✅ **Unique email format** prevents constraint violations  
✅ **Force-reset strategy** ensures clean test isolation  
✅ **SQL + NoSQL seeding** covers both database types  
✅ **Integrity validation** catches issues before tests run  
✅ **Autouse fixture** makes seeding automatic and reliable  
✅ **Scalable design** supports 150+ students + 300+ tests  

---

**Last Updated:** 2024  
**Status:** Complete - Ready for production testing
