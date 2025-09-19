import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Fish,
  MapPin,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';

const ComplianceMonitoring = () => {
  const [complianceData, setComplianceData] = useState({
    overview: {
      totalVessels: 2847,
      compliantVessels: 2683,
      violations: 164,
      complianceRate: 94.2
    },
    violations: [
      {
        id: 'V001',
        vesselName: 'Blue Ocean',
        type: 'Boundary Violation',
        severity: 'high',
        location: { lat: 19.0176, lon: 72.8562 },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        id: 'V002', 
        vesselName: 'Sea Pioneer',
        type: 'Juvenile Catch',
        severity: 'medium',
        location: { lat: 18.9388, lon: 72.8354 },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: 'resolved'
      },
      {
        id: 'V003',
        vesselName: 'Wave Rider',
        type: 'Seasonal Ban Violation',
        severity: 'high',
        location: { lat: 19.0825, lon: 72.7625 },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        status: 'under_review'
      }
    ],
    species: [
      { name: 'Pomfret', status: 'safe', riskLevel: 15, trend: 'stable' },
      { name: 'Tuna', status: 'caution', riskLevel: 45, trend: 'increasing' },
      { name: 'Sardine', status: 'safe', riskLevel: 20, trend: 'decreasing' },
      { name: 'Mackerel', status: 'warning', riskLevel: 75, trend: 'increasing' }
    ],
    regions: [
      { name: 'Maharashtra', complianceRate: 94.2, vessels: 1245, violations: 72 },
      { name: 'Tamil Nadu', complianceRate: 96.1, vessels: 987, violations: 38 },
      { name: 'Kerala', complianceRate: 89.3, vessels: 615, violations: 54 }
    ]
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskLevel) => {
    if (riskLevel < 30) return 'text-green-600';
    if (riskLevel < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compliance Monitoring</h2>
          <p className="text-gray-600 mt-1">
            Monitor fishing compliance, violations, and species risk across all regions
          </p>
        </div>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vessels</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceData.overview.totalVessels}</div>
            <p className="text-xs text-muted-foreground">
              Registered and monitored
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{complianceData.overview.compliantVessels}</div>
            <p className="text-xs text-muted-foreground">
              Following regulations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{complianceData.overview.violations}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceData.overview.complianceRate}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${complianceData.overview.complianceRate}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="violations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="violations">Active Violations</TabsTrigger>
          <TabsTrigger value="species">Species Risk</TabsTrigger>
          <TabsTrigger value="regions">Regional Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          <div className="grid gap-4">
            {complianceData.violations.map((violation) => (
              <Card key={violation.id} className={`border-l-4 ${
                violation.severity === 'high' ? 'border-red-500' :
                violation.severity === 'medium' ? 'border-yellow-500' :
                'border-blue-500'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`w-5 h-5 ${
                        violation.severity === 'high' ? 'text-red-600' :
                        violation.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <div>
                        <CardTitle className="text-lg">{violation.type}</CardTitle>
                        <CardDescription>
                          Vessel: {violation.vesselName} • ID: {violation.id}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(violation.severity)}>
                        {violation.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(violation.status)}>
                        {violation.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {violation.location.lat.toFixed(4)}°N, {violation.location.lon.toFixed(4)}°E
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {violation.timestamp.toLocaleString()}
                      </span>
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

        <TabsContent value="species" className="space-y-4">
          <Alert>
            <Fish className="h-4 w-4" />
            <AlertTitle>Species Risk Assessment</AlertTitle>
            <AlertDescription>
              Monitoring fish species sustainability and risk levels based on catch data and regulations.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {complianceData.species.map((species, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Fish className="w-5 h-5 text-sky-600" />
                      {species.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        species.status === 'safe' ? 'bg-green-100 text-green-800' :
                        species.status === 'caution' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {species.status.toUpperCase()}
                      </Badge>
                      {species.trend === 'increasing' ? (
                        <TrendingUp className="w-4 h-4 text-red-500" />
                      ) : species.trend === 'decreasing' ? (
                        <TrendingDown className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Risk Level</span>
                      <span className={`text-sm font-bold ${getRiskColor(species.riskLevel)}`}>
                        {species.riskLevel}%
                      </span>
                    </div>
                    <Progress value={species.riskLevel} className="w-full" />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Sustainable</span>
                      <span>At Risk</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="regions" className="space-y-4">
          <div className="grid gap-4">
            {complianceData.regions.map((region, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{region.name}</CardTitle>
                    <Badge className={
                      region.complianceRate >= 95 ? 'bg-green-100 text-green-800' :
                      region.complianceRate >= 90 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {region.complianceRate}% Compliant
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-sky-600">{region.vessels}</p>
                      <p className="text-sm text-gray-500">Total Vessels</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{region.violations}</p>
                      <p className="text-sm text-gray-500">Violations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {(region.vessels - region.violations)}
                      </p>
                      <p className="text-sm text-gray-500">Compliant</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Compliance Rate</span>
                      <span className="text-sm font-bold">{region.complianceRate}%</span>
                    </div>
                    <Progress value={region.complianceRate} className="w-full" />
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

export default ComplianceMonitoring;