import axios from 'axios';

// Create standard axios instance utilizing only relative URLs via Vite proxy (/api -> http://localhost:5001)
// Relative URL examples: /api/system/status, /api/weather/search, /api/news, /api/plant-doctor/analyze
const api = axios.create({
  baseURL: '/api',
  timeout: 15000, // 15 seconds request timeout
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (left empty for now, can be used for other headers if needed)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error transformation and user-friendly alerting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let userMessage = 'Could not connect to the Grow Green, Live Long backend service. Please verify your connection.';

    if (error.response && error.response.data && error.response.data.message) {
      // Backend returned a safe, standardized readable error message
      userMessage = error.response.data.message;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      userMessage = 'The request timed out while contacting the server or external agriculture provider. Please try again.';
    } else if (error.message && (error.message.includes('Network Error') || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED')) {
      userMessage = 'Could not reach backend API. Please ensure the server is active and reachable.';
    }

    // Attach human-readable message directly to the rejection error
    error.userMessage = userMessage;
    return Promise.reject(error);
  }
);

export default api;
