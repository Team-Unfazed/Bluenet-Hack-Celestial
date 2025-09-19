import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Navigation, 
  Play, 
  Square, 
  MapPin, 
  Fuel,
  Clock,
  AlertTriangle,
  Shield,
  Compass,
  Waves,
  Loader2
} from 'lucide-react';
import { apiService } from '../../utils/api';
import JourneyMap from '../maps/JourneyMap';

const JourneyTracking = () => {
  const [journeyState, setJourneyState] = useState({
    isActive: false,
    currentJourney: null,
    journeyHistory: [],
    loading: false
  });
  const [startForm, setStartForm] = useState({
    vesselName: 'My Vessel',
    fuelEfficiency: 2.5, // km per liter
    startLatitude: null,
    startLongitude: null
  });
  const [showStartDialog, setShowStartDialog] = useState(false);
  const locationWatchId = useRef(null);

  useEffect(() => {
    getCurrentLocation();
    loadJourneyHistory();
    
    return () => {
      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStartForm(prev => ({
            ...prev,
            startLatitude: position.coords.latitude,
            startLongitude: position.coords.longitude
          }));
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Use default Mumbai coordinates
          setStartForm(prev => ({
            ...prev,
            startLatitude: 19.0760,
            startLongitude: 72.8777
          }));
        }
      );
    }
  };

  const loadJourneyHistory = () => {
    // Mock journey history
    const mockHistory = [
      {
        id: 'journey_1',
        vesselName: 'Sea Explorer',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        totalDistance: 45.2,
        fuelConsumed: 18.8,
        status: 'completed'
      },
      {
        id: 'journey_2',
        vesselName: 'Ocean Pride',
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
        totalDistance: 67.8,
        fuelConsumed: 27.1,
        status: 'completed'
      }
    ];
    
    setJourneyState(prev => ({
      ...prev,
      journeyHistory: mockHistory
    }));
  };

  const startJourney = async () => {
    try {
      setJourneyState(prev => ({ ...prev, loading: true }));
      
      const response = await apiService.startJourney({
        start_latitude: startForm.startLatitude,
        start_longitude: startForm.startLongitude,
        fuel_efficiency: startForm.fuelEfficiency,
        vessel_name: startForm.vesselName
      });
      
      const newJourney = {
        id: response.data.journey_id,
        vesselName: startForm.vesselName,
        startTime: new Date(),
        fuelEfficiency: startForm.fuelEfficiency,
        currentLocation: {
          lat: startForm.startLatitude,
          lon: startForm.startLongitude
        },
        totalDistance: 0,
        fuelConsumed: 0,
        boundaryAlerts: [],
        status: 'active'
      };
      
      setJourneyState(prev => ({
        ...prev,
        isActive: true,
        currentJourney: newJourney,
        loading: false
      }));
      
      setShowStartDialog(false);
      startLocationTracking(response.data.journey_id);
      
    } catch (error) {
      console.error('Failed to start journey:', error);
      setJourneyState(prev => ({ ...prev, loading: false }));
    }
  };

  const stopJourney = () => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
    }
    
    setJourneyState(prev => ({
      ...prev,
      isActive: false,
      journeyHistory: prev.currentJourney ? 
        [...prev.journeyHistory, { ...prev.currentJourney, status: 'completed', endTime: new Date() }] :
        prev.journeyHistory,
      currentJourney: null
    }));
  };

  const startLocationTracking = (journeyId) => {
    if (navigator.geolocation) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            const response = await apiService.updateJourney({
              journey_id: journeyId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            
            setJourneyState(prev => ({
              ...prev,
              currentJourney: prev.currentJourney ? {
                ...prev.currentJourney,
                currentLocation: {
                  lat: position.coords.latitude,
                  lon: position.coords.longitude
                },
                totalDistance: response.data.distance_km,
                fuelConsumed: response.data.fuel_consumed,
                boundaryAlerts: response.data.boundary_alerts || []
              } : null
            }));
          } catch (error) {
            console.error('Failed to update journey:', error);
          }
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 10000
        }
      );
    }
  };

  const handleFormChange = (field, value) => {
    setStartForm(prev => ({ ...prev, [field]: value }));
  };

  const formatDuration = (startTime, endTime = new Date()) => {
    const durationMs = endTime - startTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Journey Tracking</h2>
          <p className="text-gray-600 mt-1">
            Track your fishing journeys with live GPS, fuel monitoring, and safety alerts
          </p>
        </div>
        
        <div className="flex gap-2 mt-4 sm:mt-0">
          {!journeyState.isActive ? (
            <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Journey
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Journey</DialogTitle>
                  <DialogDescription>
                    Configure your vessel details before starting the journey tracking
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vesselName">Vessel Name</Label>
                    <Input
                      id="vesselName"
                      value={startForm.vesselName}
                      onChange={(e) => handleFormChange('vesselName', e.target.value)}
                      placeholder="Enter vessel name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fuelEfficiency">Fuel Efficiency (km per liter)</Label>
                    <Input
                      id="fuelEfficiency"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={startForm.fuelEfficiency}
                      onChange={(e) => handleFormChange('fuelEfficiency', parseFloat(e.target.value) || 2.5)}
                      placeholder="e.g., 2.5"
                    />
                  </div>
                  
                  {startForm.startLatitude && startForm.startLongitude && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Starting Location</p>
                      <p className="text-sm text-gray-600">
                        {startForm.startLatitude.toFixed(4)}°N, {startForm.startLongitude.toFixed(4)}°E
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={startJourney} 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={journeyState.loading || !startForm.startLatitude}
                  >
                    {journeyState.loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Start Tracking
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={stopJourney} variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              Stop Journey
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Current Journey</TabsTrigger>
          <TabsTrigger value="history">Journey History</TabsTrigger>
          <TabsTrigger value="map">Live Map</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {journeyState.isActive && journeyState.currentJourney ? (
            <>
              {/* Active Journey Status */}
              <Alert className="border-green-200 bg-green-50">
                <Navigation className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Journey Active</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your vessel <strong>{journeyState.currentJourney.vesselName}</strong> is being tracked. 
                  Started {formatDuration(journeyState.currentJourney.startTime)} ago.
                </AlertDescription>
              </Alert>

              {/* Boundary Alerts */}
              {journeyState.currentJourney.boundaryAlerts.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Boundary Alert</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {journeyState.currentJourney.boundaryAlerts[0].message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Journey Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Distance</CardTitle>
                    <Compass className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{journeyState.currentJourney.totalDistance.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">kilometers</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fuel Used</CardTitle>
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{journeyState.currentJourney.fuelConsumed.toFixed(1)}</div>
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
                      {formatDuration(journeyState.currentJourney.startTime)}
                    </div>
                    <p className="text-xs text-muted-foreground">elapsed</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Safety</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">Safe</div>
                    <p className="text-xs text-muted-foreground">in boundaries</p>
                  </CardContent>
                </Card>
              </div>

              {/* Current Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-sky-600" />
                    Current Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Coordinates</Label>
                      <p className="font-medium">
                        {journeyState.currentJourney.currentLocation.lat.toFixed(6)}°N, {' '}
                        {journeyState.currentJourney.currentLocation.lon.toFixed(6)}°E
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Fuel Efficiency</Label>
                      <p className="font-medium">
                        {journeyState.currentJourney.fuelEfficiency} km/L
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Navigation className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Journey</h3>
                <p className="text-gray-500 text-center mb-4">
                  Start a new journey to track your vessel's location, fuel consumption, and safety status.
                </p>
                <Button onClick={() => setShowStartDialog(true)} className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Journey
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            {journeyState.journeyHistory.length > 0 ? (
              journeyState.journeyHistory.map((journey) => (
                <Card key={journey.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{journey.vesselName}</CardTitle>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Completed
                      </Badge>
                    </div>
                    <CardDescription>
                      {journey.startTime.toLocaleDateString()} • {formatDuration(journey.startTime, journey.endTime)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-500">Distance Traveled</Label>
                        <p className="font-medium">{journey.totalDistance} km</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Fuel Consumed</Label>
                        <p className="font-medium">{journey.fuelConsumed} L</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Efficiency</Label>
                        <p className="font-medium">{(journey.totalDistance / journey.fuelConsumed).toFixed(1)} km/L</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Journey History</h3>
                  <p className="text-gray-500 text-center">
                    Your completed journeys will appear here once you start tracking.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-sky-600" />
                Live Vessel Map
              </CardTitle>
              <CardDescription>
                Interactive map with real-time location and boundary monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Map Integration</h3>
                  <p className="text-gray-500">
                    Mapbox integration will be implemented here for real-time vessel tracking,
                    boundary visualization, and route history.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JourneyTracking;