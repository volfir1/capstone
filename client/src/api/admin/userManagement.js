import apiClient from "@config/api/apiClient";

const unwrapResponseData = (response, fallbackMessage) => {
  if (response?.data?.success) {
    return response.data.data;
  }

  throw new Error(fallbackMessage);
};

const getApiError = (error, fallbackMessage) =>
  error?.response?.data?.message || error?.message || fallbackMessage;

export async function fetchProfiles() {
  try {
    const response = await apiClient.get("/users/profiles");
    return unwrapResponseData(response, "Failed to fetch profiles");
  } catch (error) {
    console.error("Error fetching profiles:", error);
    throw new Error(getApiError(error, "Failed to fetch profiles"));
  }
}

export async function fetchProfileHistory() {
  try {
    const response = await apiClient.get("/users/history");
    return unwrapResponseData(response, "Failed to fetch profile history");
  } catch (error) {
    console.error("Error fetching profile history:", error);
    throw new Error(getApiError(error, "Failed to fetch profile history"));
  }
}

export async function createManagedProfile(profileData) {
  try {
    const response = await apiClient.post("/users/profiles", profileData);
    return unwrapResponseData(response, "Failed to create profile");
  } catch (error) {
    console.error("Error creating profile:", error);
    throw new Error(getApiError(error, "Failed to create profile"));
  }
}

export async function updateManagedProfile(profileId, profileData) {
  try {
    const response = await apiClient.put(`/users/${profileId}`, profileData);
    return unwrapResponseData(response, "Failed to update profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error(getApiError(error, "Failed to update profile"));
  }
}

export async function deleteManagedProfile(profileId, archiveData = {}) {
  try {
    const response = await apiClient.delete(`/users/${profileId}`, { data: archiveData });
    return unwrapResponseData(response, "Failed to delete profile");
  } catch (error) {
    console.error("Error deleting profile:", error);
    throw new Error(getApiError(error, "Failed to delete profile"));
  }
}

export async function restoreManagedProfile(profileId) {
  try {
    const response = await apiClient.put(`/users/${profileId}/restore`);
    return unwrapResponseData(response, "Failed to restore profile");
  } catch (error) {
    console.error("Error restoring profile:", error);
    throw new Error(getApiError(error, "Failed to restore profile"));
  }
}

export async function updateUserRole(userId, newRole) {
  try {
    const response = await apiClient.put(`/users/${userId}/role`, { role: newRole });
    return unwrapResponseData(response, "Failed to update profile role");
  } catch (error) {
    console.error("Error updating profile role:", error);
    throw new Error(getApiError(error, "Failed to update profile role"));
  }
}

export async function toggleUserStatus(userId, disabled) {
  try {
    const response = await apiClient.put(`/users/${userId}/status`, { disabled });
    return unwrapResponseData(response, "Failed to update profile status");
  } catch (error) {
    console.error("Error updating profile status:", error);
    throw new Error(getApiError(error, "Failed to update profile status"));
  }
}

export async function resetManagedProfilePin(profileId) {
  try {
    const response = await apiClient.post(`/users/${profileId}/pin/reset`);
    return unwrapResponseData(response, "Failed to reset profile PIN");
  } catch (error) {
    console.error("Error resetting profile PIN:", error);
    throw new Error(getApiError(error, "Failed to reset profile PIN"));
  }
}

export async function sendPasswordReset(email) {
  try {
    const response = await apiClient.post("/users/send-password-reset", { email });
    if (response?.data?.success) {
      return response.data;
    }

    throw new Error("Failed to send password reset");
  } catch (error) {
    console.error("Error sending password reset:", error);
    throw new Error(getApiError(error, "Failed to send password reset"));
  }
}

// Legacy aliases kept for existing imports.
export const fetchUsers = fetchProfiles;
export const updateUser = updateManagedProfile;
export const deleteUser = deleteManagedProfile;
