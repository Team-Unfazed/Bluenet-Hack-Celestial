import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Fish, 
  Search,
  RefreshCw,
  Loader2,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { apiService } from '../../utils/api';

const MarketPrices = () => {
  const [marketData, setMarketData] = useState({
    recommendations: null,
    priceHistory: [],
    topMarkets: [],
    loading: false
  });
  const [searchForm, setSearchForm] = useState({
    port: 'Mumbai',
    fishType: 'pomfret',
    fishSize: 'medium'
  });
  const [activeTab, setActiveTab] = useState('recommendation');

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setMarketData(prev => ({ ...prev, loading: true }));
      
      console.log('🔍 Fetching mandi data for:', {
        port_name: searchForm.port,
        fish_type: searchForm.fishType,
        fish_size: searchForm.fishSize
      });
      
      // Load market recommendations
      const response = await apiService.getMandiRecommendation({
        port_name: searchForm.port,
        fish_type: searchForm.fishType,
        fish_size: searchForm.fishSize
      });
      
      console.log('✅ Mandi API response:', response.data);
      
      setMarketData(prev => ({
        ...prev,
        recommendations: response.data,
        priceHistory: generateMockPriceHistory(),
        topMarkets: generateMockTopMarkets(),
        loading: false
      }));
    } catch (error) {
      console.error('❌ Failed to load market data:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Show error message to user
      alert(`Failed to fetch market data: ${error.response?.data?.detail || error.message}`);
      
      setMarketData(prev => ({
        ...prev,
        recommendations: generateMockRecommendation(),
        priceHistory: generateMockPriceHistory(),
        topMarkets: generateMockTopMarkets(),
        loading: false
      }));
    }
  };

  const generateMockRecommendation = () => ({
    best_mandi: {
      mandi: "Sassoon Dock, Mumbai",
      state: "Maharashtra",
      price_inr: 485,
      distance_km: 2.3,
      port: "Mumbai"
    },
    all_options: [
      { mandi: "Sassoon Dock", state: "Maharashtra", price_inr: 485, distance_km: 2.3 },
      { mandi: "Crawford Market", state: "Maharashtra", price_inr: 465, distance_km: 3.8 },
      { mandi: "Vashi Market", state: "Maharashtra", price_inr: 445, distance_km: 26.1 }
    ],
    analysis: "Based on the data analysis, Sassoon Dock offers the best net price of ₹485/kg for pomfret from Mumbai port."
  });

  const generateMockPriceHistory = () => {
    const basePrice = 420;
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      price: basePrice + Math.random() * 100 - 50,
      volume: Math.floor(Math.random() * 500) + 200
    }));
  };

  const generateMockTopMarkets = () => [
    { name: "Sassoon Dock", location: "Mumbai", avgPrice: 485, trend: 'up', change: 5.2 },
    { name: "Kasimedu", location: "Chennai", avgPrice: 465, trend: 'up', change: 3.1 },
    { name: "Cochin Harbor", location: "Kochi", avgPrice: 445, trend: 'down', change: -2.8 },
    { name: "Paradip Port", location: "Odisha", avgPrice: 425, trend: 'up', change: 1.5 }
  ];

  const handleSearch = () => {
    loadMarketData();
  };

  const handleFormChange = (field, value) => {
    setSearchForm(prev => ({ ...prev, [field]: value }));
  };

  const fishTypes = ['pomfret', 'tuna', 'mackerel', 'sardine', 'prawn', 'seer fish'];
  const fishSizes = ['small', 'medium', 'large'];
  const ports = ['Mumbai', 'Chennai', 'Kochi', 'Paradip', 'Visakhapatnam', 'Mangalore'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Market Price Intelligence</h2>
          <p className="text-gray-600 mt-1">
            Real-time mandi prices with ML-powered recommendations for maximum profit
          </p>
        </div>
        <Button onClick={handleSearch} disabled={marketData.loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${marketData.loading ? 'animate-spin' : ''}`} />
          Refresh Prices
        </Button>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-sky-600" />
            Find Best Mandi Prices
          </CardTitle>
          <CardDescription>
            Get AI-powered recommendations for best market prices based on your catch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="port">Your Port</Label>
              <Select value={searchForm.port} onValueChange={(value) => handleFormChange('port', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent>
                  {ports.map(port => (
                    <SelectItem key={port} value={port}>{port}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fishType">Fish Type</Label>
              <Select value={searchForm.fishType} onValueChange={(value) => handleFormChange('fishType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fish type" />
                </SelectTrigger>
                <SelectContent>
                  {fishTypes.map(fish => (
                    <SelectItem key={fish} value={fish} className="capitalize">{fish}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fishSize">Fish Size</Label>
              <Select value={searchForm.fishSize} onValueChange={(value) => handleFormChange('fishSize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {fishSizes.map(size => (
                    <SelectItem key={size} value={size} className="capitalize">{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full" disabled={marketData.loading}>
                {marketData.loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Find Best Prices
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recommendation">Best Recommendation</TabsTrigger>
          <TabsTrigger value="markets">Top Markets</TabsTrigger>
          <TabsTrigger value="trends">Price Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendation" className="space-y-4">
          {marketData.recommendations && (
            <>
              {/* Best Mandi Recommendation */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-green-800">
                      🏆 Best Mandi Recommendation
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-800">
                      Highest Profit
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-semibold text-green-800 mb-2">Market Details</h3>
                      <p className="text-lg font-bold text-green-900">
                        {marketData.recommendations.best_mandi.mandi}
                      </p>
                      <p className="text-green-700">
                        {marketData.recommendations.best_mandi.state}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          {marketData.recommendations.best_mandi.distance_km} km away
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-green-800 mb-2">Price Information</h3>
                      <p className="text-3xl font-bold text-green-900">
                        ₹{marketData.recommendations.best_mandi.price_inr}
                      </p>
                      <p className="text-green-700">per kg</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          12% above average
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-green-800 mb-2">AI Analysis</h3>
                      <p className="text-sm text-green-700 leading-relaxed">
                        {marketData.recommendations.analysis}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Options */}
              <Card>
                <CardHeader>
                  <CardTitle>All Market Options</CardTitle>
                  <CardDescription>
                    Compare prices across different mandis for {searchForm.fishType} from {searchForm.port}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketData.recommendations.all_options.map((option, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-green-100 text-green-600' :
                              index === 1 ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900">{option.mandi}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{option.state}</span>
                              <span>• {option.distance_km} km</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">₹{option.price_inr}</p>
                          <p className="text-sm text-gray-500">per kg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="markets" className="space-y-4">
          <div className="grid gap-4">
            {marketData.topMarkets.map((market, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                        <Fish className="w-6 h-6 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{market.name}</h3>
                        <p className="text-sm text-gray-500">{market.location}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">₹{market.avgPrice}</p>
                      <div className="flex items-center gap-1">
                        {market.trend === 'up' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm ${
                          market.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(market.change)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Trends (Last 30 Days)</CardTitle>
              <CardDescription>
                Historical price data for {searchForm.fishType} in {searchForm.port} markets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">₹485</p>
                    <p className="text-sm text-green-700">Current Price</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">₹456</p>
                    <p className="text-sm text-blue-700">30-Day Average</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">+6.4%</p>
                    <p className="text-sm text-orange-700">Price Change</p>
                  </div>
                </div>
                
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Market Insight:</strong> {searchForm.fishType} prices have been trending upward over the past week. 
                    This is a good time to sell your catch for maximum profit.
                  </AlertDescription>
                </Alert>
                
                {/* Simplified price chart visualization */}
                <div className="space-y-2">
                  <h4 className="font-medium">Weekly Price Trend</h4>
                  <div className="flex items-end space-x-1 h-32">
                    {[420, 435, 445, 465, 485, 490, 485].map((price, index) => (
                      <div key={index} className="flex-1 bg-sky-200 rounded-t" style={{
                        height: `${(price - 400) / 100 * 100}%`,
                        minHeight: '20px'
                      }}>
                        <div className="w-full bg-sky-600 rounded-t" style={{
                          height: index === 6 ? '100%' : '80%'
                        }}></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>7 days ago</span>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketPrices;