import apiClient from '../../api/apiClient';

export const registerUser = async (payloadOrFirstName, lastName, email, username = null, role = '') => {
  try {
    const payload =
      typeof payloadOrFirstName === 'object' && payloadOrFirstName !== null
        ? payloadOrFirstName
        : {
            firstName: payloadOrFirstName,
            lastName,
            email,
            username,
            role,
          };

    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

    const response = await apiClient.post('/auth/register', cleanedPayload);
    return response.data;
  } catch (error) {
    console.error("Registration failed", error.response?.data || error.message);
    throw error;
  }
};