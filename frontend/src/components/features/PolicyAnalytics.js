import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Fish,
  MapPin,
  Calendar,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const PolicyAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalCatch: 15420,
      sustainabilityIndex: 78.5,
      complianceRate: 94.2,
      activePolicies: 23
    },
    trends: {
      catchVolume: [
        { month: 'Jan', volume: 1245, compliance: 92 },
        { month: 'Feb', volume: 1356, compliance: 94 },
        { month: 'Mar', volume: 1289, compliance: 91 },
        { month: 'Apr', volume: 1487, compliance: 95 },
        { month: 'May', volume: 1623, compliance: 96 },
        { month: 'Jun', volume: 1534, compliance: 93 }
      ]
    },
    policies: [
      {
        id: 'POL001',
        name: 'Seasonal Fishing Ban - Hilsa',
        status: 'active',
        coverage: 'Maharashtra, West Bengal',
        compliance: 87,
        effectiveness: 'high',
        startDate: '2025-06-01',
        endDate: '2025-08-31'
      },
      {
        id: 'POL002', 
        name: 'Juvenile Fish Protection',
        status: 'active',
        coverage: 'All Coastal States',
        compliance: 92,
        effectiveness: 'medium',
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      },
      {
        id: 'POL003',
        name: 'Deep Sea Trawling Regulations',
        status: 'under_review',
        coverage: 'Gujarat, Tamil Nadu',
        compliance: 78,
        effectiveness: 'low',
        startDate: '2025-03-15',
        endDate: '2025-12-31'
      }
    ],
    sustainability: [
      { species: 'Pomfret', status: 'sustainable', trend: 'stable', biomass: 85 },
      { species: 'Tuna', status: 'at_risk', trend: 'declining', biomass: 45 }, 
      { species: 'Sardine', status: 'sustainable', trend: 'improving', biomass: 72 },
      { species: 'Mackerel', status: 'overfished', trend: 'declining', biomass: 28 }
    ]
  });

  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffectivenessColor = (effectiveness) => {
    switch (effectiveness) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSustainabilityColor = (status) => {
    switch (status) {
      case 'sustainable': return 'bg-green-100 text-green-800';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800';
      case 'overfished': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportReport = () => {
    // Mock export functionality
    console.log('Exporting policy analytics report...');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Policy Analytics</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive analysis of fishing policies, compliance, and sustainability metrics
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="maharashtra">Maharashtra</SelectItem>
              <SelectItem value="tamilnadu">Tamil Nadu</SelectItem>
              <SelectItem value="kerala">Kerala</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Catch</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalCatch.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              tons this year
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sustainability Index</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analyticsData.overview.sustainabilityIndex}</div>
            <p className="text-xs text-muted-foreground">
              +2.3% from last year
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">
              above target
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.activePolicies}</div>
            <p className="text-xs text-muted-foreground">
              currently enforced
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList>
          <TabsTrigger value="policies">Policy Performance</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
          <TabsTrigger value="trends">Catch Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <div className="grid gap-4">
            {analyticsData.policies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{policy.name}</CardTitle>
                      <CardDescription>
                        {policy.id} • Coverage: {policy.coverage}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(policy.status)}>
                        {policy.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Compliance Rate</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${policy.compliance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold">{policy.compliance}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Effectiveness</p>
                      <p className={`text-sm font-bold ${getEffectivenessColor(policy.effectiveness)}`}>
                        {policy.effectiveness.toUpperCase()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Duration</p>
                      <div className="flex items-center space-x-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        <span>{policy.startDate} to {policy.endDate}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sustainability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Species Sustainability Overview</CardTitle>
              <CardDescription>
                Current status and trends for key fish species based on catch data and biomass assessments
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            {analyticsData.sustainability.map((species, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Fish className="w-5 h-5 text-sky-600" />
                      {species.species}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSustainabilityColor(species.status)}>
                        {species.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {species.trend === 'improving' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : species.trend === 'declining' ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Biomass Index</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${
                              species.biomass >= 70 ? 'bg-green-500' :
                              species.biomass >= 40 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${species.biomass}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold">{species.biomass}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Population Trend</p>
                      <p className={`text-sm font-bold capitalize ${
                        species.trend === 'improving' ? 'text-green-600' :
                        species.trend === 'declining' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {species.trend}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                      <p className={`text-sm font-bold ${
                        species.status === 'sustainable' ? 'text-green-600' :
                        species.status === 'at_risk' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {species.status.replace('_', ' ').toUpperCase()}
                      </p>
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
              <CardTitle>Catch Volume & Compliance Trends</CardTitle>
              <CardDescription>
                Monthly analysis of catch volumes and compliance rates across all regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Simplified trend visualization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Catch Volume Trend</h4>
                    <div className="space-y-2">
                      {analyticsData.trends.catchVolume.map((data, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{data.month}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(data.volume / 1800) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-12">{data.volume}t</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Compliance Trend</h4>
                    <div className="space-y-2">
                      {analyticsData.trends.catchVolume.map((data, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{data.month}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${data.compliance}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-8">{data.compliance}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">8,290</p>
                      <p className="text-sm text-blue-700">Total Catch (tons)</p>
                      <p className="text-xs text-blue-600">Last 6 months</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">93.5%</p>
                      <p className="text-sm text-green-700">Avg Compliance</p>
                      <p className="text-xs text-green-600">Last 6 months</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">+5.2%</p>
                      <p className="text-sm text-orange-700">Growth Rate</p>
                      <p className="text-xs text-orange-600">vs. previous period</p>
                    </div>
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

export default PolicyAnalytics;