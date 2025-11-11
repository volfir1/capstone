import { getAuth } from 'firebase/auth';
import apiClient from 'api/apiClient';

export const verifyUser = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    const response = await apiClient.put('/auth/verify-user');
    
    console.log('Verification updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Verify user error:', error);
    throw error;
  }
};

