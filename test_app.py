#!/usr/bin/env python3
"""
Comprehensive integration test script for Adria Style Studio.
Tests all key API endpoints and user flows.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
API_BASE = "http://127.0.0.1:8000"
FRONTEND_BASE = "http://127.0.0.1:3000"
RESULTS = {"passed": 0, "failed": 0, "tests": []}

def log_test(name, status, details=""):
    """Log test result"""
    result = {
        "name": name,
        "status": status,
        "details": details,
        "timestamp": datetime.now().isoformat()
    }
    RESULTS["tests"].append(result)
    
    status_symbol = "✅" if status == "PASS" else "❌"
    print(f"\n{status_symbol} {name}")
    if details:
        print(f"   {details}")
    
    if status == "PASS":
        RESULTS["passed"] += 1
    else:
        RESULTS["failed"] += 1

def test_health():
    """Test health endpoint"""
    try:
        resp = requests.get(f"{API_BASE}/api/health")
        if resp.status_code == 200 and resp.json().get("status") == "healthy":
            log_test("Health Check", "PASS", f"Status: {resp.json()['status']}")
            return True
        else:
            log_test("Health Check", "FAIL", f"Status code: {resp.status_code}")
            return False
    except Exception as e:
        log_test("Health Check", "FAIL", str(e))
        return False

def test_register():
    """Test user registration"""
    try:
        email = f"test+{datetime.now().timestamp()}@example.com"
        payload = {
            "email": email,
            "password": "Test123456!",
            "firstName": "Test",
            "lastName": "User"
        }
        resp = requests.post(
            f"{API_BASE}/api/auth/register",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success") and data.get("user"):
                log_test(
                    "User Registration",
                    "PASS",
                    f"Registered: {email} (ID: {data['user']['id']})"
                )
                return email, data.get("token")
            else:
                log_test("User Registration", "FAIL", f"Response: {data}")
                return None, None
        else:
            log_test("User Registration", "FAIL", f"Status: {resp.status_code}, {resp.text}")
            return None, None
    except Exception as e:
        log_test("User Registration", "FAIL", str(e))
        return None, None

def test_login(email=None):
    """Test user login"""
    if not email:
        email = "admin@adriastyle.com"
        password = "Admin123!"
        is_admin = True
    else:
        password = "Test123456!"
        is_admin = False
    
    try:
        payload = {"email": email, "password": password}
        resp = requests.post(
            f"{API_BASE}/api/auth/login",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success") and data.get("token"):
                user_type = "Admin" if is_admin else "Regular"
                log_test(
                    f"Login ({user_type})",
                    "PASS",
                    f"Token received for {email}"
                )
                return data.get("token")
            else:
                log_test("Login", "FAIL", f"Response: {data}")
                return None
        else:
            log_test("Login", "FAIL", f"Status: {resp.status_code}")
            return None
    except Exception as e:
        log_test("Login", "FAIL", str(e))
        return None

def test_get_current_user(token):
    """Test get current user endpoint"""
    try:
        resp = requests.get(
            f"{API_BASE}/api/auth/me",
            cookies={"token": token}
        )
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("user"):
                log_test(
                    "Get Current User",
                    "PASS",
                    f"User: {data['user']['email']}"
                )
                return True
            else:
                log_test("Get Current User", "FAIL", f"No user in response")
                return False
        else:
            log_test("Get Current User", "FAIL", f"Status: {resp.status_code}")
            return False
    except Exception as e:
        log_test("Get Current User", "FAIL", str(e))
        return False

def test_get_articles():
    """Test get published articles endpoint"""
    try:
        resp = requests.get(f"{API_BASE}/api/blog/articles")
        
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                log_test(
                    "Get Published Articles",
                    "PASS",
                    f"Retrieved {len(data)} articles"
                )
                return len(data) > 0
            else:
                log_test("Get Published Articles", "FAIL", "Response is not a list")
                return False
        else:
            log_test("Get Published Articles", "FAIL", f"Status: {resp.status_code}")
            return False
    except Exception as e:
        log_test("Get Published Articles", "FAIL", str(e))
        return False

def test_get_article_by_slug():
    """Test get article by slug"""
    try:
        resp = requests.get(f"{API_BASE}/api/blog/articles/capsule-wardrobe")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("title"):
                log_test(
                    "Get Article by Slug",
                    "PASS",
                    f"Retrieved: {data['title']}"
                )
                return True
            else:
                log_test("Get Article by Slug", "FAIL", "No title in response")
                return False
        else:
            log_test("Get Article by Slug", "FAIL", f"Status: {resp.status_code}")
            return False
    except Exception as e:
        log_test("Get Article by Slug", "FAIL", str(e))
        return False

def test_subscribe_email():
    """Test email subscription"""
    try:
        email = f"subscriber+{datetime.now().timestamp()}@example.com"
        payload = {
            "email": email,
            "name": "Test Subscriber",
            "phone": "555-0123",
            "message": "Test subscription"
        }
        resp = requests.post(
            f"{API_BASE}/api/email/subscribe",
            json=payload
        )
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success"):
                log_test(
                    "Email Subscription",
                    "PASS",
                    f"Subscribed: {email}"
                )
                return True
            else:
                log_test("Email Subscription", "FAIL", f"Response: {data}")
                return False
        else:
            log_test("Email Subscription", "FAIL", f"Status: {resp.status_code}")
            return False
    except Exception as e:
        log_test("Email Subscription", "FAIL", str(e))
        return False

def test_admin_stats(token):
    """Test admin stats endpoint"""
    try:
        resp = requests.get(
            f"{API_BASE}/api/admin/stats",
            cookies={"token": token}
        )
        
        if resp.status_code == 200:
            data = resp.json()
            stats = f"Users: {data.get('totalUsers')}, Articles: {data.get('totalArticles')}, Subscribers: {data.get('totalSubscribers')}"
            log_test(
                "Admin Stats",
                "PASS",
                stats
            )
            return True
        else:
            log_test("Admin Stats", "FAIL", f"Status: {resp.status_code}")
            return False
    except Exception as e:
        log_test("Admin Stats", "FAIL", str(e))
        return False

def test_admin_users(token):
    """Test get all users endpoint"""
    try:
        resp = requests.get(
            f"{API_BASE}/api/admin/users",
            cookies={"token": token}
        )
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("users"):
                log_test(
                    "Admin: List Users",
                    "PASS",
                    f"Retrieved {len(data['users'])} users"
                )
                return True
            else:
                log_test("Admin: List Users", "FAIL", "No users in response")
                return False
        else:
            log_test("Admin: List Users", "FAIL", f"Status: {resp.status_code}")
            return False
    except Exception as e:
        log_test("Admin: List Users", "FAIL", str(e))
        return False

def test_frontend_pages():
    """Test that frontend pages load correctly"""
    pages = [
        ("/", "index.html"),
        ("/register.html", "register.html"),
        ("/login.html", "login.html"),
        ("/matcher.html", "matcher.html"),
        ("/blog.html", "blog.html")
    ]
    
    for path, name in pages:
        try:
            resp = requests.get(f"{FRONTEND_BASE}{path}")
            if resp.status_code == 200 and "<!DOCTYPE" in resp.text:
                # Check if API base config is set for auth pages
                if "auth" in name and "window.__API_BASE__" in resp.text:
                    log_test(f"Frontend: {name}", "PASS", "Page loads + API config present")
                elif "auth" not in name:
                    log_test(f"Frontend: {name}", "PASS", "Page loads")
                else:
                    log_test(f"Frontend: {name}", "FAIL", "API config missing")
            else:
                log_test(f"Frontend: {name}", "FAIL", f"Status: {resp.status_code}")
        except Exception as e:
            log_test(f"Frontend: {name}", "FAIL", str(e))

def print_summary():
    """Print test summary"""
    total = RESULTS["passed"] + RESULTS["failed"]
    print("\n" + "="*60)
    print(f"TEST SUMMARY")
    print("="*60)
    print(f"Total Tests: {total}")
    print(f"✅ Passed: {RESULTS['passed']}")
    print(f"❌ Failed: {RESULTS['failed']}")
    print(f"Pass Rate: {(RESULTS['passed']/total*100):.1f}%" if total > 0 else "N/A")
    print("="*60)
    
    if RESULTS["failed"] > 0:
        print("\nFailed Tests:")
        for test in RESULTS["tests"]:
            if test["status"] == "FAIL":
                print(f"  - {test['name']}: {test['details']}")
    
    return RESULTS["failed"] == 0

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("ADRIA STYLE STUDIO - INTEGRATION TEST SUITE")
    print("="*60)
    print(f"Backend: {API_BASE}")
    print(f"Frontend: {FRONTEND_BASE}")
    print("="*60)
    
    # Test health
    if not test_health():
        print("\n❌ Backend is not responding. Aborting tests.")
        sys.exit(1)
    
    # Test public endpoints
    print("\n--- PUBLIC ENDPOINTS ---")
    test_get_articles()
    test_get_article_by_slug()
    test_subscribe_email()
    
    # Test authentication flow
    print("\n--- AUTHENTICATION FLOW ---")
    new_email, new_token = test_register()
    if new_email and new_token:
        test_get_current_user(new_token)
    
    # Test login
    print("\n--- LOGIN TESTS ---")
    admin_token = test_login()
    if admin_token:
        test_get_current_user(admin_token)
    
    # Test admin endpoints
    if admin_token:
        print("\n--- ADMIN ENDPOINTS ---")
        test_admin_stats(admin_token)
        test_admin_users(admin_token)
    
    # Test frontend pages
    print("\n--- FRONTEND PAGES ---")
    test_frontend_pages()
    
    # Print summary
    success = print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
