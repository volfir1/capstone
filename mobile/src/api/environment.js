import Constants from 'expo-constants';

const ENV = {
  dev: {
    apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
    environment: 'development',
  },
  staging: {
    apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://staging-api.justreach.com/api',
    environment: 'staging',
  },
  prod: {
    apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.justreach.com/api',
    environment: 'production',
  },
};

const getEnv = () => {
  if (__DEV__) {
    return ENV.dev;
  } else if (Constants.manifest?.releaseChannel === 'staging') {
    return ENV.staging;
  } else {
    return ENV.prod;
  }
};

export default getEnv;