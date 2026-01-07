import apiClient from '@config/api/apiClient';

/**
 * Fetch all users from the backend
 * @returns {Promise<Array>} Array of user objects
 */
export async function fetchUsers() {
  try {
    console.log('Fetching users from /users/fetchusers...');
    const response = await apiClient.get('/users/fetchusers');
    console.log('Response received:', response.status, response.data);
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch users');
  } catch (error) {
    console.error('Error fetching users:', error);
    console.error('Error response:', error.response?.status, error.response?.data);
    throw error;
  }
}

/**
 * Update user role
 * @param {string} userId - The user ID
 * @param {string} newRole - The new role (secretary or user)
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUserRole(userId, newRole) {
  try {
    const response = await apiClient.put(`/users/${userId}/role`, { role: newRole });
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to update user role');
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

/**
 * Disable or enable a user account
 * @param {string} userId - The user ID
 * @param {boolean} disabled - True to disable, false to enable
 * @returns {Promise<Object>} Updated user object
 */
export async function toggleUserStatus(userId, disabled) {
  try {
    const response = await apiClient.put(`/users/${userId}/status`, { disabled });
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to update user status');
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}

/**
 * Send password reset email to user
 * @param {string} email - The user's email
 * @returns {Promise<Object>} Success message
 */
export async function sendPasswordReset(email) {
  try {
    const response = await apiClient.post('/users/send-password-reset', { email });
    
    if (response.data.success) {
      return response.data;
    }
    
    throw new Error('Failed to send password reset');
  } catch (error) {
    console.error('Error sending password reset:', error);
    throw error;
  }
}

/**
 * Update user details
 * @param {string} userId - The user ID
 * @param {Object} userData - The updated user data
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUser(userId, userData) {
  try {
    const response = await apiClient.put(`/users/${userId}`, userData);
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to update user');
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Delete a user
 * @param {string} userId - The user ID to delete
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteUser(userId) {
  try {
    const response = await apiClient.delete(`/users/${userId}`);
    
    if (response.data.success) {
      return response.data;
    }
    
    throw new Error('Failed to delete user');
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
