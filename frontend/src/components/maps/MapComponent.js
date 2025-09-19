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