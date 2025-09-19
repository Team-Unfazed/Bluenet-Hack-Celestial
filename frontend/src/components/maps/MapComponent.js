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
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: `${height}px` }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={handleMapClick}
        cursor="crosshair"
      >
        {/* Fishing Zones Data */}
        {fishingZones.length > 0 && (
          <Source id="fishing-zones" type="geojson" data={fishingZonesGeoJSON}>
            <Layer {...heatmapLayer} />
            <Layer {...pointsLayer} />
          </Source>
        )}

        {/* Journey Route */}
        {journeyRoute.length > 1 && (
          <Source id="journey-route" type="geojson" data={journeyRouteGeoJSON}>
            <Layer {...routeLayer} />
          </Source>
        )}

        {/* Maritime Boundaries */}
        {boundaries.length > 0 && (
          <Source id="boundaries" type="geojson" data={boundariesGeoJSON}>
            <Layer {...boundaryLayer} />
          </Source>
        )}

        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            longitude={currentLocation.lon}
            latitude={currentLocation.lat}
            anchor="center"
          >
            <div className="relative">
              <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              <div className="absolute -top-1 -left-1 w-8 h-8 bg-blue-400 rounded-full opacity-30 animate-ping"></div>
            </div>
          </Marker>
        )}

        {/* User Location Marker */}
        {userLocation && (
          <Marker longitude={userLocation.lon} latitude={userLocation.lat} anchor="center">
            <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow-lg"></div>
          </Marker>
        )}

        {/* Alert Markers */}
        {alerts.map((alert, index) => (
          <Marker
            key={index}
            longitude={alert.location.lon}
            latitude={alert.location.lat}
            anchor="center"
          >
            <div className="w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
          </Marker>
        ))}

        {/* Selected Zone Popup */}
        {selectedZone && (
          <Popup
            longitude={selectedZone.lon}
            latitude={selectedZone.lat}
            anchor="bottom"
            onClose={() => setSelectedZone(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <Card className="border-0 shadow-none min-w-64">
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
              </CardContent>
            </Card>
          </Popup>
        )}

        {/* Map Controls */}
        {showControls && (
          <>
            <NavigationControl position="top-right" />
            <GeolocateControl
              position="top-right"
              positionOptions={{ enableHighAccuracy: true }}
              trackUserLocation={true}
              onGeolocate={handleGeolocate}
            />
          </>
        )}
      </Map>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <h4 className="font-medium text-sm mb-2">Map Legend</h4>
        <div className="space-y-1 text-xs">
          {fishingZones.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Excellent Fishing Zone</span>
            </div>
          )}
          {fishingZones.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Good Fishing Zone</span>
            </div>
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