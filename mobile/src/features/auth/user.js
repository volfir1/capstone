import apiClient from 'api/apiClient';

export const getUserData = async () => {
  try {
    const response = await apiClient.get('/users/profile');

    return response.data?.data;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};