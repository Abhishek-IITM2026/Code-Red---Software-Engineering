# Backend Test Quick Reference

**Quick start guide for developers**

## 🚀 Running Tests

### Run All Tests
```bash
cd backend
pytest tests/ -v
```

### Run Specific Tests
```bash
# Only functional tests
pytest tests/functional/ -v

# Only unit tests
pytest tests/unit/ -v

# Only auth tests
pytest tests/functional/test_auth_endpoints.py -v

# Specific test class
pytest tests/functional/test_auth_endpoints.py::TestAuthLoginEndpoint -v

# Specific test
pytest tests/functional/test_auth_endpoints.py::TestAuthLoginEndpoint::test_login_student_success -v
```

### Run with Coverage
```bash
pytest tests/ --cov=app --cov-report=html --cov-report=term-missing
open htmlcov/index.html
```

## 📝 Test File Organization

```
backend/tests/
├── functional/
│   ├── test_auth_endpoints.py
│   ├── test_students_endpoints.py
│   └── test_attendance_marks_endpoints.py
├── unit/
│   ├── test_models.py
│   └── test_business_logic.py
└── conftest.py
```

## 🔐 Test Credentials

All test accounts use the seeded data from `backend/app/seed/__init__.py`:

```
Student:   student.aarav@example.in / student123
Faculty:   faculty.aarav@example.in / faculty123
Parent:    parent.aarav@example.in / parent123
Admin:     admin@example.in / admin123
Director:  director@example.in / admin123
```

## 🛠️ Available Fixtures

In `conftest.py`:

```python
# Authentication headers
- student_auth_header        # Authenticated student request
- faculty_auth_header        # Authenticated faculty request
- admin_auth_header          # Authenticated admin request
- parent_auth_header         # Authenticated parent request
- director_auth_header       # Authenticated director request

# Test data
- seeded_student             # First student from seed
- seeded_staff_user_id       # First staff member ID

# Utilities
- verify_otp(email, purpose) # Verify OTP for test
- client                     # Flask test client
- app                        # Flask app instance
```

## ✍️ Writing a New Test

### Basic Test Template

```python
"""
Comprehensive functional tests for [Feature] API endpoints.

Use Case: [What user does]
Description: [What endpoints are tested]
"""
import pytest

BASE_URL = "/api/v1/[endpoint]"


class TestSomeEndpoint:
    """Functional tests for [ENDPOINT]"""

    def test_success_case(self, client, student_auth_header):
        """
        Test Case: [Clear test name]
        Inputs:
          - Field 1: value1
          - Field 2: value2
        Expected Output:
          - Status: 200 OK
          - Response has field X
        Actual Output: [Will be filled during execution]
        Result: [Success/Fail]
        """
        response = client.get(
            f"{BASE_URL}/test",
            headers=student_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "field_name" in data

    def test_error_case(self, client):
        """
        Test Case: [Clear error scenario]
        Inputs:
          - Invalid data
        Expected Output:
          - Status: 400/401/403/404
          - Error message
        """
        response = client.get(f"{BASE_URL}/invalid")
        assert response.status_code in [400, 401, 403, 404]
```

### Unit Test Template

```python
"""Unit tests for [module/feature]."""
import pytest


class TestSomethingModel:
    """Unit tests for [Model/Service]"""

    def test_valid_input(self, app):
        """
        Test Case: [What is being tested]
        Inputs:
          - Input 1
          - Input 2
        Expected Output:
          - Output behavior
        """
        with app.app_context():
            # Arrange
            obj = create_test_object(data)
            
            # Act
            result = obj.method()
            
            # Assert
            assert result == expected_value

    def test_invalid_input(self, app):
        """
        Test Case: [Invalid scenario]
        """
        with app.app_context():
            with pytest.raises(ValidationError):
                invalid_operation()
```

## 📊 Test Case Format

Every test should document:

