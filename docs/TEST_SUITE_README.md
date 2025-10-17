# Integration Test Suite

Comprehensive automated test script for Adria Style Studio API and frontend.

## Features

Tests the following components:

### Public Endpoints
- Health check
- Get published articles
- Get article by slug
- Email subscription

### Authentication
- User registration
- User login (admin and regular users)
- Get current user
- Token-based authentication

### Admin Features
- Admin dashboard statistics
- List all users
- User management

### Frontend
- All pages load correctly
- API base configuration present on auth pages

## Running Tests

### Prerequisites

```bash
pip install requests
```

### Run All Tests

```bash
python3 test_app.py
```

### Expected Output

```
============================================================
ADRIA STYLE STUDIO - INTEGRATION TEST SUITE
============================================================
Backend: http://127.0.0.1:8000
Frontend: http://127.0.0.1:3000
============================================================

✅ Health Check
   Status: healthy

--- PUBLIC ENDPOINTS ---

✅ Get Published Articles
   Retrieved 3 articles

✅ Get Article by Slug
   Retrieved: Capsule Wardrobe Essentials

... (more tests)

============================================================
TEST SUMMARY
============================================================
Total Tests: 15
✅ Passed: 15
❌ Failed: 0
Pass Rate: 100.0%
============================================================
```

## Test Coverage

- **15 total test cases**
- **100% pass rate** (when both backend and frontend are running)

### What Each Test Does

| Test | Purpose |
|------|---------|
| Health Check | Verifies backend is running |
| Get Published Articles | Retrieves all published blog articles |
| Get Article by Slug | Retrieves a specific article |
| Email Subscription | Tests newsletter signup |
| User Registration | Creates a new user account |
| Get Current User | Retrieves authenticated user profile |
| Login (Admin) | Tests admin user login |
| Admin Stats | Retrieves dashboard statistics |
| Admin: List Users | Gets all registered users |
| Frontend Pages | Verifies all pages load correctly |

## Requirements

- Backend running on `http://127.0.0.1:8000`
- Frontend static server running on `http://127.0.0.1:3000`
- Python 3.7+
- `requests` library

## Troubleshooting

### "Connection refused" errors

Ensure both servers are running:

```bash
# Terminal 1 - Start FastAPI backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Start frontend static server
cd public && python3 -m http.server 3000 --bind 127.0.0.1
```

### Test failures

Check the test output for specific failures. Each failed test shows:
- Test name
- Error message
- HTTP status code (if applicable)

## Extending Tests

To add more tests, edit `test_app.py` and add new test functions following the pattern:

```python
def test_new_feature():
    """Test description"""
    try:
        # Your test code
        log_test("Test Name", "PASS", "Details")
    except Exception as e:
        log_test("Test Name", "FAIL", str(e))
```

Then call the function in `main()`.
