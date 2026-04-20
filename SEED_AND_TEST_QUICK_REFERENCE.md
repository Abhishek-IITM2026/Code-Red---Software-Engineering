# 🚀 Seed Data & Testing - Quick Reference

## Test Credentials (Seeded Data)

```python
# Admin Account
Email: admin@example.in
Password: admin123
Role: admin

# Director Account
Email: director@example.in
Password: admin123
Role: director

# First Student
Email: student0001.aarav@example.in
Password: student123
Role: student

# First Faculty Member
Email: faculty001.aarav@example.in
Password: faculty123
Role: faculty

# First Parent
Email: parent0001.aarav@example.in
Password: parent123
Role: parent

# First Staff Member
Email: staff001.vikram@example.in
Password: admin123
Role: admin
```

---

## Quick Commands

### Run All Tests
```bash
cd backend
pytest -v
```

### Run Specific Test File
```bash
pytest tests/functional/test_auth_endpoints.py -v
```

### Run Specific Test
```bash
pytest tests/functional/test_auth_endpoints.py::TestAuthLoginEndpoint::test_login_student_success -v
```

### Run with Coverage
```bash
pytest --cov=app --cov-report=html
```

### View Coverage Report
```bash
# After running with coverage
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

---

## Seed Data Counts

| Entity | Count | Start ID |
|--------|-------|----------|
| Students | 150 | student0001 |
| Faculty | 12 | faculty001 |
| Staff | 8 | staff001 |
| Parents | 150 | parent0001 |
| Admin | 1 | admin |
| Director | 1 | director |
| **Total** | **322** | - |

---

## Email Format

All emails follow this pattern:

```
{role}{index:padded}.{first_name}@example.in

Examples:
- student0001.aarav@example.in (student index: 0001)
- student0002.vivaan@example.in
- student0150.neha@example.in
- faculty001.aditya@example.in
- staff001.vikram@example.in
- parent0001.ananya@example.in
```

**Why this format?**
- ✅ Unique email per user (no duplicates)
- ✅ Human-readable (includes name)
- ✅ Scalable (index supports 0001-9999)

---

## Test File Structure

```
backend/tests/
├── conftest.py                          # Fixtures & seeding
├── functional/
│   ├── test_auth_endpoints.py          # 40+ auth tests
│   ├── test_students_endpoints.py      # 18+ student tests
│   └── test_attendance_marks_endpoints.py # 25+ mark/attendance tests
└── unit/
    ├── test_models.py                  # 25+ model tests
    └── test_business_logic.py          # 20+ logic tests
```

---

## Fixture Usage

### Get Auth Header (for API calls)
```python
def test_get_profile(client, student_auth_header):
    response = client.get(
        "/api/v1/students/profile",
        headers=student_auth_header
    )
    assert response.status_code == 200
```

### Get Seeded Student Data
```python
def test_student_data(app, seeded_student):
    assert seeded_student is not None
    assert seeded_student.roll_number.startswith("APX")
```

### Verify OTP
```python
def test_otp_flow(client, verify_otp):
    otp = verify_otp("admin@example.in", "password_change")
    # OTP already verified, can now use for API calls
```

---

## Common Assertions

```python
# Check status codes
assert response.status_code == 200
assert response.status_code == 401  # Unauthorized
assert response.status_code == 403  # Forbidden
assert response.status_code == 404  # Not found

# Check JSON response
data = response.get_json()
assert data["success"] == True
assert "token" in data

# Check list response
assert len(data["data"]) > 0
assert isinstance(data["data"], list)
```

---

## Debugging Tests

### Show Fixture Setup/Teardown
```bash
pytest -v --setup-show
```

### Show All Logs
```bash
pytest -v -s  # -s = capture output
```

### Stop on First Failure
```bash
pytest -x
```

### Run Until First N Failures
```bash
pytest --maxfail=3
```

### Run Only Failed Tests (from last run)
```bash
pytest --lf
```

---

## Data Validation

### Check Data Integrity
```python
from app.services.seed_validator import SeedDataValidator

# SQL integrity
sql_valid, sql_issues = SeedDataValidator.validate_sql_integrity()
if not sql_valid:
    print(f"Issues: {sql_issues}")

# MongoDB integrity
mongo_valid, mongo_issues = SeedDataValidator.validate_mongodb_integrity(app.document_store)

# Get seed summary
summary = SeedDataValidator.get_seed_summary()
print(f"Users: {summary['users']}")
print(f"Students: {summary['students']}")
```

---

## Demo Startup

### Start Flask Server with Seeding
```bash
cd backend
export AUTO_CREATE_TABLES=true
export SEED_ON_STARTUP=true
./start_flask_server.sh
```

### View Logs
```
✓ Database seeding completed: 150 students, 12 faculty, 8 staff
✓ Seed data validated: {'users': 322, 'students': 150, ...}
```

---

## Documentation References

| Document | Purpose |
|----------|---------|
| `SEED_DATA_STRATEGY.md` | Comprehensive seed strategy guide |
| `SEED_DATA_FIX_SUMMARY.md` | Implementation details |
| `BACKEND_TEST_CASES.md` | All 80+ test cases documented |
| `TEST_QUICK_REFERENCE.md` | Test commands and patterns |
| `backend/tests/conftest.py` | Test fixtures |

---

## Troubleshooting

### Tests Fail: "UNIQUE constraint failed: users.email"
- Cause: Email collision (outdated format or incomplete reset)
- Fix: Ensure seed file uses format `{role}{index:04d}.{name}`
- Fix: Run `seed_database(force=True)` to reset

### Tests Fail: "No route found"
- Cause: Endpoint path incorrect or not implemented
- Fix: Check endpoint path in API docs
- Fix: Use correct HTTP method (GET, POST, etc.)

### Tests Fail: "Unauthorized"
- Cause: Missing or invalid auth header
- Fix: Use fixture: `student_auth_header`, `admin_auth_header`, etc.
- Fix: Ensure `Authorization: Bearer {token}` header present

### Tests Fail: "Connection refused"
- Cause: Database not running or seeding failed
- Fix: Check database connection string
- Fix: Verify no syntax errors: `python3 -m py_compile app/seed/__init__.py`

---

## Best Practices

✅ **Always use fixtures** - Let conftest handle auth and data  
✅ **Test one thing** - Keep tests focused and simple  
✅ **Use descriptive names** - `test_login_student_success` not `test_1`  
✅ **Follow AAA pattern** - Arrange, Act, Assert  
✅ **Clean assertions** - One clear expectation per assertion  
✅ **Don't hardcode IDs** - Use seeded data fixtures  

---

## Performance

| Operation | Time |
|-----------|------|
| Full seed database | ~2-3 seconds |
| Reset + reseed | ~1.5 seconds |
| Integrity validation | ~0.1 seconds |
| Single test | ~0.05-0.5 seconds |
| Full test suite (80+ tests) | ~30-60 seconds |

---

## Summary

- ✅ **322 users** seeded automatically
- ✅ **No duplicate emails** (numeric index guaranteed)
- ✅ **SQL + NoSQL** both properly seeded
- ✅ **Automatic validation** on every test
- ✅ **Clean isolation** between tests

**Run tests:** `pytest -v`  
**View docs:** See `SEED_DATA_STRATEGY.md`  
**Get help:** Check this quick reference!

