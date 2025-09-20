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
      title: t('aiFishForecasting'),
      description: t('smartPredictions'),
      color: "text-sky-600"
    },
    {
      icon: TrendingUp,
      title: t('marketPriceIntelligence'),
      description: t('realtimeMandiPrices'),
      color: "text-teal-600"
    },
    {
      icon: Shield,
      title: t('complianceSafety'),
      description: t('automatedCatchLogging'),
      color: "text-indigo-600"
    },
    {
      icon: AlertTriangle,
      title: t('disasterAlerts'),
      description: t('realtimeWeatherWarnings'),
      color: "text-orange-600"
    },
    {
      icon: Navigation,
      title: t('journeyTracking'),
      description: t('liveGPSTracking'),
      color: "text-green-600"
    },
    {
      icon: MessageSquare,
      title: t('aiAssistant'),
      description: t('expertGuidance'),
      color: "text-purple-600"
    }
  ];

  const stats = [
    { value: "15,000+", label: t('activeFishermen'), icon: Users },
    { value: "₹2.5Cr+", label: t('savingsGenerated'), icon: TrendingUp },
    { value: "350+", label: t('locations'), icon: MapPin },
    { value: "95%", label: t('successRate'), icon: Shield }
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
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">{t('features')}</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">{t('howItWorks')}</a>
                <a href="#contact" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">{t('contact')}</a>
              </div>
              
              <LanguageSelector onLanguageChange={(lang) => console.log('Language changed to:', lang)} />
            </div>
            
            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
              <DialogTrigger asChild>
                <Button className="bg-sky-600 hover:bg-sky-700">
                  {t('tryDashboard')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('welcomeToBlueNet')}</DialogTitle>
                  <DialogDescription>
                    {t('joinThousands')}
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs value={authMode} onValueChange={setAuthMode}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">{t('login')}</TabsTrigger>
                    <TabsTrigger value="register">{t('register')}</TabsTrigger>
                  </TabsList>
                  
                  <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
                    <TabsContent value="register" className="space-y-4 mt-0">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('fullName')}</Label>
                        <Input
                          id="name"
                          placeholder={t('enterYourFullName')}
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('phoneNumber')}</Label>
                        <Input
                          id="phone"
                          placeholder={t('enterYourPhone')}
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">{t('yourRole')}</Label>
                        <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectYourRole')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fisherman">{t('fisherman')}</SelectItem>
                            <SelectItem value="policymaker">{t('policymaker')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('enterYourEmail')}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('password')}</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={t('enterYourPassword')}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">
                      {authMode === 'login' ? t('signIn') : t('createAccount')}
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
                🌊 {t('enhancingCoastalFishing')}
              </Badge>
              
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
                {t('tagline').split('. ')[0]}. {t('tagline').split('. ')[1]}.{' '}
                <span className="text-sky-600">{t('tagline').split('. ')[2]}</span>
              </h1>
              
              <p className="text-lg leading-8 text-gray-600 mb-12 max-w-2xl mx-auto">
                {t('description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-sky-600 hover:bg-sky-700"
                  onClick={() => setShowAuthModal(true)}
                >
                  <Play className="w-5 h-5 mr-2" />
                  {t('tryDashboard')}
                </Button>
                <Button size="lg" variant="outline" className="border-sky-200 text-sky-700 hover:bg-sky-50">
                  <Fish className="w-5 h-5 mr-2" />
                  {t('watchDemo')}
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
              {t('everythingYouNeed')}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t('advancedAITools')}
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
              {t('simpleSmartEffective')}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t('getStartedInThreeSteps')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: t('createYourAccount'),
                description: t('signUpAndChoose'),
                icon: Users
              },
              {
                step: "02", 
                title: t('accessSmartTools'),
                description: t('useAIPoweredForecasting'),
                icon: BarChart3
              },
              {
                step: "03",
                title: t('fishSmarter'),
                description: t('followAIRecommendations'),
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
              {t('readyToRevolutionize')}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-sky-100">
              {t('joinThousandsAlreadyUsing')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-sky-600 hover:bg-gray-50"
                onClick={() => setShowAuthModal(true)}
              >
                {t('startFreeTrial')}
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-sky-700">
                {t('learnMore')}
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
                {t('enhancingCoastalFishingPractices')}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t('featuresNav')}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-sky-400">{t('aiForecasting')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">{t('marketPricesNav')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">{t('journeyTracking')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">{t('safetyAlerts')}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t('support')}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-sky-400">{t('helpCenter')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">{t('documentation')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">{t('contactUs')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-sky-400">{t('training')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              {t('builtForIndianFishermen')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;