import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Fish, 
  TrendingUp, 
  Navigation as NavigationIcon, 
  MessageSquare, 
  BarChart3, 
  AlertTriangle,
  Waves,
  MapPin,
  Users,
  Shield,
  Camera,
  Database,
  Globe
} from 'lucide-react';

// Import feature components
import FishForecast from './features/FishForecast';
import MarketPrices from './features/MarketPrices';
import JourneyTracking from './features/JourneyTracking';
import AIAssistant from './features/AIAssistant';
import ComplianceMonitoring from './features/ComplianceMonitoring';
import PolicyAnalytics from './features/PolicyAnalytics';
import CatchLogger from './features/CatchLogger';
import OfflineData from './features/OfflineData';
import MaritimeSafety from './features/MaritimeSafety';

import { useApp } from '../contexts/AppContext';
import { apiService } from '../utils/api';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [dashboardData, setDashboardData] = useState({
    alerts: [],
    stats: {},
    loading: true
  });

  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load dashboard data
      const [alertsResponse] = await Promise.all([
        apiService.getDisasterAlerts().catch(() => ({ data: { alerts: [] } }))
      ]);

      setDashboardData({
        alerts: alertsResponse.data.alerts || [],
        stats: generateMockStats(),
        loading: false
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardData({
        alerts: [],
        stats: generateMockStats(),
        loading: false
      });
    }
  };

  const generateMockStats = () => {
    if (currentUser?.role === 'policymaker') {
      return {
        totalVessels: 2847,
        activeJourneys: 156,
        complianceRate: 94.2,
        alertsToday: 12
      };
    } else {
      return {
        totalCatches: 127,
        bestPrice: 485,
        safetyScore: 98,
        journeysCompleted: 34
      };
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const renderOverview = () => {
    if (currentUser?.role === 'policymaker') {
      return <PolicymakerOverview stats={dashboardData.stats} alerts={dashboardData.alerts} />;
    } else {
      return <FishermanOverview stats={dashboardData.stats} alerts={dashboardData.alerts} />;
    }
  };

  const tabs = currentUser?.role === 'policymaker' 
    ? [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'compliance', label: 'Compliance', icon: AlertTriangle },
        { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
        { id: 'offline', label: 'Offline Data', icon: Database }
      ]
    : [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'maritime', label: 'Maritime Safety', icon: Shield },
        { id: 'forecast', label: 'Fish Forecast', icon: Fish },
        { id: 'market', label: 'Market Prices', icon: TrendingUp },
        { id: 'journey', label: 'Journey Track', icon: NavigationIcon },
        { id: 'catch', label: 'Catch Logger', icon: Camera },
        { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
        { id: 'offline', label: 'Offline Data', icon: Database }
      ];

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {currentUser?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            {currentUser?.role === 'policymaker' 
              ? 'Monitor fishing activities and compliance across all regions'
              : 'Your smart fishing assistant powered by AI technology'
            }
          </p>
        </div>

        {/* Active alerts */}
        {dashboardData.alerts.length > 0 && (
          <div className="mb-6">
            {dashboardData.alerts.slice(0, 2).map((alert, index) => (
              <Alert key={index} className={`mb-2 ${
                alert.severity === 'high' ? 'border-red-200 bg-red-50' :
                alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <AlertTriangle className={`h-4 w-4 ${
                  alert.severity === 'high' ? 'text-red-600' :
                  alert.severity === 'medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <AlertDescription className="font-medium">
                  {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Dashboard tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="maritime" className="space-y-6">
            <MaritimeSafety />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <FishForecast />
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <MarketPrices />
          </TabsContent>

          <TabsContent value="journey" className="space-y-6">
            <JourneyTracking />
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6">
            <AIAssistant />
          </TabsContent>

          <TabsContent value="catch" className="space-y-6">
            <CatchLogger />
          </TabsContent>

          <TabsContent value="offline" className="space-y-6">
            <OfflineData />
          </TabsContent>

          {currentUser?.role === 'policymaker' && (
            <>
              <TabsContent value="analytics" className="space-y-6">
                <PolicyAnalytics />
              </TabsContent>

              <TabsContent value="compliance" className="space-y-6">
                <ComplianceMonitoring />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

// Fisherman Overview Component
const FishermanOverview = ({ stats, alerts }) => {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Catches</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCatches}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.bestPrice}</div>
            <p className="text-xs text-muted-foreground">
              per kg today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.safetyScore}%</div>
            <p className="text-xs text-muted-foreground">
              Excellent rating
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Journeys</CardTitle>
            <NavigationIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.journeysCompleted}</div>
            <p className="text-xs text-muted-foreground">
              This quarter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Recommendations</CardTitle>
            <CardDescription>AI-powered insights for optimal fishing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-100 text-green-800">High Probability</Badge>
              <span className="text-sm">Pomfret at 15.2°N, 74.1°E</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-800">Best Price</Badge>
              <span className="text-sm">Sassoon Dock - ₹485/kg</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-yellow-100 text-yellow-800">Weather Alert</Badge>
              <span className="text-sm">Moderate winds expected</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest fishing operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Journey completed - 2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Catch logged - 4 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Price alert triggered - 6 hours ago</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Policymaker Overview Component
const PolicymakerOverview = ({ stats, alerts }) => {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vessels</CardTitle>
            <NavigationIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVessels}</div>
            <p className="text-xs text-muted-foreground">
              Registered vessels
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Journeys</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJourneys}</div>
            <p className="text-xs text-muted-foreground">
              Currently at sea
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Above target
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alertsToday}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Policy insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Summary</CardTitle>
            <CardDescription>Regional compliance monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Maharashtra</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full">
                  <div className="w-3/4 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium">94%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Tamil Nadu</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full">
                  <div className="w-4/5 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium">96%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Kerala</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full">
                  <div className="w-2/3 h-2 bg-yellow-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium">89%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Critical Issues</CardTitle>
            <CardDescription>Issues requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Badge variant="destructive">High</Badge>
              <span className="text-sm">Boundary violations in sector 7</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
              <span className="text-sm">Juvenile catch reports increasing</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-800">Info</Badge>
              <span className="text-sm">New seasonal ban starting next week</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;