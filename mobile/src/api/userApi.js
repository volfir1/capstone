import apiClient from './apiClient';

// ============== USER CASES ==============
export const fetchUserCases = async () => {
  const response = await apiClient.get('/cases/user-cases');
  return response.data;
};

// ============== CLIENT INFO / APPOINTMENTS ==============
export const submitClientInfo = async (data) => {
  const response = await apiClient.post('/clientsinfo', data);
  return response.data;
};

export const fetchUserAppointments = async () => {
  const response = await apiClient.get('/clientsinfo');
  return response.data;
};

// ============== FINALIZED CASES (user side) ==============
export const fetchUserFinalizedCases = async (userId) => {
  const response = await apiClient.get(`/finalize/user/${userId}`);
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

// ============== CHAT ==============
export const fetchChatList = async () => {
  const response = await apiClient.get('/chat/list');
  return response.data;
};

export const fetchChatMessages = async (caseId) => {
  const response = await apiClient.get(`/chat/case/${caseId}`);
  return response.data;
};

export const sendChatMessage = async (caseId, message) => {
  const response = await apiClient.post('/chat/send', { caseId, message });
  return response.data;
};

export const markChatAsRead = async (caseId) => {
  const response = await apiClient.put(`/chat/read/${caseId}`);
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

// ============== AI CHATBOT ==============
export const sendAIMessage = async (message) => {
  const response = await apiClient.post('/ai-assistant/message', { message });
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
