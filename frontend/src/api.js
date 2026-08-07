import axios from 'axios';

// Get API URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('🌐 API URL:', API_URL);

// Create axios instance with base URL
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error Details:');
    if (error.response) {
      // Server responded with error
      console.error('  📊 Status:', error.response.status);
      console.error('  📝 Data:', error.response.data);
      console.error('  📋 Headers:', error.response.headers);
    } else if (error.request) {
      // Request made but no response
      console.error('  📡 No response received');
      console.error('  🔍 Request:', error.request);
    } else {
      // Error setting up request
      console.error('  ⚠️ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper function to check API health
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/api/health');
    console.log('✅ API Health Check:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Health Check Failed:', error.message);
    return null;
  }
};

export default api;