import apiClient from 'api/apiClient';

export const getAccountContext = async (profileId = '') => {
  const headers = profileId ? { 'x-profile-id': profileId } : undefined;
  const response = await apiClient.get('/auth/context', { headers });
  return response.data?.data;
};

export const getProfiles = async () => {
  const response = await apiClient.get('/users/profiles');
  return response.data?.data || [];
};

export const createProfile = async (payload) => {
  const response = await apiClient.post('/users/profiles', payload);
  return response.data?.data;
};
