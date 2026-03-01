import apiClient from './apiClient';

// ============== USER MANAGEMENT ==============
export const fetchUsers = async () => {
  const response = await apiClient.get('/users/fetchusers');
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await apiClient.put(`/users/${userId}/role`, { role });
  return response.data;
};

export const toggleUserStatus = async (userId, disabled) => {
  const response = await apiClient.put(`/users/${userId}/status`, { disabled });
  return response.data;
};

export const sendPasswordReset = async (email) => {
  const response = await apiClient.post('/users/send-password-reset', { email });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}`);
  return response.data;
};

// ============== DASHBOARD STATS ==============
export const fetchDashboardStats = async () => {
  const response = await apiClient.get('/cases/admin/stats');
  return response.data;
};

// ============== CASES ==============
export const fetchAllCases = async () => {
  const response = await apiClient.get('/cases/admin/all-cases');
  return response.data;
};

export const fetchAttorneysForAssignment = async () => {
  const response = await apiClient.get('/cases/admin/attorneys');
  return response.data;
};

export const assignAttorneyToCase = async (caseId, attorneyId) => {
  const response = await apiClient.put(`/cases/admin/assign/${caseId}`, { attorneyId });
  return response.data;
};

// ============== ATTORNEYS ==============
export const fetchAllAttorneys = async () => {
  const response = await apiClient.get('/auth/all-attorneys');
  return response.data;
};

export const activateAttorney = async (attorneyId) => {
  const response = await apiClient.put(`/auth/activate-attorney/${attorneyId}`);
  return response.data;
};

// ============== CASE ASSIGNMENTS ==============
export const fetchCaseAssignments = async () => {
  const response = await apiClient.get('/case-assignments');
  return response.data;
};

export const completeCaseAssignment = async (assignmentId) => {
  const response = await apiClient.put(`/case-assignments/${assignmentId}/complete`);
  return response.data;
};

// ============== REVIEWS ==============
export const fetchReviews = async (reviewerId) => {
  const url = reviewerId ? `/reviews?reviewerId=${reviewerId}` : '/reviews';
  const response = await apiClient.get(url);
  return response.data;
};

export const createReview = async (reviewData) => {
  const response = await apiClient.post('/reviews', reviewData);
  return response.data;
};

export const updateReview = async (reviewId, updateData) => {
  const response = await apiClient.put(`/reviews/${reviewId}`, updateData);
  return response.data;
};

// ============== FINALIZE ==============
export const fetchFinalizedCases = async () => {
  const response = await apiClient.get('/finalize');
  return response.data;
};

export const createFinalizedCase = async (data) => {
  const response = await apiClient.post('/finalize', data);
  return response.data;
};

export const updateFinalizedCase = async (id, data) => {
  const response = await apiClient.put(`/finalize/${id}`, data);
  return response.data;
};

// ============== CASE RECORDS ==============
export const fetchCaseRecord = async (finalizeId) => {
  const response = await apiClient.get(`/caserecords/finalize/${finalizeId}`);
  return response.data;
};

export const updateCaseRecord = async (finalizeId, data) => {
  const response = await apiClient.put(`/caserecords/finalize/${finalizeId}`, data);
  return response.data;
};

// ============== EVENTS ==============
export const fetchEvents = async () => {
  const response = await apiClient.get('/events');
  return response.data;
};

export const createEvent = async (eventData) => {
  const response = await apiClient.post('/events', eventData);
  return response.data;
};

export const updateEvent = async (eventId, eventData) => {
  const response = await apiClient.put(`/events/${eventId}`, eventData);
  return response.data;
};

export const deleteEvent = async (eventId) => {
  const response = await apiClient.delete(`/events/${eventId}`);
  return response.data;
};

// ============== CLIENT INFO ==============
export const fetchClientInfoRecords = async () => {
  const response = await apiClient.get('/clientsinfo');
  return response.data;
};

export const fetchClientInfoById = async (id) => {
  const response = await apiClient.get(`/clientsinfo/${id}`);
  return response.data;
};

export const updateClientInfo = async (id, data) => {
  const response = await apiClient.put(`/clientsinfo/${id}`, data);
  return response.data;
};

// ============== ACTIVITY LOGS ==============
export const fetchActivityLogs = async () => {
  const response = await apiClient.get('/activity-logs');
  return response.data;
};

export const createActivityLog = async (data) => {
  const response = await apiClient.post('/activity-logs', data);
  return response.data;
};

// ============== UPLOAD ==============
export const uploadDocument = async (formData) => {
  const response = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
