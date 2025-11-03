import axios from 'axios';
import { getAuth } from 'firebase/auth';
import Constants from 'expo-constants';

// Get the API URL based on environment
function getBaseUrl() {
  // For development, use your machine's IP
  const debuggerHost = Constants.expoConfig?.debuggerHost?.split(':')[0];
  
  if (debuggerHost) {
    // Use the debugger host IP (your machine's IP)
    return `http://${debuggerHost}:5000/api`;
  }
  
  // Fallback - replace with your actual machine IP
  return 'http://192.168.1.2:5000/api'; // ✅ Added :5000 port!
}

// Add debug logging
const baseUrl = getBaseUrl();
console.log('API Base URL:', baseUrl);

const apiClient = axios.create({
  baseURL: baseUrl, 
});

// Interceptor stays the same...
apiClient.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('Making request to:', config.baseURL + config.url); // Debug log
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;