import requests
import sys
import json
import time
from datetime import datetime

class BlueNetAPITester:
    def __init__(self, base_url="https://marine-assistant-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
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

def main():
    print("🌊 BlueNet Smart Fishing Assistant - API Testing")
    print("=" * 60)
    
    tester = BlueNetAPITester()
    
    # Test basic endpoints
    print("\n📡 Testing Basic Endpoints...")
    tester.test_root_endpoint()
    tester.test_health_check()
    
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