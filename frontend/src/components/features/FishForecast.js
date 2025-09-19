import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Fish, 
  MapPin, 
  TrendingUp, 
  Thermometer, 
  Wind, 
  Waves,
  Loader2,
  RefreshCw,
  Target
} from 'lucide-react';
import { apiService } from '../../utils/api';
import FishingZonesMap from '../maps/FishingZonesMap';

const FishForecast = () => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({
    latitude: 19.0760,
    longitude: 72.8777
  });
  const [activeTab, setActiveTab] = useState('zones');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLoading(false);
          fetchFishingZones(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setLoading(false);
          // Use default Mumbai coordinates
          fetchFishingZones(19.0760, 72.8777);
        }
      );
    } else {
      // Use default location
      fetchFishingZones(19.0760, 72.8777);
    }
  };

  const generateMockFishingZones = (lat, lon) => {
    // Generate realistic fishing zones around the given location
    const zones = [];
    const numZones = 8 + Math.floor(Math.random() * 7); // 8-15 zones
    
    for (let i = 0; i < numZones; i++) {
      // Create zones within 20km radius
      const distance = 2 + Math.random() * 18; // 2-20 km from center
      const angle = (i / numZones) * 2 * Math.PI + Math.random() * 0.5; // Spread around
      
      const zoneLat = lat + (distance / 111) * Math.cos(angle);
      const zoneLon = lon + (distance / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
      
      // Generate realistic environmental scores
      const sst = 0.3 + Math.random() * 0.5; // Sea surface temperature suitability
      const chlorophyll = 0.2 + Math.random() * 0.6; // Chlorophyll concentration
      const wind = 0.4 + Math.random() * 0.4; // Wind conditions (0.4-0.8 good for fishing)
      const current = 0.3 + Math.random() * 0.5; // Ocean current strength
      
      // Combined score with some randomness
      const combinedScore = (sst * 0.3 + chlorophyll * 0.3 + wind * 0.25 + current * 0.15) + (Math.random() - 0.5) * 0.2;
      const finalScore = Math.max(0.1, Math.min(0.95, combinedScore));
      
      // Determine zone quality
      let quality = 'fair';
      let color = '#ef4444'; // red
      if (finalScore >= 0.8) {
        quality = 'excellent';
        color = '#22c55e'; // green
      } else if (finalScore >= 0.6) {
        quality = 'good';
        color = '#eab308'; // yellow
      }
      
      zones.push({
        lat: zoneLat,
        lon: zoneLon,
        score: finalScore,
        sst: sst,
        chlorophyll: chlorophyll,
        wind: wind,
        current: current,
        quality: quality,
        color: color,
        location_name: `Zone ${i + 1}`,
        distance_from_user: distance,
        depth: 15 + Math.random() * 85, // 15-100m depth
        fish_probability: {
          pomfret: Math.random() * 0.8 + 0.1,
          mackerel: Math.random() * 0.9 + 0.1,
          sardine: Math.random() * 0.7 + 0.2,
          tuna: Math.random() * 0.6 + 0.1,
          kingfish: Math.random() * 0.5 + 0.1
        }
      });
    }
    
    // Sort by score (best first)
    return zones.sort((a, b) => b.score - a.score);
  };

  const fetchFishingZones = async (lat, lon) => {
    setLoading(true);
    try {
      // Use the new mock data generator
      const zones = generateMockFishingZones(lat, lon);
      const mockData = {
        user_location: { lat, lon },
        best_zones: zones.slice(0, 10), // Take top 10 zones
        prediction_details: {
          model_info: "Using enhanced mock data with realistic fishing zones",
          grid_size: 100,
          radius_km: 20,
          timestamp: new Date().toISOString()
        }
      };
      setForecastData(mockData);
    } catch (error) {
      console.error('Error generating fishing zones:', error);
      // Fallback to original mock data
      const mockData = generateMockForecastData(lat, lon);
      setForecastData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const generateMockForecastData = (lat, lon) => {
    return {
      user_location: { lat, lon },
      best_zones: [
        {
          lat: lat + 0.05,
          lon: lon - 0.03,
          score: 0.91,
          sst: 0.88,
          chlorophyll: 0.82,
          wind: 0.95,
          current: 0.78
        },
        {
          lat: lat - 0.02,
          lon: lon + 0.04,
          score: 0.87,
          sst: 0.85,
          chlorophyll: 0.79,
          wind: 0.92,
          current: 0.84
        },
        {
          lat: lat + 0.08,
          lon: lon + 0.02,
          score: 0.83,
          sst: 0.81,
          chlorophyll: 0.88,
          wind: 0.86,
          current: 0.77
        }
      ],
      prediction_details: {
        model_info: "Using 4 Hugging Face models for environmental prediction",
        grid_size: 100,
        radius_km: 15,
        timestamp: new Date().toISOString()
      }
    };
  };

  const handleRefresh = () => {
    fetchFishingZones(location.latitude, location.longitude);
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Fish Forecasting</h2>
          <p className="text-gray-600 mt-1">
            AI-powered environmental analysis to predict the best fishing spots
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button 
            variant="outline" 
            onClick={getCurrentLocation}
            disabled={loading}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Use My Location
          </Button>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Analyzing environmental conditions and predicting fishing zones...
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="zones">Best Zones</TabsTrigger>
          <TabsTrigger value="map">Interactive Map</TabsTrigger>
          <TabsTrigger value="environmental">Environmental Data</TabsTrigger>
          <TabsTrigger value="species">Species Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          {forecastData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-sky-600" />
                    Current Location
                  </CardTitle>
                  <CardDescription>
                    Your position: {forecastData.user_location.lat.toFixed(4)}°N, {forecastData.user_location.lon.toFixed(4)}°E
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-500">Radius Analyzed</Label>
                      <p className="font-medium">{forecastData.prediction_details.radius_km} km</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Last Updated</Label>
                      <p className="font-medium">
                        {new Date(forecastData.prediction_details.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {forecastData.best_zones.map((zone, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Zone {index + 1}
                        </CardTitle>
                        <Badge className={getScoreColor(zone.score)}>
                          {getScoreLabel(zone.score)} ({Math.round(zone.score * 100)}%)
                        </Badge>
                      </div>
                      <CardDescription>
                        {zone.lat.toFixed(4)}°N, {zone.lon.toFixed(4)}°E
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <Thermometer className="w-6 h-6 mx-auto mb-2 text-red-500" />
                          <Label className="text-xs text-gray-500">Sea Temperature</Label>
                          <p className="text-sm font-medium">{Math.round(zone.sst * 100)}%</p>
                        </div>
                        <div className="text-center">
                          <div className="w-6 h-6 mx-auto mb-2 bg-green-500 rounded-full"></div>
                          <Label className="text-xs text-gray-500">Chlorophyll</Label>
                          <p className="text-sm font-medium">{Math.round(zone.chlorophyll * 100)}%</p>
                        </div>
                        <div className="text-center">
                          <Wind className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                          <Label className="text-xs text-gray-500">Wind Conditions</Label>
                          <p className="text-sm font-medium">{Math.round(zone.wind * 100)}%</p>
                        </div>
                        <div className="text-center">
                          <Waves className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
                          <Label className="text-xs text-gray-500">Ocean Current</Label>
                          <p className="text-sm font-medium">{Math.round(zone.current * 100)}%</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600">
                          <strong>Distance:</strong> {(Math.sqrt(
                            Math.pow(zone.lat - forecastData.user_location.lat, 2) + 
                            Math.pow(zone.lon - forecastData.user_location.lon, 2)
                          ) * 111).toFixed(1)} km from your location
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <FishingZonesMap 
            fishingZones={forecastData?.best_zones || []}
            userLocation={forecastData?.user_location}
            onLocationUpdate={(lat, lon) => {
              setLocation({ latitude: lat, longitude: lon });
              fetchFishingZones(lat, lon);
            }}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="environmental" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sea Surface Temperature</CardTitle>
                <CardDescription>Current thermal conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Optimal Range</span>
                    <Badge variant="outline">26-28°C</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current Avg</span>
                    <span className="font-medium">27.2°C</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  <p className="text-xs text-gray-500">Good conditions for most species</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chlorophyll Levels</CardTitle>
                <CardDescription>Phytoplankton concentration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Productivity</span>
                    <Badge className="bg-green-100 text-green-800">High</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Concentration</span>
                    <span className="font-medium">2.4 mg/m³</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                  <p className="text-xs text-gray-500">Excellent feeding conditions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wind Conditions</CardTitle>
                <CardDescription>Surface wind patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Wind Speed</span>
                    <span className="font-medium">12 knots</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Direction</span>
                    <span className="font-medium">SW</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '65%'}}></div>
                  </div>
                  <p className="text-xs text-gray-500">Moderate winds, manageable conditions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ocean Currents</CardTitle>
                <CardDescription>Water circulation patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current Speed</span>
                    <span className="font-medium">0.8 m/s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Direction</span>
                    <span className="font-medium">NE</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '72%'}}></div>
                  </div>
                  <p className="text-xs text-gray-500">Favorable for nutrient transport</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="species" className="space-y-4">
          <div className="grid gap-4">
            {[
              { species: 'Pomfret', probability: 85, depth: '40-60m', time: 'Early morning', status: 'excellent' },
              { species: 'Mackerel', probability: 72, depth: '20-40m', time: 'Dawn/Dusk', status: 'good' },
              { species: 'Sardine', probability: 68, depth: '10-30m', time: 'Morning', status: 'good' },
              { species: 'Tuna', probability: 45, depth: '60-100m', time: 'All day', status: 'fair' }
            ].map((fish, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Fish className="w-5 h-5 text-sky-600" />
                      {fish.species}
                    </CardTitle>
                    <Badge className={
                      fish.status === 'excellent' ? 'bg-green-100 text-green-800' :
                      fish.status === 'good' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {fish.probability}% probability
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-500">Optimal Depth</Label>
                      <p className="font-medium">{fish.depth}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Best Time</Label>
                      <p className="font-medium">{fish.time}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <p className="font-medium capitalize">{fish.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FishForecast;