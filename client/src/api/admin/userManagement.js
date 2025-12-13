import apiClient from '@config/api/apiClient';

/**
 * Fetch all users from the backend
 * @returns {Promise<Array>} Array of user objects
 */
export async function fetchUsers() {
  try {
    const response = await apiClient.get('/users/fetchusers');
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch users');
  } catch (error) {
    console.error('Error fetching users:', error);
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
