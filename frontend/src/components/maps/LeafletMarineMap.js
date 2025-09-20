import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Navigation, AlertTriangle, Ship, Eye, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LeafletMarineMap = ({
  initialViewState = { longitude: 72.8777, latitude: 19.0760, zoom: 8 },
  height = 500,
  currentLocation = null,
  vessels = [],
  onLocationChange = () => {},
  showControls = true,
  mapStyle = "marine"
}) => {
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [mapCenter, setMapCenter] = useState([initialViewState.latitude, initialViewState.longitude]);

  // Generate realistic mock marine traffic data
  const generateMockVessels = (centerLat, centerLon, count = 35) => {
    const vesselTypes = [
      { type: 'Cargo', names: ['MV Mumbai Express', 'MV Arabian Sea', 'MV Indian Ocean', 'MV Bay of Bengal', 'MV Lakshadweep'] },
      { type: 'Tanker', names: ['MT Oil Pioneer', 'MT Crude Carrier', 'MT Petroleum Star', 'MT Fuel Master', 'MT Energy Voyager'] },
      { type: 'Fishing', names: ['FV Sea Harvest', 'FV Ocean Bounty', 'FV Fish Master', 'FV Deep Sea', 'FV Coastal Catcher'] },
      { type: 'Passenger', names: ['MV Ferry Express', 'MV Coastal Cruiser', 'MV Island Hopper', 'MV Bay Ferry', 'MV Harbor Shuttle'] },
      { type: 'Other', names: ['MV Survey Vessel', 'MV Research Ship', 'MV Patrol Boat', 'MV Support Vessel', 'MV Utility Craft'] }
    ];
    
    const mockVessels = [];

    for (let i = 0; i < count; i++) {
      // Create more realistic distribution around the center
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 0.8 + 0.05; // 0.05 to 0.85 degrees (more spread)
      const lat = centerLat + distance * Math.cos(angle);
      const lon = centerLon + distance * Math.sin(angle);
      
      const vesselTypeData = vesselTypes[Math.floor(Math.random() * vesselTypes.length)];
      const vesselType = vesselTypeData.type;
      const vesselName = vesselTypeData.names[Math.floor(Math.random() * vesselTypeData.names.length)];
      
      const isMoving = Math.random() > 0.3; // 70% moving, 30% stationary
      const speed = isMoving ? Math.random() * 18 + 2 : 0; // 2-20 knots for moving
      const course = isMoving ? Math.random() * 360 : 0;
      
      // More realistic distance calculation
      const distance_km = Math.sqrt(
        Math.pow((lat - centerLat) * 111, 2) + 
        Math.pow((lon - centerLon) * 111 * Math.cos(centerLat * Math.PI / 180), 2)
      );
      
      // More realistic alert levels based on distance and speed
      let alertLevel = 'SAFE';
      if (distance_km < 2 && speed > 10) {
        alertLevel = 'DANGER';
      } else if (distance_km < 5 && speed > 5) {
        alertLevel = 'WARNING';
      }
      
      mockVessels.push({
        id: `vessel_${i}`,
        name: vesselName,
        type: vesselType,
        lat: lat,
        lon: lon,
        speed: speed,
        course: course,
        status: isMoving ? 'Moving' : 'Stationary',
        mmsi: `1234567${String(i).padStart(3, '0')}`,
        distance_km: distance_km,
        alert_level: {
          level: alertLevel
        },
        marker_color: getVesselColor(vesselType, isMoving ? 'Moving' : 'Stationary'),
        marker_shape: isMoving ? 'triangle' : 'circle'
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
      case 'Tanker': return 20;
      case 'Cargo': return 16;
      case 'Passenger': return 14;
      case 'Fishing': return 12;
      default: return 14;
    }
  };

  // Create custom vessel icons
  const createVesselIcon = (vessel) => {
    const size = getVesselSize(vessel.type);
    const color = vessel.marker_color;
    const isDanger = vessel.alert_level.level === 'DANGER';
    
    let iconHtml;
    if (vessel.marker_shape === 'triangle') {
      // Triangle for moving vessels
      iconHtml = `
        <div style="
          width: 0;
          height: 0;
          border-left: ${size/2}px solid transparent;
          border-right: ${size/2}px solid transparent;
          border-bottom: ${size}px solid ${color};
          transform: rotate(${vessel.course}deg);
          filter: drop-shadow(2px 2px 6px rgba(0,0,0,0.4));
          ${isDanger ? 'animation: pulse-danger 1.5s infinite;' : ''}
        "></div>
        ${isDanger ? `
          <style>
            @keyframes pulse-danger {
              0% { transform: rotate(${vessel.course}deg) scale(1); opacity: 1; }
              50% { transform: rotate(${vessel.course}deg) scale(1.3); opacity: 0.7; }
              100% { transform: rotate(${vessel.course}deg) scale(1); opacity: 1; }
            }
          </style>
        ` : ''}
      `;
    } else {
      // Circle for stationary vessels
      iconHtml = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border-radius: 50%;
          border: 3px solid white;
          filter: drop-shadow(2px 2px 6px rgba(0,0,0,0.4));
          ${isDanger ? 'animation: pulse-danger 1.5s infinite;' : ''}
        "></div>
        ${isDanger ? `
          <style>
            @keyframes pulse-danger {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.3); opacity: 0.7; }
              100% { transform: scale(1); opacity: 1; }
            }
          </style>
        ` : ''}
      `;
    }

    return L.divIcon({
      html: iconHtml,
      className: 'custom-vessel-icon',
      iconSize: [size + 4, size + 4],
      iconAnchor: [(size + 4)/2, (size + 4)/2],
    });
  };

  // Create user location icon
  const createUserIcon = () => {
    const iconHtml = `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #3b82f6;
        border-radius: 50%;
        border: 3px solid white;
        animation: pulse 2s infinite;
        filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-user-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  // Generate mock vessels if none provided
  const mockVessels = vessels.length > 0 ? vessels : generateMockVessels(mapCenter[0], mapCenter[1], 25);

  // Map controls component
  const MapControls = () => {
    const map = useMap();

    const zoomIn = () => {
      map.zoomIn();
    };

    const zoomOut = () => {
      map.zoomOut();
    };

    return (
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <Button
          size="sm"
          variant="outline"
          className="bg-white shadow-md"
          onClick={zoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-white shadow-md"
          onClick={zoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full relative">
      <div style={{ height: `${height}px`, width: '100%' }}>
        <MapContainer
          center={mapCenter}
          zoom={initialViewState.zoom}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
        >
          {/* Free OpenStreetMap tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Free marine chart overlay */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
            opacity={0.4}
          />

          {/* Vessel markers */}
          {mockVessels.map((vessel) => (
            <Marker
              key={vessel.id}
              position={[vessel.lat, vessel.lon]}
              icon={createVesselIcon(vessel)}
              eventHandlers={{
                click: () => setSelectedVessel(vessel),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900 mb-2">{vessel.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{vessel.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">{vessel.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed:</span>
                      <span className="font-medium">{vessel.speed.toFixed(1)} knots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Course:</span>
                      <span className="font-medium">{vessel.course.toFixed(0)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-medium">{vessel.distance_km.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Alert Level:</span>
                      <Badge 
                        variant={vessel.alert_level.level === 'DANGER' ? 'destructive' : 
                                vessel.alert_level.level === 'WARNING' ? 'default' : 'secondary'}
                      >
                        {vessel.alert_level.level}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* User location marker */}
          {currentLocation && (
            <Marker
              position={[currentLocation.lat, currentLocation.lon]}
              icon={createUserIcon()}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-blue-600 mb-1">Your Location</h3>
                  <p className="text-sm text-gray-600">
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Map controls */}
          {showControls && <MapControls />}
        </MapContainer>
      </div>

      {/* Vessel Info Panel */}
      {selectedVessel && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-[1000]">
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
            <div className="flex justify-between items-center">
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
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs z-[1000]">
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
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
            <span>Your Location</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t text-gray-500">
          <p>🔺 Moving vessels</p>
          <p>⭕ Stationary vessels</p>
        </div>
      </div>
    </div>
  );
};

export default LeafletMarineMap;
