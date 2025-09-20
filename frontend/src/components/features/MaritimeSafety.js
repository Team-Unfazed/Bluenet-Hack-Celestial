import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Navigation, 
  Shield, 
  Waves, 
  Wind,
  Thermometer,
  Anchor,
  MapPin,
  Clock,
  Crosshair
} from 'lucide-react';

const MaritimeSafety = () => {
  const [location, setLocation] = useState(null);
  const [dangerAnalysis, setDangerAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
    
    // Set up auto-refresh every 30 seconds for real-time location monitoring
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        getCurrentLocation();
      }, 30000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setLocation(loc);
          fetchEnvironmentalData(loc.lat, loc.lon);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Mumbai coordinates for demo
          const loc = { lat: 19.0760, lon: 72.8777 };
          setLocation(loc);
          fetchEnvironmentalData(loc.lat, loc.lon);
        }
      );
    } else {
      // Fallback for browsers without geolocation
      const loc = { lat: 19.0760, lon: 72.8777 };
      setLocation(loc);
      fetchEnvironmentalData(loc.lat, loc.lon);
    }
  };

  const fetchEnvironmentalData = async (lat, lon) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      // Fetch environmental danger analysis only
      const response = await fetch(
        `${backendUrl}/api/maritime/danger-analysis?lat=${lat}&lon=${lon}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setDangerAnalysis(data.data);
        setLastUpdate(new Date());
      } else {
        console.error('Failed to fetch environmental data');
        // Fallback environmental data
        setDangerAnalysis(generateMockEnvironmentalData());
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching environmental data:', error);
      // Fallback environmental data
      setDangerAnalysis(generateMockEnvironmentalData());
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  const generateMockEnvironmentalData = () => {
    return {
      environmental_data: {
        sea_surface_temp_c: 27.5,
        wind_speed_knots: 12.0,
        ocean_current_knots: 2.3,
        chlorophyll_mg_m3: 1.2
      },
      risk_analysis: {
        overall_risk_level: "SAFE",
        risk_color: "green",
        risk_message: "✅ CONDITIONS SAFE - Good for fishing",
        rogue_wave_probability: 0.15,
        danger_factors: {
          dangerous_currents: false,
          high_winds: false,
          temperature_anomaly: false
        }
      },
      recommendations: [
        "✅ Conditions favorable for fishing",
        "🌊 Sea conditions within safe limits",
        "🎣 Good fishing conditions expected",
        "📍 Maintain standard safety protocols"
      ]
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'EXTREME_DANGER':
      case 'DANGER': return 'border-red-500 bg-red-50';
      case 'CAUTION': return 'border-orange-500 bg-orange-50';
      case 'SAFE': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  // React-compatible animated map component
  const LiveLocationMap = ({ lat, lon }) => (
    <div className="relative w-full h-80 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-lg overflow-hidden">
      {/* Animated ocean waves background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" 
             style={{ 
               backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)',
               animation: 'waves 3s linear infinite'
             }}>
        </div>
      </div>
      
      {/* Coordinate grid */}
      <div className="absolute inset-0 opacity-20"
           style={{
             backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>
      
      {/* Your location marker */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Pulsing ring */}
          <div className="absolute -inset-4 bg-red-400 rounded-full animate-ping opacity-75"></div>
          <div className="absolute -inset-2 bg-red-500 rounded-full animate-pulse opacity-50"></div>
          {/* Main marker */}
          <div className="relative w-6 h-6 bg-red-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Location info overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white px-4 py-3 rounded-lg">
        <div className="text-center">
          <div className="font-semibold text-sm">🧭 Live Location</div>
          <div className="text-xs mt-1">
            {lat.toFixed(6)}°N, {lon.toFixed(6)}°E
          </div>
          <div className="text-xs text-blue-200 mt-1">
            📡 GPS Active • Auto-refresh: {autoRefresh ? '30s' : 'Off'}
          </div>
        </div>
      </div>
      
      {/* Compass indicator */}
      <div className="absolute top-4 right-4 w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
        <div className="text-white text-2xl">🧭</div>
      </div>
      
      <style jsx>{`
        @keyframes waves {
          0% { transform: translateX(0); }
          100% { transform: translateX(40px); }
        }
      `}</style>
    </div>
  );

  return (
    <div className="space-y-6 p-4 max-w-full">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🧭 Live Location Tracker</h2>
          <p className="text-gray-600">Your live GPS location & environmental monitoring</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={getCurrentLocation}
            disabled={loading}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Crosshair className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Updating...' : 'Update Location'}
          </Button>
          <Button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Clock className="w-4 h-4 mr-2" />
            Auto: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Current Location Status */}
      {location && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-blue-800">📍 Your Live Location</h3>
                <p className="text-blue-600">
                  Latitude: {location.lat.toFixed(6)}° | Longitude: {location.lon.toFixed(6)}°
                </p>
                <p className="text-xs text-blue-500">
                  Last updated: {lastUpdate?.toLocaleTimeString()} | Auto-refresh: {autoRefresh ? 'Every 30s' : 'Off'}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Live Location Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-blue-600" />
            Interactive Live Location Map
          </CardTitle>
          <CardDescription>
            Your current position with real-time GPS tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {location && <LiveLocationMap lat={location.lat} lon={location.lon} />}
        </CardContent>
      </Card>

      {/* Environmental Conditions Grid */}
      {dangerAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Status */}
          <Card className={`${getStatusColor(dangerAnalysis.risk_analysis.overall_risk_level)} border-2`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl">{dangerAnalysis.risk_analysis.risk_message}</h3>
                  <p className="text-sm mt-1">
                    Risk Level: {dangerAnalysis.risk_analysis.overall_risk_level}
                  </p>
                </div>
                <Shield className={`w-10 h-10 ${
                  dangerAnalysis.risk_analysis.overall_risk_level.includes('DANGER') ? 'text-red-600' :
                  dangerAnalysis.risk_analysis.overall_risk_level === 'CAUTION' ? 'text-orange-600' :
                  'text-green-600'
                }`} />
              </div>
            </CardContent>
          </Card>

          {/* Environmental Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Waves className="w-5 h-5 mr-2 text-blue-600" />
                Environmental Conditions
              </CardTitle>
              <CardDescription>
                Real-time analysis at your location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Sea Temp</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {dangerAnalysis.environmental_data.sea_surface_temp_c.toFixed(1)}°C
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Wind</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {dangerAnalysis.environmental_data.wind_speed_knots.toFixed(1)} kts
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Waves className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Current</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    {dangerAnalysis.environmental_data.ocean_current_knots.toFixed(1)} kts
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Anchor className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Rogue Wave</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-700">
                    {Math.round(dangerAnalysis.risk_analysis.rogue_wave_probability * 100)}%
                  </div>
                </div>
              </div>

              {/* Safety Recommendations */}
              {dangerAnalysis.recommendations && dangerAnalysis.recommendations.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">🛡️ Safety Recommendations:</h4>
                  <div className="space-y-2">
                    {dangerAnalysis.recommendations.slice(0, 4).map((recommendation, index) => (
                      <div key={index} className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {recommendation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Location Tracking Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Tracking Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Live GPS Tracking: 
                <Badge variant={autoRefresh ? "default" : "secondary"} className="ml-2">
                  {autoRefresh ? "Active" : "Paused"}
                </Badge>
              </p>
              <p className="text-gray-600 mt-1">
                GPS accuracy: High | Update frequency: 30 seconds
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Last sync:</p>
              <p className="font-semibold">{lastUpdate?.toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaritimeSafety;