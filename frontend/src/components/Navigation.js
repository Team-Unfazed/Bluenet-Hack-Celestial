import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { 
  Waves, 
  Home, 
  Fish, 
  TrendingUp, 
  Navigation as NavigationIcon, 
  MessageSquare, 
  AlertTriangle,
  BarChart3,
  User,
  Settings,
  LogOut,
  Menu,
  Bell
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Navigation = () => {
  const location = useLocation();
  const { currentUser, onLogout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Fish Forecast',
      href: '/dashboard?tab=forecast',
      icon: Fish,
      current: location.search.includes('tab=forecast')
    },
    {
      name: 'Market Prices',
      href: '/dashboard?tab=market',
      icon: TrendingUp,
      current: location.search.includes('tab=market')
    },
    {
      name: 'Journey Track',
      href: '/dashboard?tab=journey',
      icon: NavigationIcon,
      current: location.search.includes('tab=journey')
    },
    {
      name: 'AI Assistant',
      href: '/dashboard?tab=assistant',
      icon: MessageSquare,
      current: location.search.includes('tab=assistant')
    }
  ];

  // Add policymaker-specific items
  if (currentUser?.role === 'policymaker') {
    navigationItems.push(
      {
        name: 'Analytics',
        href: '/dashboard?tab=analytics',
        icon: BarChart3,
        current: location.search.includes('tab=analytics')
      },
      {
        name: 'Compliance',
        href: '/dashboard?tab=compliance',
        icon: AlertTriangle,
        current: location.search.includes('tab=compliance')
      }
    );
  }

  const handleLogout = () => {
    onLogout();
  };

  const getUserInitials = () => {
    if (!currentUser?.name) return 'U';
    return currentUser.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = () => {
    return currentUser?.role === 'policymaker' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left section */}
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Waves className="h-8 w-8 text-sky-600" />
              <span className="text-xl font-bold text-gray-900">BlueNet</span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      item.current
                        ? 'bg-sky-100 text-sky-700'
                        : 'text-gray-600 hover:text-sky-600 hover:bg-sky-50'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                2
              </Badge>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={currentUser?.name} />
                    <AvatarFallback className="bg-sky-100 text-sky-700 text-sm font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900">{currentUser?.name}</span>
                    <Badge variant="secondary" className={`text-xs ${getRoleBadgeColor()}`}>
                      {currentUser?.role}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navigationItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            item.current
                              ? 'bg-sky-100 text-sky-700'
                              : 'text-gray-600 hover:text-sky-600 hover:bg-sky-50'
                          }`}
                        >
                          <IconComponent className="h-4 w-4 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;