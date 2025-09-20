import React from 'react';
import LeafletMarineMap from './LeafletMarineMap';

const LeafletMapTest = () => {
  const testLocation = {
    lat: 19.0760,
    lon: 72.8777
  };

  const testVessels = [
    {
      id: 'test_vessel_1',
      name: 'MV Test Cargo',
      type: 'Cargo',
      lat: 19.1,
      lon: 72.9,
      speed: 12.5,
      course: 45,
      status: 'Moving',
      mmsi: '123456789',
      distance_km: 5.2,
      alert_level: { level: 'SAFE' },
      marker_color: '#3b82f6',
      marker_shape: 'triangle'
    },
    {
      id: 'test_vessel_2',
      name: 'MT Test Tanker',
      type: 'Tanker',
      lat: 19.05,
      lon: 72.85,
      speed: 0,
      course: 0,
      status: 'Stationary',
      mmsi: '123456790',
      distance_km: 2.1,
      alert_level: { level: 'WARNING' },
      marker_color: '#ef4444',
      marker_shape: 'circle'
    }
  ];

  return (
    <div className="w-full h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Leaflet Marine Map Test</h1>
      <div className="border rounded-lg overflow-hidden">
        <LeafletMarineMap
          initialViewState={{
            longitude: testLocation.lon,
            latitude: testLocation.lat,
            zoom: 10
          }}
          height={600}
          currentLocation={testLocation}
          vessels={testVessels}
          showControls={true}
          mapStyle="marine"
        />
      </div>
    </div>
  );
};

export default LeafletMapTest;
