import Constants from 'expo-constants';
import { Platform } from 'react-native';

const explicitApiBaseUrl = String(process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();

const getExpoPackagerHost = () => {
  const hostSource =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    '';

  const host = String(hostSource).split(':')[0].trim();
  return host || '';
};

const resolveDevApiUrl = () => {
  if (explicitApiBaseUrl) {
    return explicitApiBaseUrl;
  }

  const expoHost = getExpoPackagerHost();
  if (expoHost) {
    return `http://${expoHost}:5000/api`;
  }

  // Android emulators cannot reach host localhost directly.
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

const getReleaseChannel = () =>
  Constants.expoConfig?.releaseChannel || Constants.manifest?.releaseChannel || '';

const ENV = {
  dev: {
    apiUrl: resolveDevApiUrl(),
    environment: 'development',
  },
  staging: {
    apiUrl: explicitApiBaseUrl || 'https://staging-api.justreach.com/api',
    environment: 'staging',
  },
  prod: {
    apiUrl: explicitApiBaseUrl || 'https://api.justreach.com/api',
    environment: 'production',
  },
};

const getEnv = () => {
  if (__DEV__) {
    return ENV.dev;
  } else if (getReleaseChannel() === 'staging') {
    return ENV.staging;
  } else {
    return ENV.prod;
  }
};

export default getEnv;