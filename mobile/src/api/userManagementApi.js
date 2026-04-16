import apiClient from './apiClient';

const unwrapResponseData = (response, fallbackMessage) => {
  if (response?.data?.success) {
    return response.data.data;
  }

  throw new Error(fallbackMessage);
};

const getApiError = (error, fallbackMessage) =>
  error?.response?.data?.message || error?.message || fallbackMessage;

export const fetchProfiles = async () => {
  try {
    const response = await apiClient.get('/users/profiles');
    return unwrapResponseData(response, 'Failed to fetch profiles');
  } catch (error) {
    throw new Error(getApiError(error, 'Failed to fetch profiles'));
  }
};

export const createManagedProfile = async (profileData) => {
  try {
    const response = await apiClient.post('/users/profiles', profileData);
    return unwrapResponseData(response, 'Failed to create profile');
  } catch (error) {
    throw new Error(getApiError(error, 'Failed to create profile'));
  }
};

export const updateManagedProfile = async (profileId, profileData) => {
  try {
    const response = await apiClient.put(`/users/${profileId}`, profileData);
    return unwrapResponseData(response, 'Failed to update profile');
  } catch (error) {
    throw new Error(getApiError(error, 'Failed to update profile'));
  }
};

export const deleteManagedProfile = async (profileId) => {
  try {
    const response = await apiClient.delete(`/users/${profileId}`);
    return unwrapResponseData(response, 'Failed to delete profile');
  } catch (error) {
    throw new Error(getApiError(error, 'Failed to delete profile'));
  }
};

export const toggleUserStatus = async (profileId, disabled) => {
  try {
    const response = await apiClient.put(`/users/${profileId}/status`, { disabled });
    return unwrapResponseData(response, 'Failed to update profile status');
  } catch (error) {
    throw new Error(getApiError(error, 'Failed to update profile status'));
  }
};

export const resetManagedProfilePin = async (profileId) => {
  try {
    const response = await apiClient.post(`/users/${profileId}/pin/reset`);
    return unwrapResponseData(response, 'Failed to reset profile PIN');
  } catch (error) {
    throw new Error(getApiError(error, 'Failed to reset profile PIN'));
  }
};

export const sendPasswordReset = async (email) => {
  try {
    const response = await apiClient.post('/users/send-password-reset', { email });
    if (response?.data?.success) {
      return response.data;
    }

    throw new Error('Failed to send password reset');
  } catch (error) {
    throw new Error(getApiError(error, 'Failed to send password reset'));
  }
};
