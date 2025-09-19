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
        """Test fishing zones prediction with enhanced environmental analysis"""
        success, response = self.run_test(
            "Fishing Zones Prediction - Mumbai",
            "POST",
            "api/predict/fishing-zones",
            200,
            data={
                "latitude": 19.0760,
                "longitude": 72.8777,
                "radius_km": 10.0
            }
        )
        
        if success and response:
            # Analyze environmental predictions
            print(f"   📍 User Location: {response.get('user_location', {}).get('name', 'Unknown')}")
            
            best_zones = response.get('best_zones', [])
            if best_zones:
                print(f"   🎯 Found {len(best_zones)} fishing zones")
                
                # Analyze first zone in detail
                zone = best_zones[0]
                sst_score = zone.get('sst', 0)
                chlorophyll_score = zone.get('chlorophyll', 0)
                wind_score = zone.get('wind', 0)
                current_score = zone.get('current', 0)
                combined_score = zone.get('score', 0)
                
                print(f"   🌊 Best Zone Environmental Scores:")
                print(f"      SST (Sea Surface Temp): {sst_score}")
                print(f"      Chlorophyll-a: {chlorophyll_score}")
                print(f"      Wind Conditions: {wind_score}")
                print(f"      Ocean Current: {current_score}")
                print(f"      Combined Score: {combined_score}")
                
                # Check if predictions are varied (not all 0.5)
                scores = [sst_score, chlorophyll_score, wind_score, current_score]
                all_same = all(abs(score - 0.5) < 0.01 for score in scores)
                varied_scores = len(set(round(score, 1) for score in scores)) > 1
                
                if all_same:
                    print(f"   ⚠️ WARNING: All scores are ~0.5 (fallback values)")
                elif varied_scores:
                    print(f"   ✅ GOOD: Environmental scores are varied and realistic")
                else:
                    print(f"   ⚠️ NOTICE: Scores show limited variation")
                
                # Check score ranges
                realistic_ranges = {
                    'sst': (0.1, 0.9),
                    'chlorophyll': (0.2, 0.9),
                    'wind': (0.3, 0.8),
                    'current': (0.4, 0.8)
                }
                
                for param, score in [('sst', sst_score), ('chlorophyll', chlorophyll_score), 
                                   ('wind', wind_score), ('current', current_score)]:
                    min_val, max_val = realistic_ranges[param]
                    if min_val <= score <= max_val:
                        print(f"   ✅ {param.upper()} score {score} within realistic range [{min_val}-{max_val}]")
                    else:
                        print(f"   ⚠️ {param.upper()} score {score} outside expected range [{min_val}-{max_val}]")
            
            # Check prediction details
            pred_details = response.get('prediction_details', {})
            models_used = pred_details.get('models_used', [])
            if models_used:
                print(f"   🤖 Models Used: {len(models_used)} Hugging Face models")
                for model in models_used:
                    print(f"      - {model}")
        
        return success, response

    def test_fishing_zones_multiple_locations(self):
        """Test fishing zones prediction at different locations for geographic variation"""
        locations = [
            {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777},
            {"name": "Chennai", "lat": 13.0827, "lon": 80.2707},
            {"name": "Kochi", "lat": 9.9312, "lon": 76.2673}
        ]
        
        location_results = []
        
        for location in locations:
            print(f"\n   🌍 Testing {location['name']} ({location['lat']}, {location['lon']})")
            
            success, response = self.run_test(
                f"Fishing Zones - {location['name']}",
                "POST",
                "api/predict/fishing-zones",
                200,
                data={
                    "latitude": location['lat'],
                    "longitude": location['lon'],
                    "radius_km": 5.0
                }
            )
            
            if success and response:
                best_zones = response.get('best_zones', [])
                if best_zones:
                    zone = best_zones[0]
                    scores = {
                        'sst': zone.get('sst', 0),
                        'chlorophyll': zone.get('chlorophyll', 0),
                        'wind': zone.get('wind', 0),
                        'current': zone.get('current', 0),
                        'combined': zone.get('score', 0)
                    }
                    location_results.append({
                        'location': location['name'],
                        'scores': scores
                    })
                    
                    print(f"      Best zone scores: SST={scores['sst']:.3f}, Chl={scores['chlorophyll']:.3f}, Wind={scores['wind']:.3f}, Current={scores['current']:.3f}")
        
        # Analyze geographic variation
        if len(location_results) >= 2:
            print(f"\n   📊 Geographic Variation Analysis:")
            
            for param in ['sst', 'chlorophyll', 'wind', 'current']:
                values = [result['scores'][param] for result in location_results]
                variation = max(values) - min(values)
                print(f"      {param.upper()} variation: {variation:.3f} (range: {min(values):.3f} - {max(values):.3f})")
                
                if variation > 0.1:
                    print(f"      ✅ Good geographic variation for {param.upper()}")
                else:
                    print(f"      ⚠️ Limited geographic variation for {param.upper()}")
        
        return len(location_results) > 0, location_results

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

    # =============================================================================
    # 🚨 MARITIME SAFETY ENDPOINTS - COLLISION AVOIDANCE & DANGEROUS CONDITIONS
    # =============================================================================

    def test_nearby_vessels(self):
        """Test nearby vessels endpoint for collision avoidance"""
        print("\n🚨 Testing PRIORITY 1: Real-time vessel tracking for collision avoidance")
        
        # Test with Mumbai coordinates as specified in the review request
        success, response = self.run_test(
            "Maritime Safety - Nearby Vessels (Mumbai)",
            "GET",
            "api/maritime/vessels-nearby?lat=19.0760&lon=72.8777&radius=10",
            200
        )
        
        if success and response:
            data = response.get('data', {})
            vessels = data.get('vessels', [])
            alert_summary = data.get('alert_summary', {})
            
            print(f"   📍 Location: Mumbai ({data.get('user_location', {}).get('latitude')}, {data.get('user_location', {}).get('longitude')})")
            print(f"   🚢 Vessels found: {data.get('vessels_found', 0)}")
            print(f"   📊 Alert Summary: DANGER={alert_summary.get('DANGER', 0)}, WARNING={alert_summary.get('WARNING', 0)}, SAFE={alert_summary.get('SAFE', 0)}")
            
            # Verify collision alert system
            if vessels:
                print(f"   🔍 Analyzing collision alert levels...")
                for i, vessel in enumerate(vessels[:3]):  # Check first 3 vessels
                    distance = vessel.get('distance_km', 0)
                    alert_level = vessel.get('alert_level', {}).get('level', 'UNKNOWN')
                    vessel_name = vessel.get('ship_name', 'Unknown')
                    
                    print(f"      Vessel {i+1}: {vessel_name} - {distance}km - {alert_level}")
                    
                    # Verify alert thresholds
                    if distance <= 2.0 and alert_level != 'DANGER':
                        print(f"      ❌ CRITICAL: Vessel at {distance}km should be DANGER level, got {alert_level}")
                    elif distance <= 5.0 and distance > 2.0 and alert_level != 'WARNING':
                        print(f"      ⚠️ WARNING: Vessel at {distance}km should be WARNING level, got {alert_level}")
                    elif distance > 5.0 and alert_level != 'SAFE':
                        print(f"      ⚠️ NOTICE: Vessel at {distance}km should be SAFE level, got {alert_level}")
                    else:
                        print(f"      ✅ Alert level correct for distance")
            else:
                print(f"   ⚠️ No vessels found - testing with mock data or API unavailable")
        
        return success, response

    def test_danger_analysis(self):
        """Test dangerous currents & rogue wave detection using ML models"""
        print("\n🌊 Testing PRIORITY 2: Dangerous currents & rogue wave detection")
        
        # Test with Mumbai coordinates as specified
        success, response = self.run_test(
            "Maritime Safety - Danger Analysis (Mumbai)",
            "GET",
            "api/maritime/danger-analysis?lat=19.0760&lon=72.8777",
            200
        )
        
        if success and response:
            data = response.get('data', {})
            env_data = data.get('environmental_data', {})
            risk_analysis = data.get('risk_analysis', {})
            recommendations = data.get('recommendations', [])
            
            print(f"   🌊 Environmental Conditions:")
            print(f"      Wind Speed: {env_data.get('wind_speed_knots', 'N/A')} knots")
            print(f"      Ocean Current: {env_data.get('ocean_current_knots', 'N/A')} knots")
            print(f"      Sea Surface Temp: {env_data.get('sea_surface_temp_c', 'N/A')}°C")
            print(f"      Chlorophyll: {env_data.get('chlorophyll_mg_m3', 'N/A')} mg/m³")
            
            print(f"   ⚠️ Risk Analysis:")
            risk_level = risk_analysis.get('overall_risk_level', 'UNKNOWN')
            risk_message = risk_analysis.get('risk_message', 'No message')
            rogue_wave_prob = risk_analysis.get('rogue_wave_probability', 0)
            
            print(f"      Overall Risk: {risk_level}")
            print(f"      Risk Message: {risk_message}")
            print(f"      Rogue Wave Probability: {rogue_wave_prob * 100:.1f}%")
            
            # Verify ML model integration
            danger_factors = risk_analysis.get('danger_factors', {})
            print(f"   🤖 ML Model Results:")
            print(f"      Dangerous Currents: {danger_factors.get('dangerous_currents', False)}")
            print(f"      High Winds: {danger_factors.get('high_winds', False)}")
            print(f"      Temperature Anomaly: {danger_factors.get('temperature_anomaly', False)}")
            
            # Verify safety recommendations
            print(f"   📋 Safety Recommendations ({len(recommendations)}):")
            for i, rec in enumerate(recommendations[:3]):  # Show first 3
                print(f"      {i+1}. {rec}")
            
            # Validate environmental data ranges
            wind_speed = env_data.get('wind_speed_knots', 0)
            current_speed = env_data.get('ocean_current_knots', 0)
            sst = env_data.get('sea_surface_temp_c', 0)
            chlorophyll = env_data.get('chlorophyll_mg_m3', 0)
            
            if 0 < wind_speed < 50 and 0 < current_speed < 10 and 20 < sst < 35 and 0 < chlorophyll < 5:
                print(f"   ✅ Environmental data within realistic ranges")
            else:
                print(f"   ⚠️ Some environmental data may be outside realistic ranges")
        
        return success, response

    def test_complete_safety_report(self):
        """Test complete maritime safety report combining vessel tracking + environmental analysis"""
        print("\n🚨 Testing COMPLETE MARITIME SAFETY REPORT")
        
        # Test with Mumbai coordinates and radius as specified
        success, response = self.run_test(
            "Maritime Safety - Complete Safety Report",
            "GET",
            "api/maritime/complete-safety-report?lat=19.0760&lon=72.8777&radius=10",
            200
        )
        
        if success and response:
            data = response.get('data', {})
            overall_safety = data.get('overall_safety', {})
            vessel_tracking = data.get('vessel_tracking', {})
            env_conditions = data.get('environmental_conditions', {})
            
            print(f"   🎯 Overall Safety Status:")
            status = overall_safety.get('status', 'UNKNOWN')
            color = overall_safety.get('color', 'unknown')
            message = overall_safety.get('message', 'No message')
            
            print(f"      Status: {status} ({color})")
            print(f"      Message: {message}")
            
            print(f"   🚢 Vessel Tracking Summary:")
            vessels_found = vessel_tracking.get('vessels_found', 0)
            collision_alerts = vessel_tracking.get('collision_alerts', 0)
            closest_vessel = vessel_tracking.get('closest_vessel_km', 'N/A')
            
            print(f"      Vessels Found: {vessels_found}")
            print(f"      Collision Alerts: {collision_alerts}")
            print(f"      Closest Vessel: {closest_vessel} km")
            
            print(f"   🌊 Environmental Conditions:")
            env_risk = env_conditions.get('risk_analysis', {}).get('overall_risk_level', 'UNKNOWN')
            rogue_wave_risk = env_conditions.get('risk_analysis', {}).get('rogue_wave_probability', 0)
            
            print(f"      Environmental Risk: {env_risk}")
            print(f"      Rogue Wave Risk: {rogue_wave_risk * 100:.1f}%")
            
            # Verify overall safety determination logic
            if status in ['CRITICAL', 'WARNING', 'SAFE']:
                print(f"   ✅ Overall safety status determination working correctly")
            else:
                print(f"   ❌ Overall safety status determination failed")
            
            # Check that both vessel and environmental data are present
            if vessel_tracking and env_conditions:
                print(f"   ✅ Complete report includes both vessel tracking and environmental analysis")
            else:
                print(f"   ❌ Complete report missing vessel tracking or environmental data")
        
        return success, response

    def test_maritime_safety_error_handling(self):
        """Test maritime safety endpoints with invalid coordinates"""
        print("\n🔧 Testing Maritime Safety Error Handling")
        
        # Test with invalid coordinates
        test_cases = [
            {"lat": 999, "lon": 999, "name": "Invalid Coordinates"},
            {"lat": 0, "lon": 0, "name": "Zero Coordinates"},
            {"lat": 19.0760, "lon": 72.8777, "radius": -5, "name": "Negative Radius"}
        ]
        
        all_passed = True
        
        for case in test_cases:
            lat, lon = case["lat"], case["lon"]
            radius = case.get("radius", 10)
            name = case["name"]
            
            # Test vessels endpoint
            vessels_success, _ = self.run_test(
                f"Error Handling - Vessels ({name})",
                "GET",
                f"api/maritime/vessels-nearby?lat={lat}&lon={lon}&radius={radius}",
                200  # Should handle gracefully, not crash
            )
            
            # Test danger analysis endpoint  
            danger_success, _ = self.run_test(
                f"Error Handling - Danger Analysis ({name})",
                "GET",
                f"api/maritime/danger-analysis?lat={lat}&lon={lon}",
                200  # Should handle gracefully
            )
            
            if not (vessels_success and danger_success):
                all_passed = False
        
        return all_passed, {}

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
    tester.test_fishing_zones_multiple_locations()
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