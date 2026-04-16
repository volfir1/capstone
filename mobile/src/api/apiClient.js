import axios from 'axios';
import { getAuth } from 'firebase/auth';
import getEnv from './environment';
import { getStoredActiveProfileId } from '../features/auth/profileSession';
import { getStoredProfilePinToken } from '../features/auth/profilePinSession';

// Get environment-specific configuration
const { apiUrl, environment } = getEnv();

console.log(` Environment: ${environment}`);
console.log(` API Base URL: ${apiUrl}`);

const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
});

const PUBLIC_ROUTES = ['/auth/register', '/auth/check-email', '/auth/get-email-from-username'];

apiClient.interceptors.request.use(
  async (config) => {
    const isPublic = PUBLIC_ROUTES.some((route) => config.url?.includes(route));
    if (isPublic) {
      return config;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    config.headers = config.headers || {};

    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;

      const activeProfileId = await getStoredActiveProfileId(user.uid);
      if (activeProfileId && !config.headers['x-profile-id']) {
        config.headers['x-profile-id'] = activeProfileId;
      }

      const profilePinToken = activeProfileId
        ? await getStoredProfilePinToken(user.uid, activeProfileId)
        : '';
      if (profilePinToken && !config.headers['x-profile-pin-token']) {
        config.headers['x-profile-pin-token'] = profilePinToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;