import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url, config.data);
    
    // Add auth token if available
    const user = localStorage.getItem('bluenet_user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.token) {
          config.headers.Authorization = `Bearer ${userData.token}`;
        }
      } catch (e) {
        console.warn('Invalid user data in localStorage');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      // Clear invalid auth data
      localStorage.removeItem('bluenet_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API functions
export const apiService = {
  // Health check
  healthCheck: () => api.get('/health'),

  // AI Assistant
  chatWithAssistant: (query) => api.post('/chat', query),

  // Fishing zones prediction
  predictFishingZones: (location) => api.post('/predict/fishing-zones', location),

  // Mandi recommendations
  getMandiRecommendation: (request) => api.post('/mandi-recommendation', request),

  // Journey tracking
  startJourney: (journeyData) => api.post('/journey/start', journeyData),
  updateJourney: (updateData) => api.post('/journey/update', updateData),
  getJourneyStatus: (journeyId) => api.get(`/journey/${journeyId}`),

  // Disaster alerts
  getDisasterAlerts: () => api.get('/disaster-alerts'),

  // Catch logging
  logCatch: (formData) => api.post('/catch-log', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;