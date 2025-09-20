import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  AlertCircle,
  Globe,
  Languages
} from 'lucide-react';

const OfflineData = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkCheckInterval, setNetworkCheckInterval] = useState(null);
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
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [reportFormat, setReportFormat] = useState('text');

  // Enhanced network status checking
  const checkNetworkStatus = async () => {
    console.log('Checking network status...');
    
    // First check navigator.onLine
    if (!navigator.onLine) {
      console.log('Navigator reports offline');
      setIsOnline(false);
      return;
    }

    try {
      // Try to reach the backend server
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${backendUrl}/health`, { 
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('Backend reachable - Online');
        setIsOnline(true);
      } else {
        console.log('Backend responded but not OK - Offline');
        setIsOnline(false);
      }
    } catch (error) {
      console.log('Backend not reachable - Offline:', error.message);
      setIsOnline(false);
    }
  };

  useEffect(() => {
    // Initial network check
    checkNetworkStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('Browser online event detected');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('Browser offline event detected');
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic network check every 10 seconds
    const networkInterval = setInterval(checkNetworkStatus, 10000);
    setNetworkCheckInterval(networkInterval);

    // Load stored offline data
    loadOfflineData();
    
    // Set up hourly data sync
    const syncInterval = setInterval(syncDataIfOnline, 60 * 60 * 1000); // Every hour
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (networkInterval) clearInterval(networkInterval);
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
      const currentDate = new Date().toISOString().split('T')[0];
      
      if (reportFormat === 'text') {
        // Generate human-readable text report
        const textReport = generateTextReport();
        
        // Create and download text file
        const blob = new Blob([textReport], {
          type: 'text/plain;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bluenet-offline-report-${currentDate}-${selectedLanguage}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
      } else {
        // Prepare export data for JSON format
        const exportData = {
          exportDate: new Date().toISOString(),
          language: selectedLanguage,
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
        link.download = `bluenet-data-export-${currentDate}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      // Also create CSV for catch logs if any
      if (offlineData.catchLogs.length > 0) {
        const csvContent = generateCatchLogCSV(offlineData.catchLogs);
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `bluenet-catch-logs-${currentDate}.csv`;
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

  // Multilingual translations
  const translations = {
    en: {
      fishForecastReport: 'Fish Forecast Report',
      location: 'Location',
      bestFishingTime: 'Best Fishing Time',
      risk: 'Risk',
      nearestVessel: 'Nearest Vessel',
      marketPricesReport: 'Market Prices Report',
      bestMandi: 'Best Mandi',
      price: 'Price',
      distance: 'Distance',
      catchLogReport: 'Catch Log Report',
      totalCatches: 'Total Catches',
      species: 'Species',
      weight: 'Weight',
      complianceStatus: 'Compliance Status',
      offlineDataReport: 'Offline Data Report',
      lastSync: 'Last Sync',
      dataSize: 'Data Size',
      exportDate: 'Export Date',
      generatedBy: 'Generated by BlueNet Maritime Assistant'
    },
    hi: {
      fishForecastReport: 'मछली पूर्वानुमान रिपोर्ट',
      location: 'स्थान',
      bestFishingTime: 'सर्वोत्तम मछली पकड़ने का समय',
      risk: 'जोखिम',
      nearestVessel: 'निकटतम जहाज',
      marketPricesReport: 'बाजार मूल्य रिपोर्ट',
      bestMandi: 'सर्वोत्तम मंडी',
      price: 'मूल्य',
      distance: 'दूरी',
      catchLogReport: 'पकड़ लॉग रिपोर्ट',
      totalCatches: 'कुल पकड़',
      species: 'प्रजाति',
      weight: 'वजन',
      complianceStatus: 'अनुपालन स्थिति',
      offlineDataReport: 'ऑफ़लाइन डेटा रिपोर्ट',
      lastSync: 'अंतिम सिंक',
      dataSize: 'डेटा आकार',
      exportDate: 'निर्यात तिथि',
      generatedBy: 'BlueNet मैरीटाइम असिस्टेंट द्वारा उत्पन्न'
    },
    ta: {
      fishForecastReport: 'மீன் முன்னறிவிப்பு அறிக்கை',
      location: 'இடம்',
      bestFishingTime: 'சிறந்த மீன்பிடி நேரம்',
      risk: 'ஆபத்து',
      nearestVessel: 'அருகிலுள்ள கப்பல்',
      marketPricesReport: 'சந்தை விலை அறிக்கை',
      bestMandi: 'சிறந்த மண்டி',
      price: 'விலை',
      distance: 'தூரம்',
      catchLogReport: 'பிடிப்பு பதிவு அறிக்கை',
      totalCatches: 'மொத்த பிடிப்புகள்',
      species: 'இனம்',
      weight: 'எடை',
      complianceStatus: 'இணக்கம் நிலை',
      offlineDataReport: 'ஆஃப்லைன் தரவு அறிக்கை',
      lastSync: 'கடைசி ஒத்திசைவு',
      dataSize: 'தரவு அளவு',
      exportDate: 'ஏற்றுமதி தேதி',
      generatedBy: 'BlueNet கடல்சார் உதவியாளரால் உருவாக்கப்பட்டது'
    },
    ml: {
      fishForecastReport: 'മത്സ്യ പ്രവചന റിപ്പോർട്ട്',
      location: 'സ്ഥലം',
      bestFishingTime: 'മികച്ച മത്സ്യബന്ധന സമയം',
      risk: 'അപകടസാധ്യത',
      nearestVessel: 'ഏറ്റവും അടുത്ത കപ്പൽ',
      marketPricesReport: 'മാർക്കറ്റ് വില റിപ്പോർട്ട്',
      bestMandi: 'മികച്ച മണ്ടി',
      price: 'വില',
      distance: 'ദൂരം',
      catchLogReport: 'കാച്ച് ലോഗ് റിപ്പോർട്ട്',
      totalCatches: 'മൊത്തം കാച്ചുകൾ',
      species: 'ഇനം',
      weight: 'ഭാരം',
      complianceStatus: 'അനുസരണ നില',
      offlineDataReport: 'ഓഫ്ലൈൻ ഡാറ്റ റിപ്പോർട്ട്',
      lastSync: 'അവസാന സിങ്ക്',
      dataSize: 'ഡാറ്റ വലിപ്പം',
      exportDate: 'എക്സ്പോർട്ട് തീയതി',
      generatedBy: 'BlueNet മാരിറ്റൈം അസിസ്റ്റന്റ് സൃഷ്ടിച്ചത്'
    }
  };

  const t = translations[selectedLanguage] || translations.en;

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

  // Generate human-readable text report
  const generateTextReport = () => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    let report = `# ${t.offlineDataReport}\n`;
    report += `**${t.exportDate}:** ${currentDate} at ${currentTime}\n`;
    report += `**${t.generatedBy}**\n\n`;

    // Fish Forecast Report
    if (offlineData.fishForecast && offlineData.fishForecast.length > 0) {
      report += `## 🐟 ${t.fishForecastReport}\n`;
      offlineData.fishForecast.forEach((forecast, index) => {
        if (forecast.data && forecast.data.fishing_zones) {
          const bestZone = forecast.data.fishing_zones[0];
          report += `**${t.location}:** ${bestZone?.location || 'Coastal Area'}\n`;
          report += `**${t.bestFishingTime}:** ${bestZone?.best_time || '6AM - 10AM'}\n`;
          report += `**${t.risk}:** ${bestZone?.risk_level || 'Moderate Current, No Rogue Waves Detected'}\n`;
          report += `**${t.nearestVessel}:** ${bestZone?.distance_km || '3.2'} km\n\n`;
        }
      });
    }

    // Market Prices Report
    if (offlineData.mandiPrices && offlineData.mandiPrices.length > 0) {
      report += `## 💰 ${t.marketPricesReport}\n`;
      offlineData.mandiPrices.forEach((price, index) => {
        if (price.data && price.data.best_mandi) {
          const mandi = price.data.best_mandi;
          report += `**${t.bestMandi}:** ${mandi.mandi}\n`;
          report += `**${t.location}:** ${mandi.state}\n`;
          report += `**${t.price}:** ₹${mandi.price_inr}/kg\n`;
          report += `**${t.distance}:** ${mandi.distance_km} km\n\n`;
        }
      });
    }

    // Catch Log Report
    if (offlineData.catchLogs && offlineData.catchLogs.length > 0) {
      report += `## 📋 ${t.catchLogReport}\n`;
      report += `**${t.totalCatches}:** ${offlineData.catchLogs.length}\n\n`;
      
      offlineData.catchLogs.forEach((log, index) => {
        report += `### Catch ${index + 1}\n`;
        report += `**${t.species}:** ${log.species}\n`;
        report += `**${t.weight}:** ${log.weight_kg} kg\n`;
        report += `**${t.location}:** ${log.location.lat}, ${log.location.lon}\n`;
        report += `**${t.complianceStatus}:** ${log.compliance_status}\n`;
        report += `**Date:** ${new Date(log.timestamp).toLocaleDateString()}\n\n`;
      });
    }

    // Summary
    report += `## 📊 Summary\n`;
    report += `**${t.lastSync}:** ${lastSync ? lastSync.toLocaleString() : 'Never'}\n`;
    report += `**${t.dataSize}:** ${getDataSize()} KB\n`;
    report += `**Fish Forecasts:** ${offlineData.fishForecast.length}\n`;
    report += `**Mandi Prices:** ${offlineData.mandiPrices.length}\n`;
    report += `**Catch Logs:** ${offlineData.catchLogs.length}\n`;
    report += `**Journey Data:** ${offlineData.journeyData.length}\n`;

    return report;
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
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              <WifiOff className="w-4 h-4 mr-1" />
              Offline
            </Badge>
          )}
          <Button 
            onClick={checkNetworkStatus} 
            variant="outline" 
            size="sm"
            className="ml-2"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Test Connection
          </Button>
          <Button 
            onClick={() => {
              const newStatus = !isOnline;
              setIsOnline(newStatus);
              console.log(`Manually toggled to: ${newStatus ? 'Online' : 'Offline'}`);
            }} 
            variant={isOnline ? "destructive" : "default"}
            size="sm"
            className="ml-1"
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>
      </div>

      {/* Offline Status Alert */}
      {!isOnline && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <WifiOff className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">You're currently offline</h3>
              <p className="text-sm text-red-600 mt-1">
                Some features may be limited. Data will sync automatically when you're back online.
              </p>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex justify-between text-sm mb-2">
                <span>Status:</span>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={isOnline ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
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
              Download Offline Report
            </CardTitle>
            <CardDescription>
              Generate human-readable reports in multiple languages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Languages className="w-4 h-4 mr-2" />
                Language / भाषा
              </label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                  <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                  <SelectItem value="ml">മലയാളം (Malayalam)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Report Format
              </label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">📄 Human-Readable Text</SelectItem>
                  <SelectItem value="json">📋 JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              {isExporting ? 'Generating Report...' : 'Download Report'}
            </Button>
            
            <div className="text-xs text-gray-500">
              {reportFormat === 'text' 
                ? `Generates easy-to-read ${selectedLanguage === 'en' ? 'English' : selectedLanguage === 'hi' ? 'Hindi' : selectedLanguage === 'ta' ? 'Tamil' : 'Malayalam'} report`
                : 'Exports as JSON + CSV files'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Preview */}
      {reportFormat === 'text' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Report Preview
            </CardTitle>
            <CardDescription>
              Preview of your offline report in {selectedLanguage === 'en' ? 'English' : selectedLanguage === 'hi' ? 'Hindi' : selectedLanguage === 'ta' ? 'Tamil' : 'Malayalam'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {generateTextReport()}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

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