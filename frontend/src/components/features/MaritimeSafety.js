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
  Clock
} from 'lucide-react';
import { t } from '../../utils/translations';
import MapComponent from '../maps/MapComponent';

const MaritimeSafety = () => {
  const [location, setLocation] = useState(null);
  const [nearbyVessels, setNearbyVessels] = useState([]);
  const [dangerAnalysis, setDangerAnalysis] = useState(null);
  const [safetyReport, setSafetyReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
    
    // Set up auto-refresh every 30 seconds for real-time monitoring
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        if (location) {
          fetchSafetyData(location.lat, location.lon, false);
        }
      }, 30000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [location, autoRefresh]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setLocation(loc);
          fetchSafetyData(loc.lat, loc.lon, true);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Mumbai coordinates for demo
          const loc = { lat: 19.0760, lon: 72.8777 };
          setLocation(loc);
          fetchSafetyData(loc.lat, loc.lon, true);
        }
      );
    }
  };

  const fetchSafetyData = async (lat, lon, showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      // Fetch complete safety report
      const response = await fetch(
        `${backendUrl}/api/maritime/complete-safety-report?lat=${lat}&lon=${lon}&radius=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        const reportData = data.data;
        
        setSafetyReport(reportData);
        setNearbyVessels(reportData.vessel_tracking.vessels || []);
        setDangerAnalysis(reportData.environmental_conditions);
        setLastUpdate(new Date());
        
        // Check for new alerts
        checkForAlerts(reportData);
        
      } else {
        console.error('Failed to fetch safety data');
      }
    } catch (error) {
      console.error('Error fetching safety data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const checkForAlerts = (reportData) => {
    const newNotifications = [];
    
    // Check vessel collision alerts
    const dangerVessels = reportData.vessel_tracking.vessels.filter(
      v => v.alert_level.level === 'DANGER'
    );
    const warningVessels = reportData.vessel_tracking.vessels.filter(
      v => v.alert_level.level === 'WARNING'
    );
    
    if (dangerVessels.length > 0) {
      newNotifications.push({
        id: Date.now() + Math.random(),
        type: 'DANGER',
        title: '🚨 COLLISION RISK',
        message: `${dangerVessels.length} vessel(s) within 2km - Take immediate action!`,
        timestamp: new Date(),
        urgent: true
      });
      
      // Browser notification for critical alerts
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 COLLISION RISK - BlueNet Maritime Safety', {
          body: `${dangerVessels.length} vessel(s) very close - Take evasive action!`,
          icon: '/favicon.ico',
          requireInteraction: true
        });
      }
    }
    
    if (warningVessels.length > 0) {
      newNotifications.push({
        id: Date.now() + Math.random() + 1,
        type: 'WARNING',
        title: '⚠️ Vessels Nearby',
        message: `${warningVessels.length} vessel(s) within 5km - Monitor closely`,
        timestamp: new Date(),
        urgent: false
      });
    }
    
    // Check environmental dangers
    const envRisk = reportData.environmental_conditions?.risk_analysis?.overall_risk_level;
    if (envRisk === 'DANGER' || envRisk === 'EXTREME_DANGER') {
      newNotifications.push({
        id: Date.now() + Math.random() + 2,
        type: 'DANGER',
        title: '🌊 Dangerous Conditions',
        message: reportData.environmental_conditions.risk_analysis.risk_message,
        timestamp: new Date(),
        urgent: true
      });
    }
    
    // Add new notifications
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev.slice(0, 4)]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return 'border-red-500 bg-red-50';
      case 'WARNING': return 'border-orange-500 bg-orange-50';
      case 'SAFE': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-full">
      {/* Request notification permission */}
      {'Notification' in window && Notification.permission === 'default' && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Enable notifications for real-time collision alerts?
            <Button onClick={requestNotificationPermission} className="ml-2" size="sm">
              Enable Alerts
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Active Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((notification) => (
            <Alert 
              key={notification.id} 
              className={`${notification.type === 'DANGER' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'} animate-pulse`}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <strong>{notification.title}</strong>
                    <br />
                    {notification.message}
                    <div className="text-xs text-gray-500 mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <Button 
                    onClick={() => clearNotification(notification.id)}
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🚨 Maritime Safety</h2>
          <p className="text-sm text-gray-600">Real-time collision avoidance & danger detection</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => location && fetchSafetyData(location.lat, location.lon, true)}
            disabled={loading}
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Updating...' : 'Refresh'}
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

      {/* Overall Safety Status */}
      {safetyReport && (
        <Card className={`${getStatusColor(safetyReport.overall_safety.status)} border-2`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{safetyReport.overall_safety.message}</h3>
                <p className="text-sm">
                  Last updated: {lastUpdate?.toLocaleTimeString()}
                </p>
              </div>
              <Shield className={`w-8 h-8 ${
                safetyReport.overall_safety.status === 'CRITICAL' ? 'text-red-600' :
                safetyReport.overall_safety.status === 'WARNING' ? 'text-orange-600' :
                'text-green-600'
              }`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile-Optimized Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Vessel Tracking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Navigation className="w-5 h-5 mr-2 text-blue-600" />
              Vessel Tracking
            </CardTitle>
            <CardDescription>
              {nearbyVessels.length} vessels within 10km radius
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {nearbyVessels.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No vessels detected nearby</p>
            ) : (
              nearbyVessels.slice(0, 5).map((vessel, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={vessel.alert_level.level === 'DANGER' ? 'destructive' : 
                               vessel.alert_level.level === 'WARNING' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {vessel.alert_level.icon} {vessel.alert_level.level}
                      </Badge>
                      <span className="font-medium text-sm">{vessel.ship_name}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {vessel.ship_type} • {vessel.distance_km}km away
                    </div>
                    <div className="text-xs text-gray-500">
                      Speed: {vessel.speed} knots • Course: {vessel.course}°
                    </div>
                    {vessel.alert_level.level !== 'SAFE' && (
                      <div className="text-xs font-medium mt-1" style={{color: vessel.alert_level.color}}>
                        {vessel.alert_level.action}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Environmental Conditions */}
        {dangerAnalysis && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Waves className="w-5 h-5 mr-2 text-blue-600" />
                Environmental Conditions
              </CardTitle>
              <CardDescription>
                ML-powered danger analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Risk Level */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">Overall Risk</div>
                  <div className="text-sm text-gray-600">
                    {dangerAnalysis.risk_analysis.risk_message}
                  </div>
                </div>
                <Badge 
                  variant={dangerAnalysis.risk_analysis.overall_risk_level.includes('DANGER') ? 'destructive' : 
                         dangerAnalysis.risk_analysis.overall_risk_level === 'CAUTION' ? 'secondary' : 'default'}
                >
                  {dangerAnalysis.risk_analysis.overall_risk_level}
                </Badge>
              </div>

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
        )}
      </div>

      {/* Interactive Map */}
      {location && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Maritime Safety Map
            </CardTitle>
            <CardDescription>
              Your location and nearby vessels with safety zones
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-64 sm:h-80 rounded-lg overflow-hidden">
              <MapComponent
                latitude={location.lat}
                longitude={location.lon}
                zoom={11}
                mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
              >
                {/* Your location marker */}
                <div 
                  className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
                
                {/* Safety zones */}
                <div
                  className="rounded-full border-2 border-orange-400 bg-orange-400 opacity-20"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: '100px',
                    height: '100px',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
                <div
                  className="rounded-full border-2 border-red-400 bg-red-400 opacity-30"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: '50px',
                    height: '50px',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
                
                {/* Vessel markers */}
                {nearbyVessels.slice(0, 5).map((vessel, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full border border-white shadow-lg ${
                      vessel.alert_level.level === 'DANGER' ? 'bg-red-600' :
                      vessel.alert_level.level === 'WARNING' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                    style={{
                      position: 'absolute',
                      // Approximate positioning - would need proper coordinate conversion
                      left: `${50 + (vessel.distance_km * Math.cos(vessel.course * Math.PI / 180) * 2)}%`,
                      top: `${50 - (vessel.distance_km * Math.sin(vessel.course * Math.PI / 180) * 2)}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    title={`${vessel.ship_name} - ${vessel.distance_km}km`}
                  />
                ))}
              </MapComponent>
            </div>
          </CardContent>
        </Card>
      )}

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