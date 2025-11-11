import axios from 'axios';
import { getAuth } from 'firebase/auth';
import getEnv from './environment';

// Get environment-specific configuration
const { apiUrl, environment } = getEnv();

console.log(` Environment: ${environment}`);
console.log(` API Base URL: ${apiUrl}`);

const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('Making request to:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;