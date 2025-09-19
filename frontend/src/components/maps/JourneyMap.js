import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { 
  Navigation, 
  MapPin, 
  Fuel,
  Clock,
  AlertTriangle,
  Route,
  Shield,
  Play,
  Square
} from 'lucide-react';

const JourneyMap = ({ 
  currentJourney = null,
  journeyHistory = [],
  onStartJourney = null,
  onStopJourney = null,
  isActive = false
}) => {
  const [mapViewState, setMapViewState] = useState({
    longitude: 72.8777,
    latitude: 19.0760,
    zoom: 12
  });

  // Create maritime boundaries for safety monitoring
  const maritimeBoundaries = [
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
  ];

  // Generate journey route from history if available
  const journeyRoute = currentJourney && currentJourney.routeHistory ? 
    currentJourney.routeHistory : [];

  // Create sample alerts for demonstration
  const alerts = currentJourney && currentJourney.boundaryAlerts ? 
    currentJourney.boundaryAlerts.map(alert => ({
      location: { lat: 19.0, lon: 72.9 },
      type: alert.type,
      message: alert.message
    })) : [];

  useEffect(() => {
    if (currentJourney && currentJourney.currentLocation) {
      setMapViewState(prev => ({
        ...prev,
        longitude: currentJourney.currentLocation.lon,
        latitude: currentJourney.currentLocation.lat
      }));
    }
  }, [currentJourney]);

  const formatDuration = (startTime) => {
    if (!startTime) return '0h 0m';
    const now = new Date();
    const start = new Date(startTime);
    const diff = now - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'alert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Journey Status Banner */}
      {isActive && currentJourney && (
        <Alert className="border-green-200 bg-green-50">
          <Navigation className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Journey Active</AlertTitle>
          <AlertDescription className="text-green-700">
            <strong>{currentJourney.vesselName}</strong> is being tracked. 
            Started {formatDuration(currentJourney.startTime)} ago.
          </AlertDescription>
        </Alert>
      )}

      {/* Boundary Violation Alerts */}
      {alerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Boundary Alert</AlertTitle>
          <AlertDescription className="text-red-700">
            {alerts[0].message}
          </AlertDescription>
        </Alert>
      )}

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5 text-sky-600" />
                Live Journey Tracking
              </CardTitle>
              <CardDescription>
                Real-time vessel tracking with maritime boundary monitoring and safety alerts
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isActive ? (
                <Button onClick={onStartJourney} className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Journey
                </Button>
              ) : (
                <Button onClick={onStopJourney} variant="destructive">
                  <Square className="w-4 h-4 mr-2" />
                  Stop Journey
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MapComponent
            initialViewState={mapViewState}
            height={500}
            journeyRoute={journeyRoute}
            currentLocation={currentJourney?.currentLocation}
            boundaries={maritimeBoundaries}
            alerts={alerts}
            mapStyle="mapbox://styles/mapbox/navigation-day-v1"
          />
        </CardContent>
      </Card>

      {/* Journey Statistics */}
      {isActive && currentJourney && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distance</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentJourney.totalDistance?.toFixed(1) || '0.0'}</div>
              <p className="text-xs text-muted-foreground">kilometers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fuel Used</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentJourney.fuelConsumed?.toFixed(1) || '0.0'}</div>
              <p className="text-xs text-muted-foreground">liters</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(currentJourney.startTime)}
              </div>
              <p className="text-xs text-muted-foreground">elapsed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${alerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {alerts.length > 0 ? 'Alert' : 'Safe'}
              </div>
              <p className="text-xs text-muted-foreground">
                {alerts.length > 0 ? 'boundary violation' : 'in safe waters'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Journey History */}
      {journeyHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" />
              Recent Journeys
            </CardTitle>
            <CardDescription>
              History of completed fishing journeys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {journeyHistory.slice(0, 3).map((journey, index) => (
                <div key={journey.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <div className="font-medium">{journey.vesselName}</div>
                      <div className="text-sm text-gray-500">
                        {journey.startTime.toLocaleDateString()} • 
                        {formatDuration(journey.startTime, journey.endTime)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{journey.totalDistance.toFixed(1)} km</div>
                      <div className="text-gray-500">Distance</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{journey.fuelConsumed.toFixed(1)} L</div>
                      <div className="text-gray-500">Fuel</div>
                    </div>
                    <Badge className={getStatusColor(journey.status)}>
                      {journey.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Information */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Safety Monitoring:</strong> The map shows maritime boundaries (red dashed lines) and restricted zones. 
          You'll receive automatic alerts if your vessel approaches or crosses these boundaries. 
          Always maintain a safe distance from restricted areas and follow maritime regulations.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default JourneyMap;