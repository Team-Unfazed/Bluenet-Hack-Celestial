import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  MapPin, 
  Thermometer, 
  Wind, 
  Waves,
  RefreshCw,
  Target,
  Fish
} from 'lucide-react';

const FishingZonesMap = ({ 
  fishingZones = [], 
  userLocation = null, 
  onLocationUpdate = null,
  loading = false 
}) => {
  const [selectedZone, setSelectedZone] = useState(null);
  const [mapViewState, setMapViewState] = useState({
    longitude: userLocation?.lon || 72.8777,
    latitude: userLocation?.lat || 19.0760,
    zoom: 11
  });

  useEffect(() => {
    if (userLocation) {
      setMapViewState(prev => ({
        ...prev,
        longitude: userLocation.lon,
        latitude: userLocation.lat
      }));
    }
  }, [userLocation]);

  // Create sample maritime boundaries for demonstration
  const boundaries = [
    {
      name: 'Indian Territorial Waters',
      type: 'territorial',
      geometry: {
        type: 'LineString',
        coordinates: [
          [72.5, 18.8],
          [72.8, 18.9],
          [73.2, 19.1],
          [73.0, 19.4],
          [72.6, 19.3],
          [72.5, 18.8]
        ]
      }
    }
  ];

  const getEnvironmentalIcon = (type) => {
    switch (type) {
      case 'sst': return <Thermometer className="w-4 h-4 text-red-500" />;
      case 'chlorophyll': return <div className="w-4 h-4 bg-green-500 rounded-full"></div>;
      case 'wind': return <Wind className="w-4 h-4 text-blue-500" />;
      case 'current': return <Waves className="w-4 h-4 text-cyan-500" />;
      default: return <Fish className="w-4 h-4 text-sky-600" />;
    }
  };

  const getBestZones = () => {
    return fishingZones
      .filter(zone => zone.score >= 0.6)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  const handleLocationChange = (location) => {
    if (onLocationUpdate) {
      onLocationUpdate(location.latitude, location.longitude);
    }
  };

  return (
    <div className="space-y-6">
      {/* Map Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-sky-600" />
                Interactive Fishing Zones Map
              </CardTitle>
              <CardDescription>
                Click on zones to view detailed environmental data. Green zones indicate excellent fishing conditions.
              </CardDescription>
            </div>
            {loading && (
              <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MapComponent
            initialViewState={mapViewState}
            height={500}
            fishingZones={fishingZones}
            currentLocation={userLocation}
            boundaries={boundaries}
            onLocationChange={handleLocationChange}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          />
        </CardContent>
      </Card>

      {/* Zone Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Zones Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700">{fishingZones.length}</div>
            <p className="text-xs text-gray-500">Environmental predictions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Excellent Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {fishingZones.filter(z => z.score >= 0.8).length}
            </div>
            <p className="text-xs text-gray-500">Score ≥ 80%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {fishingZones.length > 0 
                ? Math.round(fishingZones.reduce((sum, z) => sum + z.score, 0) / fishingZones.length * 100)
                : 0}%
            </div>
            <p className="text-xs text-gray-500">Across all zones</p>
          </CardContent>
        </Card>
      </div>

      {/* Best Zones List */}
      {getBestZones().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fish className="w-5 h-5 text-sky-600" />
              Top Recommended Zones
            </CardTitle>
            <CardDescription>
              Best fishing zones based on environmental analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getBestZones().map((zone, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedZone(zone)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-sky-100 text-sky-700 rounded-full font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">
                        Zone {index + 1}
                      </div>
                      <div className="text-sm text-gray-500">
                        {zone.lat.toFixed(4)}°N, {zone.lon.toFixed(4)}°E
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        {getEnvironmentalIcon('sst')}
                        <div className="text-xs mt-1">{Math.round(zone.sst * 100)}%</div>
                      </div>
                      <div className="text-center">
                        {getEnvironmentalIcon('chlorophyll')}
                        <div className="text-xs mt-1">{Math.round(zone.chlorophyll * 100)}%</div>
                      </div>
                      <div className="text-center">
                        {getEnvironmentalIcon('wind')}
                        <div className="text-xs mt-1">{Math.round(zone.wind * 100)}%</div>
                      </div>
                      <div className="text-center">
                        {getEnvironmentalIcon('current')}
                        <div className="text-xs mt-1">{Math.round(zone.current * 100)}%</div>
                      </div>
                    </div>
                    
                    <Badge className={
                      zone.score >= 0.8 ? 'bg-green-100 text-green-800' :
                      zone.score >= 0.6 ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {Math.round(zone.score * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          <strong>Map Usage:</strong> Click on colored zones to view detailed environmental data. 
          Green zones indicate the best fishing conditions based on sea temperature, chlorophyll levels, 
          wind patterns, and ocean currents. Use the location button to center the map on your current position.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default FishingZonesMap;