import React, { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Navigation, AlertTriangle, Fish, Waves, ExternalLink } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoicHJhbmF5MDk2IiwiYSI6ImNtZnBlczl5bzA5dW8ybHNjdmc2Y2toOWIifQ.jJSKHO7NHQCRQv7AUxn0kw';

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

        {/* Fishing Zone Markers */}
        {fishingZones.map((zone, index) => (
          <Marker
            key={index}
            longitude={zone.lon}
            latitude={zone.lat}
            anchor="center"
            onClick={() => setSelectedZone(zone)}
          >
            <div 
              className="w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: getScoreColor(zone.score) }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                {zone.location_name || `Zone ${index + 1}`}
              </div>
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
            <div className="p-3 min-w-64">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Fish className="w-4 h-4 text-sky-600" />
                  <span className="font-medium">{selectedZone.location_name || 'Fishing Zone'}</span>
                </div>
                <Badge className={`${getScoreColor(selectedZone.score) === '#22c55e' ? 'bg-green-100 text-green-800' : 
                  getScoreColor(selectedZone.score) === '#eab308' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}`}>
                  {getScoreLabel(selectedZone.score)}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
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
        <h4 className="font-medium text-sm mb-2">Map Legend</h4>
        <div className="space-y-1 text-xs">
          {fishingZones.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Excellent Fishing Zone (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Good Fishing Zone (60-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Fair Fishing Zone (<60%)</span>
              </div>
            </>
          )}
          {currentLocation && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span>Your Location</span>
            </div>
          )}
          <div className="pt-2 text-xs text-gray-400">
            Click on zones for details
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;