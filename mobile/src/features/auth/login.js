import { getAuth } from 'firebase/auth';
import apiClient from '../../api/apiClient';

export const loginUser = async (loginData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    const response = await apiClient.post('/auth/login', loginData);
    
    console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Add any other login-related functions here