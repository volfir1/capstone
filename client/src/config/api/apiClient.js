import axios from 'axios';
import { auth } from '@/firebase/firebase';

// 1. Create a "pre-configured" instance of Axios
// Use proxy in development (/api) or full URL in production
const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api';

console.log('API Client baseURL:', baseURL);

const client = axios.create({
  baseURL,
});

// 2. Use an Interceptor to automatically add the auth token to every request
client.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Request with auth:', config.method.toUpperCase(), config.url);
      } else {
        console.error('❌ No authenticated user found for request:', config.url);
        console.error('Auth state:', { hasAuth: !!auth, hasCurrentUser: !!auth.currentUser });
      }
    } catch (tokenError) {
      console.error('❌ Failed to get auth token:', tokenError);
    }
    
    return config;
  },
  (error) => {
    // This function will be called if there is an error setting up the request
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 3. Export the configured client for other files to use
export default client;