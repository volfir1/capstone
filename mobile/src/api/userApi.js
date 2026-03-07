import apiClient from './apiClient';

// ============== CLIENT INFO / APPOINTMENTS ==============
export const submitPublicAppointment = async (data) => {
  const response = await apiClient.post('/clientsinfo/public-appointment', data);
  return response.data;
};

export const fetchUserAppointments = async () => {
  const response = await apiClient.get('/clientsinfo');
  return response.data;
};

// ============== PROFILE ==============
export const fetchUserProfile = async () => {
  const response = await apiClient.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (data) => {
  const response = await apiClient.put('/user/profile', data);
  return response.data;
};

export const updateProfileImage = async (imageUrl) => {
  const response = await apiClient.put('/users/profile/image', { profileImage: imageUrl });
  return response.data;
};

export const updateAdminProfile = async (data) => {
  const response = await apiClient.put('/admin/profile', data);
  return response.data;
};

export const updateAttorneyProfile = async (data) => {
  const response = await apiClient.put('/attorney/profile', data);
  return response.data;
};

// ============== NOTIFICATIONS ==============
export const fetchNotifications = async (page = 1, limit = 20) => {
  const response = await apiClient.get(`/notifications?page=${page}&limit=${limit}`);
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await apiClient.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await apiClient.delete(`/notifications/${id}`);
  return response.data;
};

export const clearAllNotifications = async () => {
  const response = await apiClient.delete('/notifications/clear-all');
  return response.data;
};

// ============== PUSH NOTIFICATIONS ==============
export const registerPushToken = async (token) => {
  const response = await apiClient.post('/users/push-token', { token });
  return response.data;
};

export const unregisterPushToken = async (token) => {
  const response = await apiClient.delete('/users/push-token', { data: { token } });
  return response.data;
};

// ============== AUTH ==============
export const getEmailFromUsername = async (username) => {
  const response = await apiClient.post('/auth/get-email-from-username', { username });
  return response.data;
};

export const checkEmailExists = async (email) => {
  const response = await apiClient.post('/auth/check-email', { email });
  return response.data;
};
