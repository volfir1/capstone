import { getAuth } from 'firebase/auth';
import apiClient from 'api/apiClient';

export const getUserData = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    const response = await apiClient.get('/users/profile');
    
    return response.data;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};