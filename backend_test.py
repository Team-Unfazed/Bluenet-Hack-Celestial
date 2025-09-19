import requests
import sys
import json
import time
from datetime import datetime

class BlueNetAPITester:
    def __init__(self, base_url="https://fishtech-platform.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.auth_token = None  # Store JWT token for authenticated requests

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add authorization header if auth is required
        if auth_required and self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if auth_required:
            print(f"   Auth: {'✓ Token provided' if self.auth_token else '✗ No token'}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test API health endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test(
            "Root Endpoint",
            "GET", 
            "api/",
            200
        )

    def test_chat_assistant(self):
        """Test AI Assistant chat endpoint"""
        return self.run_test(
            "AI Assistant Chat",
            "POST",
            "api/chat",
            200,
            data={
                "query": "What are the best fishing practices for Indian coastal waters?",
                "species": "pomfret",
                "port": "Mumbai"
            }
        )

    def test_fishing_zones_prediction(self):
        """Test fishing zones prediction"""
        return self.run_test(
            "Fishing Zones Prediction",
            "POST",
            "api/predict/fishing-zones",
            200,
            data={
                "latitude": 19.0760,
                "longitude": 72.8777,
                "radius_km": 10.0
            }
        )

    def test_mandi_recommendation(self):
        """Test mandi recommendation"""
        return self.run_test(
            "Mandi Recommendation",
            "POST",
            "api/mandi-recommendation",
            200,
            data={
                "port_name": "Mumbai",
                "fish_type": "pomfret",
                "fish_size": "medium"
            }
        )

    def test_journey_start(self):
        """Test journey start"""
        success, response = self.run_test(
            "Journey Start",
            "POST",
            "api/journey/start",
            200,
            data={
                "start_latitude": 19.0760,
                "start_longitude": 72.8777,
                "fuel_efficiency": 5.0,
                "vessel_name": "Test Vessel"
            }
        )
        return success, response.get('journey_id') if success else None

    def test_journey_update(self, journey_id):
        """Test journey update"""
        if not journey_id:
            print("❌ Skipping journey update - no journey_id")
            return False, {}
            
        return self.run_test(
            "Journey Update",
            "POST",
            "api/journey/update",
            200,
            data={
                "journey_id": journey_id,
                "latitude": 19.1000,
                "longitude": 72.9000
            }
        )

    def test_journey_status(self, journey_id):
        """Test journey status retrieval"""
        if not journey_id:
            print("❌ Skipping journey status - no journey_id")
            return False, {}
            
        return self.run_test(
            "Journey Status",
            "GET",
            f"api/journey/{journey_id}",
            200
        )

    def test_disaster_alerts(self):
        """Test disaster alerts"""
        return self.run_test(
            "Disaster Alerts",
            "GET",
            "api/disaster-alerts",
            200
        )

    # Authentication Tests
    def test_user_registration(self):
        """Test user registration endpoint"""
        test_user_data = {
            "full_name": "Test Fisher",
            "phone": "+91 9876543210",
            "email": "testfisher@example.com",
            "password": "testpassword123",
            "role": "fisherman"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            200,
            data=test_user_data
        )
        
        if success and response:
            # Store the token for subsequent tests
            self.auth_token = response.get('access_token')
            print(f"   ✓ JWT Token received: {self.auth_token[:20]}..." if self.auth_token else "   ✗ No token in response")
            
            # Verify response structure
            expected_keys = ['access_token', 'token_type', 'user']
            missing_keys = [key for key in expected_keys if key not in response]
            if missing_keys:
                print(f"   ⚠️ Missing response keys: {missing_keys}")
            
            # Verify user data
            user_data = response.get('user', {})
            if user_data:
                print(f"   ✓ User created: {user_data.get('full_name')} ({user_data.get('email')})")
                print(f"   ✓ User role: {user_data.get('role')}")
                print(f"   ✓ User ID: {user_data.get('id')}")
        
        return success, response

    def test_duplicate_registration(self):
        """Test duplicate email registration (should fail)"""
        duplicate_user_data = {
            "full_name": "Another Fisher",
            "phone": "+91 9876543211",
            "email": "testfisher@example.com",  # Same email as previous test
            "password": "anotherpassword123",
            "role": "fisherman"
        }
        
        return self.run_test(
            "Duplicate Email Registration",
            "POST",
            "api/auth/register",
            400,  # Should return 400 for duplicate email
            data=duplicate_user_data
        )

    def test_user_login_success(self):
        """Test successful user login"""
        login_data = {
            "email": "testfisher@example.com",
            "password": "testpassword123"
        }
        
        success, response = self.run_test(
            "User Login - Valid Credentials",
            "POST",
            "api/auth/login",
            200,
            data=login_data
        )
        
        if success and response:
            # Update token from login response
            self.auth_token = response.get('access_token')
            print(f"   ✓ Login JWT Token: {self.auth_token[:20]}..." if self.auth_token else "   ✗ No token in response")
            
            # Verify response structure
            expected_keys = ['access_token', 'token_type', 'user']
            missing_keys = [key for key in expected_keys if key not in response]
            if missing_keys:
                print(f"   ⚠️ Missing response keys: {missing_keys}")
        
        return success, response

    def test_user_login_invalid_email(self):
        """Test login with invalid email"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "testpassword123"
        }
        
        return self.run_test(
            "User Login - Invalid Email",
            "POST",
            "api/auth/login",
            401,  # Should return 401 for invalid credentials
            data=login_data
        )

    def test_user_login_wrong_password(self):
        """Test login with wrong password"""
        login_data = {
            "email": "testfisher@example.com",
            "password": "wrongpassword"
        }
        
        return self.run_test(
            "User Login - Wrong Password",
            "POST",
            "api/auth/login",
            401,  # Should return 401 for invalid credentials
            data=login_data
        )

    def test_get_current_user_with_token(self):
        """Test getting current user profile with valid token"""
        if not self.auth_token:
            print("❌ Skipping authenticated user profile test - no auth token available")
            return False, {}
        
        success, response = self.run_test(
            "Get Current User Profile - With Token",
            "GET",
            "api/auth/me",
            200,
            auth_required=True
        )
        
        if success and response:
            expected_keys = ['id', 'full_name', 'email', 'phone', 'role', 'created_at']
            missing_keys = [key for key in expected_keys if key not in response]
            if missing_keys:
                print(f"   ⚠️ Missing profile keys: {missing_keys}")
            else:
                print(f"   ✓ Profile complete: {response.get('full_name')} ({response.get('role')})")
        
        return success, response

    def test_get_current_user_without_token(self):
        """Test getting current user profile without token (should fail)"""
        # Temporarily clear token
        original_token = self.auth_token
        self.auth_token = None
        
        success, response = self.run_test(
            "Get Current User Profile - No Token",
            "GET",
            "api/auth/me",
            401,  # Should return 401 for missing token
            auth_required=True
        )
        
        # Restore token
        self.auth_token = original_token
        return success, response

    def test_get_current_user_invalid_token(self):
        """Test getting current user profile with invalid token"""
        # Temporarily set invalid token
        original_token = self.auth_token
        self.auth_token = "invalid.jwt.token"
        
        success, response = self.run_test(
            "Get Current User Profile - Invalid Token",
            "GET",
            "api/auth/me",
            401,  # Should return 401 for invalid token
            auth_required=True
        )
        
        # Restore token
        self.auth_token = original_token
        return success, response

def main():
    print("🌊 BlueNet Smart Fishing Assistant - API Testing")
    print("=" * 60)
    
    tester = BlueNetAPITester()
    
    # Test basic endpoints
    print("\n📡 Testing Basic Endpoints...")
    tester.test_root_endpoint()
    tester.test_health_check()
    
    # Test authentication endpoints (NEW)
    print("\n🔐 Testing Authentication System...")
    print("   Testing user registration flow...")
    tester.test_user_registration()
    tester.test_duplicate_registration()
    
    print("   Testing user login flow...")
    tester.test_user_login_success()
    tester.test_user_login_invalid_email()
    tester.test_user_login_wrong_password()
    
    print("   Testing protected routes...")
    tester.test_get_current_user_with_token()
    tester.test_get_current_user_without_token()
    tester.test_get_current_user_invalid_token()
    
    # Test core features
    print("\n🤖 Testing AI Assistant...")
    tester.test_chat_assistant()
    
    print("\n🎣 Testing Fishing Features...")
    tester.test_fishing_zones_prediction()
    tester.test_mandi_recommendation()
    
    print("\n🚢 Testing Journey Tracking...")
    journey_success, journey_id = tester.test_journey_start()
    if journey_success and journey_id:
        time.sleep(1)  # Brief pause
        tester.test_journey_update(journey_id)
        tester.test_journey_status(journey_id)
    
    print("\n⚠️ Testing Safety Features...")
    tester.test_disaster_alerts()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests ({len(tester.failed_tests)}):")
        for i, test in enumerate(tester.failed_tests, 1):
            print(f"{i}. {test['name']}")
            if 'error' in test:
                print(f"   Error: {test['error']}")
            else:
                print(f"   Expected: {test['expected']}, Got: {test['actual']}")
                print(f"   Response: {test['response']}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    # Enhanced reporting for authentication
    auth_tests = [test for test in tester.failed_tests if 'auth' in test['name'].lower() or 'login' in test['name'].lower() or 'registration' in test['name'].lower()]
    if auth_tests:
        print(f"\n🔐 Authentication Issues Found ({len(auth_tests)}):")
        for test in auth_tests:
            print(f"   • {test['name']}")
    
    if success_rate >= 80:
        print("✅ Backend API is functioning well!")
        return 0
    elif success_rate >= 50:
        print("⚠️ Backend API has some issues but core functionality works")
        return 0
    else:
        print("❌ Backend API has major issues - frontend testing may be limited")
        return 1

if __name__ == "__main__":
    sys.exit(main())