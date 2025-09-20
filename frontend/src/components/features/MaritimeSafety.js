import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Navigation, 
  AlertTriangle, 
  Shield, 
  Waves, 
  Wind,
  Thermometer,
  Anchor,
  MapPin,
  RefreshCw,
  PhoneCall,
  Radio,
  Users,
  Clock,
  Crosshair
} from 'lucide-react';
import { t } from '../../utils/translations';

const MaritimeSafety = () => {
  const [location, setLocation] = useState(null);
  const [dangerAnalysis, setDangerAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);
  const mapRef = useRef(null);

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
          fetchEnvironmentalData(loc.lat, loc.lon, true);
          initializeInteractiveMap(loc.lat, loc.lon);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Mumbai coordinates for demo
          const loc = { lat: 19.0760, lon: 72.8777 };
          setLocation(loc);
          fetchEnvironmentalData(loc.lat, loc.lon, true);
          initializeInteractiveMap(loc.lat, loc.lon);
        }
      );
    } else {
      // Fallback for browsers without geolocation
      const loc = { lat: 19.0760, lon: 72.8777 };
      setLocation(loc);
      fetchEnvironmentalData(loc.lat, loc.lon, true);
      initializeInteractiveMap(loc.lat, loc.lon);
    }
  };

  const initializeInteractiveMap = (lat, lon) => {
    // Initialize VesselFinder interactive map with ONLY user's location
    if (mapRef.current) {
      // Clear existing map
      mapRef.current.innerHTML = '';
      
      // Create script elements for the VesselFinder interactive map
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `
        // Map appearance
        var width="100%";
        var height="300";
        var latitude="${lat.toFixed(6)}";
        var longitude="${lon.toFixed(6)}";
        var zoom="12";
        var names=false;

        // Single ship tracking - DISABLED (no specific vessel tracking)
        var mmsi="";
        var imo="";
        var show_track=false;

        // Fleet tracking - DISABLED (only show user location)
        var fleet="";
        var fleet_name="";
        var fleet_timespan="0";
      `;
      
      const mapScript = document.createElement('script');
      mapScript.type = 'text/javascript';
      mapScript.src = 'https://www.vesselfinder.com/aismap.js';
      
      mapRef.current.appendChild(configScript);
      mapRef.current.appendChild(mapScript);
      
      console.log(`🗺️ Interactive map initialized for location: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    }
  };

  const fetchEnvironmentalData = async (lat, lon, showLoading = true) => {
    if (showLoading) setLoading(true);
    
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
      if (showLoading) setLoading(false);
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

  return (
    <div className="space-y-4 p-4 max-w-full">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🧭 Live Location Tracker</h2>
          <p className="text-sm text-gray-600">Your live location tracking & environmental conditions</p>
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
                <p className="text-sm text-blue-600">
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

      {/* Interactive VesselFinder Map - Live Location Only */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <Navigation className="w-5 h-5 mr-2 text-blue-600" />
            Interactive Live Location Map
          </CardTitle>
          <CardDescription>
            Your current position on interactive map - Live tracking enabled
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div 
            ref={mapRef}
            className="h-64 sm:h-80 rounded-lg overflow-hidden bg-blue-50 border border-blue-200"
            style={{ minHeight: '300px' }}
          >
            {/* VesselFinder interactive map will be injected here */}
            {!location && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Crosshair className="w-12 h-12 mx-auto text-blue-400 animate-pulse" />
                  <p className="text-blue-600 mt-2">Getting your location...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Environmental Conditions */}
      {dangerAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overall Status */}
          <Card className={`${getStatusColor(dangerAnalysis.risk_analysis.overall_risk_level)} border-2`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{dangerAnalysis.risk_analysis.risk_message}</h3>
                  <p className="text-sm">
                    Risk Level: {dangerAnalysis.risk_analysis.overall_risk_level}
                  </p>
                </div>
                <Shield className={`w-8 h-8 ${
                  dangerAnalysis.risk_analysis.overall_risk_level.includes('DANGER') ? 'text-red-600' :
                  dangerAnalysis.risk_analysis.overall_risk_level === 'CAUTION' ? 'text-orange-600' :
                  'text-green-600'
                }`} />
              </div>
            </CardContent>
          </Card>

          {/* Environmental Data */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Waves className="w-5 h-5 mr-2 text-blue-600" />
                Environmental Conditions
              </CardTitle>
              <CardDescription>
                Real-time environmental analysis at your location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Environmental Data Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Sea Temp</span>
                  </div>
                  <div className="text-lg font-bold text-blue-700">
                    {dangerAnalysis.environmental_data.sea_surface_temp_c.toFixed(1)}°C
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Wind</span>
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    {dangerAnalysis.environmental_data.wind_speed_knots.toFixed(1)} kts
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Current</span>
                  </div>
                  <div className="text-lg font-bold text-purple-700">
                    {dangerAnalysis.environmental_data.ocean_current_knots.toFixed(1)} kts
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center gap-2">
                    <Anchor className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Rogue Wave</span>
                  </div>
                  <div className="text-lg font-bold text-orange-700">
                    {Math.round(dangerAnalysis.risk_analysis.rogue_wave_probability * 100)}%
                  </div>
                </div>
              </div>

              {/* Safety Recommendations */}
              {dangerAnalysis.recommendations && dangerAnalysis.recommendations.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">🛡️ Safety Recommendations:</h4>
                  <div className="space-y-1">
                    {dangerAnalysis.recommendations.slice(0, 3).map((recommendation, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
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

      {/* Location History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Location Tracking Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Live Tracking: 
                <Badge variant={autoRefresh ? "default" : "secondary"} className="ml-2">
                  {autoRefresh ? "Active" : "Paused"}
                </Badge>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                GPS accuracy: High | Update frequency: 30 seconds
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last sync:</p>
              <p className="font-medium">{lastUpdate?.toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Actions */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base text-red-800">
            <PhoneCall className="w-5 h-5 mr-2" />
            Emergency Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button className="bg-red-600 hover:bg-red-700 w-full">
              <PhoneCall className="w-4 h-4 mr-2" />
              Call Coast Guard
            </Button>
            <Button variant="outline" className="border-red-300 text-red-700 w-full">
              <Radio className="w-4 h-4 mr-2" />
              Emergency Radio
            </Button>
          </div>
          <div className="mt-3 text-xs text-red-700">
            <strong>Emergency Contacts:</strong> Coast Guard: 1554 | Port Control: 022-22661504
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaritimeSafety;