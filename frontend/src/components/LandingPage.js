import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import LanguageSelector from './LanguageSelector';
import { t } from '../utils/translations';
import { 
  Waves, 
  Fish, 
  MapPin, 
  TrendingUp, 
  Shield, 
  Users,
  Navigation,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Play
} from 'lucide-react';

const LandingPage = ({ onLogin }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'fisherman',
    phone: ''
  });

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      if (authMode === 'register') {
        // Registration API call
        const response = await fetch(`${backendUrl}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            role: formData.role
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Store token and user data
          localStorage.setItem('auth_token', data.access_token);
          localStorage.setItem('user_data', JSON.stringify(data.user));
          onLogin(data.user);
          setShowAuthModal(false);
        } else {
          const error = await response.json();
          alert(`Registration failed: ${error.detail || 'Unknown error'}`);
        }
      } else {
        // Login API call
        const response = await fetch(`${backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Store token and user data
          localStorage.setItem('auth_token', data.access_token);
          localStorage.setItem('user_data', JSON.stringify(data.user));
          onLogin(data.user);
          setShowAuthModal(false);
        } else {
          const error = await response.json();
          alert(`Login failed: ${error.detail || 'Invalid credentials'}`);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const features = [
    {
      icon: Fish,
      title: "AI Fish Forecasting",
      description: "Smart predictions using environmental data to find the best fishing spots with 72% accuracy.",
      color: "text-sky-600"
    },
    {
      icon: TrendingUp,
      title: "Market Price Intelligence",
      description: "Real-time mandi prices with ML-powered recommendations for maximum profit.",
      color: "text-teal-600"
    },
    {
      icon: Shield,
      title: "Compliance & Safety",
      description: "Automated catch logging with species detection and regulation compliance monitoring.",
      color: "text-indigo-600"
    },
    {
      icon: AlertTriangle,
      title: "Disaster Alerts",
      description: "Real-time weather warnings and geofencing for maritime boundary safety.",
      color: "text-orange-600"
    },
    {
      icon: Navigation,
      title: "Journey Tracking",
      description: "Live GPS tracking with fuel efficiency monitoring and boundary alerts.",
      color: "text-green-600"
    },
    {
      icon: MessageSquare,
      title: "AI Assistant",
      description: "Expert guidance on regulations, forecasts, and market insights powered by RAG technology.",
      color: "text-purple-600"
    }
  ];

  const stats = [
    { value: "15,000+", label: "Active Fishermen", icon: Users },
    { value: "₹2.5Cr+", label: "Savings Generated", icon: TrendingUp },
    { value: "350+", label: "Ports Connected", icon: MapPin },
    { value: "95%", label: "Safety Rate", icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Ocean wave background */}
        <div className="absolute inset-0 ocean-wave opacity-30"></div>
        
        <div className="relative">
          {/* Navigation */}
          <nav className="flex items-center justify-between p-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Waves className="h-8 w-8 text-sky-600" />
              <span className="text-2xl font-bold text-gray-900">BlueNet</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">How it Works</a>
              <a href="#contact" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">Contact</a>
            </div>
            
            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
              <DialogTrigger asChild>
                <Button className="bg-sky-600 hover:bg-sky-700">
                  Get Started
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Welcome to BlueNet</DialogTitle>
                  <DialogDescription>
                    Join thousands of fishermen using smart technology for better catches
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs value={authMode} onValueChange={setAuthMode}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
                    <TabsContent value="register" className="space-y-4 mt-0">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Your Role</Label>
                        <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fisherman">Fisherman</SelectItem>
                            <SelectItem value="policymaker">Policymaker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="fisher@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                    </Button>
                  </form>
                </Tabs>
              </DialogContent>
            </Dialog>
          </nav>
          
          {/* Hero Content */}
          <div className="px-6 py-24 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <Badge variant="outline" className="mb-8 px-4 py-2 text-sm font-medium border-sky-200 text-sky-700">
                🌊 Enhancing Coastal Fishing with AI & Technology
              </Badge>
              
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
                Fish Smarter. Stay Safer.{' '}
                <span className="text-sky-600">Earn More.</span>
              </h1>
              
              <p className="text-lg leading-8 text-gray-600 mb-12 max-w-2xl mx-auto">
                BlueNet combines artificial intelligence, real-time data, and local expertise to revolutionize 
                coastal fishing practices in India. Join thousands of fishermen already using smart technology 
                for better catches and safer journeys.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-sky-600 hover:bg-sky-700"
                  onClick={() => setShowAuthModal(true)}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Try the Dashboard
                </Button>
                <Button size="lg" variant="outline" className="border-sky-200 text-sky-700 hover:bg-sky-50">
                  <Fish className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <stat.icon className="h-8 w-8 text-sky-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for modern fishing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Advanced AI-powered tools designed specifically for Indian coastal fishermen and policymakers
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-gray-200 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-50 ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div id="how-it-works" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple. Smart. Effective.
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get started in three easy steps and transform your fishing operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create Your Account",
                description: "Sign up and choose your role - fisherman or policymaker. Complete your profile to get personalized recommendations.",
                icon: Users
              },
              {
                step: "02", 
                title: "Access Smart Tools",
                description: "Use AI-powered forecasting, market insights, journey tracking, and compliance tools designed for your needs.",
                icon: BarChart3
              },
              {
                step: "03",
                title: "Fish Smarter",
                description: "Follow AI recommendations, track your journeys, stay compliant, and maximize your profits with data-driven decisions.",
                icon: TrendingUp
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-sky-600 text-white rounded-full text-xl font-bold">
                    {step.step}
                  </div>
                </div>
                <div className="flex justify-center mb-4">
                  <step.icon className="h-8 w-8 text-sky-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
                {index < 2 && (
                  <div className="hidden md:flex justify-center mt-8">
                    <ChevronRight className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-sky-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to revolutionize your fishing operations?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-sky-100">
              Join thousands of fishermen already using BlueNet to increase their catch, 
              ensure safety, and maximize profits with smart technology.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-sky-600 hover:bg-gray-50"
                onClick={() => setShowAuthModal(true)}
              >
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-sky-700">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Waves className="h-8 w-8 text-sky-400" />
                <span className="text-2xl font-bold text-white">BlueNet</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Enhancing coastal fishing practices in India through AI-powered technology, 
                market insights, and safety monitoring for sustainable and profitable fishing operations.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Features</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-sky-400">AI Forecasting</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">Market Prices</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">Journey Tracking</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">Safety Alerts</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-sky-400">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">Training</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 BlueNet. Built for Indian fishermen with ❤️ and cutting-edge technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;