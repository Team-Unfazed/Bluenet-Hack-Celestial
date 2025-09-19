import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';

// Import contexts and utilities
import { AppProvider } from './contexts/AppContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (simplified)
    const savedUser = localStorage.getItem('bluenet_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('bluenet_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('bluenet_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('bluenet_user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading BlueNet...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider value={{ currentUser, onLogin: handleLogin, onLogout: handleLogout, backendUrl: BACKEND_URL }}>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100">
          {currentUser && <Navigation />}
          <Routes>
            <Route 
              path="/" 
              element={
                currentUser ? 
                <Navigate to="/dashboard" replace /> : 
                <LandingPage onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                currentUser ? 
                <Dashboard /> : 
                <Navigate to="/" replace />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;