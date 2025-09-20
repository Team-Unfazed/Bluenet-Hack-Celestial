import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Navigation, AlertTriangle, Fish, Waves, ExternalLink, Ship, Eye, ZoomIn, ZoomOut } from 'lucide-react';

const MarineMapComponent = ({
  initialViewState = { longitude: 72.8777, latitude: 19.0760, zoom: 8 },
  height = 500,
  currentLocation = null,
  fishingZones = [],
  onLocationChange = () => {},
  showControls = true,
  mapStyle = "marine"
}) => {
  const mapRef = useRef(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: initialViewState.latitude,
    lon: initialViewState.longitude
  });

  useEffect(() => {
    // Create a simple marine map with vessel tracking
    if (mapRef.current) {
      const createMarineMap = () => {
        const mapContainer = mapRef.current;
        mapContainer.innerHTML = `
          <div style="
            width: 100%; 
            height: 100%; 
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%);
            position: relative;
            overflow: hidden;
            border-radius: 8px;
          ">
            <!-- Simple Grid Pattern -->
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: 
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
              background-size: 40px 40px;
            "></div>
            
            <!-- Vessel Markers Container -->
            <div id="vessel-markers" style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              pointer-events: none;
            "></div>
            
            <!-- User Location Marker -->
            <div id="user-location" style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 16px;
              height: 16px;
              background: #3b82f6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
              animation: pulse 2s infinite;
              pointer-events: none;
            "></div>
            
            <!-- Map Info Overlay -->
            <div style="
              position: absolute;
              top: 16px;
              left: 16px;
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 12px;
              font-family: Arial, sans-serif;
            ">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span>🌊</span>
                <span>Marine Traffic Map</span>
              </div>
              <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">
                ${fishingZones.length} vessels • Live tracking
              </div>
            </div>
            
            <!-- Coordinates Display -->
            <div style="
              position: absolute;
              bottom: 16px;
              right: 16px;
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              font-size: 11px;
              font-family: monospace;
            ">
              ${mapCenter.lat.toFixed(4)}°N, ${mapCenter.lon.toFixed(4)}°E
            </div>
            
            <style>
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
              }
              
              .vessel-marker {
                position: absolute;
                cursor: pointer;
                transition: all 0.3s ease;
                pointer-events: auto;
              }
              
              .vessel-marker:hover {
                transform: scale(1.2);
                z-index: 10;
              }
              
              .vessel-triangle {
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-bottom: 12px solid;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
              }
              
              .vessel-circle {
                border-radius: 50%;
                border: 2px solid white;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
              }
              
              .vessel-label {
                position: absolute;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
              }
              
              .vessel-marker:hover .vessel-label {
                opacity: 1;
              }
            </style>
          </div>
        `;
        
        // Add vessel markers
        addVesselMarkers();
      };
      
      createMarineMap();
    }
  }, [fishingZones, mapCenter]);

  const addVesselMarkers = () => {
    const markersContainer = document.getElementById('vessel-markers');
    if (!markersContainer) return;
    
    // Clear existing markers
    markersContainer.innerHTML = '';
    
    fishingZones.forEach((vessel, index) => {
      // Calculate position based on distance from user
      const maxDistance = 50; // km
      const distanceRatio = Math.min(vessel.distance_km / maxDistance, 1);
      
      // Random angle for realistic distribution
      const angle = (Math.random() * 2 * Math.PI);
      const radius = distanceRatio * 40; // Max 40% from center
      
      const x = 50 + (radius * Math.cos(angle));
      const y = 50 + (radius * Math.sin(angle));
      
      const marker = document.createElement('div');
      marker.className = 'vessel-marker';
      marker.style.left = `${x}%`;
      marker.style.top = `${y}%`;
      marker.style.transform = 'translate(-50%, -50%)';
      
      const isMoving = vessel.marker_shape === 'triangle';
      const color = vessel.marker_color || '#3b82f6';
      const size = vessel.size === 'large' ? 16 : vessel.size === 'medium' ? 12 : 8;
      
      if (isMoving) {
        marker.innerHTML = `
          <div class="vessel-triangle" style="border-bottom-color: ${color}; width: ${size}px; height: ${size}px; transform: rotate(${vessel.course_degrees || 0}deg);"></div>
          <div class="vessel-label">${vessel.name}</div>
        `;
      } else {
        marker.innerHTML = `
          <div class="vessel-circle" style="width: ${size}px; height: ${size}px; background-color: ${color};"></div>
          <div class="vessel-label">${vessel.name}</div>
        `;
      }
      
      // Add click handler
      marker.addEventListener('click', () => {
        setSelectedZone(vessel);
      });
      
      markersContainer.appendChild(marker);
    });
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#22c55e'; // Green
    if (score >= 0.6) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Fair';
  };

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      {/* Marine Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden border border-gray-200"
        style={{ minHeight: `${height}px`, maxHeight: '100vh' }}
      />

      {/* Marine Map Legend */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-white rounded-lg shadow-lg p-2 sm:p-3 max-w-xs z-10">
        <h4 className="font-medium text-xs sm:text-sm mb-1 sm:mb-2">Marine Traffic Legend</h4>
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
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', backgroundColor: '#3b82f6'}}></div>
                <span>Moving Vessels</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Stationary Vessels</span>
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
            Click on vessels for details • Marine charts overlay
          </div>
        </div>
      </div>

      {/* Vessel Details Popup */}
      {selectedZone && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white rounded-lg shadow-lg p-3 sm:p-4 max-w-xs sm:max-w-sm border border-gray-200 z-20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {selectedZone.vessel_type ? (
                <Ship className="w-4 h-4 text-blue-600" />
              ) : (
                <Fish className="w-4 h-4 text-sky-600" />
              )}
              <span className="font-medium">{selectedZone.location_name || 'Vessel'}</span>
            </div>
            <Badge className={`${
              selectedZone.alert_level === 'DANGER' ? 'bg-red-100 text-red-800' :
              selectedZone.alert_level === 'WARNING' ? 'bg-orange-100 text-orange-800' :
              'bg-green-100 text-green-800'
            }`}>
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
                <div className="flex justify-between">
                  <span className="text-gray-600">MMSI:</span>
                  <span className="font-medium">{selectedZone.mmsi || 'N/A'}</span>
                </div>
              </>
            ) : (
              // Fishing zone information
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overall Score:</span>
                  <span className="font-medium">{Math.round(selectedZone.score * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sea Temperature:</span>
                  <span className="font-medium">{Math.round((selectedZone.sst || 0.5) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chlorophyll:</span>
                  <span className="font-medium">{Math.round((selectedZone.chlorophyll || 0.5) * 100)}%</span>
                </div>
              </>
            )}
            <div className="pt-2 text-xs text-gray-500">
              {selectedZone.lat.toFixed(4)}°N, {selectedZone.lon.toFixed(4)}°E
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={() => setSelectedZone(null)}
          >
            Close
          </Button>
        </div>
      )}

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-1 sm:gap-2 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Zoom in functionality
              console.log('Zoom in');
            }}
            className="bg-white shadow-md"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Zoom out functionality
              console.log('Zoom out');
            }}
            className="bg-white shadow-md"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Marine Chart Info */}
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white bg-opacity-90 rounded-lg px-2 py-1 sm:px-3 sm:py-2 text-xs text-gray-600 z-10">
        <div className="flex items-center gap-2">
          <Waves className="w-3 h-3" />
          <span>Marine Charts</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Custom Marine Map
        </div>
      </div>
    </div>
  );
};

export default MarineMapComponent;