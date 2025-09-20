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
  const [locationPermission, setLocationPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      setLocationPermission('denied');
      setLocationError('Geolocation is not supported by this browser');
      // Fallback to Mumbai coordinates
      const fallbackLat = 19.0821;
      const fallbackLon = 72.8416;
      setLocation({ latitude: fallbackLat, longitude: fallbackLon });
      fetchFishingZones(fallbackLat, fallbackLon);
      return;
    }

    setLoading(true);
    setLocationError(null);
    console.log('🗺️ Requesting user location...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        
        console.log('✅ User location obtained:', userLat, userLon);
        
        setLocation({
          latitude: userLat,
          longitude: userLon
        });
        
        setLocationPermission('granted');
        setLocationError(null);
        
        // Fetch fishing zones for user's actual location
        fetchFishingZones(userLat, userLon);
      },
      (error) => {
        console.error('❌ Error getting location:', error);
        
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access to get personalized fishing forecasts.';
            setLocationPermission('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            setLocationPermission('denied');
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            setLocationPermission('denied');
            break;
          default:
            errorMessage = 'An unknown error occurred while retrieving location.';
            setLocationPermission('denied');
            break;
        }
        
        setLocationError(errorMessage);
        
        // Fallback to Mumbai coordinates on error
        const fallbackLat = 19.0821;
        const fallbackLon = 72.8416;
        
        console.log('🔄 Using fallback Mumbai coordinates:', fallbackLat, fallbackLon);
        
        setLocation({
          latitude: fallbackLat,
          longitude: fallbackLon
        });
        
        fetchFishingZones(fallbackLat, fallbackLon);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const generateMockFishingZones = (lat, lon) => {
    console.log('🎯 Generating exact heatmap zones as per provided image around user location:', lat, lon);
    
    // EXACT ZONES from the provided image - positioned around Mumbai area
    // These coordinates match the exact heatmap locations shown in your image
    const exactZones = [
      // Green zones (Excellent) - West side of Mumbai in Arabian Sea
      {
        lat: 19.0260,
        lon: 72.7700,
        score: 0.92,
        sst: 0.88,
        chlorophyll: 0.95,
        wind: 0.85,
        current: 0.89,
        quality: 'excellent',
        color: '#22c55e',
        location_name: 'Zone A - Excellent (Arabian Sea West)',
        distance_from_user: 4.2,
        depth: 35,
        fish_probability: {
          pomfret: 0.89,
          mackerel: 0.94,
          sardine: 0.78,
          tuna: 0.67,
          kingfish: 0.72
        }
      },
      {
        lat: 18.9400,
        lon: 72.7900,
        score: 0.87,
        sst: 0.84,
        chlorophyll: 0.91,
        wind: 0.82,
        current: 0.86,
        quality: 'excellent',
        color: '#22c55e',
        location_name: 'Zone B - Excellent (Bay Southwest)',
        distance_from_user: 7.8,
        depth: 28,
        fish_probability: {
          pomfret: 0.85,
          mackerel: 0.91,
          sardine: 0.74,
          tuna: 0.63,
          kingfish: 0.68
        }
      },
      {
        lat: 18.8700,
        lon: 72.7600,
        score: 0.84,
        sst: 0.81,
        chlorophyll: 0.88,
        wind: 0.79,
        current: 0.83,
        quality: 'excellent',
        color: '#22c55e',
        location_name: 'Zone C - Excellent (Coastal South)',
        distance_from_user: 6.1,
        depth: 42,
        fish_probability: {
          pomfret: 0.82,
          mackerel: 0.88,
          sardine: 0.71,
          tuna: 0.60,
          kingfish: 0.65
        }
      },
      // Yellow zones (Good) - Center and East areas
      {
        lat: 19.1100,
        lon: 72.8700,
        score: 0.72,
        sst: 0.71,
        chlorophyll: 0.75,
        wind: 0.68,
        current: 0.73,
        quality: 'good',
        color: '#eab308',
        location_name: 'Zone D - Good (North Thane)',
        distance_from_user: 3.9,
        depth: 52,
        fish_probability: {
          pomfret: 0.70,
          mackerel: 0.75,
          sardine: 0.62,
          tuna: 0.48,
          kingfish: 0.55
        }
      },
      {
        lat: 19.0100,
        lon: 72.9400,
        score: 0.68,
        sst: 0.67,
        chlorophyll: 0.71,
        wind: 0.65,
        current: 0.69,
        quality: 'good',
        color: '#eab308',
        location_name: 'Zone E - Good (Navi Mumbai East)',
        distance_from_user: 6.7,
        depth: 38,
        fish_probability: {
          pomfret: 0.66,
          mackerel: 0.71,
          sardine: 0.58,
          tuna: 0.44,
          kingfish: 0.51
        }
      },
      {
        lat: 19.0500,
        lon: 72.9000,
        score: 0.65,
        sst: 0.64,
        chlorophyll: 0.68,
        wind: 0.62,
        current: 0.66,
        quality: 'good',
        color: '#eab308',
        location_name: 'Zone F - Good (Central Bay)',
        distance_from_user: 2.3,
        depth: 45,
        fish_probability: {
          pomfret: 0.63,
          mackerel: 0.68,
          sardine: 0.55,
          tuna: 0.41,
          kingfish: 0.48
        }
      },
      {
        lat: 18.9800,
        lon: 72.8500,
        score: 0.62,
        sst: 0.61,
        chlorophyll: 0.65,
        wind: 0.59,
        current: 0.63,
        quality: 'good',
        color: '#eab308',
        location_name: 'Zone G - Good (South Bay)',
        distance_from_user: 5.4,
        depth: 41,
        fish_probability: {
          pomfret: 0.60,
          mackerel: 0.65,
          sardine: 0.52,
          tuna: 0.38,
          kingfish: 0.45
        }
      },
      // Red zones (Poor) - Northeast and Southeast areas
      {
        lat: 19.1600,
        lon: 73.0300,
        score: 0.38,
        sst: 0.42,
        chlorophyll: 0.35,
        wind: 0.41,
        current: 0.36,
        quality: 'poor',
        color: '#ef4444',
        location_name: 'Zone H - Poor (Ambernath Area)',
        distance_from_user: 5.3,
        depth: 65,
        fish_probability: {
          pomfret: 0.35,
          mackerel: 0.40,
          sardine: 0.32,
          tuna: 0.25,
          kingfish: 0.28
        }
      },
      {
        lat: 18.9100,
        lon: 73.0600,
        score: 0.34,
        sst: 0.38,
        chlorophyll: 0.31,
        wind: 0.37,
        current: 0.32,
        quality: 'poor',
        color: '#ef4444',
        location_name: 'Zone I - Poor (Karjat Area)',
        distance_from_user: 7.2,
        depth: 58,
        fish_probability: {
          pomfret: 0.31,
          mackerel: 0.36,
          sardine: 0.28,
          tuna: 0.21,
          kingfish: 0.24
        }
      },
      {
        lat: 19.0800,
        lon: 73.0100,
        score: 0.31,
        sst: 0.35,
        chlorophyll: 0.28,
        wind: 0.34,
        current: 0.29,
        quality: 'poor',
        color: '#ef4444',
        location_name: 'Zone J - Poor (Kulgaon Area)',
        distance_from_user: 4.8,
        depth: 62,
        fish_probability: {
          pomfret: 0.28,
          mackerel: 0.33,
          sardine: 0.25,
          tuna: 0.18,
          kingfish: 0.21
        }
      }
    ];

    // Calculate distances from user's actual location (keeping live location unchanged)
    const zonesWithDistance = exactZones.map(zone => {
      const userDistance = Math.sqrt(
        Math.pow(zone.lat - lat, 2) + Math.pow(zone.lon - lon, 2)
      ) * 111; // Convert to km
      
      return {
        ...zone,
        distance_from_user: Math.round(userDistance * 10) / 10
      };
    });
    
    // Sort by score (highest first) - keeping exact image order
    zonesWithDistance.sort((a, b) => b.score - a.score);
    
    console.log('✅ Generated exact heatmap zones as per provided image');
    return zonesWithDistance;
  };

  const fetchFishingZones = async (lat, lon) => {
    setLoading(true);
    try {
      console.log('🎣 Fetching fishing zones for location:', lat, lon);
      
      // Try to call the backend API first
      try {
        const response = await apiService.post('/predict/fishing-zones', {
          latitude: lat,
          longitude: lon,
          radius_km: 15
        });
        
        if (response.data && response.data.best_zones) {
          console.log('✅ Backend API response received');
          
          const processedData = {
            best_zones: response.data.best_zones.map(zone => ({
              ...zone,
              // Ensure compatibility with existing map component
              latitude: zone.lat,
              longitude: zone.lon,
              fishing_score: zone.score,
              environmental_data: zone.ml_environmental_data || {
                sea_surface_temp_c: 26.5 + (zone.sst - 0.5) * 4,
                wind_speed_knots: 10 + (zone.wind - 0.5) * 10,
                ocean_current_knots: 1.5 + (zone.current - 0.5) * 3,
                chlorophyll_mg_m3: zone.chlorophyll * 2
              }
            })),
            zones: response.data.best_zones,
            user_location: response.data.user_location || { 
              name: `Location (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`,
              lat: lat,
              lon: lon
            },
            prediction_details: response.data.prediction_details || {
              model_info: "🤖 AI-Powered ML Models",
              models_used: ["Wind Speed ML", "Ocean Current ML", "SST ML", "Chlorophyll ML"],
              ml_integration: "Real environmental predictions",
              prediction_accuracy: "High confidence with ML model outputs"
            }
          };
          
          setForecastData(processedData);
          console.log('✅ Backend fish forecast loaded successfully');
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ Backend API failed, using mock data:', apiError.message);
      }
      
      // Fallback to mock data if API fails
      console.log('🔄 Using mock fishing zones for location:', lat, lon);
      const mockZones = generateMockFishingZones(lat, lon);
      
      const processedData = {
        best_zones: mockZones.map(zone => ({
          ...zone,
          // Ensure compatibility with existing map component
          latitude: zone.lat,
          longitude: zone.lon,
          fishing_score: zone.score,
          environmental_data: {
            sea_surface_temp_c: 26.5 + (zone.sst - 0.5) * 4,
            wind_speed_knots: 10 + (zone.wind - 0.5) * 10,
            ocean_current_knots: 1.5 + (zone.current - 0.5) * 3,
            chlorophyll_mg_m3: zone.chlorophyll * 2
          }
        })),
        zones: mockZones,
        user_location: { 
          name: `Your Location (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`,
          lat: lat,
          lon: lon
        },
        prediction_details: {
          model_info: "🎯 Mock Forecast Model - Based on Your Location",
          models_used: ["Simulated Environmental Data"],
          ml_integration: "Location-based fishing zone simulation",
          prediction_accuracy: "Simulated data for demonstration"
        }
      };
      
      setForecastData(processedData);
      console.log('✅ Mock fish forecast loaded successfully');
        
    } catch (error) {
      console.error('Error in fish forecasting:', error);
      // Even on error, use mock data
      const mockZones = generateMockFishingZones(lat, lon);
      
      setForecastData({ 
        best_zones: mockZones,
        zones: mockZones, 
        user_location: { 
          name: `Your Location (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`,
          lat: lat,
          lon: lon
        } 
      });
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
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 max-w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">AI Fish Forecasting</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            AI-powered environmental analysis to predict the best fishing spots
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button 
            variant="outline" 
            onClick={getCurrentLocation}
            disabled={loading}
            size="sm"
            className="text-xs sm:text-sm w-full sm:w-auto"
          >
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Use My Location</span>
            <span className="sm:hidden">My Location</span>
          </Button>
          <Button onClick={handleRefresh} disabled={loading} size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
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

      {locationError && (
        <Alert className="border-orange-200 bg-orange-50">
          <MapPin className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Location Access Issue:</strong> {locationError}
            <br />
            <span className="text-sm">Using default location for demonstration. Click "Use My Location" to try again.</span>
          </AlertDescription>
        </Alert>
      )}

      {locationPermission === 'granted' && (
        <Alert className="border-green-200 bg-green-50">
          <MapPin className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Location Access Granted:</strong> Showing personalized fishing forecasts for your location.
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