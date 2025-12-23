import axios from 'axios';
import { auth } from '@/firebase/firebase';

// 1. Create a "pre-configured" instance of Axios
// If VITE_API_URL is set, use it; otherwise default to relative `/api` to allow Vite dev proxy
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const client = axios.create({
  baseURL,
});

// 2. Use an Interceptor to automatically add the auth token to every request
client.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      // Add the Authorization header to the request config
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // This function will be called if there is an error setting up the request
    return Promise.reject(error);
  }
);

// 3. Export the configured client for other files to use
export default client;