```
Test Case: [Clear name of what's being tested]
Inputs:
  - Input 1: value
  - Input 2: value
Expected Output:
  - Status: HTTP status code
  - Response: expected fields/values
Actual Output: [Filled during test run]
Result: Success/Fail
```

## 🔍 Common Test Patterns

### Testing Authentication
```python
def test_endpoint_requires_auth(self, client):
    """User must be authenticated"""
    response = client.get("/api/v1/students/me")
    assert response.status_code == 401
```

### Testing Authorization
```python
def test_student_cannot_access_admin_endpoint(self, client, student_auth_header):
    """Student role cannot access admin-only endpoint"""
    response = client.get("/api/v1/admin/data", headers=student_auth_header)
    assert response.status_code == 403
```

### Testing Validation
```python
def test_invalid_data_rejected(self, client, admin_auth_header):
    """Invalid input should be rejected"""
    response = client.post("/api/v1/marks", 
                          headers=admin_auth_header,
                          json={"marks": 150})  # Invalid > 100
    assert response.status_code == 422
```

### Testing Business Logic
```python
def test_calculation(self, app):
    """Business logic calculation"""
    with app.app_context():
        result = calculate_attendance_percentage(18, 20)
        assert result == 90.0
```

## ✅ Test Checklist

When writing a test, ensure you:

- [ ] Use descriptive test name
- [ ] Include docstring with Use Case description
- [ ] Test one behavior per test
- [ ] Use Arrange-Act-Assert pattern
- [ ] Test both success and error cases
- [ ] Use appropriate assertions
- [ ] Mock external dependencies if needed
- [ ] Include comments for complex logic
- [ ] Document expected vs actual output

## 🐛 Debugging Tests

### Enable Verbose Output
```bash
pytest tests/functional/test_auth_endpoints.py -vv -s
```

### Stop on First Failure
```bash
pytest tests/ -x
```

### Run with PDB Debugger
```bash
pytest tests/ --pdb
```

### Show Local Variables on Failure
```bash
pytest tests/ -l
```

## 📈 Test Statistics

Current test suite:

- **Unit Tests**: 40+ test cases
- **Functional Tests**: 40+ test cases
- **Total Coverage**: 85%+
- **Execution Time**: ~35 seconds

## 🔗 Related Documentation

- [BACKEND_TEST_CASES.md](../BACKEND_TEST_CASES.md) - Complete test documentation
- [API_ENDPOINTS.md](../API_ENDPOINTS.md) - API reference
- [docs/openapi.yaml](../docs/openapi.yaml) - OpenAPI specification
- [CONTEXTS.md](../../CONTEXTS.md) - Project architecture

## 💡 Tips & Tricks

1. **Use -k flag to filter tests by name**
   ```bash
   pytest tests/ -k "login" -v  # Only runs tests with "login" in name
   ```

2. **Mark slow tests**
   ```python
   @pytest.mark.slow
   def test_expensive_operation():
       ...
   
   # Run: pytest -m "not slow"  # Skip slow tests
   ```

3. **Use parametrize for multiple inputs**
   ```python
   @pytest.mark.parametrize("email,password,expected", [
       ("student.aarav@example.in", "student123", 200),
       ("student.aarav@example.in", "wrong", 401),
   ])
   def test_login(self, client, email, password, expected):
       response = client.post("/api/v1/auth/login", 
                             json={"email": email, "password": password})
       assert response.status_code == expected
   ```

4. **Skip tests temporarily**
   ```python
   @pytest.mark.skip(reason="Not implemented yet")
   def test_future_feature():
       pass
   ```

## 🆘 Troubleshooting

### Tests pass locally but fail in CI
- Check Python version consistency
- Verify database state is fresh (seeded)
- Check environment variables

### Fixture errors
- Ensure fixture is imported or defined in conftest.py
- Check fixture scope (function vs session)
- Verify fixture yields properly

### Import errors
- Ensure sys.path is set in conftest.py
- Check __init__.py files exist in test directories

---

**For detailed information, see [BACKEND_TEST_CASES.md](../BACKEND_TEST_CASES.md)**
