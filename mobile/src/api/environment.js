import Constants from 'expo-constants';

const ENV = {
  dev: {
    apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
    environment: 'development',
  },
  staging: {
    apiUrl: 'https://staging-api.justreach.com/api',
    environment: 'staging',
  },
  prod: {
    apiUrl: 'https://api.justreach.com/api',
    environment: 'production',
  },
};

const getEnv = () => {
  // Check if running in Expo Go (development mode)
  if (__DEV__) {
    return ENV.dev;
  } else if (Constants.manifest?.releaseChannel === 'staging') {
    return ENV.staging;
  } else {
    return ENV.prod;
  }
};

export default getEnv;