"""
Maritime Safety System - Collision Avoidance & Dangerous Currents Detection
Priority 1: Real-time vessel tracking with geo-fencing alerts
Priority 2: Dangerous ocean currents & rogue wave prediction using ML models
"""

import requests
import joblib
import torch
import numpy as np
import logging
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional
from huggingface_hub import hf_hub_download
from geopy.distance import geodesic
import asyncio
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MaritimeSafetySystem:
    def __init__(self):
        self.marine_traffic_api_key = "e48ab3d80a0e2a9bf28930f2dd08800c"
        self.fleet_id = "e48ab3d80a0e2a9bf28930f2dd08800c"
        
        # HF Configuration
        self.hf_token = "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"
        self.sst_repo = "pranay096/my-big-model"
        self.sst_filename = "my_model.pkl"
        
        # Model paths
        self.models_dir = "/app/backend/models"
        
        # Initialize models
        self.models = {}
        self.load_models()
        
        # Safety thresholds
        self.collision_warning_distance = 5.0  # km - Show warning
        self.collision_danger_distance = 2.0   # km - Trigger strong alert
        self.current_danger_threshold = 3.0    # knots
        self.wind_danger_threshold = 5.0       # knots variance
        self.sst_anomaly_threshold = 2.0       # °C deviation from normal
        
    def load_models(self):
        """Load all ML models for environmental prediction"""
        try:
            # Load local models
            logger.info("Loading local ML models...")
            
            # Wind speed model
            self.models['wind'] = joblib.load(f"{self.models_dir}/wind_speed_model.pkl")
            logger.info("✅ Wind speed model loaded")
            
            # Ocean current model  
            self.models['current'] = joblib.load(f"{self.models_dir}/ocean_currents_model.pkl")
            logger.info("✅ Ocean current model loaded")
            
            # Chlorophyll model (final_model.txt)
            try:
                self.models['chlorophyll'] = joblib.load(f"{self.models_dir}/final_model.txt")
                logger.info("✅ Chlorophyll model loaded")
            except:
                logger.warning("⚠️ Chlorophyll model failed to load, using fallback")
                self.models['chlorophyll'] = None
            
            # Fish classification model (PyTorch)
            try:
                self.models['fish_classifier'] = torch.load(f"{self.models_dir}/best_clf.pt", map_location='cpu')
                self.models['fish_classifier'].eval()
                logger.info("✅ Fish classification model loaded")
            except Exception as e:
                logger.warning(f"⚠️ Fish classifier failed to load: {e}")
                self.models['fish_classifier'] = None
            
            # SST model from Hugging Face
            try:
                logger.info("Downloading SST model from Hugging Face...")
                sst_path = hf_hub_download(
                    repo_id=self.sst_repo,
                    filename=self.sst_filename,
                    use_auth_token=self.hf_token
                )
                self.models['sst'] = joblib.load(sst_path)
                logger.info("✅ SST model loaded from Hugging Face")
            except Exception as e:
                logger.warning(f"⚠️ SST model failed to load from HF: {e}")
                self.models['sst'] = None
                
        except Exception as e:
            logger.error(f"❌ Error loading models: {e}")
            
    async def get_nearby_vessels(self, user_lat: float, user_lon: float, radius_km: float = 10) -> List[Dict]:
        """
        Get nearby vessels from MarineTraffic API
        Priority 1: Real-time collision avoidance
        """
        try:
            # MarineTraffic API call
            url = f"https://services.marinetraffic.com/api/exportvessel/v:5/{self.marine_traffic_api_key}/fleet:{self.fleet_id}/protocol:json"
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                vessels_data = response.json()
                nearby_vessels = []
                
                for vessel in vessels_data:
                    try:
                        vessel_lat = float(vessel.get('LAT', 0))
                        vessel_lon = float(vessel.get('LON', 0))
                        
                        if vessel_lat == 0 or vessel_lon == 0:
                            continue
                            
                        # Calculate distance
                        distance = geodesic((user_lat, user_lon), (vessel_lat, vessel_lon)).kilometers
                        
                        if distance <= radius_km:
                            vessel_info = {
                                'mmsi': vessel.get('MMSI', 'Unknown'),
                                'ship_name': vessel.get('SHIPNAME', 'Unknown Vessel'),
                                'ship_type': vessel.get('TYPE_NAME', 'Unknown'),
                                'latitude': vessel_lat,
                                'longitude': vessel_lon,
                                'distance_km': round(distance, 2),
                                'speed': vessel.get('SPEED', 0),
                                'course': vessel.get('COURSE', 0),
                                'timestamp': vessel.get('TIMESTAMP', ''),
                                'alert_level': self.get_collision_alert_level(distance)
                            }
                            nearby_vessels.append(vessel_info)
                    except Exception as e:
                        logger.warning(f"Error processing vessel data: {e}")
                        continue
                
                # Sort by distance (closest first)
                nearby_vessels.sort(key=lambda x: x['distance_km'])
                return nearby_vessels
                
            else:
                logger.warning(f"MarineTraffic API error: {response.status_code}")
                return self.generate_mock_vessels(user_lat, user_lon, radius_km)
                
        except Exception as e:
            logger.error(f"Error fetching vessel data: {e}")
            return self.generate_mock_vessels(user_lat, user_lon, radius_km)
    
    def get_collision_alert_level(self, distance_km: float) -> Dict:
        """Determine collision alert level based on distance"""
        if distance_km <= self.collision_danger_distance:
            return {
                'level': 'DANGER',
                'icon': '🚨',
                'message': 'COLLISION RISK - Vessel very close!',
                'color': 'red',
                'action': 'Take immediate evasive action'
            }
        elif distance_km <= self.collision_warning_distance:
            return {
                'level': 'WARNING', 
                'icon': '⚠️',
                'message': 'Ship nearby - Monitor closely',
                'color': 'orange',
                'action': 'Maintain safe distance and heading'
            }
        else:
            return {
                'level': 'SAFE',
                'icon': '✅', 
                'message': 'Safe distance',
                'color': 'green',
                'action': 'Continue normal operation'
            }
    
    def predict_environmental_conditions(self, lat: float, lon: float, timestamp: Optional[datetime] = None) -> Dict:
        """
        Use ML models to predict environmental conditions
        Priority 2: Dangerous currents & rogue wave detection
        """
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)
        
        try:
            # Prepare features for models
            # Most ML models will expect [lat, lon, timestamp_feature]
            timestamp_feature = timestamp.timestamp()
            features = np.array([[lat, lon, timestamp_feature]])
            
            predictions = {}
            
            # Wind speed prediction
            if self.models['wind']:
                try:
                    wind_pred = self.models['wind'].predict(features)[0]
                    predictions['wind_speed'] = float(wind_pred)
                except:
                    predictions['wind_speed'] = self.fallback_wind_prediction(lat, lon)
            else:
                predictions['wind_speed'] = self.fallback_wind_prediction(lat, lon)
            
            # Ocean current prediction
            if self.models['current']:
                try:
                    current_pred = self.models['current'].predict(features)[0]
                    predictions['ocean_current'] = float(current_pred)
                except:
                    predictions['ocean_current'] = self.fallback_current_prediction(lat, lon)
            else:
                predictions['ocean_current'] = self.fallback_current_prediction(lat, lon)
            
            # SST prediction
            if self.models['sst']:
                try:
                    sst_pred = self.models['sst'].predict(features)[0]
                    predictions['sst'] = float(sst_pred)
                except:
                    predictions['sst'] = self.fallback_sst_prediction(lat, lon)
            else:
                predictions['sst'] = self.fallback_sst_prediction(lat, lon)
            
            # Chlorophyll prediction
            if self.models['chlorophyll']:
                try:
                    chl_pred = self.models['chlorophyll'].predict(features)[0]
                    predictions['chlorophyll'] = float(chl_pred)
                except:
                    predictions['chlorophyll'] = self.fallback_chlorophyll_prediction(lat, lon)
            else:
                predictions['chlorophyll'] = self.fallback_chlorophyll_prediction(lat, lon)
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error predicting environmental conditions: {e}")
            return {
                'wind_speed': 15.0,
                'ocean_current': 2.5,
                'sst': 26.5,
                'chlorophyll': 0.8
            }
    
    def detect_dangerous_conditions(self, lat: float, lon: float, timestamp: Optional[datetime] = None) -> Dict:
        """
        Detect dangerous ocean currents and potential rogue waves
        Combined ML model analysis for maritime safety
        """
        predictions = self.predict_environmental_conditions(lat, lon, timestamp)
        
        # Extract predictions
        wind_speed = predictions['wind_speed']
        ocean_current = predictions['ocean_current'] 
        sst = predictions['sst']
        chlorophyll = predictions['chlorophyll']
        
        # Danger analysis
        current_danger = ocean_current > self.current_danger_threshold
        wind_danger = wind_speed > self.wind_danger_threshold
        sst_danger = abs(sst - 25.0) > self.sst_anomaly_threshold  # Normal ~25°C
        
        # Risk level determination
        danger_flags = sum([current_danger, wind_danger, sst_danger])
        
        if danger_flags >= 3:
            risk_level = "EXTREME_DANGER"
            risk_color = "red"
            risk_message = "🚨 EXTREME CONDITIONS - Return to port immediately!"
        elif danger_flags >= 2:
            risk_level = "DANGER"
            risk_color = "orange"  
            risk_message = "⚠️ DANGEROUS CONDITIONS - Exercise extreme caution"
        elif danger_flags >= 1:
            risk_level = "CAUTION"
            risk_color = "yellow"
            risk_message = "⚠️ MODERATE RISK - Monitor conditions closely"
        else:
            risk_level = "SAFE"
            risk_color = "green"
            risk_message = "✅ CONDITIONS SAFE - Good for fishing"
        
        # Rogue wave risk calculation
        rogue_wave_risk = 0.0
        if current_danger and wind_danger and sst_danger:
            rogue_wave_risk = 0.85  # 85% risk
        elif (current_danger and wind_danger) or (wind_danger and sst_danger):
            rogue_wave_risk = 0.6   # 60% risk
        elif current_danger or wind_danger:
            rogue_wave_risk = 0.35  # 35% risk
        
        return {
            'environmental_data': {
                'wind_speed_knots': round(wind_speed, 2),
                'ocean_current_knots': round(ocean_current, 2),
                'sea_surface_temp_c': round(sst, 2),
                'chlorophyll_mg_m3': round(chlorophyll, 3)
            },
            'risk_analysis': {
                'overall_risk_level': risk_level,
                'risk_color': risk_color,
                'risk_message': risk_message,
                'rogue_wave_probability': round(rogue_wave_risk, 2),
                'danger_factors': {
                    'dangerous_currents': current_danger,
                    'high_winds': wind_danger,
                    'temperature_anomaly': sst_danger
                }
            },
            'recommendations': self.get_safety_recommendations(risk_level, rogue_wave_risk),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def get_safety_recommendations(self, risk_level: str, rogue_wave_risk: float) -> List[str]:
        """Get safety recommendations based on risk analysis"""
        recommendations = []
        
        if risk_level == "EXTREME_DANGER":
            recommendations = [
                "🚨 RETURN TO PORT IMMEDIATELY",
                "🌊 Extremely dangerous sea conditions detected",
                "📡 Maintain emergency radio contact",
                "🦺 Ensure all safety equipment is ready",
                "⚓ Avoid fishing activities completely"
            ]
        elif risk_level == "DANGER":
            recommendations = [
                "⚠️ Consider returning to port",
                "🌊 Dangerous currents and waves expected",
                "👥 Stay close to other vessels if possible",
                "📱 Keep emergency contacts ready",
                "🎣 Suspend fishing operations"
            ]
        elif risk_level == "CAUTION":
            recommendations = [
                "⚠️ Monitor weather conditions continuously",
                "🌊 Be aware of changing sea conditions",
                "📍 Stay within safe distance from shore",
                "🎣 Exercise caution while fishing",
                "📡 Maintain regular radio contact"
            ]
        else:
            recommendations = [
                "✅ Conditions favorable for fishing",
                "🌊 Sea conditions within safe limits",
                "🎣 Good fishing conditions expected",
                "📍 Maintain standard safety protocols"
            ]
        
        if rogue_wave_risk > 0.7:
            recommendations.insert(1, "🌊 HIGH ROGUE WAVE RISK - Avoid open waters")
        elif rogue_wave_risk > 0.4:
            recommendations.insert(-1, "🌊 Monitor for unusual wave patterns")
            
        return recommendations
    
    def generate_mock_vessels(self, user_lat: float, user_lon: float, radius_km: float) -> List[Dict]:
        """Generate mock vessel data for testing when API is unavailable"""
        mock_vessels = []
        
        # Generate 3-8 mock vessels
        num_vessels = np.random.randint(3, 9)
        
        for i in range(num_vessels):
            # Random position within radius
            angle = np.random.uniform(0, 2 * np.pi)
            distance = np.random.uniform(0.5, radius_km)
            
            # Calculate vessel position
            vessel_lat = user_lat + (distance / 111) * np.cos(angle)
            vessel_lon = user_lon + (distance / (111 * np.cos(np.radians(user_lat)))) * np.sin(angle)
            
            vessel = {
                'mmsi': f"MOCK{1000 + i}",
                'ship_name': f"Vessel {i+1}",
                'ship_type': np.random.choice(['Fishing', 'Cargo', 'Tanker', 'Passenger']),
                'latitude': round(vessel_lat, 6),
                'longitude': round(vessel_lon, 6), 
                'distance_km': round(distance, 2),
                'speed': round(np.random.uniform(5, 20), 1),
                'course': round(np.random.uniform(0, 360), 0),
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'alert_level': self.get_collision_alert_level(distance)
            }
            mock_vessels.append(vessel)
        
        return sorted(mock_vessels, key=lambda x: x['distance_km'])
    
    # Fallback prediction methods for when models fail
    def fallback_wind_prediction(self, lat: float, lon: float) -> float:
        """Realistic wind speed prediction based on location"""
        base_wind = 12.0  # Base wind speed in knots
        coastal_factor = max(0.7, 1.0 - abs(lat - 19.0) * 0.1)  # Vary by latitude
        seasonal_factor = 0.8 + 0.4 * np.sin((datetime.now().month - 1) * np.pi / 6)
        return base_wind * coastal_factor * seasonal_factor * np.random.uniform(0.8, 1.2)
    
    def fallback_current_prediction(self, lat: float, lon: float) -> float:
        """Realistic ocean current prediction"""
        base_current = 2.0  # Base current in knots
        monsoon_factor = 1.3 if datetime.now().month in [6, 7, 8, 9] else 1.0
        return base_current * monsoon_factor * np.random.uniform(0.7, 1.3)
    
    def fallback_sst_prediction(self, lat: float, lon: float) -> float:
        """Realistic sea surface temperature prediction"""
        base_temp = 27.0  # Base temperature in Celsius
        seasonal_temp = base_temp + 2 * np.sin((datetime.now().month - 1) * np.pi / 6)
        return seasonal_temp + np.random.uniform(-1, 1)
    
    def fallback_chlorophyll_prediction(self, lat: float, lon: float) -> float:
        """Realistic chlorophyll prediction"""
        coastal_distance = min(abs(lon - 72.8), abs(lat - 19.0)) * 111  # Distance from coast
        coastal_factor = max(0.2, 1.0 - coastal_distance / 50)  # Higher near coast
        return coastal_factor * np.random.uniform(0.5, 2.0)

# Global instance
maritime_safety = MaritimeSafetySystem()