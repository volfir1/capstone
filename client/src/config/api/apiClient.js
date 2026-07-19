import axios from 'axios';
import { auth } from '@/firebase/firebase';
import { getStoredActiveProfileId } from '@/features/auth/profileSession';
import { getStoredProfilePinToken } from '@/features/auth/profilePinSession';

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
    // ✅ skip auth for public routes
    const PUBLIC_ROUTES = ['/auth/register', '/auth/login', '/auth/check-email'];
    const isPublic = PUBLIC_ROUTES.some(route => config.url?.includes(route));

    if (isPublic) {
      console.log('Public route, skipping auth:', config.url);
      return config;
    }

    try {
      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        const activeProfileId = getStoredActiveProfileId(user.uid);
        if (activeProfileId && !config.headers['x-profile-id']) {
          config.headers['x-profile-id'] = activeProfileId;
        }
        const profilePinToken = activeProfileId
          ? getStoredProfilePinToken(user.uid, activeProfileId)
          : '';
        if (profilePinToken && !config.headers['x-profile-pin-token']) {
          config.headers['x-profile-pin-token'] = profilePinToken;
        }
        console.log('Request with auth:', config.method.toUpperCase(), config.url);
      } else {
        console.error('No authenticated user found for request:', config.url);
      }
    } catch (tokenError) {
      console.error('Failed to get auth token:', tokenError);
    }

    return config;
  },
  (error) => {
    console.error('Failed to set up request:', error);
    return Promise.reject(error);
  }
);

// 3. Export the configured client for other files to use
export default client;
