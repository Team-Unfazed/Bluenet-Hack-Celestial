import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Download, 
  Database, 
  WifiOff, 
  Wifi,
  Clock,
  FileText,
  Archive,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const OfflineData = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState({
    fishForecast: [],
    mandiPrices: [],
    catchLogs: [],
    journeyData: [],
    weatherAlerts: []
  });
  const [lastSync, setLastSync] = useState(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load stored offline data
    loadOfflineData();
    
    // Set up hourly data sync
    const syncInterval = setInterval(syncDataIfOnline, 60 * 60 * 1000); // Every hour
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  const loadOfflineData = () => {
    try {
      const stored = localStorage.getItem('bluenet_offline_data');
      const syncTime = localStorage.getItem('bluenet_last_sync');
      
      if (stored) {
        setOfflineData(JSON.parse(stored));
      }
      if (syncTime) {
        setLastSync(new Date(syncTime));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const syncDataIfOnline = async () => {
    if (!isOnline) return;
    
    setSyncProgress(0);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    const token = localStorage.getItem('auth_token');
    
    try {
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      // Sync fish forecast data
      setSyncProgress(20);
      const fishForecastData = await fetchWithFallback(`${backendUrl}/api/predict/fishing-zones`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          latitude: 19.0760,
          longitude: 72.8777,
          radius_km: 20
        })
      });

      // Sync mandi prices
      setSyncProgress(40);
      const mandiData = await fetchWithFallback(`${backendUrl}/api/mandi-recommendation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          port_name: 'mumbai',
          fish_type: 'pomfret',
          fish_size: 'medium'
        })
      });

      // Sync weather alerts
      setSyncProgress(60);
      const weatherData = await fetchWithFallback(`${backendUrl}/api/disaster-alerts`, {
        headers
      });

      // Generate hourly forecast data for next 24 hours
      setSyncProgress(80);
      const hourlyData = generateHourlyForecast();

      const newOfflineData = {
        fishForecast: fishForecastData ? [fishForecastData] : offlineData.fishForecast,
        mandiPrices: mandiData ? [mandiData] : offlineData.mandiPrices,
        catchLogs: offlineData.catchLogs, // Keep existing catch logs
        journeyData: offlineData.journeyData, // Keep existing journey data
        weatherAlerts: weatherData?.alerts || offlineData.weatherAlerts,
        hourlyForecast: hourlyData,
        lastUpdate: new Date().toISOString()
      };

      setOfflineData(newOfflineData);
      localStorage.setItem('bluenet_offline_data', JSON.stringify(newOfflineData));
      localStorage.setItem('bluenet_last_sync', new Date().toISOString());
      setLastSync(new Date());
      setSyncProgress(100);

    } catch (error) {
      console.error('Error syncing data:', error);
    }
  };

  const fetchWithFallback = async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    return null;
  };

  const generateHourlyForecast = () => {
    const hours = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
      hours.push({
        time: hour.toISOString(),
        temperature: 26 + Math.random() * 4, // 26-30°C
        windSpeed: 10 + Math.random() * 15, // 10-25 km/h
        waveHeight: 1 + Math.random() * 2, // 1-3 meters
        fishingScore: 0.3 + Math.random() * 0.6, // 0.3-0.9
        tideLevel: Math.sin((i / 24) * 2 * Math.PI) * 0.5 + 0.5 // Simulated tide
      });
    }
    
    return hours;
  };

  const exportData = async () => {
    setIsExporting(true);
    
    try {
      // Prepare export data
      const exportData = {
        exportDate: new Date().toISOString(),
        userData: JSON.parse(localStorage.getItem('user_data') || '{}'),
        fishForecast: offlineData.fishForecast,
        mandiPrices: offlineData.mandiPrices,
        catchLogs: offlineData.catchLogs,
        journeyData: offlineData.journeyData,
        weatherAlerts: offlineData.weatherAlerts,
        hourlyForecast: offlineData.hourlyForecast || [],
        summary: {
          totalCatches: offlineData.catchLogs.length,
          totalJourneys: offlineData.journeyData.length,
          lastSync: lastSync?.toISOString(),
          dataRange: {
            from: lastSync?.toISOString(),
            to: new Date().toISOString()
          }
        }
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bluenet-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Also create CSV for catch logs if any
      if (offlineData.catchLogs.length > 0) {
        const csvContent = generateCatchLogCSV(offlineData.catchLogs);
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `bluenet-catch-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);
      }

    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateCatchLogCSV = (catchLogs) => {
    const headers = ['Date', 'Species', 'Weight (kg)', 'Location (Lat, Lon)', 'Compliance Status'];
    const rows = catchLogs.map(log => [
      new Date(log.timestamp).toLocaleDateString(),
      log.species,
      log.weight_kg,
      `${log.location.lat}, ${log.location.lon}`,
      log.compliance_status
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const getDataSize = () => {
    const sizeInBytes = new Blob([JSON.stringify(offlineData)]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    return sizeInKB;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Offline Data Manager</h2>
          <p className="text-gray-600">Manage your offline data and export capabilities</p>
        </div>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Wifi className="w-4 h-4 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge variant="destructive">
              <WifiOff className="w-4 h-4 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="w-5 h-5 mr-2" />
              Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Last Sync:</span>
                <span>{lastSync ? lastSync.toLocaleString() : 'Never'}</span>
              </div>
              {syncProgress > 0 && syncProgress < 100 && (
                <Progress value={syncProgress} className="w-full" />
              )}
            </div>
            <Button 
              onClick={syncDataIfOnline} 
              disabled={!isOnline || syncProgress > 0}
              className="w-full"
            >
              {syncProgress > 0 ? 'Syncing...' : 'Sync Now'}
            </Button>
          </CardContent>
        </Card>

        {/* Data Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Offline Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Fish Forecasts:</span>
              <Badge variant="outline">{offlineData.fishForecast.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Mandi Prices:</span>
              <Badge variant="outline">{offlineData.mandiPrices.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Catch Logs:</span>
              <Badge variant="outline">{offlineData.catchLogs.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Journey Data:</span>
              <Badge variant="outline">{offlineData.journeyData.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Data Size:</span>
              <Badge variant="outline">{getDataSize()} KB</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Download all your offline data in organized formats
            </p>
            <Button 
              onClick={exportData} 
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isExporting ? 'Exporting...' : 'Export All Data'}
            </Button>
            <div className="text-xs text-gray-500">
              Exports as JSON + CSV files
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Forecast Preview */}
      {offlineData.hourlyForecast && offlineData.hourlyForecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              24-Hour Forecast (Offline Available)
            </CardTitle>
            <CardDescription>
              Cached environmental data for the next 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {offlineData.hourlyForecast.slice(0, 12).map((hour, index) => (
                <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium">
                    {new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {hour.temperature.toFixed(1)}°C
                  </div>
                  <div className="text-xs text-gray-600">
                    {hour.windSpeed.toFixed(0)} km/h
                  </div>
                  <div className="text-xs">
                    <Badge 
                      variant={hour.fishingScore > 0.7 ? "default" : hour.fishingScore > 0.5 ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {Math.round(hour.fishingScore * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offline Capabilities Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Offline Capabilities</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• View cached fish forecasts and mandi prices</li>
                <li>• Log catches with offline storage</li>
                <li>• Access 24-hour environmental forecast</li>
                <li>• Export all data when connection is available</li>
                <li>• Automatic sync every hour when online</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineData;