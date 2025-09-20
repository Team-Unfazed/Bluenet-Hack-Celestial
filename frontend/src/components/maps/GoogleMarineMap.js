import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Navigation, AlertTriangle, Ship, Eye, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

const GoogleMarineMap = ({
  initialViewState = { longitude: 72.8777, latitude: 19.0760, zoom: 8 },
  height = 500,
  currentLocation = null,
  vessels = [],
  onLocationChange = () => {},
  showControls = true,
  mapStyle = "marine"
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: initialViewState.latitude,
    lon: initialViewState.longitude
  });

  // Google Maps API key - you'll need to replace this with your actual API key
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
  
  // Check if API key is configured
  const isApiKeyConfigured = GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY';

  // Generate mock marine traffic data
  const generateMockVessels = (centerLat, centerLon, count = 20) => {
    const vesselTypes = ['Cargo', 'Tanker', 'Fishing', 'Passenger', 'Other'];
    const statuses = ['Moving', 'Stationary'];
    const mockVessels = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const distance = Math.random() * 0.5 + 0.1; // 0.1 to 0.6 degrees
      const lat = centerLat + distance * Math.cos(angle);
      const lon = centerLon + distance * Math.sin(angle);
      
      const vesselType = vesselTypes[Math.floor(Math.random() * vesselTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const speed = status === 'Moving' ? Math.random() * 15 + 5 : 0;
      const course = Math.random() * 360;
      
      mockVessels.push({
        id: `vessel_${i}`,
        name: `${vesselType} Vessel ${i + 1}`,
        type: vesselType,
        lat: lat,
        lon: lon,
        speed: speed,
        course: course,
        status: status,
        mmsi: `12345678${i}`,
        distance_km: Math.random() * 50 + 1,
        alert_level: {
          level: Math.random() > 0.8 ? 'DANGER' : Math.random() > 0.6 ? 'WARNING' : 'SAFE'
        },
        marker_color: getVesselColor(vesselType, status),
        marker_shape: status === 'Moving' ? 'triangle' : 'circle'
      });
    }

    return mockVessels;
  };

  const getVesselColor = (type, status) => {
    if (status === 'Stationary') return '#6b7280'; // Gray for stationary
    switch (type) {
      case 'Cargo': return '#3b82f6'; // Blue
      case 'Tanker': return '#ef4444'; // Red
      case 'Fishing': return '#10b981'; // Green
      case 'Passenger': return '#f59e0b'; // Yellow
      default: return '#8b5cf6'; // Purple
    }
  };

  const getVesselSize = (type) => {
    switch (type) {
      case 'Tanker': return 12;
      case 'Cargo': return 10;
      case 'Passenger': return 8;
      case 'Fishing': return 6;
      default: return 8;
    }
  };

  const render = (status) => {
    if (!isApiKeyConfigured) {
      return (
        <div className="flex items-center justify-center h-full bg-yellow-50 rounded-lg border-2 border-yellow-200">
          <div className="text-center p-6">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Google Maps API Key Required</h3>
            <p className="text-yellow-700 mb-4">
              To use Google Maps, you need to configure your API key.
            </p>
            <div className="text-sm text-yellow-600 text-left bg-yellow-100 p-3 rounded">
              <p className="font-semibold mb-2">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Get API key from Google Cloud Console</li>
                <li>Enable Maps JavaScript API</li>
                <li>Create .env file in frontend directory</li>
                <li>Add: REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here</li>
                <li>Restart the development server</li>
              </ol>
            </div>
            <p className="text-xs text-yellow-600 mt-3">
              Currently showing custom marine map. Click "Custom Map" button to toggle.
            </p>
          </div>
        </div>
      );
    }

    switch (status) {
      case Status.LOADING:
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        );
      case Status.FAILURE:
        return (
          <div className="flex items-center justify-center h-full bg-red-50 rounded-lg">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <p className="text-red-600 mb-2">Failed to load Google Maps</p>
              <p className="text-sm text-gray-600">Please check your API key configuration</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const MapComponent = () => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);

    useEffect(() => {
      if (mapRef.current && !map) {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: mapCenter.lat, lng: mapCenter.lon },
          zoom: initialViewState.zoom,
          mapTypeId: 'satellite', // Use satellite view for marine context
          styles: [
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#1e3a8a' }]
            },
            {
              featureType: 'land',
              elementType: 'geometry',
              stylers: [{ color: '#f0f9ff' }]
            }
          ],
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true
        });
        setMap(mapInstance);
      }
    }, [mapRef, map, mapCenter, initialViewState.zoom]);

    useEffect(() => {
      if (map && vessels.length > 0) {
        // Clear existing markers
        markers.forEach(marker => marker.setMap(null));
        
        const newMarkers = vessels.map(vessel => {
          const position = { lat: vessel.lat, lng: vessel.lon };
          
          // Create custom marker icon
          const icon = {
            path: vessel.marker_shape === 'triangle' 
              ? 'M 0,0 L 0,20 L 17.32,10 z' // Triangle for moving vessels
              : 'M 10,0 A 10,10 0 1,1 0,10 A 10,10 0 1,1 10,0 z', // Circle for stationary
            fillColor: vessel.marker_color,
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: getVesselSize(vessel.type),
            rotation: vessel.marker_shape === 'triangle' ? vessel.course : 0,
            anchor: new window.google.maps.Point(10, 10)
          };

          const marker = new window.google.maps.Marker({
            position: position,
            map: map,
            icon: icon,
            title: vessel.name,
            animation: vessel.alert_level.level === 'DANGER' 
              ? window.google.maps.Animation.BOUNCE 
              : null
          });

          // Add click listener
          marker.addListener('click', () => {
            setSelectedVessel(vessel);
          });

          return marker;
        });

        setMarkers(newMarkers);
      }
    }, [map, vessels]);

    // Add user location marker
    useEffect(() => {
      if (map && currentLocation) {
        const userMarker = new window.google.maps.Marker({
          position: { lat: currentLocation.lat, lng: currentLocation.lon },
          map: map,
          icon: {
            path: 'M 0,0 A 10,10 0 1,1 0,20 A 10,10 0 1,1 0,0 z',
            fillColor: '#3b82f6',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 1.5
          },
          title: 'Your Location',
          animation: window.google.maps.Animation.BOUNCE
        });

        return () => {
          userMarker.setMap(null);
        };
      }
    }, [map, currentLocation]);

    return (
      <div className="relative">
        <div ref={mapRef} style={{ height: `${height}px`, width: '100%' }} />
        
        {/* Map Controls */}
        {showControls && (
          <div className="absolute top-4 right-4 space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white shadow-md"
              onClick={() => {
                if (map) {
                  map.setZoom(map.getZoom() + 1);
                }
              }}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white shadow-md"
              onClick={() => {
                if (map) {
                  map.setZoom(map.getZoom() - 1);
                }
              }}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Vessel Info Panel */}
        {selectedVessel && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{selectedVessel.name}</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedVessel(null)}
              >
                ×
              </Button>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{selectedVessel.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{selectedVessel.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Speed:</span>
                <span className="font-medium">{selectedVessel.speed.toFixed(1)} knots</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Course:</span>
                <span className="font-medium">{selectedVessel.course.toFixed(0)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium">{selectedVessel.distance_km.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alert Level:</span>
                <Badge 
                  variant={selectedVessel.alert_level.level === 'DANGER' ? 'destructive' : 
                          selectedVessel.alert_level.level === 'WARNING' ? 'default' : 'secondary'}
                >
                  {selectedVessel.alert_level.level}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
          <h4 className="font-semibold mb-2">Vessel Types</h4>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Cargo</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Tanker</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Fishing</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Passenger</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
              <span>Stationary</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Generate mock vessels if none provided
  const mockVessels = vessels.length > 0 ? vessels : generateMockVessels(mapCenter.lat, mapCenter.lon, 25);

  return (
    <div className="w-full">
      {isApiKeyConfigured ? (
        <Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render}>
          <MapComponent />
        </Wrapper>
      ) : (
        render()
      )}
    </div>
  );
};

export default GoogleMarineMap;
