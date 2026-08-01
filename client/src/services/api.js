import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let userMessage =
      'Could not connect to the Grow Green, Live Long backend service. Please verify your connection.';

    if (error.response?.data?.message) {
      userMessage = error.response.data.message;
    } else if (
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout')
    ) {
      userMessage =
        'The request timed out while contacting the server or external agriculture provider. Please try again.';
    } else if (
      error.message?.includes('Network Error') ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED'
    ) {
      userMessage =
        'Could not reach backend API. Please ensure the server is active and reachable.';
    }

    error.userMessage = userMessage;
    return Promise.reject(error);
  }
);

export default api;