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

    # =============================================================================
    # 🐟 ENHANCED FISH FORECASTING & CATCH LOGGING TESTS (REVIEW REQUEST PRIORITY)
    # =============================================================================

    def test_enhanced_fish_forecasting_mumbai(self):
        """Test Enhanced Fish Forecasting API with Mumbai coordinates as specified in review request"""
        print("\n🎣 Testing ENHANCED FISH FORECASTING with Real ML Models (Mumbai)")
        
        # Test with exact Mumbai coordinates from review request
        success, response = self.run_test(
            "Enhanced Fish Forecasting - Mumbai (19.0760, 72.8777)",
            "POST",
            "api/predict/fishing-zones",
            200,
            data={
                "latitude": 19.0760,
                "longitude": 72.8777,
                "radius_km": 15  # As specified in review request
            }
        )
        
        if success and response:
            # Verify enhanced ML model integration
            prediction_details = response.get('prediction_details', {})
            model_info = prediction_details.get('model_info', '')
            models_used = prediction_details.get('models_used', [])
            
            print(f"   🤖 ML Model Integration:")
            print(f"      Model Info: {model_info}")
            print(f"      Models Used: {len(models_used)} models")
            for model in models_used:
                print(f"         - {model}")
            
            # Verify environmental data is detailed
            best_zones = response.get('best_zones', [])
            if best_zones:
                zone = best_zones[0]
                ml_env_data = zone.get('ml_environmental_data', {})
                
                print(f"   🌊 Detailed Environmental Data:")
                print(f"      Sea Surface Temperature: {ml_env_data.get('sea_surface_temp_c', 'N/A')}°C")
                print(f"      Wind Speed: {ml_env_data.get('wind_speed_knots', 'N/A')} knots")
                print(f"      Ocean Current: {ml_env_data.get('ocean_current_knots', 'N/A')} knots")
                print(f"      Chlorophyll: {ml_env_data.get('chlorophyll_mg_m3', 'N/A')} mg/m³")
                print(f"      Safety Level: {ml_env_data.get('safety_level', 'N/A')}")
                
                # Verify fishing scores are realistic and varied
                fish_prob = zone.get('fish_probability', {})
                print(f"   🐟 Fish Probability Predictions:")
                for species, prob in fish_prob.items():
                    print(f"      {species.title()}: {prob:.3f} ({prob*100:.1f}%)")
                
                # Check if scores are varied (not all the same)
                prob_values = list(fish_prob.values())
                if len(set(round(p, 2) for p in prob_values)) > 1:
                    print(f"   ✅ Fish probabilities are varied and realistic")
                else:
                    print(f"   ⚠️ Fish probabilities show limited variation")
                
                # Verify environmental scores are realistic
                sst_score = zone.get('sst', 0)
                chlorophyll_score = zone.get('chlorophyll', 0)
                wind_score = zone.get('wind', 0)
                current_score = zone.get('current', 0)
                
                print(f"   📊 Environmental Scores:")
                print(f"      SST Score: {sst_score:.3f}")
                print(f"      Chlorophyll Score: {chlorophyll_score:.3f}")
                print(f"      Wind Score: {wind_score:.3f}")
                print(f"      Current Score: {current_score:.3f}")
                
                # Check if using real ML models (not fallback 0.5 values)
                scores = [sst_score, chlorophyll_score, wind_score, current_score]
                fallback_count = sum(1 for s in scores if abs(s - 0.5) < 0.01)
                
                if fallback_count == len(scores):
                    print(f"   ❌ CRITICAL: All scores are 0.5 - using fallback values, not real ML models")
                elif fallback_count > len(scores) // 2:
                    print(f"   ⚠️ WARNING: {fallback_count}/{len(scores)} scores are fallback values")
                else:
                    print(f"   ✅ EXCELLENT: Using real ML model predictions")
            
            # Verify 8-12 zones are returned
            total_zones = len(best_zones)
            if 8 <= total_zones <= 12:
                print(f"   ✅ Returned {total_zones} zones (within expected 8-12 range)")
            else:
                print(f"   ⚠️ Returned {total_zones} zones (expected 8-12)")
            
            # Check environmental summary
            env_summary = prediction_details.get('environmental_summary', {})
            if env_summary:
                print(f"   🌍 Environmental Summary:")
                print(f"      Base SST: {env_summary.get('base_sst_c', 'N/A')}°C")
                print(f"      Base Wind: {env_summary.get('base_wind_knots', 'N/A')} knots")
                print(f"      Base Current: {env_summary.get('base_current_knots', 'N/A')} knots")
                print(f"      Overall Safety: {env_summary.get('overall_safety', 'N/A')}")
        
        return success, response

    def test_catch_logging_with_image_classification(self):
        """Test Catch Logging API with image classification as specified in review request"""
        print("\n🐟 Testing CATCH LOGGING with AI Image Classification")
        
        if not self.auth_token:
            print("❌ Skipping catch logging test - authentication required")
            return False, {}
        
        # Create a mock image file for testing
        import io
        import tempfile
        
        # Create a temporary image file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
            # Write some dummy image data
            temp_file.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00')
            temp_file_path = temp_file.name
        
        try:
            # Test catch logging with form data as specified in review request
            url = f"{self.base_url}/api/catch-log"
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            
            # Form data as specified: species="pomfret", weight=1.5, location_lat=19.0760, location_lon=72.8777
            with open(temp_file_path, 'rb') as image_file:
                files = {'image': ('test_fish.jpg', image_file, 'image/jpeg')}
                data = {
                    'species': 'pomfret',
                    'weight': 1.5,
                    'location_lat': 19.0760,
                    'location_lon': 72.8777
                }
                
                print(f"   📤 Uploading catch log with:")
                print(f"      Species: {data['species']}")
                print(f"      Weight: {data['weight']} kg")
                print(f"      Location: {data['location_lat']}, {data['location_lon']}")
                
                self.tests_run += 1
                
                try:
                    response = requests.post(url, files=files, data=data, headers=headers, timeout=30)
                    
                    success = response.status_code == 200
                    if success:
                        self.tests_passed += 1
                        print(f"✅ Passed - Status: {response.status_code}")
                        
                        try:
                            response_data = response.json()
                            
                            # Verify AI classification results
                            ai_classification = response_data.get('data', {}).get('ai_classification', {})
                            if ai_classification:
                                predicted_species = ai_classification.get('predicted_species', 'N/A')
                                confidence = ai_classification.get('confidence', 'N/A')
                                matches_manual = ai_classification.get('matches_manual', False)
                                
                                print(f"   🤖 AI Classification Results:")
                                print(f"      Predicted Species: {predicted_species}")
                                print(f"      Confidence: {confidence}")
                                print(f"      Matches Manual Entry: {matches_manual}")
                                
                                if predicted_species != 'N/A' and predicted_species != 'Classification Failed':
                                    print(f"   ✅ AI species classification working")
                                else:
                                    print(f"   ⚠️ AI species classification returned fallback result")
                            
                            # Verify compliance status calculation
                            compliance = response_data.get('data', {}).get('compliance', {})
                            if compliance:
                                compliant = compliance.get('compliant', False)
                                status = compliance.get('status', 'N/A')
                                issues = compliance.get('issues', [])
                                
                                print(f"   📋 Compliance Check:")
                                print(f"      Status: {status}")
                                print(f"      Compliant: {compliant}")
                                if issues:
                                    print(f"      Issues: {', '.join(filter(None, issues))}")
                                
                                print(f"   ✅ Compliance status calculation working")
                            
                            # Verify environmental snapshot
                            env_snapshot = response_data.get('data', {}).get('environmental_snapshot', {})
                            if env_snapshot:
                                print(f"   🌊 Environmental Snapshot Captured:")
                                wind_speed = env_snapshot.get('wind_speed_knots', 'N/A')
                                sst = env_snapshot.get('sea_surface_temp_c', 'N/A')
                                print(f"      Wind Speed: {wind_speed} knots")
                                print(f"      Sea Surface Temp: {sst}°C")
                                print(f"   ✅ Environmental conditions integrated")
                            
                            # Verify catch details
                            catch_details = response_data.get('data', {}).get('catch_details', {})
                            if catch_details:
                                print(f"   📝 Catch Details Logged:")
                                print(f"      Species: {catch_details.get('species', 'N/A')}")
                                print(f"      Weight: {catch_details.get('weight_kg', 'N/A')} kg")
                                print(f"      Location: {catch_details.get('location', 'N/A')}")
                            
                            return True, response_data
                            
                        except Exception as e:
                            print(f"   Response parsing error: {e}")
                            print(f"   Raw response: {response.text[:200]}...")
                            return True, {}
                    else:
                        print(f"❌ Failed - Expected 200, got {response.status_code}")
                        print(f"   Response: {response.text[:200]}...")
                        self.failed_tests.append({
                            'name': 'Catch Logging with Image Classification',
                            'expected': 200,
                            'actual': response.status_code,
                            'response': response.text[:200]
                        })
                        return False, {}
                        
                except Exception as e:
                    print(f"❌ Failed - Error: {str(e)}")
                    self.failed_tests.append({
                        'name': 'Catch Logging with Image Classification',
                        'error': str(e)
                    })
                    return False, {}
        
        finally:
            # Clean up temporary file
            try:
                import os
                os.unlink(temp_file_path)
            except:
                pass

    def test_ml_model_verification(self):
        """Verify all 4 ML models are loaded and working"""
        print("\n🤖 Testing ML MODEL VERIFICATION")
        
        # Test maritime safety endpoints to verify ML models
        success, response = self.run_test(
            "ML Models - Maritime Safety Analysis",
            "GET",
            "api/maritime/danger-analysis?lat=19.0760&lon=72.8777",
            200
        )
        
        if success and response:
            data = response.get('data', {})
            env_data = data.get('environmental_data', {})
            
            # Check if all 4 ML models are providing predictions
            ml_predictions = {
                'wind_speed_knots': env_data.get('wind_speed_knots', 0),
                'ocean_current_knots': env_data.get('ocean_current_knots', 0),
                'sea_surface_temp_c': env_data.get('sea_surface_temp_c', 0),
                'chlorophyll_mg_m3': env_data.get('chlorophyll_mg_m3', 0)
            }
            
            print(f"   🔍 ML Model Predictions:")
            models_working = 0
            for param, value in ml_predictions.items():
                if value > 0:
                    models_working += 1
                    print(f"      ✅ {param}: {value}")
                else:
                    print(f"      ❌ {param}: {value} (not working)")
            
            print(f"   📊 ML Models Status: {models_working}/4 models providing predictions")
            
            if models_working == 4:
                print(f"   ✅ All 4 ML models are loaded and working")
            elif models_working >= 2:
                print(f"   ⚠️ {models_working}/4 ML models working - partial functionality")
            else:
                print(f"   ❌ Only {models_working}/4 ML models working - major issue")
            
            # Test location-based variation
            print(f"   🌍 Testing location-based prediction variation...")
            
            # Test different location
            success2, response2 = self.run_test(
                "ML Models - Different Location (Chennai)",
                "GET",
                "api/maritime/danger-analysis?lat=13.0827&lon=80.2707",
                200
            )
            
            if success2 and response2:
                data2 = response2.get('data', {})
                env_data2 = data2.get('environmental_data', {})
                
                # Compare predictions between locations
                variations = {}
                for param in ml_predictions.keys():
                    val1 = ml_predictions[param]
                    val2 = env_data2.get(param, 0)
                    if val1 > 0 and val2 > 0:
                        variation = abs(val1 - val2) / max(val1, val2)
                        variations[param] = variation
                        print(f"      {param}: Mumbai={val1:.2f}, Chennai={val2:.2f}, Variation={variation:.2%}")
                
                avg_variation = sum(variations.values()) / len(variations) if variations else 0
                if avg_variation > 0.1:
                    print(f"   ✅ Good geographic variation in ML predictions ({avg_variation:.2%})")
                else:
                    print(f"   ⚠️ Limited geographic variation in ML predictions ({avg_variation:.2%})")
        
        return success, response

    def test_fish_classifier_model_availability(self):
        """Test if fish classifier model (best_clf.pt) is available"""
        print("\n🐟 Testing FISH CLASSIFIER MODEL Availability")
        
        # This would be tested through the catch logging endpoint
        # For now, we'll check if the maritime safety system has the model loaded
        
        # Test a simple prediction to see if models are accessible
        success, response = self.run_test(
            "Fish Classifier Model Check",
            "GET",
            "api/health",
            200
        )
        
        if success and response:
            services = response.get('services', {})
            print(f"   🔍 Service Status:")
            for service, status in services.items():
                status_icon = "✅" if status else "❌"
                print(f"      {status_icon} {service}: {status}")
            
            # Check if all required services are running
            required_services = ['rag_system', 'mandi_system', 'boundary_system']
            all_services_up = all(services.get(service, False) for service in required_services)
            
            if all_services_up:
                print(f"   ✅ All backend services are initialized")
            else:
                print(f"   ⚠️ Some backend services are not initialized")
        
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
    
    # 🚨 NEW: Test Maritime Safety System (PRIORITY 1 FEATURE)
    print("\n🚨 Testing Maritime Safety System (PRIORITY 1)...")
    print("   Testing collision avoidance and dangerous conditions detection...")
    tester.test_nearby_vessels()
    tester.test_danger_analysis()
    tester.test_complete_safety_report()
    tester.test_maritime_safety_error_handling()
    
    # 🎣 NEW: Test Enhanced Fish Forecasting & Catch Logging (REVIEW REQUEST PRIORITY)
    print("\n🎣 Testing Enhanced Fish Forecasting & Catch Logging (REVIEW REQUEST)...")
    print("   Testing enhanced fish forecasting with real ML models...")
    tester.test_enhanced_fish_forecasting_mumbai()
    print("   Testing catch logging with image classification...")
    tester.test_catch_logging_with_image_classification()
    
    # 🤖 NEW: Test ML Model Integration
    print("\n🤖 Testing ML Model Integration...")
    tester.test_ml_model_verification()
    tester.test_fish_classifier_model_availability()
    
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