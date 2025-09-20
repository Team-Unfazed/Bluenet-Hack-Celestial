import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Navigation, 
  Shield, 
  Waves, 
  Wind,
  Thermometer,
  Anchor,
  MapPin,
  Clock,
  Crosshair,
  Ship,
  AlertTriangle,
  Eye,
  RefreshCw,
  Target
} from 'lucide-react';
import MarineMapComponent from '../maps/MarineMapComponent';
import GoogleMarineMap from '../maps/GoogleMarineMap';
import LeafletMarineMap from '../maps/LeafletMarineMap';
import FreeMarineMap from '../maps/FreeMarineMap';
import MapComponent from '../maps/MapComponent';

const MaritimeSafety = () => {
  const [location, setLocation] = useState(null);
  const [dangerAnalysis, setDangerAnalysis] = useState(null);
  const [nearbyVessels, setNearbyVessels] = useState([]);
  const [safetyReport, setSafetyReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [trafficDensity, setTrafficDensity] = useState('high');
  const [mapType, setMapType] = useState('journey'); // 'journey', 'free', 'leaflet', 'google', 'custom'
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
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Validate coordinates
          if (isNaN(lat) || isNaN(lon) || lat === null || lon === null || 
              lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            console.warn('Invalid coordinates received, using fallback');
            const loc = { lat: 19.0760, lon: 72.8777 };
            setLocation(loc);
            fetchEnvironmentalData(loc.lat, loc.lon);
          } else {
            const loc = { lat, lon };
            setLocation(loc);
            fetchEnvironmentalData(loc.lat, loc.lon);
          }
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
      
      // Try to fetch real-time MarineTraffic data first
      try {
        const realTimeResponse = await fetch(
          `${backendUrl}/api/maritime/real-time-vessels?lat=${lat}&lon=${lon}&radius=50`
        );
        
        if (realTimeResponse.ok) {
          const realTimeData = await realTimeResponse.json();
          console.log('🚢 Real-time MarineTraffic data received:', realTimeData.data);
          
          setNearbyVessels(realTimeData.data.vessels || []);
          
          // Also fetch environmental data
          const envResponse = await fetch(
            `${backendUrl}/api/maritime/danger-analysis?lat=${lat}&lon=${lon}`
          );
          
          if (envResponse.ok) {
            const envData = await envResponse.json();
            setDangerAnalysis(envData.data);
          } else {
            setDangerAnalysis(generateMockEnvironmentalData());
          }
          
          // Generate safety report with real vessel data
          const vesselAlerts = realTimeData.data.vessels.filter(v => v.alert_level.level !== 'SAFE');
          const hasVesselDanger = vesselAlerts.some(v => v.alert_level.level === 'DANGER');
          
          let overallStatus = 'SAFE';
          let statusColor = 'green';
          let statusMessage = '✅ CONDITIONS SAFE - Normal operations';
          
          if (hasVesselDanger) {
            overallStatus = 'CRITICAL';
            statusColor = 'red';
            statusMessage = '🚨 CRITICAL CONDITIONS - Immediate action required';
          } else if (vesselAlerts.length > 0) {
            overallStatus = 'WARNING';
            statusColor = 'orange';
            statusMessage = '⚠️ WARNING CONDITIONS - Exercise caution';
          }
          
          setSafetyReport({
            location: { latitude: lat, longitude: lon },
            overall_safety: {
              status: overallStatus,
              color: statusColor,
              message: statusMessage
            },
            vessel_tracking: {
              vessels_found: realTimeData.data.total_vessels,
              closest_vessel_km: realTimeData.data.closest_vessel_km,
              collision_alerts: realTimeData.data.danger_vessels + realTimeData.data.warning_vessels,
              vessels: realTimeData.data.vessels.slice(0, 10)
            },
            environmental_conditions: realTimeData.data.environmental_conditions || generateMockEnvironmentalData(),
            api_status: realTimeData.data.api_status,
            source: realTimeData.data.source
          });
          
          setLastUpdate(new Date());
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ Real-time API failed, trying fallback:', apiError.message);
      }
      
      // Fallback to complete safety report
      const response = await fetch(
        `${backendUrl}/api/maritime/complete-safety-report?lat=${lat}&lon=${lon}&radius=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSafetyReport(data.data);
        setDangerAnalysis(data.data.environmental_conditions);
        setNearbyVessels(data.data.vessel_tracking.vessels || []);
        setLastUpdate(new Date());
      } else {
        console.error('Failed to fetch safety data');
        // Fallback data
        setDangerAnalysis(generateMockEnvironmentalData());
        setNearbyVessels(generateMockVessels(lat, lon));
        setSafetyReport(generateMockSafetyReport(lat, lon));
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching safety data:', error);
      // Fallback data
      setDangerAnalysis(generateMockEnvironmentalData());
      setNearbyVessels(generateMockVessels(lat, lon));
      setSafetyReport(generateMockSafetyReport(lat, lon));
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

  const generateMockVessels = (lat, lon) => {
    const vesselTypes = [
      { 
        type: 'Cargo', 
        names: ['MV Mumbai Express', 'MV Arabian Sea', 'MV Indian Ocean', 'MV Bay of Bengal', 'MV Lakshadweep', 'MV Gateway Express', 'MV Coastal Carrier', 'MV Mumbai Trader'],
        speeds: [8, 12, 15, 10, 14, 9, 11, 13]
      },
      { 
        type: 'Tanker', 
        names: ['MT Oil Pioneer', 'MT Crude Carrier', 'MT Petroleum Star', 'MT Fuel Master', 'MT Energy Voyager', 'MT Mumbai Refinery', 'MT Arabian Oil', 'MT Coastal Tanker'],
        speeds: [6, 8, 10, 7, 9, 5, 8, 7]
      },
      { 
        type: 'Fishing', 
        names: ['FV Sea Harvest', 'FV Ocean Bounty', 'FV Fish Master', 'FV Deep Sea', 'FV Coastal Catcher', 'FV Mumbai Fisher', 'FV Arabian Catch', 'FV Bay Fisher'],
        speeds: [4, 6, 8, 5, 7, 3, 6, 5]
      },
      { 
        type: 'Passenger', 
        names: ['MV Ferry Express', 'MV Coastal Cruiser', 'MV Island Hopper', 'MV Bay Ferry', 'MV Harbor Shuttle', 'MV Mumbai Ferry', 'MV Gateway Cruiser', 'MV Port Ferry'],
        speeds: [10, 12, 8, 9, 11, 7, 10, 9]
      },
      { 
        type: 'Container', 
        names: ['MV Container Express', 'MV Mumbai Port', 'MV Gateway Container', 'MV Arabian Cargo', 'MV Coastal Container', 'MV Bay Container', 'MV Port Express'],
        speeds: [12, 14, 16, 11, 13, 10, 15]
      },
      { 
        type: 'Bulk Carrier', 
        names: ['MV Bulk Pioneer', 'MV Mumbai Bulk', 'MV Arabian Bulk', 'MV Coastal Bulk', 'MV Bay Carrier', 'MV Port Bulk', 'MV Gateway Bulk'],
        speeds: [9, 11, 13, 8, 10, 7, 12]
      },
      { 
        type: 'Tug', 
        names: ['MV Mumbai Tug', 'MV Port Tug', 'MV Harbor Tug', 'MV Bay Tug', 'MV Coastal Tug', 'MV Gateway Tug', 'MV Arabian Tug'],
        speeds: [6, 8, 10, 5, 7, 4, 9]
      },
      { 
        type: 'Pilot', 
        names: ['MV Pilot Boat 1', 'MV Pilot Boat 2', 'MV Mumbai Pilot', 'MV Port Pilot', 'MV Harbor Pilot', 'MV Bay Pilot', 'MV Coastal Pilot'],
        speeds: [8, 10, 12, 7, 9, 6, 11]
      }
    ];
    
    const vessels = [];
    
    // Generate dense marine traffic like the image - adjust based on density setting
    const baseVessels = trafficDensity === 'high' ? 80 : trafficDensity === 'medium' ? 50 : 20;
    const numVessels = baseVessels + Math.floor(Math.random() * 20);
    
    for (let i = 0; i < numVessels; i++) {
      // Create a wider spread around the user's location (up to 50km radius)
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * 50; // 0-50 km
      
      const vesselLat = lat + (distance / 111) * Math.cos(angle);
      const vesselLon = lon + (distance / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
      
      // Validate generated coordinates
      if (isNaN(vesselLat) || isNaN(vesselLon) || 
          vesselLat < -90 || vesselLat > 90 || 
          vesselLon < -180 || vesselLon > 180) {
        console.warn(`Invalid vessel coordinates generated: ${vesselLat}, ${vesselLon}`);
        continue; // Skip this vessel
      }
      
      const vesselTypeData = vesselTypes[Math.floor(Math.random() * vesselTypes.length)];
      const vesselType = vesselTypeData.type;
      const vesselName = vesselTypeData.names[Math.floor(Math.random() * vesselTypeData.names.length)];
      const baseSpeed = vesselTypeData.speeds[Math.floor(Math.random() * vesselTypeData.speeds.length)];
      
      // More realistic alert levels based on distance
      let alertLevel = 'SAFE';
      if (distance < 1.0) alertLevel = 'DANGER';
      else if (distance < 3.0) alertLevel = 'WARNING';
      
      // Add some vessels that are stationary (at anchor)
      const isStationary = Math.random() < 0.2; // 20% chance
      const actualSpeed = isStationary ? Math.random() * 0.5 : baseSpeed + (Math.random() * 4 - 2);
      const course = Math.random() * 360; // 0-360 degrees
      
      vessels.push({
        id: `vessel_${i + 1}`,
        name: vesselName,
        mmsi: Math.floor(100000000 + Math.random() * 900000000),
        type: vesselType,
        lat: vesselLat,
        lon: vesselLon,
        speed_knots: Math.max(0, actualSpeed),
        course_degrees: course,
        distance_km: distance,
        alert_level: {
          level: alertLevel,
          message: alertLevel === 'DANGER' ? 'Collision Risk!' : 
                   alertLevel === 'WARNING' ? 'Close Approach' : 'Safe Distance'
        },
        last_update: new Date(Date.now() - Math.random() * 300000), // Last 5 minutes
        status: actualSpeed > 0.5 ? 'Underway' : 'At Anchor',
        // Add visual properties for the map
        marker_color: getVesselColor(vesselType, alertLevel),
        marker_shape: actualSpeed > 0.5 ? 'triangle' : 'circle', // Moving vessels are triangles
        size: getVesselSize(vesselType)
      });
    }
    
    return vessels.sort((a, b) => a.distance_km - b.distance_km);
  };

  const getVesselColor = (type, alertLevel) => {
    if (alertLevel === 'DANGER') return '#ef4444'; // Red
    if (alertLevel === 'WARNING') return '#f59e0b'; // Orange
    
    // Color by vessel type
    const colors = {
      'Cargo': '#3b82f6',      // Blue
      'Tanker': '#ef4444',     // Red
      'Fishing': '#10b981',    // Green
      'Passenger': '#8b5cf6',  // Purple
      'Tug': '#f59e0b',        // Orange
      'Pilot': '#06b6d4',      // Cyan
      'Container': '#84cc16',  // Lime
      'Bulk Carrier': '#f97316', // Orange
      'RoRo': '#ec4899',       // Pink
      'Cruise': '#6366f1'      // Indigo
    };
    return colors[type] || '#6b7280'; // Gray default
  };

  const getVesselSize = (type) => {
    const sizes = {
      'Tanker': 'large',
      'Cruise': 'large',
      'Container': 'large',
      'Bulk Carrier': 'large',
      'Cargo': 'medium',
      'Passenger': 'medium',
      'RoRo': 'medium',
      'Fishing': 'small',
      'Tug': 'small',
      'Pilot': 'small'
    };
    return sizes[type] || 'medium';
  };

  const generateMockSafetyReport = (lat, lon) => {
    const vessels = generateMockVessels(lat, lon);
    const dangerAnalysis = generateMockEnvironmentalData();
    
    const vesselAlerts = vessels.filter(v => v.alert_level.level !== 'SAFE');
    const hasVesselDanger = vesselAlerts.some(v => v.alert_level.level === 'DANGER');
    const envRisk = dangerAnalysis.risk_analysis.overall_risk_level;
    
    let overallStatus = 'SAFE';
    let statusColor = 'green';
    let statusMessage = '✅ CONDITIONS SAFE - Normal operations';
    
    if (hasVesselDanger || envRisk.includes('DANGER')) {
      overallStatus = 'CRITICAL';
      statusColor = 'red';
      statusMessage = '🚨 CRITICAL CONDITIONS - Immediate action required';
    } else if (vesselAlerts.length > 0 || envRisk === 'CAUTION') {
      overallStatus = 'WARNING';
      statusColor = 'orange';
      statusMessage = '⚠️ WARNING CONDITIONS - Exercise caution';
    }
    
    return {
      location: { latitude: lat, longitude: lon },
      overall_safety: {
        status: overallStatus,
        color: statusColor,
        message: statusMessage
      },
      vessel_tracking: {
        vessels_found: vessels.length,
        closest_vessel_km: vessels.length > 0 ? (vessels[0].distance_km || 0) : 0,
        collision_alerts: vesselAlerts.length,
        vessels: vessels.slice(0, 5)
      },
      environmental_conditions: dangerAnalysis
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
            {lat?.toFixed(6) || '0.000000'}°N, {lon?.toFixed(6) || '0.000000'}°E
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

  // Initialize with default data if not available
  const safeSafetyReport = safetyReport || {
    status: 'loading',
    message: 'Loading maritime safety data...',
    risk_level: 'low',
    recommendations: [],
    overall_safety: {
      status: 'SAFE',
      message: 'Loading safety data...'
    },
    vessel_tracking: {
      vessels_found: 0,
      collision_alerts: 0,
      closest_vessel_km: 0,
      vessels: []
    },
    api_status: 'offline',
    source: 'simulated'
  };
  
  const safeNearbyVessels = nearbyVessels || [];
  
  const safeDangerAnalysis = dangerAnalysis || {
    environmental_data: {
      sea_surface_temp_c: 0,
      wind_speed_ms: 0,
      wave_height_m: 0,
      visibility_km: 0
    },
    risk_factors: [],
    recommendations: [],
    risk_analysis: {
      overall_risk_level: 'LOW'
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 max-w-full overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">🚢 Maritime Safety & Traffic</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Real-time vessel tracking, collision avoidance & environmental monitoring</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button 
            onClick={getCurrentLocation}
            disabled={loading}
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Updating...' : 'Refresh Data'}</span>
            <span className="sm:hidden">{loading ? 'Updating...' : 'Refresh'}</span>
          </Button>
          <Button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Auto: {autoRefresh ? 'ON' : 'OFF'}</span>
            <span className="sm:hidden">{autoRefresh ? 'ON' : 'OFF'}</span>
          </Button>
          <Button 
            onClick={() => {
              const mapTypes = ['journey', 'free', 'leaflet', 'google', 'custom'];
              const currentIndex = mapTypes.indexOf(mapType);
              const nextIndex = (currentIndex + 1) % mapTypes.length;
              setMapType(mapTypes[nextIndex]);
            }}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">
              {mapType === 'journey' ? 'Journey Map' : 
               mapType === 'free' ? 'Free Map' : 
               mapType === 'leaflet' ? 'Leaflet Map' : 
               mapType === 'google' ? 'Google Maps' : 'Custom Map'}
            </span>
            <span className="sm:hidden">
              {mapType === 'journey' ? 'Journey' : 
               mapType === 'free' ? 'Free' : 
               mapType === 'leaflet' ? 'Leaflet' : 
               mapType === 'google' ? 'Google' : 'Custom'}
            </span>
          </Button>
          <select 
            value={trafficDensity} 
            onChange={(e) => setTrafficDensity(e.target.value)}
            className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white w-full sm:w-auto"
          >
            <option value="low">Low Traffic</option>
            <option value="medium">Medium Traffic</option>
            <option value="high">High Traffic</option>
          </select>
        </div>
      </div>

      {/* Overall Safety Status */}
      {safeSafetyReport && (
        <Alert className={`border-2 ${
          safeSafetyReport.overall_safety?.status === 'CRITICAL' ? 'border-red-500 bg-red-50' :
          safeSafetyReport.overall_safety?.status === 'WARNING' ? 'border-orange-500 bg-orange-50' :
          'border-green-500 bg-green-50'
        }`}>
          <AlertTriangle className={`h-4 w-4 ${
            safeSafetyReport.overall_safety?.status === 'CRITICAL' ? 'text-red-600' :
            safeSafetyReport.overall_safety?.status === 'WARNING' ? 'text-orange-600' :
            'text-green-600'
          }`} />
          <AlertDescription className={`${
            safeSafetyReport.overall_safety?.status === 'CRITICAL' ? 'text-red-800' :
            safeSafetyReport.overall_safety?.status === 'WARNING' ? 'text-orange-800' :
            'text-green-800'
          }`}>
            <strong>{safeSafetyReport.overall_safety?.message || 'Safety status unavailable'}</strong>
            <br />
            <span className="text-sm">
              Vessels nearby: {safeSafetyReport?.vessel_tracking?.vessels_found || 0} | 
              Collision alerts: {safeSafetyReport?.vessel_tracking?.collision_alerts || 0} | 
              Closest vessel: {safeSafetyReport?.vessel_tracking?.closest_vessel_km?.toFixed(2) || '0.00'} km
            </span>
            {safeSafetyReport.api_status && (
              <div className="mt-2 text-xs">
                <span className={`px-2 py-1 rounded ${
                  safeSafetyReport.api_status === 'online' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {safeSafetyReport.api_status === 'online' ? '🟢 Live MarineTraffic Data' : '🟡 Fallback Data'}
                </span>
                {safeSafetyReport.source && (
                  <span className="ml-2 text-gray-600">
                    Source: {safeSafetyReport.source === 'marine_traffic_api' ? 'MarineTraffic API' : 'Simulated'}
                  </span>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm p-2 sm:p-3">Overview</TabsTrigger>
          <TabsTrigger value="traffic" className="text-xs sm:text-sm p-2 sm:p-3">Marine Traffic</TabsTrigger>
          <TabsTrigger value="environmental" className="text-xs sm:text-sm p-2 sm:p-3">Environmental</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs sm:text-sm p-2 sm:p-3">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Location Status */}
          {location && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-blue-800">📍 Your Live Location</h3>
                    <p className="text-blue-600">
                      Latitude: {location.lat?.toFixed(6) || '0.000000'}° | Longitude: {location.lon?.toFixed(6) || '0.000000'}°
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

          {/* Safety Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nearby Vessels</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {safeSafetyReport?.vessel_tracking?.vessels_found || 0}
                    </p>
                  </div>
                  <Ship className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Collision Alerts</p>
                    <p className="text-2xl font-bold text-red-600">
                      {safeSafetyReport?.vessel_tracking?.collision_alerts || 0}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Closest Vessel</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {safeSafetyReport?.vessel_tracking?.closest_vessel_km?.toFixed(2) || '0.00'} km
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          {/* Marine Traffic Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Navigation className="w-5 h-5 mr-2 text-blue-600" />
                Real-Time Marine Traffic Map
              </CardTitle>
              <CardDescription>
                Live vessel positions and collision avoidance alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {location && location.lat && location.lon && !isNaN(location.lat) && !isNaN(location.lon) && (
                mapType === 'journey' ? (
                  <MapComponent
                    initialViewState={{
                      longitude: location?.lon || 72.8777,
                      latitude: location?.lat || 19.0760,
                      zoom: 10
                    }}
                    height={window.innerWidth < 640 ? 400 : window.innerWidth < 1024 ? 500 : 600}
                    currentLocation={location}
                    fishingZones={safeNearbyVessels
                      .filter(vessel => 
                        vessel.lat && vessel.lon && 
                        !isNaN(vessel.lat) && !isNaN(vessel.lon) &&
                        vessel.lat >= -90 && vessel.lat <= 90 &&
                        vessel.lon >= -180 && vessel.lon <= 180
                      )
                      .map(vessel => ({
                        lat: vessel.lat,
                        lon: vessel.lon,
                        score: vessel.alert_level.level === 'DANGER' ? 0.2 : 
                               vessel.alert_level.level === 'WARNING' ? 0.5 : 0.8,
                        location_name: vessel.name,
                        vessel_type: vessel.type,
                        speed_knots: vessel.speed_knots,
                        course_degrees: vessel.course_degrees,
                        distance_km: vessel.distance_km,
                        alert_level: vessel.alert_level.level,
                        marker_color: vessel.marker_color,
                        marker_shape: vessel.marker_shape,
                        size: vessel.size,
                        mmsi: vessel.mmsi
                      }))}
                    boundaries={[
                      {
                        name: 'Indian Territorial Waters - 12 NM',
                        type: 'territorial',
                        geometry: {
                          type: 'LineString',
                          coordinates: [
                            [72.2, 18.7],
                            [73.5, 18.7],
                            [73.5, 19.5],
                            [72.2, 19.5],
                            [72.2, 18.7]
                          ]
                        }
                      },
                      {
                        name: 'Restricted Fishing Zone',
                        type: 'restricted',
                        geometry: {
                          type: 'LineString',
                          coordinates: [
                            [72.4, 18.9],
                            [73.2, 18.9],
                            [73.2, 19.3],
                            [72.4, 19.3],
                            [72.4, 18.9]
                          ]
                        }
                      }
                    ]}
                    alerts={safeNearbyVessels
                      .filter(v => 
                        v.alert_level.level === 'DANGER' &&
                        v.lat && v.lon && 
                        !isNaN(v.lat) && !isNaN(v.lon) &&
                        v.lat >= -90 && v.lat <= 90 &&
                        v.lon >= -180 && v.lon <= 180
                      )
                      .map(vessel => ({
                        location: { lat: vessel.lat, lon: vessel.lon },
                        type: 'collision_risk',
                        message: `Collision risk with ${vessel.name}`
                      }))}
                    mapStyle="mapbox://styles/mapbox/navigation-day-v1"
                    showControls={true}
                  />
                ) : mapType === 'free' ? (
                  <FreeMarineMap
                    initialViewState={{
                      longitude: location?.lon || 0,
                      latitude: location?.lat || 0,
                      zoom: 8
                    }}
                    height={window.innerWidth < 640 ? 400 : window.innerWidth < 1024 ? 500 : 600}
                    currentLocation={location}
                    vessels={safeNearbyVessels}
                    onLocationChange={setLocation}
                    showControls={true}
                    mapStyle="marine"
                  />
                ) : mapType === 'leaflet' ? (
                  <LeafletMarineMap
                    initialViewState={{
                      longitude: location?.lon || 0,
                      latitude: location?.lat || 0,
                      zoom: 8
                    }}
                    height={window.innerWidth < 640 ? 400 : window.innerWidth < 1024 ? 500 : 600}
                    currentLocation={location}
                    vessels={safeNearbyVessels}
                    onLocationChange={setLocation}
                    showControls={true}
                    mapStyle="marine"
                  />
                ) : mapType === 'google' ? (
                  <GoogleMarineMap
                    initialViewState={{
                      longitude: location?.lon || 0,
                      latitude: location?.lat || 0,
                      zoom: 8
                    }}
                    height={window.innerWidth < 640 ? 400 : window.innerWidth < 1024 ? 500 : 600}
                    currentLocation={location}
                    vessels={safeNearbyVessels}
                    onLocationChange={setLocation}
                    showControls={true}
                    mapStyle="marine"
                  />
                ) : (
                  <MarineMapComponent
                    initialViewState={{
                      longitude: location?.lon || 0,
                      latitude: location?.lat || 0,
                      zoom: 8
                    }}
                    height={window.innerWidth < 640 ? 400 : window.innerWidth < 1024 ? 500 : 600}
                    currentLocation={location}
                    fishingZones={safeNearbyVessels.map(vessel => ({
                      lat: vessel.lat,
                      lon: vessel.lon,
                      score: vessel.alert_level.level === 'DANGER' ? 0.2 : 
                             vessel.alert_level.level === 'WARNING' ? 0.5 : 0.8,
                      location_name: vessel.name,
                      vessel_type: vessel.type,
                      speed_knots: vessel.speed_knots,
                      course_degrees: vessel.course_degrees,
                      distance_km: vessel.distance_km,
                      alert_level: vessel.alert_level.level,
                      marker_color: vessel.marker_color,
                      marker_shape: vessel.marker_shape,
                      size: vessel.size,
                      mmsi: vessel.mmsi
                    }))}
                    mapStyle="marine"
                  />
                )
              )}
            </CardContent>
          </Card>

          {/* Vessel List - Show only closest 20 vessels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ship className="w-5 h-5 mr-2 text-blue-600" />
                Closest Vessels ({Math.min(nearbyVessels.length, 20)} of {nearbyVessels.length})
              </CardTitle>
              <CardDescription>
                Real-time vessel tracking and collision risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {nearbyVessels.slice(0, 20).map((vessel, index) => (
                  <div key={vessel.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 ${
                        vessel.marker_shape === 'triangle' ? 'transform rotate-45' : 'rounded-full'
                      }`} style={{
                        backgroundColor: vessel.marker_color,
                        clipPath: vessel.marker_shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
                      }}></div>
                      <div>
                        <div className="font-medium">{vessel.name}</div>
                        <div className="text-sm text-gray-500">
                          {vessel.type} • MMSI: {vessel.mmsi}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">{vessel.distance_km?.toFixed(2) || '0.00'} km</div>
                      <div className="text-sm text-gray-500">
                        {vessel.speed_knots?.toFixed(1) || '0.0'} kts • {vessel.course_degrees?.toFixed(0) || '0'}°
                      </div>
                    </div>
                    
                    <Badge className={
                      vessel.alert_level.level === 'DANGER' ? 'bg-red-100 text-red-800' :
                      vessel.alert_level.level === 'WARNING' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {vessel.alert_level.level}
                    </Badge>
                  </div>
                ))}
              </div>
              {nearbyVessels.length > 20 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Showing closest 20 vessels. Use the map to view all {nearbyVessels.length} vessels.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environmental" className="space-y-6">
          {/* Environmental Conditions */}
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
                        {dangerAnalysis.environmental_data?.sea_surface_temp_c?.toFixed(1) || '0.0'}°C
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Wind className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Wind</span>
                      </div>
                      <div className="text-2xl font-bold text-green-700">
                        {dangerAnalysis.environmental_data?.wind_speed_knots?.toFixed(1) || '0.0'} kts
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Waves className="w-5 h-5 text-purple-600" />
                        <span className="font-medium">Current</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        {dangerAnalysis.environmental_data?.ocean_current_knots?.toFixed(1) || '0.0'} kts
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
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Alert Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Safety Alerts & Notifications
              </CardTitle>
              <CardDescription>
                Real-time safety alerts and collision warnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {safeNearbyVessels.filter(v => v.alert_level.level !== 'SAFE').map((vessel, index) => (
                  <Alert key={vessel.id} className={
                    vessel.alert_level.level === 'DANGER' ? 'border-red-500 bg-red-50' :
                    'border-orange-500 bg-orange-50'
                  }>
                    <AlertTriangle className={`h-4 w-4 ${
                      vessel.alert_level.level === 'DANGER' ? 'text-red-600' : 'text-orange-600'
                    }`} />
                    <AlertDescription className={
                      vessel.alert_level.level === 'DANGER' ? 'text-red-800' : 'text-orange-800'
                    }>
                      <strong>{vessel.alert_level.message}</strong>
                      <br />
                      <span className="text-sm">
                        {vessel.name} ({vessel.type}) - {vessel.distance_km?.toFixed(2) || '0.00'} km away
                        <br />
                        Speed: {vessel.speed_knots?.toFixed(1) || '0.0'} kts | Course: {vessel.course_degrees?.toFixed(0) || '0'}°
                      </span>
                    </AlertDescription>
                  </Alert>
                ))}
                
                {safeNearbyVessels.filter(v => v.alert_level.level !== 'SAFE').length === 0 && (
                  <Alert className="border-green-500 bg-green-50">
                    <Shield className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>No Safety Alerts</strong>
                      <br />
                      <span className="text-sm">All nearby vessels are at safe distances. Continue normal operations.</span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaritimeSafety;