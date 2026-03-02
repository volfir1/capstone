import axios from 'axios';
import { auth } from '@/firebase/firebase';

// 1. Create a "pre-configured" instance of Axios
// Use proxy in development (/api) or full URL in production
let baseURL = '/api';
if (import.meta.env.VITE_API_URL) {
  // Normalize common malformed values (e.g.":5000") to a usable URL
  let raw = import.meta.env.VITE_API_URL.trim();
  // remove trailing slash
  raw = raw.replace(/\/$/, '');

  if (raw.startsWith(':')) {
    // port-only like ":5000" -> assume local host
    raw = `http://127.0.0.1${raw}`;
  } else if (!/^https?:\/\//i.test(raw)) {
    // hostname without protocol like "localhost:5000" -> add http://
    raw = `http://${raw}`;
  }

  baseURL = `${raw}/api`;
}

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
        console.log(' Request with auth:', config.method.toUpperCase(), config.url);
      } else {
        console.error(' No authenticated user found for request:', config.url);
        console.error('Auth state:', { hasAuth: !!auth, hasCurrentUser: !!auth.currentUser });
      }
    } catch (tokenError) {
      console.error(' Failed to get auth token:', tokenError);
    }

    return config;
  },
  (error) => {
    // This function will be called if there is an error setting up the request
    console.error(' Failed to set up request:', error);
    return Promise.reject(error);
  }
);

// 3. Export the configured client for other files to use
export default client;