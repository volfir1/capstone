import apiClient from 'api/apiClient';

export const getProfilePinStatus = async () => {
  const response = await apiClient.get('/users/profile/pin/status');
  return response.data?.data;
};

export const setupProfilePin = async (pin) => {
  const response = await apiClient.post('/users/profile/pin/setup', { pin });
  return response.data?.data;
};

export const verifyProfilePin = async (pin) => {
  const response = await apiClient.post('/users/profile/pin/verify', { pin });
  return response.data?.data;
};
