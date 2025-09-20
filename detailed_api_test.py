#!/usr/bin/env python3
"""
Detailed API Testing for BlueNet - Focus on API Key Integration
Testing the specific requirements from the user's review request
"""

import requests
import json
import time
from datetime import datetime

class DetailedAPITester:
    def __init__(self, base_url="https://bluenet-marine.preview.emergentagent.com"):
        self.base_url = base_url
        self.results = []
        
    def log_result(self, test_name, success, details):
        """Log test result with detailed information"""
        self.results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })
        
    def test_fish_forecasting_detailed(self):
        """Test Fish Forecasting API with Mumbai coordinates - Focus on HF integration"""
        print("\n🎣 DETAILED FISH FORECASTING TEST")
        print("=" * 50)
        
        url = f"{self.base_url}/api/predict/fishing-zones"
        data = {
            "latitude": 19.0760,
            "longitude": 72.8777,
            "radius_km": 10.0
        }
        
        print(f"Testing coordinates: Mumbai ({data['latitude']}, {data['longitude']})")
        print("Checking for real Hugging Face predictions vs fallback values...")
        
        try:
            start_time = time.time()
            response = requests.post(url, json=data, timeout=60)  # Longer timeout for HF API calls
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                print(f"✅ API Response: {response.status_code} (took {response_time:.2f}s)")
                print(f"📍 User Location: {result['user_location']}")
                
                # Analyze prediction details
                pred_details = result.get('prediction_details', {})
                print(f"🤖 Models Used: {pred_details.get('models_used', [])}")
                print(f"📊 Grid Size: {pred_details.get('grid_size', 'N/A')}")
                print(f"🔍 Analyzed Points: {pred_details.get('analyzed_points', 'N/A')}")
                
                # Examine best zones for real vs fallback predictions
                best_zones = result.get('best_zones', [])
                print(f"\n🏆 BEST ZONES ANALYSIS ({len(best_zones)} zones):")
                
                fallback_count = 0
                real_prediction_count = 0
                
                for i, zone in enumerate(best_zones, 1):
                    print(f"\nZone {i}: {zone.get('location_name', 'Unknown')}")
                    print(f"  📍 Coordinates: ({zone.get('lat')}, {zone.get('lon')})")
                    print(f"  🎯 Combined Score: {zone.get('score')}")
                    print(f"  🌡️ SST Score: {zone.get('sst')}")
                    print(f"  🌿 Chlorophyll Score: {zone.get('chlorophyll')}")
                    print(f"  💨 Wind Score: {zone.get('wind')}")
                    print(f"  🌊 Current Score: {zone.get('current')}")
                    print(f"  📏 Distance: {zone.get('distance_from_user')} km")
                    
                    # Check if this looks like fallback values (all 0.5)
                    scores = [zone.get('sst'), zone.get('chlorophyll'), zone.get('wind'), zone.get('current')]
                    if all(score == 0.5 for score in scores):
                        fallback_count += 1
                        print("  ⚠️ FALLBACK VALUES DETECTED (all scores = 0.5)")
                    else:
                        real_prediction_count += 1
                        print("  ✅ REAL PREDICTIONS (varied scores)")
                
                # Summary of HF integration
                print(f"\n📈 HUGGING FACE INTEGRATION ANALYSIS:")
                print(f"  Real Predictions: {real_prediction_count}/{len(best_zones)}")
                print(f"  Fallback Values: {fallback_count}/{len(best_zones)}")
                
                if fallback_count == len(best_zones):
                    print("  🔴 STATUS: All predictions are fallback values - HF API may have issues")
                    hf_status = "FALLBACK_ONLY"
                elif real_prediction_count > fallback_count:
                    print("  🟢 STATUS: Majority real predictions - HF API working well")
                    hf_status = "WORKING_WELL"
                else:
                    print("  🟡 STATUS: Mixed results - HF API partially working")
                    hf_status = "PARTIAL"
                
                self.log_result("Fish Forecasting - HF Integration", True, {
                    'hf_status': hf_status,
                    'real_predictions': real_prediction_count,
                    'fallback_predictions': fallback_count,
                    'total_zones': len(best_zones),
                    'response_time': response_time,
                    'models_used': pred_details.get('models_used', [])
                })
                
                return True, hf_status
                
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text}")
                self.log_result("Fish Forecasting - HF Integration", False, {
                    'error': f"HTTP {response.status_code}",
                    'response': response.text
                })
                return False, "ERROR"
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            self.log_result("Fish Forecasting - HF Integration", False, {
                'error': str(e)
            })
            return False, "EXCEPTION"
    
    def test_mandi_recommendation_detailed(self):
        """Test Mandi Recommendation with Mumbai/Pomfret - Focus on ML predictions"""
        print("\n🏪 DETAILED MANDI RECOMMENDATION TEST")
        print("=" * 50)
        
        url = f"{self.base_url}/api/mandi-recommendation"
        data = {
            "port_name": "mumbai",
            "fish_type": "pomfret",
            "fish_size": "medium"
        }
        
        print(f"Testing: {data['fish_type']} from {data['port_name']} port ({data['fish_size']} size)")
        
        try:
            start_time = time.time()
            response = requests.post(url, json=data, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                print(f"✅ API Response: {response.status_code} (took {response_time:.2f}s)")
                
                # Analyze best mandi recommendation
                best_mandi = result.get('best_mandi', {})
                print(f"\n🏆 BEST MANDI RECOMMENDATION:")
                print(f"  🏪 Mandi: {best_mandi.get('mandi', 'N/A')}")
                print(f"  📍 State: {best_mandi.get('state', 'N/A')}")
                print(f"  💰 Net Price: ₹{best_mandi.get('price_inr', 'N/A')}/kg")
                print(f"  📏 Distance: {best_mandi.get('distance_km', 'N/A')} km")
                print(f"  🏪 Mandi Price: ₹{best_mandi.get('mandi_price', 'N/A')}/kg")
                print(f"  🚚 Transport Cost: ₹{best_mandi.get('transport_cost', 'N/A')}/kg")
                
                # Check if we have multiple options
                all_options = best_mandi.get('all_options', [])
                print(f"\n📊 ALL OPTIONS ({len(all_options)} mandis):")
                for i, option in enumerate(all_options[:3], 1):  # Show top 3
                    print(f"  {i}. {option.get('mandi_name', 'N/A')} - ₹{option.get('predicted_net_price_inr_per_kg', 'N/A')}/kg")
                
                # Analysis summary
                analysis = result.get('analysis', '')
                print(f"\n📝 ANALYSIS: {analysis}")
                
                # Check for ML model usage indicators
                has_predictions = any('predicted' in str(option) for option in all_options)
                has_multiple_options = len(all_options) > 1
                has_realistic_prices = best_mandi.get('price_inr', 0) > 0
                
                ml_status = "WORKING" if has_predictions and has_realistic_prices else "BASIC"
                
                print(f"\n📈 ML MODEL ANALYSIS:")
                print(f"  Predictions Available: {'✅' if has_predictions else '❌'}")
                print(f"  Multiple Options: {'✅' if has_multiple_options else '❌'}")
                print(f"  Realistic Prices: {'✅' if has_realistic_prices else '❌'}")
                print(f"  Status: {ml_status}")
                
                self.log_result("Mandi Recommendation - ML Integration", True, {
                    'ml_status': ml_status,
                    'best_mandi': best_mandi.get('mandi', 'N/A'),
                    'net_price': best_mandi.get('price_inr', 0),
                    'options_count': len(all_options),
                    'response_time': response_time
                })
                
                return True, ml_status
                
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text}")
                self.log_result("Mandi Recommendation - ML Integration", False, {
                    'error': f"HTTP {response.status_code}",
                    'response': response.text
                })
                return False, "ERROR"
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            self.log_result("Mandi Recommendation - ML Integration", False, {
                'error': str(e)
            })
            return False, "EXCEPTION"
    
    def test_mapbox_integration(self):
        """Test Mapbox integration through location names in fishing zones"""
        print("\n🗺️ MAPBOX INTEGRATION TEST")
        print("=" * 50)
        
        # Test through fishing zones API which uses Mapbox for location names
        url = f"{self.base_url}/api/predict/fishing-zones"
        data = {
            "latitude": 19.0760,
            "longitude": 72.8777,
            "radius_km": 5.0
        }
        
        try:
            response = requests.post(url, json=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                
                # Check user location name (should use Mapbox)
                user_location = result.get('user_location', {})
                location_name = user_location.get('name', '')
                
                print(f"📍 User Location Name: '{location_name}'")
                
                # Check zone location names
                best_zones = result.get('best_zones', [])
                location_names = [zone.get('location_name', '') for zone in best_zones]
                
                print(f"🏆 Zone Location Names:")
                for i, name in enumerate(location_names, 1):
                    print(f"  {i}. '{name}'")
                
                # Analyze if we're getting real location names vs coordinates
                coordinate_pattern_count = sum(1 for name in [location_name] + location_names 
                                             if '°' in name and ('N' in name or 'E' in name))
                real_name_count = len([location_name] + location_names) - coordinate_pattern_count
                
                print(f"\n📊 MAPBOX ANALYSIS:")
                print(f"  Real Location Names: {real_name_count}")
                print(f"  Coordinate Fallbacks: {coordinate_pattern_count}")
                
                if real_name_count > coordinate_pattern_count:
                    mapbox_status = "WORKING"
                    print("  🟢 STATUS: Mapbox geocoding working well")
                elif real_name_count > 0:
                    mapbox_status = "PARTIAL"
                    print("  🟡 STATUS: Mapbox geocoding partially working")
                else:
                    mapbox_status = "FALLBACK"
                    print("  🔴 STATUS: Mapbox geocoding using fallback coordinates")
                
                self.log_result("Mapbox Integration", True, {
                    'mapbox_status': mapbox_status,
                    'real_names': real_name_count,
                    'coordinate_fallbacks': coordinate_pattern_count,
                    'user_location_name': location_name
                })
                
                return True, mapbox_status
                
            else:
                print(f"❌ API Error: {response.status_code}")
                self.log_result("Mapbox Integration", False, {
                    'error': f"HTTP {response.status_code}"
                })
                return False, "ERROR"
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            self.log_result("Mapbox Integration", False, {
                'error': str(e)
            })
            return False, "EXCEPTION"
    
    def test_authentication_quick_verify(self):
        """Quick verification of authentication system"""
        print("\n🔐 AUTHENTICATION QUICK VERIFICATION")
        print("=" * 50)
        
        # Test login with existing user
        login_url = f"{self.base_url}/api/auth/login"
        login_data = {
            "email": "testfisher@example.com",
            "password": "testpassword123"
        }
        
        try:
            response = requests.post(login_url, json=login_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                token = result.get('access_token')
                user = result.get('user', {})
                
                print(f"✅ Login Successful")
                print(f"  👤 User: {user.get('full_name', 'N/A')} ({user.get('role', 'N/A')})")
                print(f"  🎫 Token: {token[:20]}..." if token else "  ❌ No token received")
                
                # Test protected route
                if token:
                    me_url = f"{self.base_url}/api/auth/me"
                    headers = {'Authorization': f'Bearer {token}'}
                    me_response = requests.get(me_url, headers=headers, timeout=10)
                    
                    if me_response.status_code == 200:
                        print("  ✅ Protected route access successful")
                        auth_status = "WORKING"
                    else:
                        print(f"  ❌ Protected route failed: {me_response.status_code}")
                        auth_status = "PARTIAL"
                else:
                    auth_status = "TOKEN_ISSUE"
                
                self.log_result("Authentication System", True, {
                    'auth_status': auth_status,
                    'user_name': user.get('full_name', 'N/A'),
                    'token_received': bool(token)
                })
                
                return True, auth_status
                
            else:
                print(f"❌ Login Failed: {response.status_code}")
                print(f"Response: {response.text}")
                self.log_result("Authentication System", False, {
                    'error': f"HTTP {response.status_code}",
                    'response': response.text
                })
                return False, "ERROR"
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            self.log_result("Authentication System", False, {
                'error': str(e)
            })
            return False, "EXCEPTION"
    
    def generate_summary(self):
        """Generate comprehensive test summary"""
        print("\n" + "=" * 60)
        print("📋 COMPREHENSIVE TEST SUMMARY")
        print("=" * 60)
        
        successful_tests = [r for r in self.results if r['success']]
        failed_tests = [r for r in self.results if not r['success']]
        
        print(f"✅ Successful Tests: {len(successful_tests)}/{len(self.results)}")
        print(f"❌ Failed Tests: {len(failed_tests)}/{len(self.results)}")
        
        if successful_tests:
            print(f"\n🟢 WORKING FEATURES:")
            for result in successful_tests:
                details = result['details']
                if 'hf_status' in details:
                    print(f"  • Fish Forecasting: {details['hf_status']} ({details['real_predictions']}/{details['total_zones']} real predictions)")
                elif 'ml_status' in details:
                    print(f"  • Mandi Recommendation: {details['ml_status']} (₹{details['net_price']}/kg from {details['best_mandi']})")
                elif 'mapbox_status' in details:
                    print(f"  • Mapbox Integration: {details['mapbox_status']} ({details['real_names']} real location names)")
                elif 'auth_status' in details:
                    print(f"  • Authentication: {details['auth_status']} (User: {details['user_name']})")
        
        if failed_tests:
            print(f"\n🔴 ISSUES FOUND:")
            for result in failed_tests:
                print(f"  • {result['test']}: {result['details'].get('error', 'Unknown error')}")
        
        return len(successful_tests), len(self.results)

def main():
    print("🌊 BlueNet API - Detailed Integration Testing")
    print("Focus: API Keys, Hugging Face, Mapbox, ML Models")
    print("=" * 60)
    
    tester = DetailedAPITester()
    
    # Run priority tests as requested
    print("🎯 PRIORITY TESTS (as requested by user)")
    
    # 1. Fish Forecasting with HF integration
    fish_success, hf_status = tester.test_fish_forecasting_detailed()
    
    # 2. Mandi Recommendation with ML
    mandi_success, ml_status = tester.test_mandi_recommendation_detailed()
    
    # 3. Mapbox integration check
    mapbox_success, mapbox_status = tester.test_mapbox_integration()
    
    # 4. Authentication quick verify
    auth_success, auth_status = tester.test_authentication_quick_verify()
    
    # Generate final summary
    successful, total = tester.generate_summary()
    
    print(f"\n🎯 FINAL ASSESSMENT:")
    print(f"  Success Rate: {(successful/total)*100:.1f}%")
    print(f"  Hugging Face API: {hf_status}")
    print(f"  Mandi ML System: {ml_status}")
    print(f"  Mapbox Integration: {mapbox_status}")
    print(f"  Authentication: {auth_status}")
    
    return 0 if successful >= 3 else 1

if __name__ == "__main__":
    exit(main())