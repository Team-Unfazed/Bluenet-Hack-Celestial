import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Navigation, AlertTriangle, Fish, Waves, ExternalLink } from 'lucide-react';

const MAPBOX_TOKEN = 'pk.eyJ1IjoicHJhbmF5MDk2IiwiYSI6ImNtZnBlczl5bzA5dW8ybHNjdmc2Y2toOWIifQ.jJSKHO7NHQCRQv7AUxn0kw';

const MapComponent = ({
  initialViewState = {
    longitude: 72.8777,
    latitude: 19.0760,
    zoom: 10
  },
  height = 600,
  fishingZones = [],
  journeyRoute = [],
  currentLocation = null,
  boundaries = [],
  alerts = [],
  onLocationChange = null,
  showControls = true,
  mapStyle = "satellite"
}) => {
  const [selectedZone, setSelectedZone] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (currentLocation) {
      setUserLocation(currentLocation);
    }
  }, [currentLocation]);

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Poor';
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setUserLocation(newLocation);
          if (onLocationChange) {
            onLocationChange({ longitude: newLocation.lon, latitude: newLocation.lat });
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  };

  // Create Mapbox URL for the static map
  const createMapboxStaticUrl = () => {
    const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static';
    const token = 'pk.eyJ1IjoicHJhbmF5MDk2IiwiYSI6ImNtZnBlczl5bzA5dW8ybHNjdmc2Y2toOWIifQ.jJSKHO7NHQCRQv7AUxn0kw';
    
    let overlays = [];
    
    // Add fishing zones as pins
    fishingZones.forEach((zone, index) => {
      const color = zone.score >= 0.8 ? 'green' : zone.score >= 0.6 ? 'yellow' : 'red';
      overlays.push(`pin-s-${index + 1}+${color}(${zone.lon},${zone.lat})`);
    });
    
    // Add current location
    if (currentLocation) {
      overlays.push(`pin-l-marker+blue(${currentLocation.lon},${currentLocation.lat})`);
    }
    
    const center = currentLocation ? 
      `${currentLocation.lon},${currentLocation.lat}` : 
      `${initialViewState.longitude},${initialViewState.latitude}`;
    
    const overlayString = overlays.length > 0 ? overlays.join(',') + '/' : '';
    
    return `${baseUrl}/${overlayString}${center},${initialViewState.zoom}/${800}x${height}?access_token=${token}`;
  };

  return (
    <div className="relative">
      {/* Static Map Display */}
      <div 
        className="relative w-full rounded-lg overflow-hidden border border-gray-200"
        style={{ height: `${height}px` }}
      >
        <img
          src={createMapboxStaticUrl()}
          alt="Fishing zones map"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/800x${height}/0ea5e9/ffffff?text=Interactive+Map+Loading...`;
          }}
        />
        
        {/* Interactive Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-200">
          {/* Zone markers overlay */}
          {fishingZones.map((zone, index) => (
            <div
              key={index}
              className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${50 + (zone.lon - initialViewState.longitude) * 10}%`,
                top: `${50 - (zone.lat - initialViewState.latitude) * 10}%`,
              }}
              onClick={() => setSelectedZone(zone)}
            >
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                zone.score >= 0.8 ? 'bg-green-500' :
                zone.score >= 0.6 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}>
              </div>
            </div>
          ))}
          
          {/* Current location marker */}
          {currentLocation && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${50 + (currentLocation.lon - initialViewState.longitude) * 10}%`,
                top: `${50 - (currentLocation.lat - initialViewState.latitude) * 10}%`,
              }}
            >
              <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse">
                <div className="absolute -top-1 -left-1 w-8 h-8 bg-blue-400 rounded-full opacity-30 animate-ping"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Controls overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-white shadow-lg"
            onClick={getCurrentLocation}
          >
            <MapPin className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"  
            className="bg-white shadow-lg"
            onClick={() => window.open(`https://www.google.com/maps/@${currentLocation?.lat || initialViewState.latitude},${currentLocation?.lon || initialViewState.longitude},12z`, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selected Zone Info Card */}
      {selectedZone && (
        <Card className="absolute top-4 left-4 max-w-sm bg-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Fish className="w-4 h-4 text-sky-600" />
                <span className="font-medium">Fishing Zone</span>
              </div>
              <Badge className={getScoreColor(selectedZone.score)}>
                {getScoreLabel(selectedZone.score)}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Score:</span>
                <span className="font-medium">{Math.round(selectedZone.score * 100)}%</span>
              </div>
              {selectedZone.sst && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sea Temp:</span>
                  <span className="font-medium">{Math.round(selectedZone.sst * 100)}%</span>
                </div>
              )}
              {selectedZone.chlorophyll && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Chlorophyll:</span>
                  <span className="font-medium">{Math.round(selectedZone.chlorophyll * 100)}%</span>
                </div>
              )}
              <div className="pt-2 text-xs text-gray-500">
                {selectedZone.lat.toFixed(4)}°N, {selectedZone.lon.toFixed(4)}°E
              </div>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3"
              onClick={() => setSelectedZone(null)}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <h4 className="font-medium text-sm mb-2">Map Legend</h4>
        <div className="space-y-1 text-xs">
          {fishingZones.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Excellent Fishing Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Good Fishing Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Poor Fishing Zone</span>
              </div>
            </>
          )}
          {journeyRoute.length > 1 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-blue-500"></div>
              <span>Journey Route</span>
            </div>
          )}
          {boundaries.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-red-500 border-dashed border-t"></div>
              <span>Maritime Boundary</span>
            </div>
          )}
          {currentLocation && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span>Current Position</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapComponent;