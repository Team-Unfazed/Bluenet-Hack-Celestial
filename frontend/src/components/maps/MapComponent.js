import React, { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Navigation, AlertTriangle, Fish, Waves, ExternalLink, Ship } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoicHJhbmF5MDk2IiwiYSI6ImNtZnBlczl5bzA5dW8ybHNjdmc2Y2toOWIifQ.jJSKHO7NHQCRQv7AUxn0kw';

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
  mapStyle = "mapbox://styles/mapbox/satellite-streets-v12"
}) => {
  const mapRef = useRef();
  const [viewState, setViewState] = useState(initialViewState);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    if (currentLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: currentLocation.lon,
        latitude: currentLocation.lat
      }));
    }
  }, [currentLocation]);

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#22c55e'; // green
    if (score >= 0.6) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const getScoreLabel = (score) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Poor';
  };

  const handleGeolocate = (e) => {
    if (onLocationChange) {
      onLocationChange({ longitude: e.coords.longitude, latitude: e.coords.latitude });
    }
  };

  // Create GeoJSON for fishing zones heatmap
  const fishingZonesGeoJSON = {
    type: 'FeatureCollection',
    features: fishingZones.map((zone, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [zone.lon, zone.lat]
      },
      properties: {
        id: index,
        score: zone.score || 0.5,
        sst: zone.sst || 0,
        chlorophyll: zone.chlorophyll || 0,
        wind: zone.wind || 0,
        current: zone.current || 0,
        location_name: zone.location_name || `Zone ${index + 1}`
      }
    }))
  };

  // Heatmap layer style
  const heatmapLayer = {
    id: 'fishing-zones-heatmap',
    type: 'heatmap',
    source: 'fishing-zones',
    maxzoom: 15,
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'score'], 0, 0, 1, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, 'rgb(103,169,207)',
        0.4, 'rgb(209,229,240)',
        0.6, 'rgb(253,219,199)',
        0.8, 'rgb(239,138,98)',
        1, 'rgb(178,24,43)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 0]
    }
  };

  // Points layer for fishing zones
  const pointsLayer = {
    id: 'fishing-zones-points',
    type: 'circle',
    source: 'fishing-zones',
    minzoom: 10,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'score'], 0, 6, 1, 14],
      'circle-color': [
        'case',
        ['>=', ['get', 'score'], 0.8], '#22c55e',
        ['>=', ['get', 'score'], 0.6], '#eab308',
        '#ef4444'
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': 0.8
    }
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
      >
        {/* Fishing Zones Heatmap */}
        {fishingZones.length > 0 && (
          <Source id="fishing-zones" type="geojson" data={fishingZonesGeoJSON}>
            <Layer {...heatmapLayer} />
            <Layer {...pointsLayer} />
          </Source>
        )}

        {/* Vessel Markers */}
        {fishingZones.map((vessel, index) => (
          <Marker
            key={index}
            longitude={vessel.lon}
            latitude={vessel.lat}
            anchor="center"
            onClick={() => setSelectedZone(vessel)}
          >
            {vessel.marker_shape === 'triangle' ? (
              // Moving vessel - triangle/arrow shape
              <div 
                className="cursor-pointer hover:scale-110 transition-transform"
                style={{ 
                  width: vessel.size === 'large' ? '12px' : vessel.size === 'medium' ? '10px' : '8px',
                  height: vessel.size === 'large' ? '12px' : vessel.size === 'medium' ? '10px' : '8px',
                  transform: `rotate(${vessel.course_degrees || 0}deg)`
                }}
              >
                <div 
                  className="w-full h-full"
                  style={{
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    backgroundColor: vessel.marker_color || getScoreColor(vessel.score),
                    border: '1px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                />
              </div>
            ) : (
              // Stationary vessel - circle shape
              <div 
                className="cursor-pointer hover:scale-110 transition-transform"
                style={{ 
                  width: vessel.size === 'large' ? '12px' : vessel.size === 'medium' ? '10px' : '8px',
                  height: vessel.size === 'large' ? '12px' : vessel.size === 'medium' ? '10px' : '8px'
                }}
              >
                <div 
                  className="w-full h-full rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: vessel.marker_color || getScoreColor(vessel.score) }}
                />
              </div>
            )}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
              {vessel.location_name || `Vessel ${index + 1}`}
            </div>
          </Marker>
        ))}

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

        {/* Selected Zone/Vessel Popup */}
        {selectedZone && (
          <Popup
            longitude={selectedZone.lon}
            latitude={selectedZone.lat}
            anchor="bottom"
            onClose={() => setSelectedZone(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-3 min-w-64">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {selectedZone.vessel_type ? (
                    <Ship className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Fish className="w-4 h-4 text-sky-600" />
                  )}
                  <span className="font-medium">{selectedZone.location_name || 'Zone'}</span>
                </div>
                <Badge className={`${getScoreColor(selectedZone.score) === '#22c55e' ? 'bg-green-100 text-green-800' : 
                  getScoreColor(selectedZone.score) === '#eab308' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}`}>
                  {selectedZone.alert_level || getScoreLabel(selectedZone.score)}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                {selectedZone.vessel_type ? (
                  // Vessel information
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vessel Type:</span>
                      <span className="font-medium">{selectedZone.vessel_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed:</span>
                      <span className="font-medium">{selectedZone.speed_knots?.toFixed(1)} kts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Course:</span>
                      <span className="font-medium">{selectedZone.course_degrees?.toFixed(0)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-medium">{selectedZone.distance_km?.toFixed(2)} km</span>
                    </div>
                  </>
                ) : (
                  // Fishing zone information
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Overall Score:</span>
                      <span className="font-medium">{Math.round(selectedZone.score * 100)}%</span>
                    </div>
                    {selectedZone.sst !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sea Temperature:</span>
                        <span className="font-medium">{Math.round(selectedZone.sst * 100)}%</span>
                      </div>
                    )}
                    {selectedZone.chlorophyll !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Chlorophyll:</span>
                        <span className="font-medium">{Math.round(selectedZone.chlorophyll * 100)}%</span>
                      </div>
                    )}
                    {selectedZone.wind !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wind Conditions:</span>
                        <span className="font-medium">{Math.round(selectedZone.wind * 100)}%</span>
                      </div>
                    )}
                    {selectedZone.current !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ocean Current:</span>
                        <span className="font-medium">{Math.round(selectedZone.current * 100)}%</span>
                      </div>
                    )}
                  </>
                )}
                <div className="pt-2 text-xs text-gray-500">
                  {selectedZone.lat.toFixed(4)}°N, {selectedZone.lon.toFixed(4)}°E
                </div>
              </div>
            </div>
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
        <h4 className="font-medium text-sm mb-2">Marine Traffic Legend</h4>
        <div className="space-y-1 text-xs">
          {fishingZones.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Cargo Vessels</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Tankers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Fishing Vessels</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Passenger Ships</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Tugs & Others</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', backgroundColor: '#3b82f6'}}></div>
                <span>Moving Vessels (Triangles)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Stationary Vessels (Circles)</span>
              </div>
            </>
          )}
          {currentLocation && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Your Location</span>
            </div>
          )}
          <div className="pt-2 text-xs text-gray-400">
            Click on vessels for details • Colors indicate vessel type
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;