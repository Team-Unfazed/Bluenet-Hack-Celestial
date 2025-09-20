import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Navigation, AlertTriangle, Ship, Eye, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

const FreeMarineMap = ({
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
  const [zoom, setZoom] = useState(initialViewState.zoom);

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
      // Create more realistic distribution around Mumbai area
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 0.6 + 0.02; // 0.02 to 0.62 degrees (closer to Mumbai)
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

  // Generate mock vessels if none provided
  const mockVessels = vessels.length > 0 ? vessels : generateMockVessels(mapCenter[0], mapCenter[1], 35);

  // Convert lat/lon to pixel coordinates
  const latLonToPixel = (lat, lon, centerLat, centerLon, zoom) => {
    const scale = Math.pow(2, zoom);
    const x = (lon - centerLon) * scale * 256 + 400; // 400 is half width
    const y = (centerLat - lat) * scale * 256 + 300; // 300 is half height
    return { x, y };
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 15));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 3));
  };

  return (
    <div className="w-full relative">
      <div style={{ height: `${height}px`, width: '100%' }} className="relative overflow-hidden rounded-lg">
        {/* Free Marine Map Background with Map-like appearance */}
        <div 
          className="w-full h-full relative"
          style={{
            background: `
              linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #cbd5e1 50%, #94a3b8 75%, #64748b 100%),
              radial-gradient(circle at 30% 30%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
              linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              linear-gradient(-45deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
            `,
            backgroundSize: '100% 100%, 200px 200px, 200px 200px, 300px 300px, 300px 300px'
          }}
        >
          {/* Map-like Features */}
          <div className="absolute inset-0">
            {/* Water Bodies with depth contours */}
            <div className="absolute w-3/4 h-1/2 top-1/4 left-1/8 bg-blue-200 opacity-30 rounded-full">
              {/* Depth contours */}
              <div className="absolute inset-4 border border-blue-400 opacity-20 rounded-full"></div>
              <div className="absolute inset-8 border border-blue-500 opacity-15 rounded-full"></div>
            </div>
            <div className="absolute w-1/2 h-1/3 top-1/6 right-1/6 bg-blue-300 opacity-25 rounded-lg">
              <div className="absolute inset-2 border border-blue-400 opacity-20 rounded-lg"></div>
            </div>
            <div className="absolute w-1/3 h-1/4 bottom-1/4 left-1/4 bg-blue-200 opacity-20 rounded-full">
              <div className="absolute inset-2 border border-blue-400 opacity-20 rounded-full"></div>
            </div>
            
            {/* Roads/Highways */}
            <div className="absolute w-full h-1 bg-yellow-300 opacity-40 top-1/3 transform -rotate-12"></div>
            <div className="absolute w-full h-1 bg-yellow-300 opacity-40 bottom-1/3 transform rotate-12"></div>
            <div className="absolute w-1 h-full bg-yellow-300 opacity-40 left-1/3"></div>
            <div className="absolute w-1 h-full bg-yellow-300 opacity-40 right-1/3"></div>
            
            {/* Land Areas */}
            <div className="absolute w-1/4 h-1/3 top-1/6 left-1/6 bg-green-100 opacity-20 rounded-lg"></div>
            <div className="absolute w-1/3 h-1/4 top-1/2 right-1/6 bg-green-100 opacity-15 rounded-lg"></div>
            <div className="absolute w-1/4 h-1/3 bottom-1/6 left-1/2 bg-green-100 opacity-20 rounded-lg"></div>
            
            {/* Grid Lines */}
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={`h-${i}`} className="absolute w-full h-px bg-gray-400" style={{ top: `${i * 5}%` }} />
              ))}
              {Array.from({ length: 20 }, (_, i) => (
                <div key={`v-${i}`} className="absolute h-full w-px bg-gray-400" style={{ left: `${i * 5}%` }} />
              ))}
            </div>
          </div>

          {/* Vessel Markers */}
          {mockVessels.map((vessel) => {
            const pixelPos = latLonToPixel(vessel.lat, vessel.lon, mapCenter[0], mapCenter[1], zoom);
            const size = getVesselSize(vessel.type);
            const isDanger = vessel.alert_level.level === 'DANGER';
            
            return (
              <div
                key={vessel.id}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${pixelPos.x}px`,
                  top: `${pixelPos.y}px`,
                  zIndex: isDanger ? 20 : 10
                }}
                onClick={() => setSelectedVessel(vessel)}
              >
                {vessel.marker_shape === 'triangle' ? (
                  <div
                    className={`${isDanger ? 'animate-pulse' : ''}`}
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: `${size/2}px solid transparent`,
                      borderRight: `${size/2}px solid transparent`,
                      borderBottom: `${size}px solid ${vessel.marker_color}`,
                      transform: `rotate(${vessel.course}deg)`,
                      filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
                    }}
                  />
                ) : (
                  <div
                    className={`${isDanger ? 'animate-pulse' : ''}`}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: vessel.marker_color,
                      borderRadius: '50%',
                      border: '3px solid white',
                      filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* User Location Marker */}
          {currentLocation && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
              style={{
                left: `${latLonToPixel(currentLocation.lat, currentLocation.lon, mapCenter[0], mapCenter[1], zoom).x}px`,
                top: `${latLonToPixel(currentLocation.lat, currentLocation.lon, mapCenter[0], mapCenter[1], zoom).y}px`,
                zIndex: 30
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  border: '3px solid white',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
                }}
              />
            </div>
          )}

          {/* Map Controls */}
          {showControls && (
            <div className="absolute top-4 right-4 z-50 space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white shadow-md"
                onClick={handleZoomIn}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white shadow-md"
                onClick={handleZoomOut}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Location Labels */}
          <div className="absolute top-1/6 left-1/6 text-xs font-medium text-gray-700 bg-white bg-opacity-70 px-2 py-1 rounded z-40">
            Mumbai Port
          </div>
          <div className="absolute top-1/3 right-1/4 text-xs font-medium text-gray-700 bg-white bg-opacity-70 px-2 py-1 rounded z-40">
            Arabian Sea
          </div>
          <div className="absolute bottom-1/3 left-1/3 text-xs font-medium text-gray-700 bg-white bg-opacity-70 px-2 py-1 rounded z-40">
            Fishing Zone
          </div>
          <div className="absolute top-1/2 right-1/6 text-xs font-medium text-gray-700 bg-white bg-opacity-70 px-2 py-1 rounded z-40">
            Navi Mumbai
          </div>

          {/* Map Info Overlay */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 text-sm z-50">
            <div className="font-semibold text-gray-800">Marine Traffic Map</div>
            <div className="text-gray-600">{mockVessels.length} vessels • Live tracking</div>
            <div className="text-gray-500 text-xs">
              {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)} • Zoom: {zoom}
            </div>
          </div>
        </div>
      </div>

      {/* Vessel Info Panel */}
      {selectedVessel && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50">
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
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs z-50">
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

export default FreeMarineMap;
